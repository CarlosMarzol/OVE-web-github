#!/usr/bin/env python3
"""Generate static entry points for clean SPA routes listed in sitemap.xml."""

from __future__ import annotations

import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
SITEMAP = ROOT / "sitemap.xml"
SITEMAP_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
SITE_ORIGIN = "https://ove-venezuela.com"

ROUTE_META = {
  "indicadores": (
    "Explorador de indicadores | OVE",
    "Inventario OVE de indicadores para Venezuela por tema, subárea, fuente y descarga Excel.",
  ),
  "indicadores/dashboard": (
    "Dashboard interactivo | OVE",
    "Cruce interactivo de variables económicas de Venezuela con fuentes BCV y Banco Mundial.",
  ),
  "publicaciones": (
    "Informes y publicaciones | OVE",
    "Repositorio de informes del OVE en preparación para el lanzamiento público.",
  ),
  "nota-lanzamiento": (
    "Nota de lanzamiento | OVE",
    "Primera nota institucional del OVE: alcance inicial, fuentes disponibles, metodología y hoja de ruta.",
  ),
  "datos": (
    "Banco de datos | OVE",
    "Datos abiertos, catálogos y herramientas para análisis económico.",
  ),
  "datos/bcv": (
    "Banco Central de Venezuela | OVE",
    "Datos oficiales del Banco Central de Venezuela integrados al Observatorio.",
  ),
  "datos/tipo-cambio": (
    "Tipo de cambio BCV | OVE",
    "Cuadro de mando del tipo de cambio oficial BCV con descargas diarias en CSV, JSON y Excel OVE.",
  ),
  "datos/banco-mundial": (
    "Banco Mundial Venezuela | OVE",
    "Series del Banco Mundial organizadas para el análisis económico de Venezuela.",
  ),
  "datos/oit": (
    "OIT ILOSTAT Venezuela | OVE",
    "Indicadores laborales de OIT/ILOSTAT para Venezuela catalogados por frecuencia.",
  ),
  "datos/fmi": (
    "FMI WEO Venezuela | OVE",
    "Indicadores macroeconómicos del FMI World Economic Outlook para Venezuela.",
  ),
  "datos/fred": (
    "FRED Venezuela | OVE",
    "Series de FRED etiquetadas para Venezuela, catalogadas para descarga abierta.",
  ),
  "datos/ine": (
    "INE Venezuela | OVE",
    "Catálogo de recursos oficiales del Instituto Nacional de Estadística de Venezuela.",
  ),
  "datos/cepal": (
    "CEPALSTAT Venezuela | OVE",
    "Indicadores abiertos de CEPALSTAT para Venezuela con valores descargables y catálogo OVE.",
  ),
  "datos/unctad": (
    "UNCTADstat Venezuela | OVE",
    "Reportes abiertos de UNCTADstat para Venezuela con valores descargables y catálogo OVE.",
  ),
  "datos/agricultura-medio-ambiente": (
    "Agricultura y medio ambiente | OVE",
    "Indicadores de agricultura, recursos naturales y medio ambiente para Venezuela en el banco de datos OVE.",
  ),
  "datos/ciencia-tecnologia": (
    "Ciencia y tecnología | OVE",
    "Indicadores de ciencia, tecnología e innovación para Venezuela en el banco de datos OVE.",
  ),
  "datos/demografia-poblacion": (
    "Demografía y población | OVE",
    "Indicadores demográficos y poblacionales de Venezuela organizados por el Observatorio Venezolano de Economía.",
  ),
  "datos/economia": (
    "Economía Venezuela | OVE",
    "Indicadores económicos de Venezuela con series, catálogos y descargas abiertas del OVE.",
  ),
  "datos/economia/pib-precios-corrientes-moneda-nacional": (
    "PIB moneda nacional | OVE",
    "Ficha estadística OVE del Producto interno bruto en moneda nacional.",
  ),
  "datos/economia/pib-precios-corrientes-moneda-nacional/preguntas-frecuentes": (
    "Preguntas frecuentes PIB moneda nacional | OVE",
    "Preguntas frecuentes sobre la serie OVE del PIB en moneda nacional.",
  ),
  "datos/economia/pib-precios-corrientes-dolares-estadounidenses": (
    "PIB dólares estadounidenses | OVE",
    "Ficha estadística OVE del Producto interno bruto en dólares estadounidenses.",
  ),
  "datos/economia/pib-precios-corrientes-dolares-estadounidenses/preguntas-frecuentes": (
    "Preguntas frecuentes PIB dólares estadounidenses | OVE",
    "Preguntas frecuentes sobre la serie OVE del PIB en dólares estadounidenses.",
  ),
  "datos/economia/pib-precios-constantes-moneda-nacional": (
    "PIB precios constantes, moneda nacional | OVE",
    "Ficha estadística OVE del Producto interno bruto a precios constantes en moneda nacional.",
  ),
  "datos/economia/pib-precios-constantes-moneda-nacional/preguntas-frecuentes": (
    "Preguntas frecuentes PIB precios constantes, moneda nacional | OVE",
    "Preguntas frecuentes sobre la serie OVE del PIB a precios constantes en moneda nacional.",
  ),
  "datos/economia/pib-precios-constantes-dolares-estadounidenses": (
    "PIB precios constantes, dólares estadounidenses | OVE",
    "Ficha estadística OVE del Producto interno bruto a precios constantes en dólares estadounidenses.",
  ),
  "datos/economia/pib-precios-constantes-dolares-estadounidenses/preguntas-frecuentes": (
    "Preguntas frecuentes PIB precios constantes, dólares estadounidenses | OVE",
    "Preguntas frecuentes sobre la serie OVE del PIB a precios constantes en dólares estadounidenses.",
  ),
  "datos/economia/pib-precios-corrientes-ppa-dolares-internacionales": (
    "PIB PPA, dólares internacionales | OVE",
    "Ficha estadística OVE del Producto interno bruto PPA en dólares internacionales.",
  ),
  "datos/economia/pib-precios-corrientes-ppa-dolares-internacionales/preguntas-frecuentes": (
    "Preguntas frecuentes PIB PPA | OVE",
    "Preguntas frecuentes sobre la serie OVE del PIB PPA en dólares internacionales.",
  ),
  "datos/industria-energia-construccion": (
    "Industria, energía y construcción | OVE",
    "Indicadores de industria, energía y construcción para Venezuela en el banco de datos OVE.",
  ),
  "datos/mercado-laboral": (
    "Mercado laboral Venezuela | OVE",
    "Indicadores laborales de Venezuela con fuentes oficiales e internacionales organizadas por el OVE.",
  ),
  "datos/servicios": (
    "Servicios Venezuela | OVE",
    "Indicadores del sector servicios de Venezuela disponibles en el banco de datos OVE.",
  ),
  "datos/nivel-condiciones-vida": (
    "Nivel y condiciones de vida | OVE",
    "Indicadores sociales y de condiciones de vida para Venezuela organizados por el OVE.",
  ),
  "datos/sociedad": (
    "Sociedad Venezuela | OVE",
    "Indicadores sociales de Venezuela con catálogos y descargas abiertas del OVE.",
  ),
  "datos/estadisticas-experimentales": (
    "Estadísticas experimentales | OVE",
    "Indicadores experimentales y series exploratorias para Venezuela en el banco de datos OVE.",
  ),
  "metodologia": (
    "Metodología, fuentes y citación | OVE",
    "Criterios metodológicos del OVE: fuentes, tratamiento de datos, actualización, limitaciones y forma de cita.",
  ),
  "manifiesto": (
    "Manifiesto Institucional | OVE",
    "Manifiesto institucional del Observatorio Venezolano de Economía sobre estadística rigurosa, libertad económica e integridad de las cifras.",
  ),
  "nosotros": (
    "Nosotros | OVE",
    "Conoce la misión, visión, valores y metodología del Observatorio Venezolano de Economía.",
  ),
  "contacto": (
    "Contacto y boletín | OVE",
    "Escríbenos, suscríbete al boletín o plantea una colaboración institucional.",
  ),
  "legal": (
    "Aviso legal | OVE",
    "Aviso legal provisional del Observatorio Venezolano de Economía, pendiente de revisión legal.",
  ),
  "privacidad": (
    "Política de privacidad | OVE",
    "Política de privacidad provisional del OVE para formularios, boletín y tratamiento de datos personales.",
  ),
  "cookies": (
    "Política de cookies | OVE",
    "Información provisional sobre cookies y tecnologías similares en el sitio del OVE.",
  ),
  "terminos": (
    "Términos de uso | OVE",
    "Términos de uso provisionales del sitio web y recursos del OVE.",
  ),
  "licencia-datos": (
    "Licencia de datos | OVE",
    "Condiciones provisionales para reutilizar datos y descargas del OVE.",
  ),
}


