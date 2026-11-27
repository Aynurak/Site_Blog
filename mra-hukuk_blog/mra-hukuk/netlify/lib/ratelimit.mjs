/* Sabit pencereli hız sınırlama. Anahtar, IP veya kullanıcı adının SHA-256 özetidir;
   ham IP adresi saklanmaz (veri minimizasyonu). */
import { createHash } from 'node:crypto';
import { getStore } from './storage.mjs';

const keyFor = (bucket, id) => `rl/${bucket}/${createHash('sha256').update(String(id)).digest('hex').slice(0, 40)}`;

export async function peek(bucket, id) {
  const store = await getStore();
  const rec = await store.get(keyFor(bucket, id), { type: 'json' });
  const now = Date.now();
  if (!rec || rec.resetAt <= now) return { count: 0, resetAt: 0, blockedUntil: 0 };
  return { count: rec.count | 0, resetAt: rec.resetAt, blockedUntil: rec.blockedUntil || 0 };
}

/* Bir olayı sayar; limit aşılırsa blockMs boyunca engeller */
export async function hit(bucket, id, { limit, windowMs, blockMs }) {
  const store = await getStore();
  const key = keyFor(bucket, id);
  const now = Date.now();
  let rec = await store.get(key, { type: 'json' });
  if (!rec || rec.resetAt <= now) rec = { count: 0, resetAt: now + windowMs, blockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= limit) {
    rec.blockedUntil = now + (blockMs || windowMs);
    rec.resetAt = Math.max(rec.resetAt, rec.blockedUntil);
  }
  await store.setJSON(key, rec);
  return rec;
}

export async function clear(bucket, id) {
  const store = await getStore();
  await store.delete(keyFor(bucket, id));
}

export function retryAfter(rec) {
  return rec && rec.blockedUntil > Date.now() ? Math.ceil((rec.blockedUntil - Date.now()) / 1000) : 0;
}
