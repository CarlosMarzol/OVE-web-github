#!/usr/bin/env python3
"""Refresh World Bank WDI datasets for Venezuela used by the static OVE site."""

from __future__ import annotations

import csv
import datetime as dt
import json
import urllib.request
from collections import OrderedDict
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
WB_ROOT = ROOT / "assets" / "data" / "world-bank"
CSV_DIR = WB_ROOT / "csv"
JSON_DIR = WB_ROOT / "json"
EXCEL_DIR = WB_ROOT / "excel"
CATALOG_DIR = WB_ROOT / "catalog"
COUNTRY = "VEN"
DOWNLOAD_DATE = dt.datetime.now(dt.timezone.utc).date().isoformat()
GENERATED_AT = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

FIELDNAMES = [
    "País OVE",
    "País Banco Mundial",
    "Código ISO 2",
    "Código ISO 3",
    "Región",
    "Nivel de ingreso",
    "Año",
    "Área temática",
    "ID área",
    "Subárea",
    "ID subárea",
    "Código indicador",
    "Indicador",
    "Valor",
    "Fuente",
    "Fecha descarga",
    "Error descarga",
]


def fetch_json(url: str):
    request = urllib.request.Request(url, headers={"User-Agent": "OVE World Bank ingest/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_indicator(code: str):
    url = f"https://api.worldbank.org/v2/country/{COUNTRY}/indicator/{code}?format=json&per_page=20000"
    payload = fetch_json(url)
    if not isinstance(payload, list) or len(payload) < 2:
        raise ValueError(f"Unexpected World Bank response for {code}")
    return payload[1] or []


def value_to_csv(value):
    if value is None:
        return ""
    return f"{float(value):.15g}".replace(".", ",")


def value_to_json(value):
    if value in ("", None):
        return None
    return float(str(value).replace(",", "."))


def load_area_definition(path: Path):
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        rows = list(reader)
    indicators = OrderedDict()
    for row in rows:
        code = row["Código indicador"]
        if code not in indicators:
            indicators[code] = {
                "Área temática": row["Área temática"],
                "ID área": row["ID área"],
                "Subárea": row["Subárea"],
                "ID subárea": row["ID subárea"],
                "Código indicador": code,
                "Indicador": row["Indicador"],
            }
    return rows, indicators


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES, delimiter=";", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def column_name(index: int) -> str:
    name = ""
    while index:
        index, rem = divmod(index - 1, 26)
        name = chr(65 + rem) + name
    return name


def write_xlsx(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet_rows = [FIELDNAMES] + [[row.get(field, "") for field in FIELDNAMES] for row in rows]
    shared_strings = []
    string_index = {}

    def shared(value):
        text = "" if value is None else str(value)
        if text not in string_index:
            string_index[text] = len(shared_strings)
            shared_strings.append(text)
        return string_index[text]

    sheet_data = []
    for r_idx, row in enumerate(sheet_rows, start=1):
        cells = []
        for c_idx, value in enumerate(row, start=1):
            ref = f"{column_name(c_idx)}{r_idx}"
            cells.append(f'<c r="{ref}" t="s"><v>{shared(value)}</v></c>')
        sheet_data.append(f'<row r="{r_idx}">{"".join(cells)}</row>')

    with ZipFile(path, "w", ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>""")
        zf.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>""")
        zf.writestr("xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>""")
        zf.writestr("xl/workbook.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="datos" sheetId="1" r:id="rId1"/></sheets></workbook>""")
        zf.writestr("xl/worksheets/sheet1.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>{''.join(sheet_data)}</sheetData></worksheet>""")
        zf.writestr("xl/sharedStrings.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{len(shared_strings)}" uniqueCount="{len(shared_strings)}">
{''.join(f'<si><t>{escape(s)}</t></si>' for s in shared_strings)}</sst>""")
        zf.writestr("docProps/core.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"><dc:creator>OVE</dc:creator><dcterms:created>{GENERATED_AT}</dcterms:created></cp:coreProperties>""")
        zf.writestr("docProps/app.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>OVE</Application></Properties>""")


def write_json_dataset(path: Path, area_name: str, area_id: str, rows: list[dict]) -> None:
    values = [int(r["Año"]) for r in rows if r["Valor"] not in ("", None)]
    indicators = sorted({r["Código indicador"] for r in rows})
    payload = {
        "metadatos": {
            "Organización": "Observatorio Venezolano de Economía",
            "Dataset": "Banco Mundial - Venezuela",
            "Área temática": area_name,
            "País": "Venezuela",
            "Fuente": "Banco Mundial - World Development Indicators",
            "Archivo origen": f"OVE_Banco_Mundial_Venezuela_{area_id}.csv",
            "Fecha generación": GENERATED_AT,
            "Número de registros": str(len(rows)),
            "Primer año": str(min(values)) if values else "",
            "Último año": str(max(values)) if values else "",
            "Número de indicadores": str(len(indicators)),
        },
        "datos": [{**r, "Año": int(r["Año"]), "Valor": value_to_json(r["Valor"]), "Error descarga": r["Error descarga"] or None} for r in rows],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def refresh_area(csv_path: Path):
    _, indicators = load_area_definition(csv_path)
    area_rows = []
    for definition in indicators.values():
        code = definition["Código indicador"]
        error = ""
        try:
            observations = fetch_indicator(code)
        except Exception as exc:
            observations = []
            error = str(exc)
        if not observations:
            observations = [{"date": year, "value": None, "country": {"value": "Venezuela, RB", "id": "VE"}, "countryiso3code": "VEN"} for year in range(1960, 2026)]
        for obs in sorted(observations, key=lambda item: int(item["date"])):
            country = obs.get("country") or {}
            row = {
                "País OVE": "Venezuela",
                "País Banco Mundial": country.get("value", "Venezuela, RB"),
                "Código ISO 2": country.get("id", "VE"),
                "Código ISO 3": obs.get("countryiso3code") or "VEN",
                "Región": "Latin America & Caribbean",
                "Nivel de ingreso": "Not classified",
                "Año": int(obs["date"]),
                **definition,
                "Valor": value_to_csv(obs.get("value")),
                "Fuente": "Banco Mundial - World Development Indicators",
                "Fecha descarga": DOWNLOAD_DATE,
                "Error descarga": error,
            }
            area_rows.append(row)
    area_rows.sort(key=lambda r: (r["Área temática"], r["Subárea"], r["Código indicador"], r["Año"]))
    return next(iter(indicators.values()))["Área temática"], next(iter(indicators.values()))["ID área"], area_rows


def main() -> int:
    catalog_rows = []
    for csv_path in sorted(CSV_DIR.glob("ove_banco_mundial_venezuela_*.csv")):
        area_name, area_id, rows = refresh_area(csv_path)
        json_path = JSON_DIR / f"ove_banco_mundial_venezuela_{area_id}.json"
        excel_path = EXCEL_DIR / f"ove_banco_mundial_venezuela_{area_id}.xlsx"
        write_csv(csv_path, rows)
        write_json_dataset(json_path, area_name, area_id, rows)
        write_xlsx(excel_path, rows)
        years = [int(r["Año"]) for r in rows if r["Valor"] not in ("", None)]
        catalog_rows.append({
            "Área temática": area_name,
            "ID área": area_id,
            "Registros": len(rows),
            "Indicadores": len({r["Código indicador"] for r in rows}),
            "Primer año": min(years) if years else "",
            "Último año": max(years) if years else "",
            "Archivo CSV": f"assets/data/world-bank/csv/{csv_path.name}",
            "Archivo JSON": f"assets/data/world-bank/json/{json_path.name}",
            "Archivo Excel": f"assets/data/world-bank/excel/{excel_path.name}",
        })
        print(f"{area_id}: {len(rows)} rows, latest value year {catalog_rows[-1]['Último año']}")

    catalog_rows.sort(key=lambda r: r["Área temática"])
    catalog_payload = {
        "metadatos": {
            "Organización": "Observatorio Venezolano de Economía",
            "Dataset": "Banco Mundial - Venezuela",
            "Fuente": "Banco Mundial - World Development Indicators",
            "Fecha generación": GENERATED_AT,
            "Fecha descarga": DOWNLOAD_DATE,
            "Número de áreas": len(catalog_rows),
        },
        "catalogo": catalog_rows,
    }
    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    (CATALOG_DIR / "world-bank-catalog.json").write_text(json.dumps(catalog_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_csv_catalog(CATALOG_DIR / "catalogo_dataset_web_ove_banco_mundial.csv", catalog_rows)
    write_xlsx_catalog(CATALOG_DIR / "catalogo_dataset_web_ove_banco_mundial.xlsx", catalog_rows)
    return 0


def write_csv_catalog(path: Path, rows: list[dict]) -> None:
    fields = ["Área temática", "ID área", "Registros", "Indicadores", "Primer año", "Último año", "Archivo CSV", "Archivo JSON", "Archivo Excel"]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, delimiter=";", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def write_xlsx_catalog(path: Path, rows: list[dict]) -> None:
    fields = ["Área temática", "ID área", "Registros", "Indicadores", "Primer año", "Último año", "Archivo CSV", "Archivo JSON", "Archivo Excel"]
    old = FIELDNAMES[:]
    try:
        globals()["FIELDNAMES"] = fields
        write_xlsx(path, rows)
    finally:
        globals()["FIELDNAMES"] = old


if __name__ == "__main__":
    raise SystemExit(main())
