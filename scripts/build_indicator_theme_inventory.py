#!/usr/bin/env python3
import csv
import gzip
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import xlsxwriter


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "data"
OUT = DATA / "inventario-indicadores"
TRANSLATIONS_PATH = OUT / "traducciones_indicadores_es.json"

SOURCE_EXCEL_DOWNLOADS = {
    "FMI - World Economic Outlook": "assets/data/imf/excel/ove_fmi_weo_venezuela.xlsx",
    "OIT - ILOSTAT": "assets/data/ilo/excel/ove_oit_ilostat_venezuela_catalogo_series.xlsx",
    "CEPALSTAT - CEPAL": "assets/data/cepal/catalog/catalogo_dataset_web_ove_cepalstat.xlsx",
    "UNCTADstat - UNCTAD": "assets/data/unctad/excel/ove_unctadstat_venezuela_valores.xlsx",
    "FRED - Federal Reserve Bank of St. Louis": "assets/data/fred/excel/ove_fred_venezuela.xlsx",
    "OVE - Indicadores clave": "assets/data/indicadores-clave/ove_indicadores_clave_venezuela.xlsx",
    "INE Venezuela": "assets/data/ine/excel/ove_ine_venezuela_catalogo_recursos.xlsx",
}

TOPICS = [
    "Agricultura y medio ambiente",
    "Ciencia y tecnología",
    "Demografía y población",
    "Economía",
    "Industria, energía y construcción",
    "Mercado laboral",
    "Servicios",
    "Nivel y condiciones de vida (IPC)",
    "Sociedad",
    "Estadísticas experimentales",
]

SUBAREAS = {
    "Agricultura y medio ambiente": [
        "Agricultura",
        "Agua",
        "Residuos y protección ambiental",
        "Cuentas ambientales",
        "Otras operaciones medioambientales",
    ],
    "Ciencia y tecnología": [
        "Investigación y desarrollo",
        "Innovación empresarial",
        "Conectividad y capacidades digitales",
    ],
    "Demografía y población": [
        "Población",
        "Natalidad y mortalidad",
        "Migración y movilidad",
    ],
    "Economía": [
        "Actividad económica",
        "Precios e inflación",
        "Sector externo y finanzas",
    ],
    "Industria, energía y construcción": [
        "Industria manufacturera",
        "Energía e hidrocarburos",
        "Construcción e infraestructura",
    ],
    "Mercado laboral": [
        "Empleo y desempleo",
        "Ingresos laborales",
        "Informalidad y movilidad laboral",
    ],
    "Servicios": [
        "Comercio y consumo",
        "Turismo, transporte y logística",
        "Servicios digitales y profesionales",
    ],
    "Nivel y condiciones de vida (IPC)": [
        "Condiciones de vida",
        "Costo de vida e IPC",
        "Salud, educación y vivienda",
    ],
    "Sociedad": [
        "Seguridad y convivencia",
        "Género, juventud y grupos vulnerables",
        "Participación y comunidad",
    ],
    "Estadísticas experimentales": [
        "Indicadores de alta frecuencia",
        "Datos geoespaciales",
        "Modelos y nowcasting",
    ],
}

TRANSLATION_SOURCES = {
    "FMI - World Economic Outlook",
    "UNCTADstat - UNCTAD",
    "FRED - Federal Reserve Bank of St. Louis",
}

STATE_ES = {
    "Alaska": "Alaska",
    "Alabama": "Alabama",
    "Arkansas": "Arkansas",
    "Arizona": "Arizona",
    "California": "California",
    "Colorado": "Colorado",
    "Connecticut": "Connecticut",
    "District of Columbia": "Distrito de Columbia",
    "Delaware": "Delaware",
    "Florida": "Florida",
    "Georgia": "Georgia",
    "Hawaii": "Hawái",
    "Iowa": "Iowa",
    "Idaho": "Idaho",
    "Illinois": "Illinois",
    "Indiana": "Indiana",
    "Kansas": "Kansas",
    "Kentucky": "Kentucky",
    "Louisiana": "Luisiana",
    "Massachusetts": "Massachusetts",
    "Maryland": "Maryland",
    "Maine": "Maine",
    "Michigan": "Michigan",
    "Minnesota": "Minnesota",
    "Missouri": "Misuri",
    "Mississippi": "Misisipi",
    "Montana": "Montana",
    "North Carolina": "Carolina del Norte",
    "North Dakota": "Dakota del Norte",
    "Nebraska": "Nebraska",
    "New Hampshire": "Nuevo Hampshire",
    "New Jersey": "Nueva Jersey",
    "New Mexico": "Nuevo México",
    "Nevada": "Nevada",
    "New York": "Nueva York",
    "Ohio": "Ohio",
    "Oklahoma": "Oklahoma",
    "Oregon": "Oregón",
    "Pennsylvania": "Pensilvania",
    "Puerto Rico": "Puerto Rico",
    "Rhode Island": "Rhode Island",
    "South Carolina": "Carolina del Sur",
    "South Dakota": "Dakota del Sur",
    "Tennessee": "Tennessee",
    "Texas": "Texas",
    "Utah": "Utah",
    "Virginia": "Virginia",
    "U.S. Virgin Islands": "Islas Vírgenes de EE. UU.",
    "Vermont": "Vermont",
    "Washington": "Washington",
    "Wisconsin": "Wisconsin",
    "West Virginia": "Virginia Occidental",
    "Wyoming": "Wyoming",
}


