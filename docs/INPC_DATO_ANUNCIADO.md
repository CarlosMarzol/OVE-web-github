# INPC: nota de "dato anunciado" por el BCV

## Problema

El BCV anuncia el INPC mensual en la portada de bcv.org.ve (bloque INPC) antes de
actualizar su libro estadístico descargable (`4_5_7_2.xls`). La serie oficial del
OVE se construye desde ese libro, por lo que durante ese intervalo la cifra del
sitio queda un mes por detrás del anuncio público.

## Solución

`scripts/inpc_announced_check.py` compara, en cada corrida diaria del workflow:

1. el periodo y la variación anunciados en la portada del BCV, y
2. el último periodo de la serie estadística normalizada
   (`assets/data/bcv/json/ove_bcv_inpc_nacional_mensual.json`).

Si el anuncio es más reciente, publica
`assets/data/bcv/json/ove_bcv_inpc_dato_anunciado.json` con
`mostrar_nota: true` y el estatus `anuncio_pendiente_de_confirmacion_estadistica`.
Cuando el libro estadístico se actualiza y la serie alcanza al anuncio, la nota
pasa a `confirmado_en_serie_estadistica` y `mostrar_nota: false`, sin
intervención manual.

`scripts/build_home_data.mjs` inyecta la nota en `indicators.inpc.anunciado`
del snapshot `assets/data/home/ove_home.json` solo mientras `mostrar_nota` sea
verdadero; si el archivo no existe o está confirmado, la home no cambia.

## Reglas de seguridad

- Si la página del BCV no se puede descargar o el bloque INPC no se puede
  interpretar, la nota existente se conserva intacta (nunca se reemplaza un dato
  válido por salida vacía ante una falla de la fuente).
- La nota siempre lleva el disclaimer: cifra anunciada pendiente de confirmación
  estadística; no sustituye el dato oficial para facturación, contabilidad o
  reportes legales.
- El chequeo corre en el grupo `daily` (20:30 UTC) y en `all`; el paso de commit
  ya cubre `assets/data/bcv`.

## Integración de frontend (pendiente)

La home ya recibe `indicators.inpc.anunciado` con `period_label`,
`var_mensual_pct`, `var_acumulada_pct`, `status`, `disclaimer`,
`checked_at` y `source_url`. Sugerencia de UI: insignia junto al indicador
INPC, p. ej. «Dato anunciado BCV: septiembre 2026, 8,4 % mensual (pendiente de
confirmación estadística)», enlazando a `source_url`.
