#!/usr/bin/env python3
"""Build OVE-formatted historical IMF GDP workbooks for operation pages."""

from __future__ import annotations

import csv
import datetime as dt
import json
from pathlib import Path

from openpyxl import Workbook

from ove_excel_format import format_sheet, write_key_values, write_table


ROOT = Path(__file__).resolve().parents[1]
IMF_ROOT = ROOT / "assets" / "data" / "imf"
CSV_PATH = IMF_ROOT / "csv" / "ove_fmi_weo_venezuela.csv"
EXCEL_DIR = IMF_ROOT / "excel"
SOURCE_URL = "https://data.imf.org/en/datasets/IMF.RES:WEO"

FIELDS = [
  "País",
  "Código país",
  "Indicador",
  "Código indicador",
  "Frecuencia",
  "Periodo",
  "Año",
  "Valor",
  "Unidad",
  "Escala",
  "Tipo dato",
  "Fecha actualización país",
  "Fuente",
  "URL fuente",
]

OPERATIONS = [
  {
    "code": "NGDP",
    "title": "Producto interno bruto (PIB), precios corrientes, moneda nacional",
    "subtitle": "Serie histórica FMI WEO - Venezuela",
    "filename": "ove_pib_fmi_ngdp_precios_corrientes_moneda_nacional.xlsx",
  },
  {
    "code": "NGDPD",
    "title": "Producto interno bruto (PIB), precios corrientes, dólares estadounidenses",
    "subtitle": "Serie histórica FMI WEO - Venezuela",
    "filename": "ove_pib_fmi_ngdpd_precios_corrientes_dolares_estadounidenses.xlsx",
  },
  {
    "code": "PPPGDP",
    "title": "Producto interno bruto (PIB), precios corrientes PPA, dólares internacionales",
    "subtitle": "Serie histórica FMI WEO - Venezuela",
    "filename": "ove_pib_fmi_pppgdp_precios_corrientes_ppa_dolares_internacionales.xlsx",
  },
]


def today() -> str:
  return dt.date.today().isoformat()


def read_rows() -> list[dict]:
  with CSV_PATH.open(newline="", encoding="utf-8-sig") as handle:
    return list(csv.DictReader(handle, delimiter=";"))


def safe_number(value: object) -> object:
  if value in (None, ""):
    return value
  try:
    number = float(value)
  except (TypeError, ValueError):
    return value
  return int(number) if number.is_integer() else number


def period_key(row: dict) -> int:
  try:
    return int(str(row.get("Año") or row.get("Periodo") or "0")[:4])
  except ValueError:
    return 0


def operation_rows(rows: list[dict], code: str) -> list[dict]:
  selected = []
  for row in rows:
    if row.get("Código indicador") != code:
      continue
    selected.append({
      field: safe_number(row.get(field)) if field in {"Valor", "Año"} else row.get(field)
      for field in FIELDS
    })
  selected.sort(key=period_key)
  return selected


def build_workbook(operation: dict, rows: list[dict], generated_at: str) -> Path:
  output_path = EXCEL_DIR / operation["filename"]
  wb = Workbook()

  ws = wb.active
  ws.title = "serie_historica"
  format_sheet(ws, operation["title"], operation["subtitle"])
  write_table(ws, FIELDS, rows)

  latest = rows[-1] if rows else {}
  meta_items = [
    ("Organización", "Observatorio Venezolano de Economía"),
    ("Dataset", operation["title"]),
    ("Fuente", "FMI - World Economic Outlook"),
    ("URL fuente", SOURCE_URL),
    ("Código indicador FMI", operation["code"]),
    ("País", "Venezuela"),
    ("Fecha generación OVE", generated_at),
    ("Número de registros", len(rows)),
    ("Primer periodo", rows[0]["Periodo"] if rows else ""),
    ("Último periodo", latest.get("Periodo", "")),
    ("Último valor disponible", latest.get("Valor", "")),
    ("Nota", "Los periodos futuros deben leerse según la clasificación y actualización de la fuente FMI WEO."),
  ]
  meta = wb.create_sheet("metadatos")
  format_sheet(meta, "Metadatos", operation["title"])
  write_key_values(meta, meta_items)

  EXCEL_DIR.mkdir(parents=True, exist_ok=True)
  wb.save(output_path)
  return output_path


def main() -> int:
  generated_at = today()
  source_rows = read_rows()
  outputs = []
  for operation in OPERATIONS:
    rows = operation_rows(source_rows, operation["code"])
    outputs.append(str(build_workbook(operation, rows, generated_at).relative_to(ROOT)))
  print(json.dumps({
    "dataset": "FMI PIB operation workbooks",
    "generated_at": generated_at,
    "outputs": outputs,
  }, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