def norm(text):
    text = "" if text is None else str(text)
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", text.lower()).strip()


def read_semicolon_csv(path):
    with open(path, encoding="utf-8-sig", errors="replace", newline="") as fh:
        yield from csv.DictReader(fh, delimiter=";")


def read_csv_auto(path):
    opener = gzip.open if str(path).endswith(".gz") else open
    with opener(path, "rt", encoding="utf-8-sig", errors="replace", newline="") as fh:
        sample = fh.read(4096)
        fh.seek(0)
        delimiter = ";" if sample.splitlines()[0].count(";") >= sample.splitlines()[0].count(",") else ","
        yield from csv.DictReader(fh, delimiter=delimiter)


def nonempty_periods(rows, period_key, value_key):
    periods = []
    latest_value = ""
    n_values = 0
    for row in rows:
        value = row.get(value_key, "")
        if value not in ("", None):
            n_values += 1
            periods.append(row.get(period_key, ""))
            latest_value = value
    periods = [p for p in periods if p not in ("", None)]
    return (min(periods) if periods else "", max(periods) if periods else "", latest_value, n_values)


def load_translations():
    if not TRANSLATIONS_PATH.exists():
        return {}
    with open(TRANSLATIONS_PATH, encoding="utf-8") as fh:
        return json.load(fh)


def clean_translation(text):
    fixes = {
        "República Bolivariana de Venezuela": "Venezuela",
        "Bolivariana República de Venezuela": "Venezuela",
        "EE.UU.": "EE. UU.",
        "EE. UU": "EE. UU.",
        "NOSOTROS.": "EE. UU.",
        "Base a Venezuela": "base F.A.S. hacia Venezuela",
        "por F.A.S. Base": "según criterio F.A.S.",
        "por FAS Base": "según criterio F.A.S.",
        "PPA) en dólares internacionales": "PPA), dólares internacionales",
        "Indice": "Índice",
    }
    for old, new in fixes.items():
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text).strip()


def translate_indicator(source, indicator, translations):
    if source.startswith("FRED"):
        match = re.match(r"Value of Exports to Bolivarian Republic of Venezuela from (.+)$", indicator)
        if match:
            state = STATE_ES.get(match.group(1), match.group(1))
            return f"Valor de las exportaciones hacia Venezuela desde {state}", "traducido"
        match = re.match(r"Number of Identified Exporters to Bolivarian Republic of Venezuela from (.+)$", indicator)
        if match:
            state = STATE_ES.get(match.group(1), match.group(1))
            return f"Número de exportadores identificados hacia Venezuela desde {state}", "traducido"

    if source in TRANSLATION_SOURCES:
        translated = translations.get(indicator, "")
        if translated:
            return clean_translation(translated), "traducido"
        return indicator, "pendiente_traduccion"

    return indicator, "ya estaba en español"


def translate_records(records):
    translations = load_translations()
    translated_records = []
    for row in records:
        indicator = row.get("indicador", "")
        indicator_es, status = translate_indicator(row.get("fuente", ""), indicator, translations)
        new_row = dict(row)
        new_row["indicador"] = indicator_es
        new_row["indicador_original"] = indicator
        new_row["idioma_indicador"] = "es" if status != "pendiente_traduccion" else "pendiente"
        new_row["traduccion_indicador"] = status
        translated_records.append(new_row)
    return translated_records


