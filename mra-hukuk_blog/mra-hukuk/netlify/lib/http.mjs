/* HTTP yardımcıları: JSON yanıtlar, güvenli başlıklar, gövde boyutu sınırı,
   köken (Origin) doğrulaması ve sade hata mesajları. */

const API_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

export function json(data, status = 200, extra = {}) {
  const headers = new Headers({ ...API_HEADERS, ...extra });
  return new Response(JSON.stringify(data), { status, headers });
}

export const GENERIC_ERROR = 'İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.';

export function fail(status, message, extra) {
  return json({ error: message || GENERIC_ERROR, ...(extra || {}) }, status);
}

/* Beklenmeyen hatalar: ayrıntı yalnızca sunucu günlüğüne, istemciye genel mesaj */
export function internal(err, where) {
  console.error(`[mra-api] ${where || 'hata'}:`, err && err.stack ? err.stack : err);
  return fail(500, GENERIC_ERROR);
}

export function methodNotAllowed(allowed) {
  return json({ error: 'Bu işlem desteklenmiyor.' }, 405, { Allow: allowed.join(', ') });
}

export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}

/* JSON gövdesini boyut sınırıyla okur; tür ve biçim hatalarında 4xx döner */
export async function readJson(req, maxBytes) {
  const type = (req.headers.get('content-type') || '').toLowerCase();
  if (!type.startsWith('application/json')) throw new HttpError(415, 'İstek biçimi desteklenmiyor.');
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared && declared > maxBytes) throw new HttpError(413, 'İstek çok büyük.');
  const reader = req.body && req.body.getReader ? req.body.getReader() : null;
  let text = '';
  if (reader) {
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { try { await reader.cancel(); } catch (e) { } throw new HttpError(413, 'İstek çok büyük.'); }
      chunks.push(value);
    }
    text = new TextDecoder().decode(chunks.length === 1 ? chunks[0] : concat(chunks, size));
  } else {
    text = await req.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) throw new HttpError(413, 'İstek çok büyük.');
  }
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('not object');
    return data;
  } catch (e) { throw new HttpError(400, 'İstek okunamadı.'); }
}

function concat(chunks, size) {
  const out = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.byteLength; }
  return out;
}

/* Durum değiştiren isteklerde CSRF savunması: SameSite=Strict çereze ek olarak
   Origin/Sec-Fetch-Site başlığı ve özel istek başlığı zorunlu */
export function assertSameOrigin(req, cfg) {
  const url = new URL(req.url);
  const expected = cfg.siteOrigin || url.origin;
  const origin = req.headers.get('origin');
  const site = req.headers.get('sec-fetch-site');
  if (origin && origin !== expected && origin !== url.origin) throw new HttpError(403, 'Bu istek kabul edilmedi.');
  if (!origin && site && site !== 'same-origin') throw new HttpError(403, 'Bu istek kabul edilmedi.');
  if (req.headers.get('x-requested-with') !== 'mra') throw new HttpError(403, 'Bu istek kabul edilmedi.');
}

export function clientIp(req, context) {
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return String(ip || 'unknown').slice(0, 64);
}

/* Tek noktadan hata yakalama: HttpError → kontrollü yanıt, diğerleri → genel 500 */
export function handler(fn, where) {
  return async (req, context) => {
    try { return await fn(req, context); }
    catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.message, e.extra);
      return internal(e, where);
    }
  };
}
