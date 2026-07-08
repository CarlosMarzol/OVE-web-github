# OVE Web

Sitio web estatico del Observatorio Venezolano de Economia.

## Estructura

- `index.html`: entrada principal del sitio.
- `styles.css`: estilos globales y animaciones.
- `app.js`: rutas, contenido dinamico y comportamiento de la interfaz.
- `assets/`: imagenes y recursos usados directamente por la web.
- `assets/data/world-bank/`: datasets del Banco Mundial para Venezuela en CSV, JSON y Excel.
- `assets/data/bcv/`: datasets oficiales del Banco Central de Venezuela generados por `scripts/bcv_ingest.py`.
- `assets/data/indicadores-clave/`: paquete curado CSV, JSON y Excel para el dashboard de indicadores clave.
- `.github/workflows/update-bcv-data.yml`: automatizacion de GitHub Actions para actualizar datos BCV y Banco Mundial.
- `manual_corporativo_ove_max_calidad.pdf`: archivo enlazado desde la web.
- `source-assets/`: materiales de apoyo, logos originales e imagenes fuente.

El workflow `Update OVE data` ejecuta el tipo de cambio BCV todos los dias a las 20:30 UTC, refresca PIB/INPC mensualmente, Banco Mundial semanalmente y regenera el paquete `indicadores-clave` antes de commitear cambios.

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
