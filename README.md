# OVE Web

Sitio web estatico del Observatorio Venezolano de Economia.

## Estructura

- `index.html`: entrada principal del sitio.
- `scripts/build_static_routes.py`: genera entradas HTML estaticas para rutas limpias indexables a partir de `sitemap.xml`.
- `styles.css`: estilos globales y animaciones.
- `app.js`: rutas, contenido dinamico y comportamiento de la interfaz.
- `assets/`: imagenes y recursos usados directamente por la web.
- `assets/data/world-bank/`: datasets del Banco Mundial para Venezuela en CSV, JSON y Excel.
- `assets/data/bcv/`: datasets oficiales del Banco Central de Venezuela generados por `scripts/bcv_ingest.py`.
- `assets/data/ilo/`: datos OIT/ILOSTAT para Venezuela, con series completas comprimidas por frecuencia y catalogo CSV, JSON y Excel.
- `assets/data/imf/`: indicadores macroeconomicos del FMI World Economic Outlook para Venezuela en CSV, JSON y Excel.
- `assets/data/fred/`: series de FRED para Venezuela, con catalogo de series etiquetadas y observaciones descargables cuando FRED permite acceso CSV.
- `assets/data/ine/`: catalogo de recursos oficiales del INE Venezuela, con recursos tabulares, documentos enlazados al portal original y valores extraidos por celda desde los libros XLS/XLSX.
- `assets/data/indicadores-clave/`: paquete curado CSV, JSON y Excel para el dashboard de indicadores clave.
- `assets/data/inventario-indicadores/`: inventario completo de indicadores clasificados por tema OVE, con nombres de indicadores en espanol y columna de trazabilidad del nombre original.
- `.github/workflows/update-bcv-data.yml`: automatizacion de GitHub Actions para actualizar datos BCV, Banco Mundial, OIT/ILOSTAT, FMI/WEO, FRED e INE Venezuela.
- `manual_corporativo_ove_max_calidad.pdf`: archivo enlazado desde la web.
- `source-assets/`: materiales de apoyo, logos originales e imagenes fuente.

El workflow `Update OVE data` ejecuta el tipo de cambio BCV todos los dias a las 20:30 UTC, refresca PIB/INPC varias veces al mes, Banco Mundial semanalmente, OIT/ILOSTAT varias veces al mes, FMI/WEO varias veces al mes, FRED semanalmente, INE Venezuela semanalmente y regenera el paquete `indicadores-clave` y el inventario tematico de indicadores antes de commitear cambios.

## Actualizar datos BCV

```bash
python3 scripts/bcv_ingest.py --group daily
python3 scripts/bcv_ingest.py --group monthly
python3 scripts/bcv_ingest.py --group all
```

La ingesta diaria actualiza dos salidas BCV:

- `ove_bcv_tipo_cambio_usd`: serie historica diaria Bs/USD desde el Excel oficial `2_1_1_tdc.xlsx` y el dato diario publicado por el BCV.
- `ove_bcv_tipo_cambio_referencia_smc`: referencia diaria multimoneda publicada en la pagina SMC.

La ingesta mensual refresca el catalogo de archivos oficiales de PIB e INPC para su normalizacion posterior.

Para normalizar las series oficiales ya catalogadas de PIB e INPC:

```bash
python3 scripts/bcv_workbook_extract.py
```

Salidas principales:

- `ove_bcv_pib_real_anual`: crecimiento anual del PIB real total desde workbook oficial BCV.
- `ove_bcv_inpc_nacional_mensual`: INPC nacional y variacion mensual desde workbook oficial BCV.

## Actualizar indicadores clave

Despues de refrescar BCV y Banco Mundial, regenera el paquete descargable usado por el dashboard:

```bash
python3 scripts/build_key_indicators_dataset.py
```

Salidas:

- `assets/data/indicadores-clave/ove_indicadores_clave_venezuela.csv`
- `assets/data/indicadores-clave/ove_indicadores_clave_venezuela.json`
- `assets/data/indicadores-clave/ove_indicadores_clave_venezuela.xlsx`

## Actualizar inventario tematico de indicadores

Despues de refrescar cualquiera de las fuentes, regenera el inventario completo clasificado por tema OVE:

```bash
python3 scripts/build_indicator_theme_inventory.py
```

Salidas:

- `assets/data/inventario-indicadores/inventario_indicadores_ove_clasificado_temas_es.csv`
- `assets/data/inventario-indicadores/inventario_indicadores_ove_clasificado_temas_es.xlsx`
- `assets/data/inventario-indicadores/resumen_clasificacion_temas_es.csv`

## Formato corporativo Excel

Todos los XLSX publicados desde `assets/data/` deben generarse con `scripts/ove_excel_format.py`. La plantilla deja las primeras 5 filas reservadas para cabecera institucional, coloca el logo oficial OVE y empieza la tabla de datos en la fila 6.

## Exportar dashboard desde PostgreSQL privado

Para produccion, la web publica no se conecta directamente a PostgreSQL. El servidor exporta la vista aprobada `mart_ove.indicadores_clave_public` a la capa estatica que lee el dashboard:

