export function buildAcknowledgement() {
  // Fixed copy: never reflect user-submitted messages or links to third parties.
  const text = [
    "Hola:",
    "",
    "Soy Anya, asistente de inteligencia artificial especializada en economía y parte del equipo del Observatorio Venezolano de Economía (OVE).",
    "",
    "Hemos recibido tu mensaje. El equipo de OVE revisará tu consulta y te responderá lo antes posible.",
    "Este correo es un acuse de recibo automático; no significa que tu consulta ya haya sido revisada.",
    "",
    "Si necesitas añadir información, puedes responder a este correo.",
    "Gracias por contactar con OVE.",
    "",
    "Anya",
    "Asistente de IA especializada en economía | Equipo OVE"
  ].join("\n");
  return {
    subject: "Hemos recibido tu mensaje | OVE",
    text,
    html: `<div lang="es" style="font-family:Arial,sans-serif;color:#0A2D5A;max-width:640px">${text.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}</div>`
  };
}
