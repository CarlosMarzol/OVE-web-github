#!/usr/bin/env python3
"""Refresh CEPALSTAT Venezuela datasets from the public Open Data API."""

from __future__ import annotations

import csv
import datetime as dt
import gzip
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from openpyxl import Workbook

from ove_excel_format import format_sheet, write_key_values, write_table


ROOT = Path(__file__).resolve().parents[1]
CEPAL_ROOT = ROOT / "assets" / "data" / "cepal"
RAW_DIR = CEPAL_ROOT / "raw"
CSV_DIR = CEPAL_ROOT / "csv"
JSON_DIR = CEPAL_ROOT / "json"
EXCEL_DIR = CEPAL_ROOT / "excel"
CATALOG_DIR = CEPAL_ROOT / "catalog"

API_ROOT = "https://api-cepalstat.cepal.org/cepalstat/api/v1"
OPEN_DATA_URL = "https://statistics.cepal.org/portal/cepalstat/open-data.html?lang=es"
SPEC_URL = "https://api-cepalstat.cepal.org/apispec_1.json"
COUNTRY_MEMBER_ID = 259
COUNTRY_NAME = "Venezuela (República Bolivariana de)"
COUNTRY_ISO3 = "VEN"
USER_AGENT = "OVE CEPALSTAT refresh/1.0 (+https://ove-venezuela.com/)"
MAX_WORKERS = 8

DATA_FIELDS = [
  "País",
  "Código país",
  "Fuente",
  "ID indicador CEPALSTAT",
  "Indicador",
  "Tema",
  "Área",
  "Ruta temática",
  "Unidad",
  "Periodo",
  "Año",
  "Valor",
  "Dimensiones",
  "Códigos dimensiones",
  "ID fuente",
  "Fuente original",
  "URL publicación fuente",
  "Notas",
  "Última actualización indicador",
  "URL API",
  "URL fuente",
]

CATALOG_FIELDS = [
  "Fuente",
  "País",
  "ID indicador CEPALSTAT",
  "Indicador",
  "Tema",
  "Área",
  "Ruta temática",
  "Unidad",
  "Número de registros",
  "Primer periodo",
  "Último periodo",
  "Último valor disponible",
  "Última actualización indicador",
  "Estado descarga",
  "Error descarga",
  "Archivo valores CSV.GZ",
  "Archivo catálogo JSON",
  "Archivo catálogo Excel",
  "URL API",
  "URL fuente",
]


def today() -> str:
  return dt.date.today().isoformat()


def request_json(url: str, timeout: int = 90, attempts: int = 3) -> dict[str, Any]:
  last_error: Exception | None = None
  for attempt in range(1, attempts + 1):
    try:
      request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
      with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8-sig"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
      last_error = exc
      if attempt < attempts:
        time.sleep(0.6 * attempt)
  raise RuntimeError(str(last_error))


def safe_float(value: object) -> float | None:
  if value in (None, ""):
    return None
  try:
    return float(str(value).replace(",", "."))
  except ValueError:
    return None


def infer_year(value: str) -> int | None:
  match = re.search(r"\b(18|19|20|21)\d{2}\b", value or "")
  return int(match.group(0)) if match else None


def period_sort_key(value: str) -> tuple[int, str]:
  year = infer_year(value)
  return (year or -9999, value or "")


def clean_dimension_name(value: str) -> str:
  value = (value or "").replace("__ESTANDAR", "")
  return re.sub(r"_+", " ", value).strip()


def api_url(path: str, params: dict[str, object]) -> str:
  return f"{API_ROOT}{path}?{urllib.parse.urlencode(params)}"


def load_indicator_tree() -> list[dict]:
  url = api_url("/thematic-tree", {"lang": "es", "format": "json"})
  payload = request_json(url, timeout=120)
  RAW_DIR.mkdir(parents=True, exist_ok=True)
  (RAW_DIR / "cepalstat_thematic_tree_es.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
  )
  indicators: list[dict] = []

  def walk(node: dict, path: list[str]) -> None:
    name = node.get("name") or ""
    current_path = path + ([name] if name else [])
    if node.get("indicator_id"):
      thematic_path = " > ".join(path)
      indicators.append({
        "ID indicador CEPALSTAT": int(node["indicator_id"]),
        "Indicador árbol": name,
        "Ruta temática": thematic_path,
      })
    for child in node.get("children") or []:
      walk(child, current_path)

  walk(payload["body"], [])
  return indicators


