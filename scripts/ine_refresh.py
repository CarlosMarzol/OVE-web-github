#!/usr/bin/env python3
"""Refresh INE Venezuela resource catalog from the public INE website."""

from __future__ import annotations

import csv
import datetime as dt
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from openpyxl import Workbook

from ove_excel_format import format_sheet, write_key_values, write_table


ROOT = Path(__file__).resolve().parents[1]
INE_ROOT = ROOT / "assets" / "data" / "ine"
RAW_DIR = INE_ROOT / "raw"
CATALOG_DIR = INE_ROOT / "catalog"
CSV_DIR = INE_ROOT / "csv"
JSON_DIR = INE_ROOT / "json"
EXCEL_DIR = INE_ROOT / "excel"

HOME_URL = "https://ine.gob.ve/"
SOURCE_NAME = "INE Venezuela - Instituto Nacional de Estadística"
USER_AGENT = "OVE INE refresh/1.0 (+https://ove-web-github.vercel.app/)"

CATALOG_FIELDS = [
  "Fuente",
  "País",
  "Título",
  "Categoría",
  "Tipo de recurso",
  "Formato",
  "Año publicación",
  "Mes publicación",
  "Archivo original",
  "URL fuente",
  "URL portal",
]

MONTHS = {
  "01": "enero",
  "02": "febrero",
  "03": "marzo",
  "04": "abril",
  "05": "mayo",
  "06": "junio",
  "07": "julio",
  "08": "agosto",
  "09": "septiembre",
  "10": "octubre",
  "11": "noviembre",
  "12": "diciembre",
}


def today() -> str:
  return dt.date.today().isoformat()


def fetch_text(url: str) -> str:
  request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
  with urllib.request.urlopen(request, timeout=90) as response:
    return response.read().decode("utf-8", errors="replace")


def clean_text(value: str) -> str:
  value = re.sub(r"<[^>]+>", " ", value)
  value = html.unescape(value)
  return re.sub(r"\s+", " ", value).strip()


def extension(url: str) -> str:
  path = urllib.parse.urlparse(url).path
  if "." not in path:
    return ""
  return path.rsplit(".", 1)[-1].lower()


def publication_date_parts(url: str) -> tuple[str, str]:
  match = re.search(r"/uploads/(\d{4})/(\d{2})/", url)
  if not match:
    return "", ""
  year, month = match.groups()
  return year, MONTHS.get(month, month)


def infer_category(title: str, url: str) -> str:
  text = f"{title} {url}".lower()
  checks = [
    ("Censo 2011", ["censo-2011", "censo_2011", "censo 2011"]),
    ("Censo 2001-2011", ["2001-y-2011", "2001-2011"]),
    ("Proyección de población", ["proyeccion", "proyección", "edad-simple", "esperanza-de-vida", "nacional-36"]),
    ("Población", ["poblacion", "población", "grupos-edad", "sexo"]),
    ("Estadísticas vitales", ["nacimientos", "defunciones", "matrimonios", "suicidios", "divorcios"]),
    ("Vivienda y servicios", ["vivienda", "viviendas", "hogares", "servicio", "agua", "basura", "electrico", "excretas", "hacinamiento"]),
    ("Comercio exterior", ["exportaciones", "importaciones"]),
    ("Encuesta de hogares", ["por-tipo", "por-variable", "trabajo-2001-2023", "encuesta-de-hogares"]),
    ("Nomenclador", ["nomenclador"]),
    ("Anuarios", ["anuario"]),
    ("Publicaciones", ["resumen", "folleto", "plan", "revista", "documento", "pdf"]),
  ]
  for category, tokens in checks:
    if any(token in text for token in tokens):
      return category
  return "Otros recursos INE"


def resource_type(fmt: str) -> str:
  if fmt in {"xls", "xlsx", "csv"}:
    return "Dato tabular"
  if fmt == "pdf":
    return "Documento"
  return "Recurso"


