#!/usr/bin/env python3
"""Attach data-only Excel API links to the indicator web inventory."""

from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
WEB_INDEX = ROOT / "assets" / "data" / "inventario-indicadores" / "inventario_indicadores_ove_web.json"

DOWNLOADABLE_SOURCES = {
  "Banco Mundial - WDI",
  "Banco Central de Venezuela",
  "FMI - World Economic Outlook",
  "OIT - ILOSTAT",
  "CEPALSTAT - CEPAL",
  "UNCTADstat - UNCTAD",
  "FRED - Federal Reserve Bank of St. Louis",
  "OVE - Indicadores clave",
  "INE Venezuela",
}


def slug(value: str, fallback: str = "indicador") -> str:
  text = unicodedata.normalize("NFKD", value or "")
  text = "".join(ch for ch in text if not unicodedata.combining(ch))
  text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
  return text[:96] or fallback


def has_observed_values(record: dict) -> bool:
  raw_value = record.get("registros_con_valor")
  if raw_value in (None, ""):
    raw_value = record.get("registros")
  value = str(raw_value or "").strip()
  try:
    return float(value) > 0
  except ValueError:
    return record.get("fuente") == "INE Venezuela"


def main() -> None:
  web_index = json.loads(WEB_INDEX.read_text(encoding="utf-8"))
  records = web_index.get("records", [])
  seen = defaultdict(int)
  enabled = 0

  for record in records:
    source = record.get("fuente", "")
    code = record.get("codigo", "")
    base = "__".join([
      slug(source, "fuente"),
      slug(code, "sin-codigo"),
      slug(record.get("frecuencia", ""), "sin-frecuencia"),
      slug(record.get("indicador", ""), "indicador"),
    ])
    seen[base] += 1
    download_id = base if seen[base] == 1 else f"{base}-{seen[base]}"
    record["download_id"] = download_id

    if source in DOWNLOADABLE_SOURCES and code and has_observed_values(record):
      record["excel"] = f"/api/indicator-excel?id={quote(download_id)}"
      record["download_estado"] = "datos_indicador"
      enabled += 1
    else:
      record["excel"] = ""
      record["download_estado"] = "sin_datos_normalizados"

  web_index.setdefault("metadata", {})["indicator_excel_api_links"] = enabled
  web_index.setdefault("metadata", {})["indicator_excel_api_missing"] = len(records) - enabled
  WEB_INDEX.write_text(json.dumps(web_index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
  print(f"indicator_excel_api_links={enabled}")
  print(f"indicator_excel_api_missing={len(records) - enabled}")
  print(f"web_index={WEB_INDEX}")


if __name__ == "__main__":
  main()
