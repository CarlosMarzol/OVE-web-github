import { neon } from "@neondatabase/serverless";

let sqlClient = null;
let schemaReady = null;

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

async function ensureSchema() {
  const sql = database();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS ove_form_submissions (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        form_id TEXT NOT NULL CHECK (form_id IN ('contacto', 'boletin', 'colaboracion')),
        email TEXT NOT NULL,
        nombre TEXT,
        telefono TEXT,
        tipo_consulta TEXT,
        tipo_colaboracion TEXT,
        mensaje TEXT,
        propuesta TEXT,
        acepta_privacidad BOOLEAN NOT NULL DEFAULT FALSE,
        acepta_boletin BOOLEAN NOT NULL DEFAULT FALSE,
        consentimiento_registrado_en TIMESTAMPTZ,
        page_url TEXT,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        estado TEXT NOT NULL DEFAULT 'open' CHECK (estado IN ('open', 'pending', 'subscribed', 'closed', 'unsubscribed')),
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await sql`CREATE INDEX IF NOT EXISTS ove_form_submissions_email_idx ON ove_form_submissions (LOWER(email))`;
      await sql`CREATE INDEX IF NOT EXISTS ove_form_submissions_created_idx ON ove_form_submissions (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS ove_form_submissions_state_idx ON ove_form_submissions (estado, closed_at)`;
    })();
  }
  try {
    await schemaReady;
  } catch (error) {
    schemaReady = null;
    throw error;
  }
}

function accepted(value) {
  return ["on", "true", "1"].includes(String(value || "").toLowerCase());
}

export async function storeFormSubmission(payload) {
  await ensureSchema();
  const sql = database();
  const acceptsPrivacy = accepted(payload.acepta_privacidad);
  const acceptsNewsletter = accepted(payload.acepta_boletin);
  const rows = await sql`INSERT INTO ove_form_submissions (
    form_id, email, nombre, telefono, tipo_consulta, tipo_colaboracion, mensaje, propuesta,
    acepta_privacidad, acepta_boletin, consentimiento_registrado_en, page_url, submitted_at, estado
  ) VALUES (
    ${payload.form_id}, ${payload.email}, ${payload.nombre || null}, ${payload.telefono || null},
    ${payload.tipo_consulta || null}, ${payload.tipo_colaboracion || null}, ${payload.mensaje || null}, ${payload.propuesta || null},
    ${acceptsPrivacy}, ${acceptsNewsletter}, ${acceptsPrivacy || acceptsNewsletter ? payload.submitted_at : null},
    ${payload.page_url || null}, ${payload.submitted_at}, ${payload.form_id === "boletin" ? "pending" : "open"}
  ) RETURNING id`;
  return rows?.[0]?.id ?? null;
}

export async function setNewsletterRecordStatus(id, status) {
  if (!["subscribed", "unsubscribed"].includes(status)) throw new Error("INVALID_NEWSLETTER_STATUS");
  await ensureSchema();
  const sql = database();
  await sql`UPDATE ove_form_submissions SET estado = ${status} WHERE id = ${id} AND form_id = 'boletin'`;
}

export async function deleteExpiredClosedSubmissions() {
  await ensureSchema();
  const sql = database();
  const rows = await sql`DELETE FROM ove_form_submissions
    WHERE form_id IN ('contacto', 'colaboracion')
      AND estado = 'closed'
      AND closed_at IS NOT NULL
      AND closed_at <= NOW() - INTERVAL '10 years'
    RETURNING id`;
  return rows.length;
}
