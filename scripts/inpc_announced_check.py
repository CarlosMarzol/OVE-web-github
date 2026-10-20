#!/usr/bin/env python3
"""Detect a BCV-announced INPC figure newer than the official statistical series.

The BCV announces the monthly INPC on its homepage block before updating the
downloadable statistical workbook (4_5_7_2.xls). This check reads the homepage
announcement, compares its period with the normalized series
(ove_bcv_inpc_nacional_mensual.json) and publishes
ove_bcv_inpc_dato_anunciado.json so the site can display a clearly labelled
"dato anunciado, pendiente de confirmacion estadistica" note.

Safety rule (OVE playbook): if the BCV page cannot be fetched or parsed, the
existing note file is left untouched. A failed check never replaces valid data
with empty output.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERIES_PATH = ROOT / "assets" / "data" / "bcv" / "json" / "ove_bcv_inpc_nacional_mensual.json"
OUT_PATH = ROOT / "assets" / "data" / "bcv" / "json" / "ove_bcv_inpc_dato_anunciado.json"
BCV_HOME_URL = "https://www.bcv.org.ve/"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) OVE-data-check/1.0"
DISCLAIMER = (
    "Cifra anunciada por el BCV en su pagina principal, pendiente de confirmacion "
    "en la serie estadistica oficial descargable. No sustituye el dato oficial "
    "para facturacion, contabilidad o reportes legales."
)
MESES = {
    "enero": "01", "febrero": "02", "marzo": "03", "abril": "04", "mayo": "05",
    "junio": "06", "julio": "07", "agosto": "08", "septiembre": "09",
    "octubre": "10", "noviembre": "11", "diciembre": "12",
}


def now_utc() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def fetch_homepage():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(BCV_HOME_URL, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as exc:  # noqa: BLE001
        print(f"[inpc-anunciado] aviso: no se pudo descargar la pagina del BCV: {exc}")
        return None


def clean_html(html: str) -> str:
    text = re.sub(r"<script.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text)


def parse_es_number(raw: str) -> float:
    return float(raw.replace(".", "").replace(",", "."))


def parse_announced(text: str):
    m_period = re.search(
        r"Índice Nacional de Precios al Consumidor\s+([A-Za-zÁÉÍÓÚáéíóúñ]+)\s*-\s*(\d{4})",
        text, flags=re.I)
    m_var = re.search(r"Var %:\s*([\d.,]+)", text)
    m_acum = re.search(r"Var Acumulada %:\s*([\d.,]+)", text)
    m_ind = re.search(r"Indice:\s*([\d.,]+)", text)
    if not (m_period and m_var):
        return None
    mes = MESES.get(m_period.group(1).lower())
    if mes is None:
        return None
    anio = m_period.group(2)
    return {
        "period": f"{anio}-{mes}",
        "period_label": f"{m_period.group(1).capitalize()} {anio}",
        "var_mensual_pct": parse_es_number(m_var.group(1)),
        "var_acumulada_pct": parse_es_number(m_acum.group(1)) if m_acum else None,
        "indice": parse_es_number(m_ind.group(1)) if m_ind else None,
    }


def latest_statistical():
    if not SERIES_PATH.exists():
        return None
    data = json.loads(SERIES_PATH.read_text(encoding="utf-8"))
    rows = [r for r in data.get("observations", []) if isinstance(r.get("date"), str)]
    if not rows:
        return None
    latest = max(rows, key=lambda r: r["date"])
    return {
        "latest_period": latest["date"][:7],
        "latest_date": latest["date"],
        "latest_value": latest.get("monthly_variation_pct"),
    }


def write_note(anunciado, serie) -> None:
    mostrar = bool(anunciado and serie and anunciado["period"] > serie["latest_period"])
    if anunciado and serie and anunciado["period"] <= serie["latest_period"]:
        status = "confirmado_en_serie_estadistica"
    elif mostrar:
        status = "anuncio_pendiente_de_confirmacion_estadistica"
    else:
        status = "sin_datos_comparables"
    payload = {
        "metadata": {
            "dataset_id": "ove_bcv_inpc_dato_anunciado",
            "title": "INPC: cifra anunciada por el BCV pendiente de confirmacion estadistica",
            "status": status,
            "disclaimer": DISCLAIMER,
            "source": "Banco Central de Venezuela, pagina principal (bloque INPC)",
            "source_url": BCV_HOME_URL,
            "last_fetched_at": now_utc(),
        },
        "mostrar_nota": mostrar,
        "anunciado": anunciado,
        "serie_estadistica": serie,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[inpc-anunciado] nota escrita: status={status} mostrar_nota={mostrar} "
          f"anunciado={anunciado['period'] if anunciado else 'n/a'} "
          f"serie={serie['latest_period'] if serie else 'n/a'}")


def main() -> int:
    html = fetch_homepage()
    if html is None:
        print("[inpc-anunciado] se conserva la nota existente (falla de descarga)")
        return 0
    anunciado = parse_announced(clean_html(html))
    if anunciado is None:
        print("[inpc-anunciado] aviso: bloque INPC no interpretable; se conserva la nota existente")
        return 0
    write_note(anunciado, latest_statistical())
    return 0


if __name__ == "__main__":
    sys.exit(main())