def dimension_maps(dimensions: list[dict]) -> tuple[dict[int, tuple[str, str]], dict[int, str]]:
  member_to_dimension: dict[int, tuple[str, str]] = {}
  dimension_names: dict[int, str] = {}
  for dimension in dimensions:
    dimension_id = int(dimension.get("id"))
    dimension_name = clean_dimension_name(dimension.get("name", ""))
    dimension_names[dimension_id] = dimension_name
    for member in dimension.get("members") or []:
      member_to_dimension[int(member["id"])] = (dimension_name, member.get("path") or member.get("name") or "")
  return member_to_dimension, dimension_names


def row_dimensions(row: dict, member_to_dimension: dict[int, tuple[str, str]]) -> tuple[str, str, str]:
  labels = []
  codes = []
  period = ""
  for key, value in sorted(row.items()):
    if not key.startswith("dim_"):
      continue
    dimension_id = int(key.split("_", 1)[1])
    member_id = int(value)
    dimension_name, member_name = member_to_dimension.get(member_id, (f"Dimensión {dimension_id}", str(member_id)))
    labels.append(f"{dimension_name}: {member_name}")
    codes.append(f"{key}={member_id}")
    if not period and (infer_year(member_name) is not None or "año" in dimension_name.lower() or "year" in dimension_name.lower()):
      period = member_name
  if not period:
    period = next((label.split(": ", 1)[1] for label in labels if infer_year(label) is not None), "")
  return " | ".join(labels), "; ".join(codes), period


def first_source(row: dict, sources: dict[int, dict]) -> dict:
  try:
    return sources.get(int(row.get("source_id")), {})
  except (TypeError, ValueError):
    return {}


def note_text(row: dict, notes: dict[int, str]) -> str:
  ids = [item.strip() for item in str(row.get("notes_ids") or "").split(",") if item.strip()]
  descriptions = []
  for note_id in ids:
    try:
      description = notes.get(int(note_id), "")
    except ValueError:
      description = ""
    if description:
      descriptions.append(description)
  return " | ".join(descriptions)


def fetch_indicator(indicator: dict) -> dict:
  indicator_id = indicator["ID indicador CEPALSTAT"]
  url = api_url(
    f"/indicator/{indicator_id}/data",
    {"lang": "es", "format": "json", "members": COUNTRY_MEMBER_ID, "in": 1, "path": 1},
  )
  try:
    payload = request_json(url, timeout=90)
    body = payload.get("body") or {}
    metadata = body.get("metadata") or {}
    raw_rows = body.get("data") or []
    sources = {int(item["id"]): item for item in body.get("sources") or [] if item.get("id") is not None}
    notes = {int(item["id"]): item.get("description", "") for item in body.get("footnotes") or [] if item.get("id") is not None}
    member_to_dimension, _ = dimension_maps(body.get("dimensions") or [])
    rows = []
    for raw in raw_rows:
      dimensions, dimension_codes, period = row_dimensions(raw, member_to_dimension)
      source = first_source(raw, sources)
      value = safe_float(raw.get("value"))
      rows.append({
        "País": COUNTRY_NAME,
        "Código país": raw.get("iso3") or COUNTRY_ISO3,
        "Fuente": "CEPALSTAT - CEPAL",
        "ID indicador CEPALSTAT": indicator_id,
        "Indicador": metadata.get("indicator_name") or indicator.get("Indicador árbol", ""),
        "Tema": metadata.get("theme", ""),
        "Área": metadata.get("area", ""),
        "Ruta temática": indicator.get("Ruta temática", ""),
        "Unidad": metadata.get("unit", ""),
        "Periodo": period,
        "Año": infer_year(period),
        "Valor": value,
        "Dimensiones": dimensions,
        "Códigos dimensiones": dimension_codes,
        "ID fuente": raw.get("source_id", ""),
        "Fuente original": source.get("description", ""),
        "URL publicación fuente": source.get("publication_url", ""),
        "Notas": note_text(raw, notes),
        "Última actualización indicador": metadata.get("last_update", ""),
        "URL API": url,
        "URL fuente": OPEN_DATA_URL,
      })
    return {
      "indicator": indicator,
      "metadata": metadata,
      "rows": rows,
      "url": url,
      "error": "",
    }
  except Exception as exc:  # noqa: BLE001 - catalog the source failure.
    return {
      "indicator": indicator,
      "metadata": {},
      "rows": [],
      "url": url,
      "error": str(exc)[:500],
    }


