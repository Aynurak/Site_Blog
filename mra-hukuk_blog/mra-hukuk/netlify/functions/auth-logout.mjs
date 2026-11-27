/* POST /api/auth/logout — oturumu iptal eder ve çerezi siler */
import { getConfig } from '../lib/config.mjs';
import { json, assertSameOrigin, handler, methodNotAllowed } from '../lib/http.mjs';
import { readSession, revokeSession, sessionCookie } from '../lib/auth.mjs';

export default handler(async req => {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);
  const cfg = getConfig();
  if (cfg.ok) {
    assertSameOrigin(req, cfg);
    await revokeSession(await readSession(req, cfg));
  }
  return json({ service: 'mra-api', authenticated: false }, 200, { 'Set-Cookie': sessionCookie(req, '', 0) });
}, 'auth-logout');

export const config = { path: '/api/auth/logout' };