def classify(indicator, source_area="", source_subarea="", source_topic="", source="", path=""):
    text = norm(" ".join([indicator, source_area, source_subarea, source_topic, source, path]))
    source_norm = norm(source)
    area_norm = norm(source_area)

    def hit(*words):
        return any(w in text for w in words)

    if "ilostat" in source_norm or "oit" in source_norm:
        if "poblacion" in area_norm:
            return "Demografía y población", "alta", "tema original OIT: población"
        if "precios" in area_norm or "conversion" in area_norm:
            return "Economía", "alta", "tema original OIT: precios/conversión"
        if "proteccion social" in area_norm or "competencias" in area_norm or "aprendizaje" in area_norm:
            return "Sociedad", "media", "tema original OIT: sociedad/protección/aprendizaje"
        return "Mercado laboral", "alta", "tema original OIT: laboral"

    if hit("experimental", "nowcast", "big data", "alta frecuencia", "google trends", "sentiment", "sentimiento"):
        return "Estadísticas experimentales", "media", "palabra clave experimental/alta frecuencia"

    if hit(
        "poblacion", "population", "demografia", "demographic", "migracion", "migration",
        "fertilidad", "fecundidad", "natalidad", "birth", "mortalidad", "mortality",
        "edad", "age", "esperanza de vida", "life expectancy", "urban population"
    ):
        return "Demografía y población", "alta", "demografía/población"

    if hit(
        "ipc", "inpc", "consumer price", "inflacion", "inflation", "precio consumidor",
        "precios al consumidor", "indice de precios", "linea de indigencia",
        "poverty", "pobreza", "desigualdad", "inequality", "gini", "income share",
        "living", "vida", "vivienda", "housing", "household", "hogar", "canasta",
        "encuesta de hogares"
    ):
        return "Nivel y condiciones de vida (IPC)", "alta", "precios al consumidor / pobreza / condiciones de vida"

    if hit(
        "labor", "labour", "empleo", "desempleo", "ocupacion", "actividad", "salario",
        "wage", "unemployment", "employment", "fuerza de trabajo", "work", "trabajo",
        "child labour", "trabajo infantil", "remuneraciones", "asalariados",
        "relaciones laborales", "inspeccion del trabajo", "lesiones profesionales",
        "productividad laboral", "pobreza laboral", "costo de la mano de obra"
    ):
        return "Mercado laboral", "alta", "mercado laboral"

    if hit(
        "energia", "energy", "electric", "oil", "gas", "combustible", "fuel",
        "industria", "industry", "manufactur", "construction", "construccion",
        "mining", "mineria", "power", "produccion industrial"
    ):
        return "Industria, energía y construcción", "alta", "industria/energía/construcción"

    if hit(
        "agric", "forest", "bosque", "ambient", "environment", "co2", "emission",
        "biodivers", "climate", "clima", "water", "agua", "tierra", "land",
        "crop", "rural", "pm2.5", "particulas", "air quality", "calidad del aire"
    ):
        return "Agricultura y medio ambiente", "alta", "agricultura/ambiente"

    if hit(
        "science", "ciencia", "technology", "tecnologia", "digital", "internet",
        "ict", "information", "innovation", "patent", "frontier technology",
        "research", "r&d", "i+d", "telecom"
    ):
        return "Ciencia y tecnología", "alta", "ciencia/tecnología/digital"

    if hit(
        "servicio", "services", "tourism", "turismo", "transport", "transporte",
        "air passenger", "pasajeros", "shipping", "maritime", "trade in services",
        "travel", "comercio minorista", "retail"
    ):
        return "Servicios", "alta", "servicios/transporte/turismo"

    if hit(
        "educacion", "education", "salud", "health", "gender", "genero", "mujer",
        "women", "parliament", "social", "sociedad", "crime", "governance",
        "institution", "institucion", "ods", "sdg", "estadisticas vitales",
        "anuario estadistico", "publicaciones", "otros recursos ine", "proteccion social"
    ):
        return "Sociedad", "media", "sociedad/educación/salud/género/instituciones"

    if hit(
        "gdp", "pib", "gross domestic", "macroeconomia", "macroeconomic", "current account",
        "cuenta corriente", "export", "import", "trade", "comercio", "exchange rate",
        "tipo de cambio", "deuda", "debt", "fiscal", "government", "revenue",
        "monetary", "money", "investment", "inversion", "capital", "balance",
        "fmi", "imf", "fred", "unctad", "banco central", "bcv"
    ):
        return "Economía", "alta", "macroeconomía/comercio/finanzas"

    area = norm(source_area)
    area_map = {
        "demografia": "Demografía y población",
        "mercado laboral": "Mercado laboral",
        "macroeconomia": "Economía",
        "sector externo": "Economía",
        "precios e inflacion": "Nivel y condiciones de vida (IPC)",
        "energia y ambiente": "Agricultura y medio ambiente",
        "educacion": "Sociedad",
        "salud": "Sociedad",
        "genero": "Sociedad",
        "pobreza y desigualdad": "Nivel y condiciones de vida (IPC)",
        "sector publico e instituciones": "Sociedad",
        "infraestructura y digitalizacion": "Servicios",
    }
    if area in area_map:
        return area_map[area], "media", "mapeo de área original"

    return "Economía", "baja", "asignación por defecto pendiente de revisión"


