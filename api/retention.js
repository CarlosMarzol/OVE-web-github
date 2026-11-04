import { deleteExpiredClosedSubmissions } from "./_database.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.authorization !== `Bearer ${secret}`) {
    return response.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  try {
    const deleted = await deleteExpiredClosedSubmissions();
    return response.status(200).json({ ok: true, deleted });
  } catch {
    console.error("OVE_RETENTION_JOB_FAILED");
    return response.status(503).json({ ok: false, error: "RETENTION_JOB_FAILED" });
  }
}
