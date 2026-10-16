import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contact.js';

// Stub the provider: these tests never send mail or require real credentials.
test('contact acknowledgement behavior', async t => {
  const originalFetch = globalThis.fetch;
  const saved = { ...process.env };
  process.env.RESEND_API_KEY = 'test-only';
  delete process.env.OVE_SMTP_USER;
  delete process.env.OUTLOOK_SMTP_USER;
  let calls;
  let failAt;
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return { ok: calls.length !== failAt, status: 503, text: async () => 'test failure' };
  };
  const invoke = async (body) => {
    calls = [];
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
    await t.test('newsletter does not receive contact acknowledgement', async () => {
      assert.equal((await invoke({form_id:'boletin',email:'visitor@example.com'})).status, 200);
      assert.equal(calls.length, 1);
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
