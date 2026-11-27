/* Kimlik doğrulama ve oturum
   - Parola: scrypt (N=2^15, r=8, p=1) ile özetlenmiş, ortam değişkeninde saklanır
   - Karşılaştırma: sabit süreli (timingSafeEqual)
   - Oturum: HMAC-SHA256 ile imzalanmış, süresi dolan belirteç;
     __Host- önekli, HttpOnly, Secure, SameSite=Strict çerezde taşınır
   - Çıkış: belirteç kimliği iptal listesine alınır ve çerez silinir */
import { scrypt as scryptCb, timingSafeEqual, createHmac, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { HASH_RE } from './config.mjs';
import { getStore } from './storage.mjs';
import { HttpError } from './http.mjs';

const scrypt = promisify(scryptCb);
const COOKIE = '__Host-mra_session';
const DEV_COOKIE = 'mra_session';

export async function hashPassword(password, { N = 32768, r = 8, p = 1 } = {}) {
  const salt = randomBytes(16);
  const key = await scrypt(String(password).normalize('NFKC'), salt, 64, { N, r, p, maxmem: 256 * N * r });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const m = HASH_RE.exec(String(stored || ''));
  if (!m) return false;
  const [, N, r, p, saltB64, keyB64] = m;
  const expected = Buffer.from(keyB64, 'base64');
  const n = Number(N), rr = Number(r), pp = Number(p);
  if (n < 16384 || n > 1048576 || (n & (n - 1)) !== 0 || rr < 8 || rr > 16 || pp < 1 || pp > 4) return false;
  const actual = await scrypt(String(password).normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, { N: n, r: rr, p: pp, maxmem: 256 * n * rr });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* Kullanıcı adını da sabit sürede karşılaştırır */
export function safeEqualString(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  const len = Math.max(x.length, y.length, 1);
  const xp = Buffer.alloc(len), yp = Buffer.alloc(len);
  x.copy(xp); y.copy(yp);
  return timingSafeEqual(xp, yp) && x.length === y.length;
}

const b64url = buf => Buffer.from(buf).toString('base64url');

function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

function verify(token, secret) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig || body.length > 2000) return null;
  const expected = createHmac('sha256', secret).update(body).digest();
  let given;
  try { given = Buffer.from(sig, 'base64url'); } catch (e) { return null; }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return null; }
}

export function cookieName(req) {
  return new URL(req.url).protocol === 'https:' ? COOKIE : DEV_COOKIE;
}

function readCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

export function sessionCookie(req, token, maxAgeSec) {
  const secure = new URL(req.url).protocol === 'https:';
  const name = cookieName(req);
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.max(0, Math.floor(maxAgeSec))}${secure ? '; Secure' : ''}`;
}

export function createSession(req, cfg) {
  const now = Date.now();
  const payload = { sub: cfg.username, iat: now, exp: now + cfg.sessionMs, jti: randomBytes(16).toString('hex') };
  return { token: sign(payload, cfg.sessionSecret), payload };
}

/* Geçerli oturumu döndürür; yoksa null. İptal edilmiş belirteçler reddedilir. */
export async function readSession(req, cfg) {
  const token = readCookie(req, cookieName(req));
  if (!token) return null;
  const p = verify(token, cfg.sessionSecret);
  if (!p || typeof p.exp !== 'number' || p.exp <= Date.now() || p.sub !== cfg.username || !/^[a-f0-9]{32}$/.test(p.jti || '')) return null;
  const store = await getStore();
  if (await store.get(`revoked/${p.jti}`)) return null;
  return p;
}

export async function revokeSession(session) {
  if (!session) return;
  const store = await getStore();
  await store.setJSON(`revoked/${session.jti}`, { exp: session.exp });
}

/* Yazma uç noktaları için zorunlu yetki kontrolü */
export async function requireAdmin(req, cfg) {
  if (!cfg.ok) throw new HttpError(503, 'Yönetim hizmeti şu anda kullanılamıyor.');
  const s = await readSession(req, cfg);
  if (!s) throw new HttpError(401, 'Bu işlem için giriş yapmanız gerekiyor.');
  return s;
}