def load_resources() -> list[dict]:
  RAW_DIR.mkdir(parents=True, exist_ok=True)
  html_text = fetch_text(HOME_URL)
  (RAW_DIR / "ine_venezuela_home.html").write_text(html_text, encoding="utf-8")
  records = {}
  for match in re.finditer(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html_text, flags=re.I | re.S):
    url = urllib.parse.urljoin(HOME_URL, html.unescape(match.group(1)))
    fmt = extension(url)
    if fmt not in {"xls", "xlsx", "csv", "pdf"}:
      continue
    if urllib.parse.urlparse(url).netloc != "ine.gob.ve":
      continue
    title = clean_text(match.group(2)) or urllib.parse.unquote(Path(urllib.parse.urlparse(url).path).name)
    if url in records:
      if len(title) > len(records[url]["Título"]):
        records[url]["Título"] = title
      continue
    year, month = publication_date_parts(url)
    records[url] = {
      "Fuente": SOURCE_NAME,
      "País": "Venezuela",
      "Título": title,
      "Categoría": infer_category(title, url),
      "Tipo de recurso": resource_type(fmt),
      "Formato": fmt.upper(),
      "Año publicación": year,
      "Mes publicación": month,
      "Archivo original": urllib.parse.unquote(Path(urllib.parse.urlparse(url).path).name),
      "URL fuente": url,
      "URL portal": HOME_URL,
    }
  return sorted(records.values(), key=lambda row: (row["Categoría"], row["Formato"], row["Título"], row["URL fuente"]))


def write_outputs(resources: list[dict], generated_at: str) -> None:
  for directory in (CATALOG_DIR, CSV_DIR, JSON_DIR, EXCEL_DIR):
    directory.mkdir(parents=True, exist_ok=True)

  csv_path = CATALOG_DIR / "catalogo_dataset_web_ove_ine_venezuela.csv"
  with csv_path.open("w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(handle, fieldnames=CATALOG_FIELDS, delimiter=";", lineterminator="\n")
    writer.writeheader()
    writer.writerows(resources)

  # Same catalog under csv/ for consistency with source pages that expose data downloads.
  csv_copy = CSV_DIR / "ove_ine_venezuela_catalogo_recursos.csv"
  csv_copy.write_text(csv_path.read_text(encoding="utf-8"), encoding="utf-8")

  tabular = [row for row in resources if row["Tipo de recurso"] == "Dato tabular"]
  documents = [row for row in resources if row["Tipo de recurso"] == "Documento"]
  payload = {
    "metadatos": {
      "Organización": "Observatorio Venezolano de Economía",
      "Dataset": "INE Venezuela - catálogo de recursos oficiales",
      "Fecha generación": generated_at,
      "Fuente": SOURCE_NAME,
      "URL portal": HOME_URL,
      "País": "Venezuela",
      "Número de recursos": len(resources),
      "Recursos tabulares": len(tabular),
      "Documentos": len(documents),
    },
    "catalogo": resources,
  }
  (CATALOG_DIR / "ine-catalog.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  (JSON_DIR / "ove_ine_venezuela_catalogo_recursos.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

  wb = Workbook()
  ws = wb.active
  ws.title = "catalogo"
  format_sheet(ws, "INE Venezuela", "Catálogo de recursos oficiales")
  write_table(ws, CATALOG_FIELDS, resources)
  meta = wb.create_sheet("metadatos")
  format_sheet(meta, "Metadatos", "INE Venezuela")
  write_key_values(meta, payload["metadatos"].items())
  wb.save(CATALOG_DIR / "catalogo_dataset_web_ove_ine_venezuela.xlsx")

  wb_public = Workbook()
  ws_public = wb_public.active
  ws_public.title = "catalogo"
  format_sheet(ws_public, "INE Venezuela", "Catálogo de recursos oficiales")
  write_table(ws_public, CATALOG_FIELDS, resources)
  meta_public = wb_public.create_sheet("metadatos")
  format_sheet(meta_public, "Metadatos", "INE Venezuela")
  write_key_values(meta_public, payload["metadatos"].items())
  wb_public.save(EXCEL_DIR / "ove_ine_venezuela_catalogo_recursos.xlsx")


def main() -> int:
  generated_at = today()
  resources = load_resources()
  write_outputs(resources, generated_at)
  print(json.dumps({
    "dataset": "INE Venezuela - catálogo de recursos oficiales",
    "generated_at": generated_at,
    "resources": len(resources),
    "tabular": sum(1 for row in resources if row["Tipo de recurso"] == "Dato tabular"),
    "documents": sum(1 for row in resources if row["Tipo de recurso"] == "Documento"),
    "output": str(INE_ROOT),
  }, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
