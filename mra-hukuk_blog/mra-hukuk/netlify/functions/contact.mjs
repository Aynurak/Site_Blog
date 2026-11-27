/* POST /api/contact — ziyaretçi görüşme talebi
   Savunmalar: köken kontrolü, 8 KB gövde sınırı, tuzak alan (honeypot), minimum doldurma süresi,
   IP bazlı hız sınırı, şema doğrulaması, veri minimizasyonu (yalnızca gerekli alanlar, 90 gün saklama). */
import { randomBytes } from 'node:crypto';
import { getConfig } from '../lib/config.mjs';
import { json, fail, readJson, assertSameOrigin, clientIp, handler, methodNotAllowed } from '../lib/http.mjs';
import { hit, peek, retryAfter } from '../lib/ratelimit.mjs';
import { getStore } from '../lib/storage.mjs';
import { SCHEMA } from '../lib/content.mjs';

const LIMIT = { limit: 5, windowMs: 60 * 60e3, blockMs: 60 * 60e3 };

export default handler(async (req, context) => {
  if (req.method !== 'POST') return methodNotAllowed(['POST']);
  const cfg = getConfig();
  assertSameOrigin(req, cfg);
  const ip = clientIp(req, context);

  const state = await peek('contact-ip', ip);
  if (retryAfter(state)) return fail(429, 'Kısa sürede çok sayıda mesaj gönderildi. Lütfen daha sonra tekrar deneyin.', { retryAfter: retryAfter(state) });

  const body = await readJson(req, 8 * 1024);
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true });
  if (!(Number(body.elapsed) >= 3000)) return fail(400, 'Lütfen formu doldurduktan sonra tekrar gönderin.');

  const r = SCHEMA.contactInput(body);
  if (!r.ok) return fail(422, r.errors[0]);

  await hit('contact-ip', ip, LIMIT);
  const store = await getStore();
  const list = SCHEMA.freshRequests((await store.get('requests', { type: 'json' })) || []);
  list.unshift({ id: randomBytes(9).toString('base64url'), at: Date.now(), read: false, ...r.data });
  await store.setJSON('requests', list.slice(0, SCHEMA.LIMITS.requests));
  return json({ ok: true }, 201);
}, 'contact');

export const config = { path: '/api/contact' };
