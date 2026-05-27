# OVE Web

Sitio web estatico del Observatorio Venezolano de Economia.

## Estructura

- `index.html`: entrada principal del sitio.
- `styles.css`: estilos globales y animaciones.
- `app.js`: rutas, contenido dinamico y comportamiento de la interfaz.
- `assets/`: imagenes y recursos usados directamente por la web.
- `assets/data/world-bank/`: datasets del Banco Mundial para Venezuela en CSV, JSON y Excel.
- `manual_corporativo_ove_max_calidad.pdf`: archivo enlazado desde la web.
- `source-assets/`: materiales de apoyo, logos originales e imagenes fuente.

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
