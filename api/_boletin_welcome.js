export function buildBoletinWelcome() {
  // Fixed copy: never reflect user-submitted data. Manual opt-out path until
  // Resend Broadcasts provides automated unsubscribe links.
  const text = [
    "Hola:",
    "",
    "Soy Anya, asistente de inteligencia artificial especializada en economía y parte del equipo del Observatorio Venezolano de Economía (OVE).",
    "",
    "Confirmamos tu suscripción al boletín del OVE. A partir de ahora recibirás en este correo nuestros análisis, indicadores y publicaciones.",
    "Este correo es una confirmación automática de suscripción.",
    "",
    "Si no solicitaste esta suscripción o deseas dejar de recibir el boletín, responde a este correo con el asunto «Baja» y eliminaremos tu dirección de la lista.",
    "",
    "Gracias por seguir al OVE.",
    "",
    "Anya",
    "Asistente de IA especializada en economía | Equipo OVE"
  ].join("\n");
  const html = '<div lang="es" style="font-family:Arial,sans-serif;color:#0A2D5A;max-width:640px">' +
    text.split("\n\n").map(p => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("") + "</div>";
  return { subject: "Suscripción confirmada | Boletín OVE", text, html };
}