def catalog_row(result: dict) -> dict:
  rows = result["rows"]
  indicator = result["indicator"]
  metadata = result["metadata"] or {}
  latest = max((row for row in rows if row["Valor"] is not None), key=lambda row: period_sort_key(row["Periodo"]), default=None)
  periods = [row["Periodo"] for row in rows if row.get("Periodo")]
  return {
    "Fuente": "CEPALSTAT - CEPAL",
    "País": COUNTRY_NAME,
    "ID indicador CEPALSTAT": indicator["ID indicador CEPALSTAT"],
    "Indicador": metadata.get("indicator_name") or indicator.get("Indicador árbol", ""),
    "Tema": metadata.get("theme", ""),
    "Área": metadata.get("area", ""),
    "Ruta temática": indicator.get("Ruta temática", ""),
    "Unidad": metadata.get("unit", ""),
    "Número de registros": len(rows),
    "Primer periodo": min(periods, key=period_sort_key) if periods else "",
    "Último periodo": max(periods, key=period_sort_key) if periods else "",
    "Último valor disponible": latest["Valor"] if latest else None,
    "Última actualización indicador": metadata.get("last_update", ""),
    "Estado descarga": "Con datos" if rows else "Sin datos para Venezuela",
    "Error descarga": result["error"],
    "Archivo valores CSV.GZ": "assets/data/cepal/csv/ove_cepalstat_venezuela_valores.csv.gz",
    "Archivo catálogo JSON": "assets/data/cepal/catalog/cepal-catalog.json",
    "Archivo catálogo Excel": "assets/data/cepal/catalog/catalogo_dataset_web_ove_cepalstat.xlsx",
    "URL API": result["url"],
    "URL fuente": OPEN_DATA_URL,
  }


def write_outputs(results: list[dict], generated_at: str) -> tuple[list[dict], int]:
  for directory in (CSV_DIR, JSON_DIR, EXCEL_DIR, CATALOG_DIR):
    directory.mkdir(parents=True, exist_ok=True)

  catalog = [catalog_row(result) for result in results]
  catalog.sort(key=lambda row: (row["Estado descarga"] != "Con datos", row["Ruta temática"], row["Indicador"]))

  csv_path = CSV_DIR / "ove_cepalstat_venezuela_valores.csv.gz"
  record_count = 0
  with gzip.open(csv_path, "wt", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=DATA_FIELDS, delimiter=";", lineterminator="\n")
    writer.writeheader()
    for result in results:
      for row in result["rows"]:
        writer.writerow(row)
        record_count += 1

  catalog_csv = CATALOG_DIR / "catalogo_dataset_web_ove_cepalstat.csv"
  with catalog_csv.open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=CATALOG_FIELDS, delimiter=";", lineterminator="\n")
    writer.writeheader()
    writer.writerows(catalog)

  metadata = {
    "Organización": "Observatorio Venezolano de Economía",
    "Dataset": "CEPALSTAT - Venezuela",
    "Fecha generación": generated_at,
    "Fuente": "CEPALSTAT - CEPAL",
    "URL fuente": OPEN_DATA_URL,
    "API": SPEC_URL,
    "País": COUNTRY_NAME,
    "Código país": COUNTRY_ISO3,
    "ID país CEPALSTAT": COUNTRY_MEMBER_ID,
    "Número de indicadores catalogados": len(catalog),
    "Número de indicadores con datos": sum(1 for row in catalog if row["Número de registros"] > 0),
    "Número de registros": record_count,
  }
  payload = {"metadatos": metadata, "catalogo": catalog}
  (CATALOG_DIR / "cepal-catalog.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  (JSON_DIR / "ove_cepalstat_venezuela_metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

  wb = Workbook()
  ws = wb.active
  ws.title = "catalogo"
  format_sheet(ws, "CEPALSTAT - Venezuela", "Catálogo de indicadores")
  write_table(ws, CATALOG_FIELDS, catalog)
  meta = wb.create_sheet("metadatos")
  format_sheet(meta, "Metadatos", "CEPALSTAT - Venezuela")
  write_key_values(meta, metadata.items())
  wb.save(CATALOG_DIR / "catalogo_dataset_web_ove_cepalstat.xlsx")

  return catalog, record_count


def main() -> int:
  generated_at = today()
  indicators = load_indicator_tree()
  results = []
  with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = [executor.submit(fetch_indicator, indicator) for indicator in indicators]
    for index, future in enumerate(as_completed(futures), start=1):
      result = future.result()
      results.append(result)
      if index % 100 == 0:
        print(json.dumps({
          "dataset": "CEPALSTAT - Venezuela",
          "processed": index,
          "indicators": len(indicators),
          "records_partial": sum(len(item["rows"]) for item in results),
        }, ensure_ascii=False), flush=True)

  catalog, record_count = write_outputs(results, generated_at)
  print(json.dumps({
    "dataset": "CEPALSTAT - Venezuela",
    "generated_at": generated_at,
    "indicators_cataloged": len(catalog),
    "indicators_with_data": sum(1 for row in catalog if row["Número de registros"] > 0),
    "records": record_count,
    "output": str(CEPAL_ROOT),
  }, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
