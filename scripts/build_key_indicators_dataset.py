#!/usr/bin/env python3
"""Build a curated downloadable dataset for the OVE key indicators dashboard."""

from __future__ import annotations

import csv
import datetime as dt
import json
import urllib.parse
import urllib.request
from pathlib import Path

from openpyxl import Workbook


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "data" / "indicadores-clave"
BCV_DIR = ROOT / "assets" / "data" / "bcv" / "json"
WDI_DIR = ROOT / "assets" / "data" / "world-bank" / "json"

FIELDS = [
  "indicator_id",
  "indicator",
  "area",
  "source",
  "source_url",
  "frequency",
  "period",
  "date",
  "year",
  "value",
  "unit",
]


def read_json(path: Path) -> dict:
  return json.loads(path.read_text(encoding="utf-8"))


def now_utc() -> str:
  return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def add_bcv_gdp(rows: list[dict]) -> None:
  data = read_json(BCV_DIR / "ove_bcv_pib_real_anual.json")
  for item in data["observations"]:
    rows.append({
      "indicator_id": "pib_real_bcv",
      "indicator": "PIB real",
      "area": "Economía",
      "source": "Banco Central de Venezuela",
      "source_url": data["metadata"]["source_url"],
      "frequency": "Anual",
      "period": str(item["year"]),
      "date": f'{item["year"]}-01-01',
      "year": item["year"],
      "value": item["annual_real_gdp_growth_pct"],
      "unit": "% anual",
    })


def add_bcv_inpc(rows: list[dict]) -> None:
  data = read_json(BCV_DIR / "ove_bcv_inpc_nacional_mensual.json")
  for item in data["observations"]:
    rows.append({
      "indicator_id": "inpc_nacional_bcv",
      "indicator": "INPC nacional",
      "area": "Nivel y condiciones de vida",
      "source": "Banco Central de Venezuela",
      "source_url": data["metadata"]["source_url"],
      "frequency": "Mensual",
      "period": item["date"][:7],
      "date": item["date"],
      "year": item["year"],
      "value": item["monthly_variation_pct"],
      "unit": "% mensual",
    })


def add_bcv_usd(rows: list[dict]) -> None:
  data = read_json(BCV_DIR / "ove_bcv_tipo_cambio_usd.json")
  for item in data["observations"]:
    rows.append({
      "indicator_id": "tipo_cambio_bcv_usd",
      "indicator": "Tipo de cambio BCV",
      "area": "Economía",
      "source": "Banco Central de Venezuela",
      "source_url": item.get("source_url") or data["metadata"]["source_url"],
      "frequency": "Diaria",
      "period": item["date"],
      "date": item["date"],
      "year": int(item["date"][:4]),
      "value": item["value"],
      "unit": "Bs/USD",
    })


def wdi_rows(area_file: str, code: str) -> list[dict]:
  data = read_json(WDI_DIR / area_file)
  rows = [
    item for item in data["datos"]
    if item.get("Código indicador") == code and item.get("Valor") is not None
  ]
  if rows:
    return rows
  return fetch_wdi_rows(code)


def fetch_wdi_rows(code: str) -> list[dict]:
  params = urllib.parse.urlencode({
    "format": "json",
    "per_page": 20000,
    "date": f"1960:{dt.date.today().year + 1}",
  })
  url = f"https://api.worldbank.org/v2/country/VEN/indicator/{code}?{params}"
  request = urllib.request.Request(url, headers={"User-Agent": "OVE key indicators/1.0"})
  with urllib.request.urlopen(request, timeout=45) as response:
    payload = json.loads(response.read().decode("utf-8"))
  if not isinstance(payload, list) or len(payload) < 2:
    return []
  rows = []
  for item in payload[1] or []:
    value = item.get("value")
    year = item.get("date")
    if value is None or not str(year).isdigit():
      continue
    indicator = item.get("indicator") or {}
    rows.append({
      "Año": int(year),
      "Código indicador": code,
      "Indicador": indicator.get("value") or code,
      "Valor": value,
    })
  return rows


def add_wdi(rows: list[dict], code: str, indicator_id: str, indicator: str, area: str, unit: str, scale: float = 1) -> None:
  source_url = f"https://api.worldbank.org/v2/country/VEN/indicator/{code}?format=json&per_page=100"
  area_file = "ove_banco_mundial_venezuela_mercado_laboral.json" if code.startswith("SL.") else "ove_banco_mundial_venezuela_macroeconomia.json"
  for item in wdi_rows(area_file, code):
    year = int(item["Año"])
    rows.append({
      "indicator_id": indicator_id,
      "indicator": indicator,
      "area": area,
      "source": "Banco Mundial - World Development Indicators",
      "source_url": source_url,
      "frequency": "Anual",
      "period": str(year),
      "date": f"{year}-01-01",
      "year": year,
      "value": item["Valor"] / scale,
      "unit": unit,
    })


def write_outputs(rows: list[dict]) -> None:
  OUT_DIR.mkdir(parents=True, exist_ok=True)
  rows.sort(key=lambda item: (item["indicator_id"], item["date"]))
  metadata = {
    "title": "Indicadores clave de Venezuela",
    "description": "Series históricas descargables para el dashboard OVE de indicadores clave.",
    "generated_at": now_utc(),
    "records": len(rows),
    "indicators": sorted({item["indicator_id"] for item in rows}),
    "sources": sorted({item["source"] for item in rows}),
  }
  payload = {"metadata": metadata, "observations": rows}
  (OUT_DIR / "ove_indicadores_clave_venezuela.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
  )
  with (OUT_DIR / "ove_indicadores_clave_venezuela.csv").open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)

  wb = Workbook()
  ws = wb.active
  ws.title = "datos"
  ws.append(FIELDS)
  for row in rows:
    ws.append([row.get(field) for field in FIELDS])
  meta = wb.create_sheet("metadatos")
  for key, value in metadata.items():
    if isinstance(value, list):
      value = json.dumps(value, ensure_ascii=False)
    meta.append([key, value])
  wb.save(OUT_DIR / "ove_indicadores_clave_venezuela.xlsx")


def main() -> int:
  rows: list[dict] = []
  add_bcv_gdp(rows)
  add_bcv_inpc(rows)
  add_bcv_usd(rows)
  add_wdi(rows, "NY.GDP.MKTP.CD", "pib_corriente_wdi", "PIB corriente", "Economía", "US$ mil millones", 1000000000)
  add_wdi(rows, "NY.GDP.PCAP.CD", "pib_per_capita_wdi", "PIB per cápita", "Economía", "US$")
  add_wdi(rows, "SL.UEM.TOTL.ZS", "desempleo_total_wdi", "Desempleo total", "Mercado laboral", "% fuerza laboral")
  write_outputs(rows)
  print(json.dumps({"records": len(rows), "output": str(OUT_DIR)}, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
