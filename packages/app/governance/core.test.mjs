import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { assessPassport, actionHash } from './core.mjs';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const keys = new Map([['issuer-test', publicKey.export({ type: 'spki', format: 'pem' })]]);
const now = 1800000000000;
const context = { subject: 'agent-test', audience: 'agt-test', actionHash: actionHash(Buffer.from('test-action')) };
function signed(changes = {}) {
  const bytes = Buffer.from(JSON.stringify({
    domain: 'AGT-GOVERNANCE-PASSPORT-v1', policyId: 'prawo-zero-v1',
    ...context, issuedAt: now - 1000, expiresAt: now + 60000,
    nonce: '0123456789abcdef0123456789abcdef',
    scores: { arete: 70, logos: 80, koinonia: 60 }, ...changes
  }));
  return { keyId: 'issuer-test', payload: bytes.toString('base64url'), signature: sign(null, bytes, privateKey).toString('base64url') };
}

test('exact thresholds create only a candidate, never execution approval', () => {
  const result = assessPassport(signed(), context, keys, now);
  assert.equal(result.candidate, true);
  assert.equal(result.executionAuthorized, false);
});
test('each threshold independently blocks', () => {
  for (const [metric, value] of Object.entries({ arete: 69, logos: 79, koinonia: 59 })) {
    const result = assessPassport(signed({ scores: { arete: 100, logos: 100, koinonia: 100, [metric]: value } }), context, keys, now);
    assert.equal(result.candidate, false);
  }
});
test('no trusted key means denial', () => {
  assert.equal(assessPassport(signed(), context, new Map(), now).candidate, false);
  assert.equal(assessPassport(signed(), context, new Map([['issuer-test', '']]), now).candidate, false);
});
test('tampered signature is denied', () => {
  const envelope = signed();
  const sig = Buffer.from(envelope.signature, 'base64url');
  sig[0] ^= 1;
  envelope.signature = sig.toString('base64url');
  assert.equal(assessPassport(envelope, context, keys, now).candidate, false);
});
test('subject, audience and action are bound', () => {
  for (const changed of [{ subject: 'other' }, { audience: 'other' }, { actionHash: '0'.repeat(64) }]) {
    assert.equal(assessPassport(signed(changed), context, keys, now).candidate, false);
  }
});
test('expired, future and excessive validity are denied', () => {
  for (const changed of [{ expiresAt: now }, { issuedAt: now + 1 }, { expiresAt: now + 900001 }]) {
    assert.equal(assessPassport(signed(changed), context, keys, now).candidate, false);
  }
});
test('missing scores and out-of-range values are denied', () => {
  for (const scores of [null, {}, { arete: 101, logos: 100, koinonia: 100 }, { arete: '100', logos: 100, koinonia: 100 }]) {
    assert.equal(assessPassport(signed({ scores }), context, keys, now).candidate, false);
  }
});
test('wrong policy and malformed envelopes are denied', () => {
  assert.equal(assessPassport(signed({ policyId: 'other' }), context, keys, now).candidate, false);
  for (const envelope of [null, {}, { keyId: 'issuer-test', payload: '!', signature: '!' }]) {
    assert.equal(assessPassport(envelope, context, keys, now).candidate, false);
  }
});
test('replay protection is explicitly NOT provided by assessment', () => {
  const envelope = signed();
  for (let i = 0; i < 2; i++) {
    const result = assessPassport(envelope, context, keys, now);
    assert.equal(result.executionAuthorized, false);
    assert.equal(result.reason, 'durable_authorization_required');
  }
});
