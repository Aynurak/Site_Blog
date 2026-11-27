/* POST /api/auth/login — yönetici girişi
   Savunmalar: köken kontrolü, gövde boyutu sınırı, IP ve kullanıcı adı bazlı deneme sınırlama,
   sabit süreli karşılaştırma, tek tip hata mesajı, HttpOnly/SameSite=Strict oturum çerezi. */
import { getConfig } from '../lib/config.mjs';
import { json, fail, readJson, assertSameOrigin, clientIp, handler, methodNotAllowed } from '../lib/http.mjs';
import { verifyPassword, safeEqualString, createSession, sessionCookie } from '../lib/auth.mjs';
import { hit, peek, clear, retryAfter } from '../lib/ratelimit.mjs';

const IP_LIMIT = { limit: 10, windowMs: 15 * 60e3, blockMs: 30 * 60e3 };
const USER_LIMIT = { limit: 5, windowMs: 15 * 60e3, blockMs: 15 * 60e3 };
const LOCKED = 'Çok sayıda hatalı deneme. Lütfen bir süre sonra tekrar deneyin.';
const WRONG = 'Kullanıcı adı veya şifre hatalı.';

export default handler(async (req, context) => {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);
  const cfg = getConfig();
  if (!cfg.ok) return fail(503, 'Yönetim hizmeti şu anda kullanılamıyor.');
  assertSameOrigin(req, cfg);

  const ip = clientIp(req, context);
  const body = await readJson(req, 2048);
  const username = typeof body.username === 'string' ? body.username.trim().slice(0, 60) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';

  const [ipState, userState] = await Promise.all([peek('login-ip', ip), peek('login-user', username.toLowerCase())]);
  const wait = Math.max(retryAfter(ipState), retryAfter(userState));
  if (wait) return fail(429, LOCKED, { retryAfter: wait });

  const userOk = safeEqualString(username, cfg.username);
  const passOk = await verifyPassword(password, cfg.passwordHash);
  if (!(userOk && passOk)) {
    const [a, b] = await Promise.all([hit('login-ip', ip, IP_LIMIT), hit('login-user', username.toLowerCase(), USER_LIMIT)]);
    await new Promise(r => setTimeout(r, 300 + Math.floor(Math.random() * 400)));
    const ra = Math.max(retryAfter(a), retryAfter(b));
    return ra ? fail(429, LOCKED, { retryAfter: ra }) : fail(401, WRONG);
  }

  await Promise.all([clear('login-ip', ip), clear('login-user', username.toLowerCase())]);
  const { token, payload } = createSession(req, cfg);
  return json(
    { service: 'mra-api', authenticated: true, user: payload.sub, expiresAt: payload.exp },
    200,
    { 'Set-Cookie': sessionCookie(req, token, cfg.sessionMs / 1000) }
  );
}, 'auth-login');

export const config = { path: '/api/auth/login' };