def classify_subarea(topic, indicator, original_indicator="", source_area="", source_subarea="", source_topic="", source="", path=""):
    text = norm(" ".join([indicator, original_indicator, source_area, source_subarea, source_topic, source, path]))

    def hit(*words):
        return any(w in text for w in words)

    def result(subarea, confidence, rule):
        return subarea, confidence, rule

    if topic == "Economía":
        if hit("ipc", "inpc", "inflacion", "inflation", "precio", "price", "deflactor", "canasta"):
            return result("Precios e inflación", "alta", "precios/inflación")
        if hit(
            "sector externo", "export", "import", "comercio exterior", "trade", "balanza",
            "balance of payments", "cuenta corriente", "current account", "reservas",
            "deuda", "debt", "fiscal", "publico", "government", "credito", "credit",
            "liquidez", "monetary", "money", "interes", "interest", "tipo de cambio",
            "exchange rate", "financ", "fmi", "imf", "fred"
        ):
            return result("Sector externo y finanzas", "alta", "sector externo/finanzas")
        return result("Actividad económica", "media", "actividad/cuentas nacionales por defecto del tema")

    if topic == "Mercado laboral":
        if hit("salario", "wage", "remuneracion", "ingreso laboral", "earnings", "labour income", "costo de la mano de obra"):
            return result("Ingresos laborales", "alta", "salarios/remuneraciones")
        if hit(
            "informal", "subempleo", "underemployment", "horas de trabajo", "hours of work",
            "trabajo infantil", "child labour", "cuenta propia", "own-account",
            "migracion laboral", "remesas", "movilidad laboral"
        ):
            return result("Informalidad y movilidad laboral", "alta", "informalidad/movilidad/horas")
        return result("Empleo y desempleo", "media", "empleo/desempleo por defecto del tema")

    if topic == "Demografía y población":
        if hit("natalidad", "nacimiento", "birth", "fertilidad", "fecundidad", "mortality", "mortalidad", "defuncion", "estadisticas vitales"):
            return result("Natalidad y mortalidad", "alta", "estadísticas vitales")
        if hit("migracion", "migration", "movilidad", "mobility", "desplaz", "retorno"):
            return result("Migración y movilidad", "alta", "migración/movilidad")
        return result("Población", "media", "población/estructura demográfica")

    if topic == "Nivel y condiciones de vida (IPC)":
        if hit("ipc", "inpc", "inflacion", "inflation", "precio", "price", "canasta", "costo de vida", "consumo", "gasto de consumo"):
            return result("Costo de vida e IPC", "alta", "precios/consumo/costo de vida")
        if hit("salud", "health", "educacion", "education", "escolar", "school", "vivienda", "housing", "hacinamiento"):
            return result("Salud, educación y vivienda", "alta", "salud/educación/vivienda")
        return result("Condiciones de vida", "media", "pobreza/bienestar/acceso por defecto del tema")

    if topic == "Sociedad":
        if hit("seguridad", "security", "crimen", "crime", "justicia", "justice", "gobernanza", "governance", "conflict", "protest"):
            return result("Seguridad y convivencia", "alta", "seguridad/justicia/gobernanza")
        if hit("genero", "gender", "mujer", "women", "juventud", "youth", "discapacidad", "disability", "mayores", "cuidados", "vulnerab"):
            return result("Género, juventud y grupos vulnerables", "alta", "género/juventud/vulnerabilidad")
        return result("Participación y comunidad", "media", "participación/comunidad por defecto del tema")

    if topic == "Ciencia y tecnología":
        if hit("investigacion", "research", "i+d", "r&d", "bibliometr", "publicacion cientifica", "scientific"):
            return result("Investigación y desarrollo", "alta", "I+D/investigación")
        if hit("innovacion", "innovation", "patent", "patente", "marca", "empresa", "business", "unicornio"):
            return result("Innovación empresarial", "alta", "innovación empresarial")
        return result("Conectividad y capacidades digitales", "media", "TIC/conectividad por defecto del tema")

    if topic == "Industria, energía y construcción":
        if hit("energia", "energy", "petrol", "oil", "gas", "hidrocarb", "electric", "combustible", "fuel", "renovable", "power"):
            return result("Energía e hidrocarburos", "alta", "energía/hidrocarburos")
        if hit("construccion", "construction", "infraestructura", "infrastructure", "obra", "vivienda", "building"):
            return result("Construcción e infraestructura", "alta", "construcción/infraestructura")
        return result("Industria manufacturera", "media", "industria/manufactura por defecto del tema")

    if topic == "Servicios":
        if hit("turismo", "tourism", "travel", "transporte", "transport", "pasajero", "passenger", "logistica", "cargo", "maritime", "shipping", "fleet"):
            return result("Turismo, transporte y logística", "alta", "turismo/transporte/logística")
        if hit("digital", "internet", "telecom", "financ", "insurance", "seguro", "profesional", "technical", "administrativo", "e-commerce", "pagos"):
            return result("Servicios digitales y profesionales", "alta", "servicios digitales/profesionales/financieros")
        return result("Comercio y consumo", "media", "comercio/consumo por defecto del tema")

    if topic == "Agricultura y medio ambiente":
        if hit("cuenta", "account", "emisiones a la atmosfera", "materiales", "gasto en proteccion ambiental", "bienes y servicios ambientales"):
            return result("Cuentas ambientales", "alta", "cuentas ambientales")
        if hit("residuo", "waste", "desecho", "proteccion ambiental", "pollution", "contaminacion", "tratamiento", "disposicion final"):
            return result("Residuos y protección ambiental", "alta", "residuos/protección ambiental")
        if hit("agua", "water", "saneamiento", "embalse", "hidrico", "abastecimiento"):
            return result("Agua", "alta", "agua/saneamiento")
        if hit("agric", "crop", "cultivo", "ganader", "livestock", "pecuaria", "rural", "alimento", "food", "siagro"):
            return result("Agricultura", "alta", "agricultura/producción agropecuaria")
        return result("Otras operaciones medioambientales", "media", "ambiente/clima/territorio por defecto del tema")

    if topic == "Estadísticas experimentales":
        if hit("geoespacial", "geospatial", "satelit", "satellite", "luces nocturnas", "night lights", "cobertura vegetal", "map"):
            return result("Datos geoespaciales", "alta", "datos geoespaciales/satelitales")
        if hit("nowcast", "modelo", "model", "estimacion", "estimate", "alerta", "risk", "riesgo"):
            return result("Modelos y nowcasting", "alta", "modelos/nowcasting")
        return result("Indicadores de alta frecuencia", "media", "alta frecuencia por defecto del tema")

    fallback = SUBAREAS.get(topic, ["Sin subárea OVE"])[0]
    return result(fallback, "baja", "subárea por defecto pendiente de revisión")


