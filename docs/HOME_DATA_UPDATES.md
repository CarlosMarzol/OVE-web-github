# Actualización de datos de portada

La portada no conserva cifras estadísticas ni trayectorias manuales.

- `scripts/build_home_data.mjs` lee las bases normalizadas BCV y WDI, y los ocho catálogos de fuentes; valida seis indicadores y genera atómicamente `assets/data/home/ove_home.json`.
- El workflow existente ejecuta sus actualizaciones, las pruebas de portada y este generador antes de confirmar datos. Se conservan las frecuencias de actualización existentes.
- Vercel también ejecuta el generador en cada despliegue, cubriendo cambios directos de bases normalizadas aunque no se reconstruya el dataset consolidado.
- Una única instantánea alimenta el indicador destacado y su trayectoria, las dos cintas, las cuatro pestañas y CSV, los ocho contadores y el total de fuentes.
- El navegador solicita la instantánea sin caché al abrir, cada cinco minutos mientras está visible, al recuperar foco, visibilidad o conexión. La actualización es posterior al despliegue de los datos, no instantánea respecto al organismo de origen.
- Cada indicador presenta su periodo estadístico; la captura de catálogo BCV no se confunde con la fecha valor.
- Sin datos válidos no se publican cifras de ejemplo. Una primera carga fallida muestra indisponibilidad y permite reintentar; si falla una comprobación posterior se conservan los últimos datos cargados con aviso.
- El gráfico presenta hasta 8 observaciones anuales, 12 mensuales o 45 diarias; el CSV conserva toda la serie. El botón «Últimos 5» acota la ventana visible.

Pruebas: `node --test tests/home-data.test.mjs`. Construcción: `node scripts/build_home_data.mjs`. No requiere dependencias adicionales.