```bash
PGHOST=127.0.0.1 PGPORT=5433 PGDATABASE=ove_venezuela_data PGUSER=ove_dashboard_exporter PGPASSWORD=... \
  python3 scripts/export_dashboard_from_postgres.py
```

Si el servidor debe publicar automaticamente los cambios en GitHub Pages:

```bash
scripts/sync_dashboard_data_from_postgres.sh
```

Este flujo mantiene PostgreSQL privado, evita credenciales en el navegador y permite que el dashboard se actualice al regenerarse los JSON/CSV/XLSX.

## Actualizar datos Banco Mundial

```bash
python3 scripts/world_bank_refresh.py
```

El refresco reutiliza los indicadores ya aprobados en el catalogo OVE, consulta la API publica del Banco Mundial para Venezuela y regenera CSV, JSON, Excel, catalogo y resumen de ultimos datos en:

- `assets/data/world-bank/catalog/world-bank-catalog.json`
- `assets/data/world-bank/catalog/world-bank-latest-summary.json`
- `assets/data/world-bank/csv/`
- `assets/data/world-bank/json/`
- `assets/data/world-bank/excel/`

## Actualizar datos OIT/ILOSTAT

```bash
python3 scripts/ilo_refresh.py
```

El refresco descarga los datos bulk de ILOSTAT para Venezuela en frecuencia anual, trimestral y mensual, conserva las series completas como CSV comprimido y regenera el catalogo estructurado en:

- `assets/data/ilo/catalog/ilo-catalog.json`
- `assets/data/ilo/catalog/catalogo_dataset_web_ove_oit_ilostat.csv`
- `assets/data/ilo/catalog/catalogo_dataset_web_ove_oit_ilostat.xlsx`
- `assets/data/ilo/csv/ove_oit_ilostat_venezuela_anual.csv.gz`
- `assets/data/ilo/csv/ove_oit_ilostat_venezuela_trimestral.csv.gz`
- `assets/data/ilo/csv/ove_oit_ilostat_venezuela_mensual.csv.gz`

## Actualizar datos FMI/WEO

```bash
python3 scripts/imf_refresh.py
```

El refresco consulta el API publico SDMX 3.0 del FMI para `IMF.RES/WEO`, filtra Venezuela y regenera datos, catalogo y Excel con formato corporativo OVE en:

- `assets/data/imf/catalog/imf-catalog.json`
- `assets/data/imf/catalog/catalogo_dataset_web_ove_fmi_weo.csv`
- `assets/data/imf/catalog/catalogo_dataset_web_ove_fmi_weo.xlsx`
- `assets/data/imf/csv/ove_fmi_weo_venezuela.csv`
- `assets/data/imf/json/ove_fmi_weo_venezuela.json`
- `assets/data/imf/excel/ove_fmi_weo_venezuela.xlsx`

## Actualizar datos FRED

```bash
python3 scripts/fred_refresh.py
```

El refresco usa la etiqueta publica `venezuela` de FRED, cataloga las series disponibles y descarga observaciones por `fredgraph.csv` cuando FRED permite acceso directo. Si FRED bloquea temporalmente las descargas, el script conserva el ultimo dataset no vacio y registra los errores en el catalogo.

- `assets/data/fred/catalog/fred-catalog.json`
- `assets/data/fred/catalog/catalogo_dataset_web_ove_fred.csv`
- `assets/data/fred/catalog/catalogo_dataset_web_ove_fred.xlsx`
- `assets/data/fred/csv/ove_fred_venezuela.csv`
- `assets/data/fred/json/ove_fred_venezuela.json`
- `assets/data/fred/excel/ove_fred_venezuela.xlsx`

## Actualizar datos INE Venezuela

```bash
python3 scripts/ine_refresh.py
```

El refresco lee el portal publico `ine.gob.ve`, elimina enlaces duplicados, regenera el catalogo OVE de recursos oficiales y extrae los valores de los libros XLS/XLSX en formato largo por celda: recurso, hoja, fila, columna, celda y valor. Dado que los libros Excel del INE tienen estructuras heterogeneas, esta capa conserva la estructura original y no fuerza una tabla comun de indicadores.

- `assets/data/ine/catalog/ine-catalog.json`
- `assets/data/ine/catalog/catalogo_dataset_web_ove_ine_venezuela.csv`
- `assets/data/ine/catalog/catalogo_dataset_web_ove_ine_venezuela.xlsx`
- `assets/data/ine/csv/ove_ine_venezuela_catalogo_recursos.csv`
- `assets/data/ine/csv/ove_ine_venezuela_celdas_tabulares.csv.gz`
- `assets/data/ine/csv/ove_ine_venezuela_indice_hojas.csv`
- `assets/data/ine/json/ove_ine_venezuela_catalogo_recursos.json`
- `assets/data/ine/excel/ove_ine_venezuela_catalogo_recursos.xlsx`
- `assets/data/ine/excel/ove_ine_venezuela_indice_hojas.xlsx`

## Ejecutar localmente

Puedes abrir `index.html` directamente en el navegador o iniciar un servidor local:

```bash
python -m http.server 4173
```

Luego abre:

```text
http://127.0.0.1:4173
```

## Publicar en GitHub Pages

Este proyecto no necesita build. Para GitHub Pages, publica la rama principal usando la carpeta raiz del repositorio.
