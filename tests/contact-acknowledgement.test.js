import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contact.js';

// Stub the provider: these tests never send mail or require real credentials.
test('contact acknowledgement behavior', async t => {
  const originalFetch = globalThis.fetch;
  const saved = { ...process.env };
  process.env.RESEND_API_KEY = 'test-only';
  process.env.RESEND_AUDIENCE_ID_BOLETIN = 'test-audience';
  delete process.env.OVE_SMTP_USER;
  delete process.env.OUTLOOK_SMTP_USER;
  let calls;
  let urls;
  let failAt;
  globalThis.fetch = async (_url, options) => {
    urls.push(String(_url));
    calls.push(JSON.parse(options.body));
    return { ok: calls.length !== failAt, status: 503, text: async () => 'test failure' };
  };
  const invoke = async (body) => {
    calls = [];
    urls = [];
    const result = {};
    const res = { status(n) { result.status = n; return this; }, json(p) { result.body = p; }, end() {} };
    await handler({method: 'POST', headers: {}, body}, res);
    return result;
  };
  const contact = {form_id:'contacto', nombre:'Test', email:'visitor@example.com', mensaje:'untrusted-message https://example.org'};
  try {
    await t.test('two messages, explicit AI identity, institutional reply-to, no reflection', async () => {
      failAt = 0;
      const result = await invoke(contact);
      assert.equal(result.status, 200);
      assert.equal(calls.length, 2);
      assert.equal(calls[1].to, contact.email);
      assert.equal(calls[1].reply_to, process.env.OVE_CONTACT_TO || 'ove.venezuela@outlook.com');
      assert.match(calls[1].text, /Anya/);
      assert.match(calls[1].text, /inteligencia artificial/);
      assert.doesNotMatch(calls[1].text, /untrusted-message/);
    });
    await t.test('receipt failure preserves successfully submitted inquiry', async () => {
      failAt = 2;
      assert.equal((await invoke(contact)).status, 200);
      assert.equal(calls.length, 2);
    });
    await t.test('institutional delivery failure never sends a receipt', async () => {
      failAt = 1;
      assert.equal((await invoke(contact)).status, 500);
      assert.equal(calls.length, 1);
    });
    await t.test('invalid and honeypot requests never send email', async () => {
      failAt = 0;
      assert.equal((await invoke({})).status, 400);
      assert.equal(calls.length, 0);
      assert.equal((await invoke({...contact, website:'bot'})).status, 204);
      assert.equal(calls.length, 0);
    });
    await t.test('boletin guarda el contacto en la audiencia y envia bienvenida', async () => {
      failAt = 0;
      const result = await invoke({form_id:'boletin',email:'visitor@example.com'});
      assert.equal(result.status, 200);
      assert.equal(calls.length, 3);
      assert.equal(calls[0].to, process.env.OVE_CONTACT_TO || 'ove.venezuela@outlook.com');
      assert.match(urls[1], /\/audiences\/test-audience\/contacts/);
      assert.equal(calls[1].email, 'visitor@example.com');
      assert.equal(calls[1].unsubscribed, false);
      assert.equal(calls[2].to, 'visitor@example.com');
      assert.match(calls[2].text, /suscripción/);
      assert.match(calls[2].text, /Anya/);
    });
    await t.test('boletin: fallo de audiencia o de bienvenida nunca rompe la suscripcion', async () => {
      failAt = 2;
      assert.equal((await invoke({form_id:'boletin',email:'visitor@example.com'})).status, 200);
      assert.equal(calls.length, 3);
      failAt = 3;
      assert.equal((await invoke({form_id:'boletin',email:'visitor@example.com'})).status, 200);
      assert.equal(calls.length, 3);
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