def add_subareas(records):
    enriched = []
    for row in records:
        subarea, confidence, rule = classify_subarea(
            row.get("tema_ove", ""),
            row.get("indicador", ""),
            row.get("indicador_original", ""),
            row.get("tema_origen", ""),
            row.get("subtema_origen", ""),
            row.get("ruta_origen", ""),
            row.get("fuente", ""),
            row.get("archivo_origen", ""),
        )
        new_row = dict(row)
        new_row["subarea_ove"] = subarea
        new_row["confianza_subarea"] = confidence
        new_row["criterio_subarea"] = rule
        enriched.append(new_row)
    return enriched


def add_record(records, **kwargs):
    topic, confidence, rule = classify(
        kwargs.get("indicador", ""),
        kwargs.get("tema_origen", ""),
        kwargs.get("subtema_origen", ""),
        kwargs.get("ruta_origen", ""),
        kwargs.get("fuente", ""),
        kwargs.get("archivo_origen", ""),
    )
    kwargs["tema_ove"] = topic
    kwargs["confianza_clasificacion"] = confidence
    kwargs["criterio_clasificacion"] = rule
    records.append(kwargs)


def collect_world_bank(records):
    for path in sorted((DATA / "world-bank" / "csv").glob("ove_banco_mundial_venezuela_*.csv")):
        rows_by_code = defaultdict(list)
        for row in read_semicolon_csv(path):
            rows_by_code[row["Código indicador"]].append(row)
        for code, rows in rows_by_code.items():
            first = rows[0]
            first_period, last_period, latest_value, n_values = nonempty_periods(rows, "Año", "Valor")
            add_record(
                records,
                fuente="Banco Mundial - WDI",
                codigo=code,
                indicador=first["Indicador"],
                tema_origen=first["Área temática"],
                subtema_origen=first["Subárea"],
                ruta_origen=f'{first["Área temática"]} > {first["Subárea"]}',
                frecuencia="Anual",
                primer_periodo=first_period or min(r["Año"] for r in rows if r.get("Año")),
                ultimo_periodo=last_period or max(r["Año"] for r in rows if r.get("Año")),
                registros=len(rows),
                registros_con_valor=n_values,
                ultimo_valor=latest_value,
                estado="Con datos" if n_values else "Sin valores observados",
                archivo_origen=str(path.relative_to(ROOT)),
            )


def collect_catalog(records, path, source_name, code_key, indicator_key, area_key="", subarea_key="", route_key="", freq_key="", status_key="Estado descarga"):
    for row in read_semicolon_csv(path):
        n_records = row.get("Número de registros", "")
        status = row.get(status_key, "") or ("Con datos" if str(n_records).strip() not in ("", "0") else "Sin datos")
        add_record(
            records,
            fuente=source_name,
            codigo=row.get(code_key, ""),
            indicador=row.get(indicator_key, ""),
            tema_origen=row.get(area_key, ""),
            subtema_origen=row.get(subarea_key, ""),
            ruta_origen=row.get(route_key, ""),
            frecuencia=row.get(freq_key, ""),
            primer_periodo=row.get("Primer periodo", ""),
            ultimo_periodo=row.get("Último periodo", ""),
            registros=n_records,
            registros_con_valor=n_records,
            ultimo_valor=row.get("Último valor disponible", ""),
            estado=status,
            archivo_origen=str(path.relative_to(ROOT)),
        )


