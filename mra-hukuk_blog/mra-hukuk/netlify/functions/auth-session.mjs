/* GET /api/auth/session — oturum durumu (istemci sunucu kipini bu uç noktayla algılar).
   Yapılandırma ayrıntısı sızdırılmaz; yalnızca hizmetin kullanılabilirliği bildirilir. */
import { getConfig } from '../lib/config.mjs';
import { json, handler, methodNotAllowed } from '../lib/http.mjs';
import { readSession } from '../lib/auth.mjs';

export default handler(async req => {
  if (req.method !== 'GET') return methodNotAllowed(['GET']);
  const cfg = getConfig();
  if (!cfg.ok) {
    console.error('[mra-api] Eksik veya geçersiz ortam değişkenleri:', cfg.problems.join(', '));
    return json({ service: 'mra-api', authenticated: false, adminAvailable: false });
  }
  const s = await readSession(req, cfg);
  return json(s
    ? { service: 'mra-api', authenticated: true, user: s.sub, expiresAt: s.exp, adminAvailable: true }
    : { service: 'mra-api', authenticated: false, adminAvailable: true });
}, 'auth-session');

export const config = { path: '/api/auth/session' };
