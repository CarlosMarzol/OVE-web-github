# Graph Report - /home/ubuntu/.openclaw/workspace/OVE-web-github  (2026-07-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 314 nodes · 807 edges · 17 communities (16 shown, 1 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34857cba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ove_excel_format.py
- app.js
- bcv_ingest.py
- icon
- unctad_refresh.py
- render
- ine_refresh.py
- cepal_refresh.py
- formatInteger
- fred_refresh.py
- ilo_refresh.py
- build_key_indicators_dataset.py
- dataPage
- bcv_workbook_extract.py
- fredPage
- imfPage
- sync_dashboard_data_from_postgres.sh

## God Nodes (most connected - your core abstractions)
1. `icon()` - 42 edges
2. `arrow()` - 38 edges
3. `footer()` - 25 edges
4. `formatInteger()` - 24 edges
5. `pageHero()` - 20 edges
6. `dataPage()` - 18 edges
7. `write_table()` - 17 edges
8. `dataMetaGrid()` - 16 edges
9. `format_sheet()` - 16 edges
10. `indicatorsPage()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `write_excel()` --calls--> `format_sheet()`  [INFERRED]
  scripts/bcv_ingest.py → scripts/ove_excel_format.py
- `write_excel()` --calls--> `write_table()`  [INFERRED]
  scripts/bcv_ingest.py → scripts/ove_excel_format.py
- `write_dataset()` --calls--> `format_sheet()`  [INFERRED]
  scripts/bcv_workbook_extract.py → scripts/ove_excel_format.py
- `write_dataset()` --calls--> `write_key_values()`  [INFERRED]
  scripts/bcv_workbook_extract.py → scripts/ove_excel_format.py
- `write_dataset()` --calls--> `write_table()`  [INFERRED]
  scripts/bcv_workbook_extract.py → scripts/ove_excel_format.py

## Import Cycles
- None detected.

## Communities (17 total, 1 thin omitted)

### Community 0 - "ove_excel_format.py"
Cohesion: 0.10
Nodes (40): main(), normalize_rows(), now_utc(), psql_env(), read_rows(), write_outputs(), write_catalog(), write_data_outputs() (+32 more)

### Community 1 - "app.js"
Cohesion: 0.07
Nodes (34): agricultureEnvironmentGroups, appRoot, barChart(), cepalCatalog, chartCard(), dashboardSeries, datasets, donutChart() (+26 more)

### Community 2 - "bcv_ingest.py"
Cohesion: 0.15
Nodes (34): build_catalog(), catalog_excel_links(), cell_to_float(), column_name(), dataset_payload(), decode_html(), excel_serial_to_date(), extract_value_date() (+26 more)

### Community 3 - "icon"
Cohesion: 0.23
Nodes (27): aboutPage(), arrow(), bcvPage(), bcvUsdHomePanel(), contactPage(), dataBand(), dataMetaGrid(), exchangeRatePage() (+19 more)

### Community 4 - "unctad_refresh.py"
Cohesion: 0.17
Nodes (25): bulk_download_url(), bulkfiles_url(), clean_text(), detect_delimiter(), dimensions_json(), extract_csv_files(), infer_year(), is_dimension_column() (+17 more)

### Community 5 - "render"
Cohesion: 0.13
Nodes (20): buildDashboardSeries(), comparisonSvg(), dashboardNumber(), dateLabel(), filterDashboardWindow(), formatBcvDate(), formatBcvNumber(), formatDashboardValue() (+12 more)

### Community 6 - "ine_refresh.py"
Cohesion: 0.25
Nodes (18): DictWriter, clean_cell_value(), clean_text(), extension(), extract_tabular_values(), extract_xls(), extract_xlsx(), fetch_bytes() (+10 more)

### Community 7 - "cepal_refresh.py"
Cohesion: 0.24
Nodes (17): api_url(), catalog_row(), clean_dimension_name(), dimension_maps(), fetch_indicator(), first_source(), infer_year(), load_indicator_tree() (+9 more)

### Community 8 - "formatInteger"
Cohesion: 0.18
Nodes (17): cepalDatasetCard(), cepalPage(), cepalSourceSection(), cepalTotals(), formatInteger(), iloDatasetCard(), iloPage(), iloSourceSection() (+9 more)

### Community 9 - "fred_refresh.py"
Cohesion: 0.24
Nodes (16): catalog_rows(), clean_text(), download_batch_observations(), download_single_observations(), fetch_bytes(), fetch_text(), infer_year(), load_catalog_from_fred() (+8 more)

### Community 10 - "ilo_refresh.py"
Cohesion: 0.32
Nodes (12): download_frequency(), fetch_bytes(), iter_rows_from_gzip(), load_metadata(), main(), period_key(), Path, read_csv_bytes() (+4 more)

### Community 11 - "build_key_indicators_dataset.py"
Cohesion: 0.35
Nodes (11): add_bcv_gdp(), add_bcv_inpc(), add_bcv_usd(), add_wdi(), fetch_wdi_rows(), main(), now_utc(), Path (+3 more)

### Community 12 - "dataPage"
Cohesion: 0.22
Nodes (11): bcvSourceSection(), dataPage(), datasetCard(), exampleNotice(), exampleTag(), recentDatasetTable(), topicOperationCount(), topicsSection() (+3 more)

### Community 13 - "bcv_workbook_extract.py"
Cohesion: 0.44
Nodes (8): download(), extract_gdp(), extract_inpc(), main(), now_utc(), Path, update_catalog(), write_dataset()

### Community 14 - "fredPage"
Cohesion: 0.50
Nodes (4): fredDatasetCard(), fredPage(), fredSourceSection(), fredTotals()

### Community 15 - "imfPage"
Cohesion: 0.50
Nodes (4): imfDatasetCard(), imfPage(), imfSourceSection(), imfTotals()

## Knowledge Gaps
- **25 isolated node(s):** `routes`, `routeMeta`, `appRoot`, `siteHeader`, `metricData` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `write_table()` connect `ove_excel_format.py` to `bcv_ingest.py`, `unctad_refresh.py`, `cepal_refresh.py`, `build_key_indicators_dataset.py`, `bcv_workbook_extract.py`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `format_sheet()` connect `ove_excel_format.py` to `bcv_ingest.py`, `unctad_refresh.py`, `cepal_refresh.py`, `build_key_indicators_dataset.py`, `bcv_workbook_extract.py`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `write_key_values()` connect `ove_excel_format.py` to `build_key_indicators_dataset.py`, `unctad_refresh.py`, `bcv_workbook_extract.py`, `cepal_refresh.py`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `routes`, `routeMeta`, `appRoot` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ove_excel_format.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10253699788583509 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06984126984126984 - nodes in this community are weakly interconnected._
- **Should `bcv_ingest.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14789915966386555 - nodes in this community are weakly interconnected._