def collect_bcv(records):
    bcv_dir = DATA / "bcv" / "csv"
    specs = [
        ("ove_bcv_pib_real_anual.csv", "bcv_pib_real_anual", "PIB real anual - variación porcentual", "Año", "year", "annual_real_gdp_growth_pct", "Anual"),
        ("ove_bcv_pib_historico_anual.csv", "bcv_pib_historico_anual", "PIB histórico anual - precios corrientes y constantes", "Economía", "period", "value", "Anual"),
        ("ove_bcv_pib_demanda_anual.csv", "bcv_pib_demanda_anual", "PIB por componentes de demanda - anual", "Economía", "period", "value", "Anual"),
        ("ove_bcv_pib_sector_institucional_anual.csv", "bcv_pib_sector_institucional_anual", "PIB por sector institucional - anual", "Economía", "period", "value", "Anual"),
        ("ove_bcv_pib_sector_institucional_trimestral.csv", "bcv_pib_sector_institucional_trimestral", "PIB por sector institucional - trimestral", "Economía", "period", "value", "Trimestral"),
        ("ove_bcv_pib_actividad_economica_anual.csv", "bcv_pib_actividad_economica_anual", "PIB por actividad económica - anual", "Economía", "period", "value", "Anual"),
        ("ove_bcv_pib_actividad_economica_trimestral.csv", "bcv_pib_actividad_economica_trimestral", "PIB por actividad económica - trimestral", "Economía", "period", "value", "Trimestral"),
        ("ove_bcv_inpc_nacional_mensual.csv", "bcv_inpc_indice", "INPC nacional mensual - índice", "Nivel y condiciones de vida (IPC)", "date", "index_value", "Mensual"),
        ("ove_bcv_inpc_nacional_mensual.csv", "bcv_inpc_variacion_mensual", "INPC nacional mensual - variación mensual", "Nivel y condiciones de vida (IPC)", "date", "monthly_variation_pct", "Mensual"),
    ]
    for filename, code, indicator, topic_origin, period_key, value_key, freq in specs:
        path = bcv_dir / filename
        rows = list(read_csv_auto(path))
        first_period, last_period, latest_value, n_values = nonempty_periods(rows, period_key, value_key)
        add_record(
            records,
            fuente="Banco Central de Venezuela",
            codigo=code,
            indicador=indicator,
            tema_origen=topic_origin,
            subtema_origen="",
            ruta_origen=topic_origin,
            frecuencia=freq,
            primer_periodo=first_period,
            ultimo_periodo=last_period,
            registros=len(rows),
            registros_con_valor=n_values,
            ultimo_valor=latest_value,
            estado="Con datos" if n_values else "Sin valores observados",
            archivo_origen=str(path.relative_to(ROOT)),
        )

    for filename in ["ove_bcv_tipo_cambio_usd.csv", "ove_bcv_tipo_cambio_referencia_smc.csv"]:
        path = bcv_dir / filename
        groups = defaultdict(list)
        for row in read_csv_auto(path):
            groups[row.get("indicator_id", row.get("currency", ""))].append(row)
        for code, rows in groups.items():
            first = rows[0]
            first_period, last_period, latest_value, n_values = nonempty_periods(rows, "date", "value")
            add_record(
                records,
                fuente="Banco Central de Venezuela",
                codigo=code,
                indicador=first.get("indicator_name", code),
                tema_origen="Economía",
                subtema_origen="Tipo de cambio",
                ruta_origen="Economía > Tipo de cambio",
                frecuencia=first.get("frequency", ""),
                primer_periodo=first_period,
                ultimo_periodo=last_period,
                registros=len(rows),
                registros_con_valor=n_values,
                ultimo_valor=latest_value,
                estado="Con datos" if n_values else "Sin valores observados",
                archivo_origen=str(path.relative_to(ROOT)),
            )


def collect_key_indicators(records):
    path = DATA / "indicadores-clave" / "ove_indicadores_clave_venezuela.csv"
    groups = defaultdict(list)
    for row in read_csv_auto(path):
        groups[row["indicator_id"]].append(row)
    for code, rows in groups.items():
        first = rows[0]
        first_period, last_period, latest_value, n_values = nonempty_periods(rows, "period", "value")
        add_record(
            records,
            fuente="OVE - Indicadores clave",
            codigo=code,
            indicador=first["indicator"],
            tema_origen=first["area"],
            subtema_origen="",
            ruta_origen=first["area"],
            frecuencia=first["frequency"],
            primer_periodo=first_period,
            ultimo_periodo=last_period,
            registros=len(rows),
            registros_con_valor=n_values,
            ultimo_valor=latest_value,
            estado="Con datos" if n_values else "Sin valores observados",
            archivo_origen=str(path.relative_to(ROOT)),
        )


def collect_ine(records):
    path = DATA / "ine" / "catalog" / "catalogo_dataset_web_ove_ine_venezuela.csv"
    for row in read_semicolon_csv(path):
        add_record(
            records,
            fuente="INE Venezuela",
            codigo=row.get("Archivo original", ""),
            indicador=row.get("Título", ""),
            tema_origen=row.get("Categoría", ""),
            subtema_origen=row.get("Tipo de recurso", ""),
            ruta_origen=f'{row.get("Categoría", "")} > {row.get("Tipo de recurso", "")}',
            frecuencia="",
            primer_periodo=row.get("Año publicación", ""),
            ultimo_periodo=row.get("Año publicación", ""),
            registros=1,
            registros_con_valor="",
            ultimo_valor="",
            estado=f'Recurso {row.get("Formato", "")}',
            archivo_origen=str(path.relative_to(ROOT)),
        )


