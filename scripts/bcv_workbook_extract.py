#!/usr/bin/env python3
"""Normalize selected official BCV workbooks already catalogued by bcv_ingest."""

from __future__ import annotations

import csv
import datetime as dt
import json
import ssl
import urllib.request
from pathlib import Path

import pandas as pd
from openpyxl import Workbook

from ove_excel_format import format_sheet, write_key_values, write_table


ROOT = Path(__file__).resolve().parents[1]
OUT_ROOT = ROOT / "assets" / "data" / "bcv"
RAW_DIR = OUT_ROOT / "raw"
JSON_DIR = OUT_ROOT / "json"
CSV_DIR = OUT_ROOT / "csv"
EXCEL_DIR = OUT_ROOT / "excel"
CATALOG_DIR = OUT_ROOT / "catalog"

MONTHS = {
  "Enero": 1,
  "Febrero": 2,
  "Marzo": 3,
  "Abril": 4,
  "Mayo": 5,
  "Junio": 6,
  "Julio": 7,
  "Agosto": 8,
  "Septiembre": 9,
  "Octubre": 10,
  "Noviembre": 11,
  "Diciembre": 12,
}


def now_utc() -> str:
  return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def download(url: str, path: Path) -> Path:
  if path.exists():
    return path
  request = urllib.request.Request(url, headers={"User-Agent": "OVE data ingestion bot/1.0"})
  context = ssl._create_unverified_context()
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_bytes(urllib.request.urlopen(request, context=context, timeout=45).read())
  return path


def write_dataset(slug: str, metadata: dict, rows: list[dict], fields: list[str]) -> None:
  JSON_DIR.mkdir(parents=True, exist_ok=True)
  CSV_DIR.mkdir(parents=True, exist_ok=True)
  EXCEL_DIR.mkdir(parents=True, exist_ok=True)
  payload = {"metadata": metadata, "observations": rows}
  (JSON_DIR / f"{slug}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

  with (CSV_DIR / f"{slug}.csv").open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)

  wb = Workbook()
  ws = wb.active
  ws.title = "datos"
  format_sheet(ws, metadata.get("title"), "Banco Central de Venezuela")
  write_table(ws, fields, rows)
  meta = wb.create_sheet("metadatos")
  format_sheet(meta, "Metadatos", metadata.get("title"))
  meta_items = []
  for key, value in metadata.items():
    if isinstance(value, (dict, list)):
      value = json.dumps(value, ensure_ascii=False)
    meta_items.append((key, value))
  write_key_values(meta, meta_items)
  wb.save(EXCEL_DIR / f"{slug}.xlsx")


def extract_inpc(fetched_at: str) -> dict:
  url = "https://www.bcv.org.ve/sites/default/files/precios_consumidor/4_5_7_2.xls"
  path = download(url, RAW_DIR / "4_5_7_2.xls")
  df = pd.read_excel(path, sheet_name=0, header=None)
  rows = []
  current_year = None
  for _, row in df.iterrows():
    first = row.iloc[0]
    if pd.isna(first):
      continue
    text = str(first).strip().replace("(*)", "").strip()
    numeric_year = None
    try:
      numeric = float(text)
      if numeric.is_integer():
        numeric_year = int(numeric)
    except ValueError:
      numeric_year = None
    if numeric_year and 1900 <= numeric_year <= 2100:
      current_year = numeric_year
      continue
    if current_year and text in MONTHS and pd.notna(row.iloc[1]):
      date_value = dt.date(current_year, MONTHS[text], 1)
      if date_value > dt.date.today().replace(day=1):
        continue
      rows.append({
        "date": date_value.isoformat(),
        "year": current_year,
        "month": MONTHS[text],
        "month_name": text,
        "index_value": float(row.iloc[1]),
        "monthly_variation_pct": None if pd.isna(row.iloc[2]) else float(row.iloc[2]),
        "unit": "Índice base diciembre 2007=100 y variación mensual %",
        "frequency": "monthly",
        "source": "Banco Central de Venezuela",
        "source_url": url,
        "fetched_at": fetched_at,
      })
  rows.sort(key=lambda item: item["date"])
  latest = rows[-1] if rows else None
  metadata = {
    "dataset_id": "bcv_inpc_nacional_mensual",
    "title": "Índice Nacional de Precios al Consumidor",
    "source": "Banco Central de Venezuela",
    "source_url": url,
    "frequency": "monthly",
    "status": "official_source",
    "last_fetched_at": fetched_at,
    "first_date": rows[0]["date"] if rows else None,
    "last_date": latest["date"] if latest else None,
    "records": len(rows),
    "latest": latest,
    "notes": "Serie nacional INPC normalizada desde el workbook oficial BCV 4_5_7_2.xls.",
  }
  fields = ["date", "year", "month", "month_name", "index_value", "monthly_variation_pct", "unit", "frequency", "source", "source_url", "fetched_at"]
  write_dataset("ove_bcv_inpc_nacional_mensual", metadata, rows, fields)
  return metadata


def extract_gdp(fetched_at: str) -> dict:
  url = "https://www.bcv.org.ve/sites/default/files/cuentas_macroeconomicas/5_2_1_si_anual.xlsx"
  path = download(url, RAW_DIR / "5_2_1_si_anual.xlsx")
  df = pd.read_excel(path, sheet_name="Var_punt%", header=None)
  rows = []
  for _, row in df.iterrows():
    period = row.iloc[1]
    value = row.iloc[2] if len(row) > 2 else None
    if isinstance(period, str) and pd.notna(value):
      year_text = period.replace("(*)", "").strip()
      if year_text.isdigit():
        rows.append({
          "year": int(year_text),
          "annual_real_gdp_growth_pct": float(value),
          "unit": "Variación porcentual anual a precios de 2007",
          "frequency": "annual",
          "source": "Banco Central de Venezuela",
          "source_url": url,
          "fetched_at": fetched_at,
        })
  rows.sort(key=lambda item: item["year"])
  latest = rows[-1] if rows else None
  metadata = {
    "dataset_id": "bcv_pib_real_anual",
    "title": "Producto interno bruto real anual",
    "source": "Banco Central de Venezuela",
    "source_url": url,
    "frequency": "annual",
    "status": "official_source",
    "last_fetched_at": fetched_at,
    "first_year": rows[0]["year"] if rows else None,
    "last_year": latest["year"] if latest else None,
    "records": len(rows),
    "latest": latest,
    "notes": "Crecimiento anual del PIB real total normalizado desde workbook oficial BCV 5_2_1_si_anual.xlsx.",
  }
  fields = ["year", "annual_real_gdp_growth_pct", "unit", "frequency", "source", "source_url", "fetched_at"]
  write_dataset("ove_bcv_pib_real_anual", metadata, rows, fields)
  return metadata


def update_catalog(entries: list[dict], fetched_at: str) -> None:
  path = CATALOG_DIR / "bcv-catalog.json"
  catalog = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"datasets": []}
  by_id = {item["dataset_id"]: item for item in catalog.get("datasets", []) if "dataset_id" in item}
  for entry in entries:
    by_id[entry["dataset_id"]] = entry
  payload = {
    "source": "Banco Central de Venezuela",
    "source_url": "https://www.bcv.org.ve",
    "last_fetched_at": fetched_at,
    "datasets": [by_id[key] for key in sorted(by_id)],
  }
  path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
  fetched_at = now_utc()
  entries = [extract_inpc(fetched_at), extract_gdp(fetched_at)]
  update_catalog(entries, fetched_at)
  print(json.dumps({"updated": [item["dataset_id"] for item in entries], "fetched_at": fetched_at}, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
