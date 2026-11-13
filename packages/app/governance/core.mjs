import { createHash, createPublicKey, verify } from 'node:crypto';

export const POLICY = Object.freeze({ id: 'prawo-zero-v1', arete: 70, logos: 80, koinonia: 60 });
const deny = reason => ({ candidate: false, executionAuthorized: false, reason });

export function actionHash(actionBytes) {
  if (!Buffer.isBuffer(actionBytes)) throw new TypeError('Action must be exact bytes');
  return createHash('sha256').update(actionBytes).digest('hex');
}

// Assessment only. Durable nonce consumption and audit commit are mandatory later.
// trustedKeys and audience MUST come from server configuration, never request data.
export function assessPassport(envelope, context, trustedKeys, nowMs = Date.now()) {
  try {
    if (!context || typeof context.subject !== 'string' || !context.subject ||
        typeof context.audience !== 'string' || !context.audience ||
        !/^[a-f0-9]{64}$/.test(context.actionHash ?? '')) return deny('invalid_context');
    if (!Number.isSafeInteger(nowMs)) return deny('invalid_clock');
    if (!envelope || typeof envelope.keyId !== 'string' ||
        typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string') return deny('invalid_envelope');
    if (envelope.payload.length > 16384 || !/^[A-Za-z0-9_-]+$/.test(envelope.payload) ||
        !/^[A-Za-z0-9_-]+$/.test(envelope.signature) || envelope.signature.length > 100) return deny('invalid_encoding');
    if (!(trustedKeys instanceof Map) || !trustedKeys.has(envelope.keyId)) return deny('untrusted_issuer');
    const pem = trustedKeys.get(envelope.keyId);
    if (typeof pem !== 'string' || !pem) return deny('missing_trusted_key');
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'ed25519') return deny('wrong_key_type');
    const bytes = Buffer.from(envelope.payload, 'base64url');
    const signature = Buffer.from(envelope.signature, 'base64url');
    if (bytes.toString('base64url') !== envelope.payload || signature.toString('base64url') !== envelope.signature || signature.length !== 64) return deny('invalid_encoding');
    if (!verify(null, bytes, key, signature)) return deny('invalid_signature');
    const passport = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!passport || passport.domain !== 'AGT-GOVERNANCE-PASSPORT-v1' || passport.policyId !== POLICY.id) return deny('policy_mismatch');
    if (passport.subject !== context.subject || passport.audience !== context.audience || passport.actionHash !== context.actionHash) return deny('binding_mismatch');
    if (!Number.isSafeInteger(passport.issuedAt) || !Number.isSafeInteger(passport.expiresAt) ||
        passport.issuedAt > nowMs || passport.expiresAt <= nowMs ||
        passport.expiresAt <= passport.issuedAt || passport.expiresAt - passport.issuedAt > 900000) return deny('invalid_validity');
    if (typeof passport.nonce !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(passport.nonce)) return deny('invalid_nonce');
    const scores = passport.scores;
    for (const metric of ['arete', 'logos', 'koinonia']) {
      const value = scores?.[metric];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) return deny('invalid_scores');
      if (value < POLICY[metric]) return deny('threshold_failed');
    }
    return {
      candidate: true, executionAuthorized: false, reason: 'durable_authorization_required',
      policyId: POLICY.id, issuerKeyId: envelope.keyId, subject: passport.subject,
      audience: passport.audience, actionHash: passport.actionHash, nonce: passport.nonce,
      expiresAt: passport.expiresAt, scores: { arete: scores.arete, logos: scores.logos, koinonia: scores.koinonia },
      passportHash: createHash('sha256').update(bytes).digest('hex')
    };
  } catch {
    return deny('verification_failed');
  }
}
