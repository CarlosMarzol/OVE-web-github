#!/usr/bin/env python3
"""Ingest official BCV datasets into OVE static data files.

The first active pipeline is the BCV daily exchange-rate page. PIB and INPC
pages are catalogued so their official workbooks can be added to the same flow.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import html
import json
import re
import ssl
import sys
import urllib.request
import zipfile
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "scripts" / "bcv_sources.json"
OUT_ROOT = ROOT / "assets" / "data" / "bcv"
RAW_DIR = OUT_ROOT / "raw"
JSON_DIR = OUT_ROOT / "json"
CSV_DIR = OUT_ROOT / "csv"
EXCEL_DIR = OUT_ROOT / "excel"
CATALOG_DIR = OUT_ROOT / "catalog"


def now_utc() -> str:
  return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_url(url: str) -> bytes:
  request = urllib.request.Request(
    url,
    headers={
      "User-Agent": "OVE data ingestion bot/1.0 (+https://observatoriodeeconomia.org.ve)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  )
  context = ssl._create_unverified_context()
  with urllib.request.urlopen(request, timeout=45, context=context) as response:
    return response.read()


def decode_html(payload: bytes) -> str:
  for encoding in ("utf-8", "latin-1"):
    try:
      return payload.decode(encoding)
    except UnicodeDecodeError:
      continue
  return payload.decode("utf-8", errors="replace")


def normalize_decimal(value: str) -> float:
  cleaned = html.unescape(value).strip()
  cleaned = cleaned.replace("\xa0", "").replace(" ", "")
  cleaned = cleaned.replace(".", "").replace(",", ".")
  return float(cleaned)


def extract_value_date(document: str) -> str:
  match = re.search(r'content="(\d{4}-\d{2}-\d{2})T[^"]*"', document)
  if not match:
    raise ValueError("Could not find BCV value date in exchange-rate page")
  return match.group(1)


def parse_exchange_rates(document: str, dataset: dict, fetched_at: str) -> list[dict]:
  value_date = extract_value_date(document)
  observations: list[dict] = []
  pattern = re.compile(
    r'<div id="(?P<div_id>[^"]+)"[^>]*>.*?<span>\s*(?P<currency>[A-Z]{3})\s*</span>.*?'
    r'<strong[^>]*>\s*(?P<value>[^<]+?)\s*</strong>',
    re.IGNORECASE | re.DOTALL,
  )

  for match in pattern.finditer(document):
    currency = match.group("currency").upper()
    if currency not in {"USD", "EUR", "CNY", "TRY", "RUB"}:
      continue
    observations.append({
      "date": value_date,
      "currency": currency,
      "value": normalize_decimal(match.group("value")),
      "unit": "VES por unidad de moneda extranjera",
      "frequency": dataset["frequency"],
      "indicator_id": f'{dataset["id"]}_{currency.lower()}',
      "indicator_name": f'{dataset["title"]} - {currency}',
      "source": "Banco Central de Venezuela",
      "source_url": dataset["page_url"],
      "fetched_at": fetched_at,
    })

  if not observations:
    raise ValueError("No exchange-rate observations were parsed from BCV page")
  return sorted(observations, key=lambda item: (item["date"], item["currency"]))


def load_existing_observations(path: Path) -> list[dict]:
  if not path.exists():
    return []
  data = json.loads(path.read_text(encoding="utf-8"))
  return data.get("observations", [])


def merge_observations(existing: Iterable[dict], incoming: Iterable[dict]) -> list[dict]:
  merged = {(item["date"], item["currency"]): item for item in existing}
  for item in incoming:
    merged[(item["date"], item["currency"])] = item
  return [merged[key] for key in sorted(merged)]


def dataset_payload(dataset: dict, observations: list[dict], fetched_at: str) -> dict:
  dates = [item["date"] for item in observations]
  currencies = sorted({item["currency"] for item in observations})
  return {
    "metadata": {
      "dataset_id": dataset["id"],
      "title": dataset["title"],
      "source": "Banco Central de Venezuela",
      "source_url": dataset["page_url"],
      "frequency": dataset["frequency"],
      "unit": "VES por unidad de moneda extranjera",
      "status": "official_source",
      "last_fetched_at": fetched_at,
      "first_date": min(dates) if dates else None,
      "last_date": max(dates) if dates else None,
      "currencies": currencies,
      "records": len(observations),
      "notes": "Datos extraidos de la pagina oficial del BCV. La serie se actualiza por fecha y moneda.",
    },
    "observations": observations,
  }


def write_json(path: Path, payload: dict) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, observations: list[dict]) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  fieldnames = ["date", "currency", "value", "unit", "frequency", "indicator_id", "indicator_name", "source", "source_url", "fetched_at"]
  with path.open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=fieldnames)
    writer.writeheader()
    for item in observations:
      writer.writerow({key: item.get(key, "") for key in fieldnames})


def column_name(index: int) -> str:
  name = ""
  while index:
    index, rem = divmod(index - 1, 26)
    name = chr(65 + rem) + name
  return name


def write_xlsx(path: Path, rows: list[list[object]], sheet_name: str = "serie_historica") -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  sheet_rows = []
  for row_idx, row in enumerate(rows, start=1):
    cells = []
    for col_idx, value in enumerate(row, start=1):
      ref = f"{column_name(col_idx)}{row_idx}"
      if isinstance(value, (int, float)) and not isinstance(value, bool):
        cells.append(f'<c r="{ref}"><v>{value}</v></c>')
      else:
        cells.append(f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>')
    sheet_rows.append(f'<row r="{row_idx}">{"".join(cells)}</row>')

  worksheet = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    f'<sheetData>{"".join(sheet_rows)}</sheetData>'
    '</worksheet>'
  )
  workbook = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    f'<sheets><sheet name="{escape(sheet_name)}" sheetId="1" r:id="rId1"/></sheets></workbook>'
  )
  rels = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    '</Relationships>'
  )
  workbook_rels = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    '</Relationships>'
  )
  content_types = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    '</Types>'
  )

  with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    archive.writestr("[Content_Types].xml", content_types)
    archive.writestr("_rels/.rels", rels)
    archive.writestr("xl/workbook.xml", workbook)
    archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
    archive.writestr("xl/worksheets/sheet1.xml", worksheet)


def write_excel(path: Path, observations: list[dict]) -> None:
  headers = ["indicator_id", "indicator_name", "date", "value", "currency", "unit", "frequency", "source", "source_url", "fetched_at"]
  rows: list[list[object]] = [headers]
  for item in observations:
    rows.append([item.get(header, "") for header in headers])
  write_xlsx(path, rows)


def catalog_excel_links(document: str, dataset: dict, fetched_at: str) -> dict:
  links = []
  for match in re.finditer(r'<a href="(?P<href>https://www\.bcv\.org\.ve/[^"]+\.(?:xls|xlsx))"[^>]*download="(?P<name>[^"]+)"', document, re.I):
    links.append({
      "file_name": html.unescape(match.group("name")),
      "url": html.unescape(match.group("href")),
      "format": Path(match.group("name")).suffix.lstrip(".").lower(),
    })
  return {
    "metadata": {
      "dataset_id": dataset["id"],
      "title": dataset["title"],
      "source": "Banco Central de Venezuela",
      "source_url": dataset["page_url"],
      "frequency": dataset["frequency"],
      "status": "catalogued_official_workbooks",
      "last_fetched_at": fetched_at,
      "files": len(links),
      "notes": "Catalogo de archivos oficiales BCV. La normalizacion de hojas se agregara por indicador.",
    },
    "files": links,
  }


def ingest_exchange(dataset: dict, fetched_at: str) -> dict:
  payload = fetch_url(dataset["page_url"])
  RAW_DIR.mkdir(parents=True, exist_ok=True)
  (RAW_DIR / f'{dataset["output_slug"]}.html').write_bytes(payload)
  document = decode_html(payload)
  incoming = parse_exchange_rates(document, dataset, fetched_at)
  json_path = JSON_DIR / f'{dataset["output_slug"]}.json'
  observations = merge_observations(load_existing_observations(json_path), incoming)
  payload_out = dataset_payload(dataset, observations, fetched_at)
  write_json(json_path, payload_out)
  write_csv(CSV_DIR / f'{dataset["output_slug"]}.csv', observations)
  write_excel(EXCEL_DIR / f'{dataset["output_slug"]}.xlsx', observations)
  return payload_out["metadata"]


def ingest_catalogued_workbook(dataset: dict, fetched_at: str) -> dict:
  payload = fetch_url(dataset["page_url"])
  RAW_DIR.mkdir(parents=True, exist_ok=True)
  (RAW_DIR / f'{dataset["output_slug"]}.html').write_bytes(payload)
  catalog = catalog_excel_links(decode_html(payload), dataset, fetched_at)
  write_json(CATALOG_DIR / f'{dataset["output_slug"]}_workbooks.json', catalog)
  return catalog["metadata"]


def build_catalog(results: list[dict], fetched_at: str) -> None:
  catalog_path = CATALOG_DIR / "bcv-catalog.json"
  existing = []
  if catalog_path.exists():
    try:
      existing = json.loads(catalog_path.read_text(encoding="utf-8")).get("datasets", [])
    except json.JSONDecodeError:
      existing = []
  by_id = {item["dataset_id"]: item for item in existing if "dataset_id" in item}
  for item in results:
    by_id[item["dataset_id"]] = item
  payload = {
    "source": "Banco Central de Venezuela",
    "source_url": "https://www.bcv.org.ve",
    "last_fetched_at": fetched_at,
    "datasets": [by_id[key] for key in sorted(by_id)],
  }
  write_json(catalog_path, payload)


def load_config() -> dict:
  return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def selected_datasets(config: dict, group: str) -> list[dict]:
  datasets = config["datasets"]
  if group == "all":
    return datasets
  if group == "daily":
    return [item for item in datasets if item["frequency"] == "daily"]
  if group == "monthly":
    return [item for item in datasets if item["frequency"] == "monthly"]
  return [item for item in datasets if item["id"] == group]


def main(argv: list[str] | None = None) -> int:
  parser = argparse.ArgumentParser(description="Ingest official BCV data for OVE")
  parser.add_argument("--group", default="daily", help="daily, monthly, all, or a dataset id")
  args = parser.parse_args(argv)

  config = load_config()
  fetched_at = now_utc()
  results = []
  for dataset in selected_datasets(config, args.group):
    if dataset["parser"] == "exchange_rate_current":
      results.append(ingest_exchange(dataset, fetched_at))
    elif dataset["parser"] == "excel_catalog":
      results.append(ingest_catalogued_workbook(dataset, fetched_at))
    else:
      raise ValueError(f'Unsupported parser: {dataset["parser"]}')
  build_catalog(results, fetched_at)
  print(json.dumps({"updated": [item["dataset_id"] for item in results], "fetched_at": fetched_at}, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
