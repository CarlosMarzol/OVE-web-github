#!/usr/bin/env python3
"""Generate static entry points for clean SPA routes listed in sitemap.xml."""

from __future__ import annotations

import shutil
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
SITEMAP = ROOT / "sitemap.xml"
SITEMAP_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


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


def main() -> None:
  for route in route_paths():
    target_dir = ROOT / route
    target_dir.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(INDEX, target_dir / "index.html")
  print(f"Generated {len(route_paths())} static route entry points")


if __name__ == "__main__":
  main()
