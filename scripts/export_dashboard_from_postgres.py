#!/usr/bin/env python3
"""Export the public OVE dashboard dataset from a private PostgreSQL mart.

The public website must not connect directly to PostgreSQL. This script is the
safe bridge: it reads the approved mart_ove view locally, then regenerates the
static JSON/CSV/XLSX files consumed by the browser dashboard.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

from openpyxl import Workbook

from ove_excel_format import format_sheet, write_key_values, write_table


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "data" / "indicadores-clave"
DEFAULT_VIEW = "mart_ove.indicadores_clave_public"

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


def now_utc() -> str:
  return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def psql_env() -> dict[str, str]:
  env = os.environ.copy()
  env.setdefault("PGHOST", "127.0.0.1")
  env.setdefault("PGPORT", "5433")
  env.setdefault("PGDATABASE", "ove_venezuela_data")
  return env


def read_rows(view_name: str) -> list[dict]:
  query = f"""
    copy (
      select jsonb_build_object(
        'indicator_id', indicator_id,
        'indicator', indicador,
        'area', area,
        'source', fuente,
        'source_url', fuente_url,
        'frequency', frecuencia,
        'period', periodo,
        'date', fecha,
        'year', anio,
        'value', valor,
        'unit', unidad
      )::text
      from {view_name}
      where indicator_id is not null
        and fecha is not null
      order by indicator_id, fecha
    ) to stdout;
  """
  result = subprocess.run(
    ["psql", "-X", "-v", "ON_ERROR_STOP=1", "-q", "-t", "-A", "-c", query],
    check=False,
    env=psql_env(),
    text=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
  )
  if result.returncode:
    sys.stderr.write(result.stderr)
    raise SystemExit(result.returncode)

  rows = []
  for line in result.stdout.splitlines():
    if line.strip():
      rows.append(json.loads(line))
  return rows


def normalize_rows(rows: list[dict]) -> list[dict]:
  normalized = []
  for row in rows:
    item = {field: row.get(field) for field in FIELDS}
    if item["date"]:
      item["date"] = str(item["date"])[:10]
    if item["year"] is not None:
      item["year"] = int(item["year"])
    if item["value"] is not None:
      item["value"] = float(item["value"])
    normalized.append(item)
  normalized.sort(key=lambda item: (item["indicator_id"], item["date"]))
  return normalized


def write_outputs(rows: list[dict], view_name: str) -> bool:
  OUT_DIR.mkdir(parents=True, exist_ok=True)
  json_path = OUT_DIR / "ove_indicadores_clave_venezuela.json"
  if json_path.exists():
    try:
      previous = json.loads(json_path.read_text(encoding="utf-8"))
      if previous.get("observations") == rows:
        return False
    except (OSError, json.JSONDecodeError):
      pass

  metadata = {
    "title": "Indicadores clave de Venezuela",
    "description": "Series historicas descargables para el dashboard OVE de indicadores clave.",
    "generated_at": now_utc(),
    "source_database": os.environ.get("PGDATABASE", "ove_venezuela_data"),
    "source_view": view_name,
    "records": len(rows),
    "indicators": sorted({item["indicator_id"] for item in rows}),
    "sources": sorted({item["source"] for item in rows}),
  }
  payload = {"metadata": metadata, "observations": rows}
  json_path.write_text(
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
  format_sheet(ws, "Indicadores clave de Venezuela", "Dashboard OVE")
  write_table(ws, FIELDS, rows)
  meta = wb.create_sheet("metadatos")
  meta_items = []
  for key, value in metadata.items():
    if isinstance(value, list):
      value = json.dumps(value, ensure_ascii=False)
    meta_items.append((key, value))
  format_sheet(meta, "Metadatos", "Indicadores clave de Venezuela")
  write_key_values(meta, meta_items)
  wb.save(OUT_DIR / "ove_indicadores_clave_venezuela.xlsx")
  return True


def main() -> int:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--view", default=DEFAULT_VIEW, help="PostgreSQL view to export.")
  args = parser.parse_args()

  rows = normalize_rows(read_rows(args.view))
  if not rows:
    raise SystemExit(f"No rows exported from {args.view}")
  changed = write_outputs(rows, args.view)
  print(json.dumps({"records": len(rows), "output": str(OUT_DIR), "view": args.view, "changed": changed}, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
