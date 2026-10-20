# Suscripciones al boletín: dónde se guardan

## Estado tras la integración (PR feat/boletin-audiencias)

Cada suscripción del formulario `boletin` hace tres cosas, en orden:

1. **Correo al buzón institucional** (`OVE_CONTACT_TO`), como antes.
2. **Registro del contacto en Resend Audiences**, audiencia `Boletín OVE`
   (`POST /audiences/{id}/contacts`, idempotente: re-suscripción no duplica).
   El id se resuelve por `RESEND_AUDIENCE_ID_BOLETIN` si está definido; si no,
   se busca la audiencia por nombre y se crea si no existe.
3. **Correo de bienvenida al suscriptor** (copia fija, sin datos del usuario),
   que incluye la vía de baja manual («responde con asunto Baja»).

Los fallos de (2) y (3) se registran en logs pero **nunca** convierten una
suscripción entregada en error para el visitante.

## Dónde viven los datos personales

- Únicamente en **Resend** (audiencia `Boletín OVE`) y en el buzón
  institucional. Nunca en el repositorio ni en archivos públicos.

## Exportar la lista

- Panel Resend → Audiences → Boletín OVE, o
- API: `GET https://api.resend.com/audiences/{id}/contacts` con la API key.

## Pendientes conocidos

- Baja automatizada con enlace (llega con Resend Broadcasts al enviar el primer
  boletín). Mientras tanto: baja manual respondiendo «Baja» al correo de
  bienvenida.
- Doble opt-in: valorar antes de escalar volumen.
- Actualizar `/privacidad` (hoy provisional) mencionando Resend como
  encargado de tratamiento de los correos de suscriptores.
