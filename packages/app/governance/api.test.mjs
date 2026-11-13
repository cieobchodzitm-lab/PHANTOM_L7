import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import handler from '../api/governance.mjs';
import { actionHash } from './core.mjs';

const pair = generateKeyPairSync('ed25519');
const publicPem = pair.publicKey.export({ type: 'spki', format: 'pem' });
const names = ['GOVERNANCE_SUPABASE_URL', 'GOVERNANCE_SUPABASE_PUBLISHABLE_KEY', 'GOVERNANCE_AUDIENCE', 'GOVERNANCE_ALLOWED_SUBJECTS', 'GOVERNANCE_ISSUER_PUBLIC_KEYS_JSON'];
function configure() {
  const values = ['https://example.supabase.co', 'public-test-key', 'agt-api-test', 'test-subject', JSON.stringify({ issuer: publicPem })];
  names.forEach((name, index) => { process.env[name] = values[index]; });
}
function envelope(changes = {}) {
  const now = Date.now();
  const bytes = Buffer.from(JSON.stringify({
    domain: 'AGT-GOVERNANCE-PASSPORT-v1', policyId: 'prawo-zero-v1',
    subject: 'test-subject', audience: 'agt-api-test', actionHash: actionHash(Buffer.from('test-action')),
    issuedAt: now - 1000, expiresAt: now + 60000, nonce: '0123456789abcdef0123456789abcdef',
    scores: { arete: 70, logos: 80, koinonia: 60 }, ...changes
  }));
  return { keyId: 'issuer', payload: bytes.toString('base64url'), signature: sign(null, bytes, pair.privateKey).toString('base64url') };
}
async function call(overrides = {}) {
  const req = { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' }, body: { action: 'test-action', envelope: envelope() }, ...overrides };
  const res = { headers: {}, code: 0, body: null, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await handler(req, res);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  return res;
}

test('authenticated API contract with mocked Supabase', async t => {
  const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const mockUser = (status = 200, user = { id: 'test-subject', is_anonymous: false }) => {
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(String(url), 'https://example.supabase.co/auth/v1/user');
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      return new Response(JSON.stringify(user), { status, headers: { 'content-type': 'application/json' } });
    };
  };
  try {
    configure();
    mockUser();
    await t.test('GET rejected', async () => { assert.equal((await call({ method: 'GET' })).code, 405); });
    await t.test('non-JSON rejected', async () => { assert.equal((await call({ headers: {} })).code, 415); });
    await t.test('missing configuration fails closed without auth call', async () => {
      delete process.env.GOVERNANCE_ALLOWED_SUBJECTS;
      const before = calls;
      const res = await call();
      assert.equal(res.code, 503);
      assert.equal(res.body.error, 'governance_not_configured');
      assert.equal(calls, before);
      configure();
    });
    await t.test('missing bearer rejected without auth call', async () => {
      const before = calls;
      assert.equal((await call({ headers: { 'content-type': 'application/json' } })).code, 401);
      assert.equal(calls, before);
    });
    await t.test('invalid session rejected', async () => { mockUser(401, {}); assert.equal((await call()).code, 401); });
    await t.test('subject outside allowlist rejected', async () => { mockUser(200, { id: 'other' }); assert.equal((await call()).code, 403); });
    await t.test('anonymous user rejected', async () => { mockUser(200, { id: 'test-subject', is_anonymous: true }); assert.equal((await call()).code, 403); });
    await t.test('auth network failure fails closed', async () => {
      globalThis.fetch = async () => { throw new Error('simulated failure'); };
      const res = await call();
      assert.equal(res.code, 503);
      assert.equal(res.body.executionAuthorized, false);
    });
    await t.test('malformed and oversized requests rejected', async () => {
      mockUser();
      assert.equal((await call({ body: '{' })).code, 400);
      assert.equal((await call({ body: { action: 'x'.repeat(33000) } })).code, 413);
    });
    await t.test('passport bound to another subject rejected', async () => {
      assert.equal((await call({ body: { action: 'test-action', envelope: envelope({ subject: 'other' }) } })).code, 403);
    });
    await t.test('valid assessment never authorizes execution', async () => {
      const res = await call();
      assert.equal(res.code, 200);
      assert.equal(res.body.candidate, true);
      for (const field of ['executionAuthorized', 'auditPersisted', 'nonceConsumed', 'blockchainSubmitted']) assert.equal(res.body[field], false);
    });
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name]; }
  }
});