def write_outputs(records):
    OUT.mkdir(parents=True, exist_ok=True)
    records = translate_records(records)
    records = add_subareas(records)
    fields = [
        "tema_ove", "subarea_ove", "fuente", "codigo", "indicador", "indicador_original", "idioma_indicador",
        "traduccion_indicador", "tema_origen", "subtema_origen", "ruta_origen", "frecuencia",
        "primer_periodo", "ultimo_periodo", "registros", "registros_con_valor",
        "ultimo_valor", "estado", "confianza_clasificacion", "criterio_clasificacion",
        "confianza_subarea", "criterio_subarea", "archivo_origen",
    ]
    csv_path = OUT / "inventario_indicadores_ove_clasificado_temas_es.csv"
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)

    counts = Counter(row["tema_ove"] for row in records)
    by_source = Counter(row["fuente"] for row in records)
    by_subarea = Counter((row["tema_ove"], row["subarea_ove"]) for row in records)
    by_translation = Counter(row["traduccion_indicador"] for row in records)
    trans_by_source = Counter(row["fuente"] for row in records if row["traduccion_indicador"] == "traducido")
    low_conf = [row for row in records if row["confianza_clasificacion"] == "baja"]
    low_subarea = [row for row in records if row["confianza_subarea"] == "baja"]
    summary_path = OUT / "resumen_clasificacion_temas_es.csv"
    with open(summary_path, "w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["tema_ove", "indicadores_o_recursos"])
        for topic in TOPICS:
            writer.writerow([topic, counts.get(topic, 0)])
        writer.writerow([])
        writer.writerow(["tema_ove", "subarea_ove", "indicadores_o_recursos"])
        for topic in TOPICS:
            for subarea in SUBAREAS[topic]:
                writer.writerow([topic, subarea, by_subarea.get((topic, subarea), 0)])
        writer.writerow([])
        writer.writerow(["fuente", "indicadores_o_recursos"])
        for source, count in by_source.most_common():
            writer.writerow([source, count])
        writer.writerow([])
        writer.writerow(["clasificaciones_baja_confianza", len(low_conf)])
        writer.writerow(["subareas_baja_confianza", len(low_subarea)])
        writer.writerow(["indicadores_traducidos", by_translation.get("traducido", 0)])
        writer.writerow(["indicadores_pendientes_traduccion", by_translation.get("pendiente_traduccion", 0)])

    subarea_summary_path = OUT / "resumen_clasificacion_subareas_es.csv"
    with open(subarea_summary_path, "w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["tema_ove", "subarea_ove", "indicadores_o_recursos"])
        for topic in TOPICS:
            for subarea in SUBAREAS[topic]:
                writer.writerow([topic, subarea, by_subarea.get((topic, subarea), 0)])

    xlsx_path = OUT / "inventario_indicadores_ove_clasificado_temas_es.xlsx"
    workbook = xlsxwriter.Workbook(str(xlsx_path))
    header_fmt = workbook.add_format({"bold": True, "bg_color": "#0A2D5A", "font_color": "white", "border": 1})
    text_fmt = workbook.add_format({"text_wrap": True, "valign": "top"})
    sheet = workbook.add_worksheet("inventario_clasificado_es")
    for col, field in enumerate(fields):
        sheet.write(0, col, field, header_fmt)
    for row_idx, row in enumerate(records, start=1):
        for col, field in enumerate(fields):
            sheet.write(row_idx, col, row.get(field, ""), text_fmt)
    sheet.freeze_panes(1, 0)
    sheet.autofilter(0, 0, len(records), len(fields) - 1)
    widths = {
        "tema_ove": 28, "subarea_ove": 34, "fuente": 26, "codigo": 24, "indicador": 70, "indicador_original": 70,
        "idioma_indicador": 14, "traduccion_indicador": 22, "tema_origen": 28, "subtema_origen": 28,
        "ruta_origen": 58, "criterio_clasificacion": 42, "confianza_subarea": 18,
        "criterio_subarea": 42, "archivo_origen": 58,
    }
    for col, field in enumerate(fields):
        sheet.set_column(col, col, widths.get(field, 16))

    summary = workbook.add_worksheet("resumen")
    summary.write_row(0, 0, ["tema_ove", "indicadores_o_recursos"], header_fmt)
    for r, topic in enumerate(TOPICS, start=1):
        summary.write(r, 0, topic)
        summary.write(r, 1, counts.get(topic, 0))
    start = len(TOPICS) + 3
    summary.write_row(start, 0, ["tema_ove", "subarea_ove", "indicadores_o_recursos"], header_fmt)
    r = start + 1
    for topic in TOPICS:
        for subarea in SUBAREAS[topic]:
            summary.write(r, 0, topic)
            summary.write(r, 1, subarea)
            summary.write(r, 2, by_subarea.get((topic, subarea), 0))
            r += 1
    summary.set_column(0, 0, 36)
    summary.set_column(1, 2, 34)
    start = r + 2
    summary.write_row(start, 0, ["fuente", "indicadores_o_recursos"], header_fmt)
    for r, (source, count) in enumerate(by_source.most_common(), start=start + 1):
        summary.write(r, 0, source)
        summary.write(r, 1, count)
    summary.set_column(0, 0, 36)
    summary.set_column(1, 2, 22)
    trans_start = start + len(by_source) + 3
    summary.write_row(trans_start, 0, ["fuente", "indicadores_traducidos"], header_fmt)
    for r, (source, count) in enumerate(trans_by_source.most_common(), start=trans_start + 1):
        summary.write(r, 0, source)
        summary.write(r, 1, count)
    workbook.close()
    web_index_path = write_web_index(records, counts, by_subarea)
    return csv_path, summary_path, subarea_summary_path, xlsx_path, web_index_path, counts, by_source, len(low_conf), len(low_subarea), by_translation


def excel_download_for_record(row):
    return ""


def write_web_index(records, counts, by_subarea):
    def compact_record(row):
        return {
            "tema": row.get("tema_ove", ""),
            "subarea": row.get("subarea_ove", ""),
            "fuente": row.get("fuente", ""),
            "codigo": row.get("codigo", ""),
            "indicador": row.get("indicador", ""),
            "indicador_original": row.get("indicador_original", ""),
            "frecuencia": row.get("frecuencia", ""),
            "primer_periodo": row.get("primer_periodo", ""),
            "ultimo_periodo": row.get("ultimo_periodo", ""),
            "registros": row.get("registros", ""),
            "registros_con_valor": row.get("registros_con_valor", ""),
            "ultimo_valor": row.get("ultimo_valor", ""),
            "estado": row.get("estado", ""),
            "confianza": row.get("confianza_clasificacion", ""),
            "confianza_subarea": row.get("confianza_subarea", ""),
            "excel": excel_download_for_record(row),
            "archivo_origen": row.get("archivo_origen", ""),
        }

    web_index = {
        "metadata": {
            "records": len(records),
            "topics": len(TOPICS),
            "full_inventory_excel": "assets/data/inventario-indicadores/inventario_indicadores_ove_clasificado_temas_es.xlsx",
            "full_inventory_csv": "assets/data/inventario-indicadores/inventario_indicadores_ove_clasificado_temas_es.csv",
        },
        "topics": [
            {
                "tema": topic,
                "count": counts.get(topic, 0),
                "subareas": [
                    {
                        "subarea": subarea,
                        "count": by_subarea.get((topic, subarea), 0),
                    }
                    for subarea in SUBAREAS[topic]
                ],
            }
            for topic in TOPICS
        ],
        "records": [compact_record(row) for row in records],
    }
    path = OUT / "inventario_indicadores_ove_web.json"
    path.write_text(json.dumps(web_index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return path


def main():
    records = []
    collect_world_bank(records)
    collect_bcv(records)
    collect_catalog(
        records,
        DATA / "imf" / "catalog" / "catalogo_dataset_web_ove_fmi_weo.csv",
        "FMI - World Economic Outlook",
        "Código indicador",
        "Indicador",
        freq_key="Frecuencia",
        status_key="",
    )
    collect_catalog(
        records,
        DATA / "ilo" / "catalog" / "catalogo_dataset_web_ove_oit_ilostat.csv",
        "OIT - ILOSTAT",
        "Código indicador",
        "Indicador",
        area_key="Tema",
        subarea_key="Base de datos",
        route_key="Base de datos",
        freq_key="Frecuencia",
        status_key="",
    )
    collect_catalog(
        records,
        DATA / "cepal" / "catalog" / "catalogo_dataset_web_ove_cepalstat.csv",
        "CEPALSTAT - CEPAL",
        "ID indicador CEPALSTAT",
        "Indicador",
        area_key="Tema",
        subarea_key="Área",
        route_key="Ruta temática",
    )
    collect_catalog(
        records,
        DATA / "unctad" / "catalog" / "catalogo_dataset_web_ove_unctadstat.csv",
        "UNCTADstat - UNCTAD",
        "Reporte UNCTAD",
        "Título reporte",
        area_key="Categoría",
        subarea_key="Ruta temática",
        route_key="Ruta temática",
        status_key="Estado descarga",
    )
    collect_catalog(
        records,
        DATA / "fred" / "catalog" / "catalogo_dataset_web_ove_fred.csv",
        "FRED - Federal Reserve Bank of St. Louis",
        "ID serie FRED",
        "Título",
        area_key="Unidades",
        subarea_key="Frecuencia",
        freq_key="Frecuencia",
        status_key="Estado descarga",
    )
    collect_key_indicators(records)
    collect_ine(records)

    csv_path, summary_path, subarea_summary_path, xlsx_path, web_index_path, counts, by_source, low_conf, low_subarea, by_translation = write_outputs(records)
    print(f"records={len(records)}")
    print(f"csv={csv_path}")
    print(f"summary={summary_path}")
    print(f"subarea_summary={subarea_summary_path}")
    print(f"xlsx={xlsx_path}")
    print(f"web_index={web_index_path}")
    print("topics:")
    for topic in TOPICS:
        print(f"  {topic}: {counts.get(topic, 0)}")
    print("sources:")
    for source, count in by_source.most_common():
        print(f"  {source}: {count}")
    print(f"low_confidence={low_conf}")
    print(f"low_subarea_confidence={low_subarea}")
    print("translation:")
    for status, count in by_translation.most_common():
        print(f"  {status}: {count}")


if __name__ == "__main__":
    main()
