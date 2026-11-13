import { assessPassport, actionHash } from '../governance/core.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status, body) => res.status(status).json(body);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { error: 'method_not_allowed' }); }
  if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) return reply(415, { error: 'json_required' });
  try {
    const url = process.env.GOVERNANCE_SUPABASE_URL;
    const publishableKey = process.env.GOVERNANCE_SUPABASE_PUBLISHABLE_KEY;
    const audience = process.env.GOVERNANCE_AUDIENCE;
    const allowed = new Set((process.env.GOVERNANCE_ALLOWED_SUBJECTS ?? '').split(',').map(x => x.trim()).filter(Boolean));
    const keyConfig = JSON.parse(process.env.GOVERNANCE_ISSUER_PUBLIC_KEYS_JSON ?? '{}');
    const trustedKeys = new Map(Object.entries(keyConfig));
    if (!url || !publishableKey || !audience || !allowed.size || !trustedKeys.size) return reply(503, { error: 'governance_not_configured' });
    const authUrl = new URL(url);
    if (authUrl.protocol !== 'https:' || authUrl.username || authUrl.password || authUrl.search || authUrl.hash || !['', '/'].includes(authUrl.pathname)) return reply(503, { error: 'invalid_server_configuration' });
    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9._~-]+$/.test(authorization) || authorization.length > 16384) return reply(401, { error: 'authentication_required' });
    const authResponse = await fetch(new URL('/auth/v1/user', authUrl), {
      headers: { apikey: publishableKey, Authorization: authorization },
      signal: AbortSignal.timeout(5000), redirect: 'error'
    });
    if (authResponse.status === 401 || authResponse.status === 403) return reply(401, { error: 'invalid_session' });
    if (!authResponse.ok) return reply(503, { error: 'authentication_unavailable' });
    const user = await authResponse.json();
    if (typeof user.id !== 'string' || !allowed.has(user.id) || user.is_anonymous === true) return reply(403, { error: 'subject_not_allowed' });
    let body = req.body;
    if (Buffer.isBuffer(body)) body = body.toString('utf8');
    if (typeof body === 'string') {
      if (Buffer.byteLength(body) > 32768) return reply(413, { error: 'body_too_large' });
      try { body = JSON.parse(body); } catch { return reply(400, { error: 'invalid_json' }); }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, { error: 'invalid_request' });
    if (Buffer.byteLength(JSON.stringify(body)) > 32768) return reply(413, { error: 'body_too_large' });
    if (typeof body.action !== 'string' || !body.action.trim() || Buffer.byteLength(body.action) > 8192) return reply(400, { error: 'invalid_action' });
    const result = assessPassport(body.envelope, {
      subject: user.id, audience, actionHash: actionHash(Buffer.from(body.action, 'utf8'))
    }, trustedKeys);
    return reply(result.candidate ? 200 : 403, {
      candidate: result.candidate, executionAuthorized: false, reason: result.reason,
      policyId: result.policyId ?? null,
      auditPersisted: false, nonceConsumed: false, blockchainSubmitted: false
    });
  } catch {
    return reply(503, { error: 'assessment_unavailable', executionAuthorized: false });
  }
}
