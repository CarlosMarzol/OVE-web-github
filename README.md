# OVE Web

Sitio web estatico del Observatorio Venezolano de Economia.

## Estructura

- `index.html`: entrada principal del sitio.
- `styles.css`: estilos globales y animaciones.
- `app.js`: rutas, contenido dinamico y comportamiento de la interfaz.
- `assets/`: imagenes y recursos usados directamente por la web.
- `assets/data/world-bank/`: datasets del Banco Mundial para Venezuela en CSV, JSON y Excel.
- `assets/data/bcv/`: datasets oficiales del Banco Central de Venezuela generados por `scripts/bcv_ingest.py`.
- `.github/workflows/update-bcv-data.yml`: automatizacion de GitHub Actions para actualizar datos BCV.
- `manual_corporativo_ove_max_calidad.pdf`: archivo enlazado desde la web.
- `source-assets/`: materiales de apoyo, logos originales e imagenes fuente.

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
