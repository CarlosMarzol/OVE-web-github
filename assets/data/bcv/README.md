# BCV Data Pipeline

Datos oficiales obtenidos del Banco Central de Venezuela para el Observatorio Venezolano de Economia.

## Archivos generados

- `json/`: series historicas normalizadas para consumo web.
- `csv/`: exportacion tabular.
- `excel/`: archivo `.xlsx` con columnas OVE.
- `catalog/`: catalogo de datasets y archivos oficiales detectados.
- `raw/`: copia HTML de paginas fuente para auditoria.

## Fuente activa

- `bcv_tipo_cambio_referencia_smc`: tipo de cambio de referencia SMC publicado por el BCV. Frecuencia objetivo: diaria.

## Fuentes catalogadas

- `bcv_producto_interno_bruto`: pagina oficial de PIB, con archivos Excel oficiales detectados.
- `bcv_indice_nacional_precios_consumidor`: pagina oficial de INPC, con archivos Excel oficiales detectados.

La normalizacion hoja-por-hoja de PIB e INPC se agregara por indicador para evitar mezclar estructuras oficiales distintas.
