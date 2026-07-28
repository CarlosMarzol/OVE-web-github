#!/usr/bin/env python3
"""Ingest non-official Venezuela exchange-rate market references.

These outputs are intentionally separated from BCV official data. They are
published as market references with source labels and methodological notes.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import ssl
import statistics
import urllib.request
from pathlib import Path
from typing import Any

try:
  import numpy as np
  for name, builtin in (("float", float), ("int", int), ("bool", bool), ("object", object)):
    if name not in np.__dict__:
      setattr(np, name, builtin)
except ImportError:
  pass

from openpyxl import Workbook

from ove_excel_format import format_sheet, write_table


ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "assets" / "data" / "tipo-cambio"
JSON_DIR = OUT_ROOT / "json"
CSV_DIR = OUT_ROOT / "csv"
EXCEL_DIR = OUT_ROOT / "excel"

DOLARAPI_BASE = "https://ve.dolarapi.com/v1"
BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"


def now_utc() -> str:
  return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today() -> str:
  return dt.date.today().isoformat()


def request_json(url: str, *, method: str = "GET", payload: dict | None = None) -> Any:
  data = None
  headers = {
    "User-Agent": "OVE market reference ingestion bot/1.0 (+https://observatoriodeeconomia.org.ve)",
    "Accept": "application/json,text/plain,*/*",
  }
  if payload is not None:
    data = json.dumps(payload).encode("utf-8")
    headers["Content-Type"] = "application/json"
  request = urllib.request.Request(url, data=data, headers=headers, method=method)
  context = ssl._create_unverified_context()
  with urllib.request.urlopen(request, timeout=45, context=context) as response:
    return json.loads(response.read().decode("utf-8"))


def decimal_or_none(value: Any) -> float | None:
  try:
    if value is None:
      return None
    return float(value)
  except (TypeError, ValueError):
    return None


def market_observation(
  *,
  date: str,
  indicator_id: str,
  indicator_name: str,
  currency: str,
  value: float,
  source: str,
  source_url: str,
  reference_type: str,
  fetched_at: str,
  source_updated_at: str | None = None,
  value_buy: float | None = None,
  value_sell: float | None = None,
  sample_size: int | None = None,
  notes: str = "",
) -> dict:
  return {
    "date": date,
    "currency": currency,
    "value": value,
    "value_buy": value_buy,
    "value_sell": value_sell,
    "unit": f"VES por {currency}",
    "frequency": "daily",
    "indicator_id": indicator_id,
    "indicator_name": indicator_name,
    "source": source,
    "source_url": source_url,
    "reference_type": reference_type,
    "source_updated_at": source_updated_at,
    "fetched_at": fetched_at,
    "sample_size": sample_size,
    "notes": notes,
  }


def parse_dolarapi_quote(item: dict, fetched_at: str) -> dict | None:
  currency = str(item.get("moneda") or "USD").upper()
  source_key = str(item.get("fuente") or "").lower()
  value = decimal_or_none(item.get("promedio"))
  if not value or source_key != "paralelo":
    return None
  return market_observation(
    date=today(),
    indicator_id=f"ve_{currency.lower()}_paralelo_dolarapi",
    indicator_name=f"{currency} paralelo - DolarApi",
    currency=currency,
    value=value,
    source="DolarApi Venezuela",
    source_url="https://dolarapi.com/docs/venezuela/",
    reference_type="market_reference_non_official",
    source_updated_at=item.get("fechaActualizacion"),
    fetched_at=fetched_at,
    notes="Referencia de mercado no oficial provista por DolarApi a partir de fuentes públicas.",
  )


def ingest_dolarapi(fetched_at: str) -> list[dict]:
  rows: list[dict] = []
  for endpoint in ("dolares", "euros"):
    data = request_json(f"{DOLARAPI_BASE}/{endpoint}")
    if isinstance(data, list):
      for item in data:
        parsed = parse_dolarapi_quote(item, fetched_at)
        if parsed:
          rows.append(parsed)
  return rows


def binance_rows(trade_type: str, fetched_at: str) -> dict | None:
  data = request_json(
    BINANCE_P2P_URL,
    method="POST",
    payload={
      "asset": "USDT",
      "fiat": "VES",
      "tradeType": trade_type,
      "page": 1,
      "rows": 10,
      "payTypes": [],
      "publisherType": None,
    },
  )
  prices = [
    decimal_or_none(item.get("adv", {}).get("price"))
    for item in data.get("data", [])
    if isinstance(item, dict)
  ]
  clean = [price for price in prices if price is not None]
  if not clean:
    return None
  side = "venta" if trade_type == "BUY" else "compra"
  return market_observation(
    date=today(),
    indicator_id=f"ve_usdt_binance_p2p_{side}",
    indicator_name=f"USDT/VES Binance P2P - {side}",
    currency="USDT",
    value=statistics.mean(clean),
    source="Binance P2P",
    source_url="https://www.binance.com/en/price/tether/VES",
    reference_type="digital_market_reference_non_official",
    fetched_at=fetched_at,
    sample_size=len(clean),
    notes=f"Promedio simple OVE de las primeras {len(clean)} ofertas visibles en Binance P2P para {side}. No es tasa oficial.",
  )


def load_existing(path: Path) -> list[dict]:
  if not path.exists():
    return []
  try:
    return json.loads(path.read_text(encoding="utf-8")).get("observations", [])
  except json.JSONDecodeError:
    return []


def merge_observations(existing: list[dict], incoming: list[dict]) -> list[dict]:
  merged = {(item["date"], item["indicator_id"]): item for item in existing}
  for item in incoming:
    merged[(item["date"], item["indicator_id"])] = item
  return [merged[key] for key in sorted(merged)]


def write_json(path: Path, payload: dict) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, observations: list[dict]) -> None:
  fieldnames = [
    "date", "currency", "value", "value_buy", "value_sell", "unit", "frequency",
    "indicator_id", "indicator_name", "source", "source_url", "reference_type",
    "source_updated_at", "fetched_at", "sample_size", "notes",
  ]
  path.parent.mkdir(parents=True, exist_ok=True)
  with path.open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    for row in observations:
      writer.writerow({key: row.get(key, "") for key in fieldnames})


def write_excel(path: Path, observations: list[dict]) -> None:
  headers = [
    "indicator_id", "indicator_name", "date", "value", "currency", "unit",
    "frequency", "source", "source_url", "reference_type", "source_updated_at",
    "fetched_at", "sample_size", "notes",
  ]
  path.parent.mkdir(parents=True, exist_ok=True)
  wb = Workbook()
  ws = wb.active
  ws.title = "referencias_mercado"
  format_sheet(ws, "Referencias de mercado", "Tipo de cambio Venezuela")
  write_table(ws, headers, observations)
  wb.save(path)


def payload(observations: list[dict], fetched_at: str, source_errors: list[str] | None = None) -> dict:
  latest = {}
  for row in observations:
    latest[row["indicator_id"]] = row
  latest_rows = sorted(latest.values(), key=lambda item: item["indicator_id"])
  return {
    "metadata": {
      "dataset_id": "ve_tipo_cambio_referencias_mercado",
      "title": "Referencias de mercado de tipo de cambio en Venezuela",
      "frequency": "daily",
      "unit": "VES por unidad de moneda",
      "status": "market_reference_non_official",
      "last_fetched_at": fetched_at,
      "records": len(observations),
      "latest_records": latest_rows,
      "source_errors": source_errors or [],
      "notes": "Referencias no oficiales separadas del tipo de cambio BCV. No deben usarse como tasa legal, contable o de facturación.",
    },
    "observations": observations,
  }


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--skip-binance", action="store_true", help="Skip Binance P2P references")
  args = parser.parse_args()

  fetched_at = now_utc()
  incoming: list[dict] = []
  source_errors: list[str] = []

  try:
    incoming.extend(ingest_dolarapi(fetched_at))
  except Exception as exc:
    source_errors.append(f"DolarApi: {exc}")

  if not args.skip_binance:
    for trade_type in ("BUY", "SELL"):
      try:
        row = binance_rows(trade_type, fetched_at)
        if row:
          incoming.append(row)
      except Exception as exc:
        source_errors.append(f"Binance P2P {trade_type}: {exc}")

  json_path = JSON_DIR / "ve_tipo_cambio_referencias_mercado.json"
  observations = merge_observations(load_existing(json_path), incoming)
  if not observations:
    raise RuntimeError("No market references available and no existing dataset to preserve")
  output = payload(observations, fetched_at, source_errors)
  write_json(json_path, output)
  write_csv(CSV_DIR / "ve_tipo_cambio_referencias_mercado.csv", observations)
  write_excel(EXCEL_DIR / "ve_tipo_cambio_referencias_mercado.xlsx", observations)
  print(json.dumps({"dataset": output["metadata"]["dataset_id"], "records": len(observations), "latest": len(incoming)}, ensure_ascii=False))


if __name__ == "__main__":
  main()
