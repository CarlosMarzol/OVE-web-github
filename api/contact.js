const RESEND_API_URL = "https://api.resend.com/emails";

const FORM_LABELS = {
  contacto: "Contacto general",
  boletin: "Boletin OVE",
  colaboracion: "Colaboracion institucional"
};

const FORM_SUBJECTS = {
  contacto: "Nueva consulta desde la web OVE",
  boletin: "Nueva suscripcion al boletin OVE",
  colaboracion: "Nueva propuesta de colaboracion OVE"
};

const REQUIRED_FIELDS = {
  contacto: ["nombre", "email", "mensaje"],
  boletin: ["email"],
  colaboracion: ["nombre", "email", "propuesta"]
};

const FIELD_LABELS = {
  nombre: "Nombre",
  email: "Correo electronico",
  telefono: "Telefono",
  tipo_consulta: "Tipo de consulta",
  tipo_colaboracion: "Tipo de colaboracion",
  mensaje: "Mensaje",
  propuesta: "Propuesta",
  acepta_privacidad: "Acepta privacidad",
  form_id: "Formulario",
  page_url: "Pagina",
  submitted_at: "Fecha de envio"
};

const MAX_FIELD_LENGTH = 4000;
const MAX_BODY_LENGTH = 12000;

function jsonResponse(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, MAX_FIELD_LENGTH);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return cleanValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizePayload(body) {
  const formId = cleanValue(body.form_id || body.formId || "contacto").toLowerCase();
  const safeFormId = Object.prototype.hasOwnProperty.call(FORM_LABELS, formId) ? formId : "contacto";
  const payload = {};

  for (const [key, value] of Object.entries(body || {})) {
    const safeKey = cleanValue(key).replace(/[^\w.-]/g, "_");
    if (!safeKey || safeKey.startsWith("_")) continue;
    payload[safeKey] = cleanValue(value);
  }

  payload.form_id = safeFormId;
  payload.submitted_at = new Date().toISOString();
  return payload;
}

function validatePayload(payload) {
  if (payload.website || payload.url || payload.company_website) {
    return { ok: false, status: 204, code: "SPAM_FILTERED" };
  }

  const required = REQUIRED_FIELDS[payload.form_id] || REQUIRED_FIELDS.contacto;
  const missing = required.filter(field => !payload[field]);
  if (missing.length) {
    return { ok: false, status: 400, code: "MISSING_FIELDS", fields: missing };
  }

  if (!isValidEmail(payload.email)) {
    return { ok: false, status: 400, code: "INVALID_EMAIL" };
  }

  const bodySize = JSON.stringify(payload).length;
  if (bodySize > MAX_BODY_LENGTH) {
    return { ok: false, status: 413, code: "PAYLOAD_TOO_LARGE" };
  }

  return { ok: true };
}

function buildEmail(payload, request) {
  const formLabel = FORM_LABELS[payload.form_id] || FORM_LABELS.contacto;
  const subject = FORM_SUBJECTS[payload.form_id] || FORM_SUBJECTS.contacto;
  const origin = cleanValue(request.headers.origin || request.headers.referer || "ove-venezuela.com");

  const orderedKeys = [
    "form_id",
    "nombre",
    "email",
    "telefono",
    "tipo_consulta",
    "tipo_colaboracion",
    "mensaje",
    "propuesta",
    "acepta_privacidad",
    "page_url",
    "submitted_at"
  ];

  const keys = [
    ...orderedKeys.filter(key => payload[key]),
    ...Object.keys(payload).filter(key => !orderedKeys.includes(key) && payload[key])
  ];

  const textLines = [
    `Formulario: ${formLabel}`,
    `Origen: ${origin}`,
    "",
    ...keys.map(key => `${FIELD_LABELS[key] || key}: ${payload[key]}`)
  ];

  const htmlRows = keys.map(key => {
    const label = escapeHtml(FIELD_LABELS[key] || key);
    const value = escapeHtml(payload[key]).replace(/\n/g, "<br>");
    return `<tr><th align="left" style="padding:8px 12px;border-bottom:1px solid #e5e7eb;background:#f8fafc">${label}</th><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${value}</td></tr>`;
  }).join("");

  return {
    subject,
    text: textLines.join("\n"),
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 8px">Nuevo mensaje OVE</h2>
      <p style="margin:0 0 16px;color:#475569">Formulario: ${escapeHtml(formLabel)}<br>Origen: ${escapeHtml(origin)}</p>
      <table style="border-collapse:collapse;width:100%;max-width:760px;border:1px solid #e5e7eb">${htmlRows}</table>
    </div>`
  };
}

function parseRequestBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return jsonResponse(response, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OVE_CONTACT_TO || "ove.venezuela@outlook.com";
  const from = process.env.OVE_CONTACT_FROM || "OVE Web <no-reply@ove-venezuela.com>";

  if (!apiKey) {
    return jsonResponse(response, 500, { ok: false, error: "CONTACT_SERVICE_NOT_CONFIGURED" });
  }

  const payload = normalizePayload(parseRequestBody(request.body));
  const validation = validatePayload(payload);
  if (!validation.ok) {
    if (validation.status === 204) return response.status(204).end();
    return jsonResponse(response, validation.status, { ok: false, error: validation.code, fields: validation.fields || [] });
  }

  const email = buildEmail(payload, request);

  try {
    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: payload.email,
        subject: email.subject,
        text: email.text,
        html: email.html
      })
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error("Resend error", resendResponse.status, errorBody);
      return jsonResponse(response, 502, { ok: false, error: "EMAIL_SEND_FAILED" });
    }

    return jsonResponse(response, 200, { ok: true });
  } catch (error) {
    console.error("Contact form error", error);
    return jsonResponse(response, 500, { ok: false, error: "CONTACT_FORM_ERROR" });
  }
}