def route_paths() -> list[str]:
  tree = ET.parse(SITEMAP)
  paths = []
  for loc in tree.findall(".//s:loc", SITEMAP_NS):
    if not loc.text:
      continue
    path = urlparse(loc.text).path.strip("/")
    if path:
      paths.append(path)
  return sorted(set(paths))


def meta_for_route(route: str) -> tuple[str, str]:
  if route in ROUTE_META:
    return ROUTE_META[route]

  section_labels = {
    "dashboard": "Dashboard",
    "metodologia": "Metodología",
    "mas-informacion": "Más información",
  }
  base, _, section = route.rpartition("/")
  if section in section_labels and base in ROUTE_META:
    base_title, _ = ROUTE_META[base]
    clean_base_title = base_title.replace(" | OVE", "")
    label = section_labels[section]
    return (
      f"{label} {clean_base_title} | OVE",
      f"Página {label.lower()} de la ficha estadística {clean_base_title} en OVEbase.",
    )

  return ROUTE_META["datos"]


def route_html(route: str) -> str:
  html = INDEX.read_text(encoding="utf-8")
  title, description = meta_for_route(route)
  url = f"{SITE_ORIGIN}/{route}"
  replacements = {
    "<title>Observatorio Venezolano de Economía | Indicadores, informes y datos abiertos</title>": f"<title>{title}</title>",
    'content="Portal del Observatorio Venezolano de Economía con indicadores, informes, datos abiertos y análisis económico independiente para Venezuela."': f'content="{description}"',
    '<link rel="canonical" href="https://ove-venezuela.com/">': f'<link rel="canonical" href="{url}">',
    '<link rel="alternate" hreflang="es" href="https://ove-venezuela.com/">': f'<link rel="alternate" hreflang="es" href="{url}">',
    '<meta property="og:title" content="Observatorio Venezolano de Economía">': f'<meta property="og:title" content="{title}">',
    '<meta property="og:description" content="Indicadores, informes y datos abiertos para comprender la economía venezolana.">': f'<meta property="og:description" content="{description}">',
    '<meta property="og:url" content="https://ove-venezuela.com/">': f'<meta property="og:url" content="{url}">',
    '<meta name="twitter:title" content="Observatorio Venezolano de Economía">': f'<meta name="twitter:title" content="{title}">',
    '<meta name="twitter:description" content="Indicadores, informes y datos abiertos para comprender la economía venezolana.">': f'<meta name="twitter:description" content="{description}">',
  }
  for old, new in replacements.items():
    html = html.replace(old, new)
  return html


def main() -> None:
  for route in route_paths():
    target_dir = ROOT / route
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / "index.html").write_text(route_html(route), encoding="utf-8")
  print(f"Generated {len(route_paths())} static route entry points")


if __name__ == "__main__":
  main()
