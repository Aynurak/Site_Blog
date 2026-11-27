/* /api/requests — yalnızca yönetici
   GET    — talepleri listeler (90 günden eski olanlar otomatik silinir)
   PATCH  — okundu bilgisini değiştirir { id, read }
   DELETE — talebi kalıcı olarak siler { id } */
import { getConfig } from '../lib/config.mjs';
import { json, fail, readJson, assertSameOrigin, handler, methodNotAllowed } from '../lib/http.mjs';
import { requireAdmin } from '../lib/auth.mjs';
import { getStore } from '../lib/storage.mjs';
import { SCHEMA } from '../lib/content.mjs';

async function load(store) {
  const raw = (await store.get('requests', { type: 'json' })) || [];
  const list = SCHEMA.freshRequests(raw);
  if (list.length !== (Array.isArray(raw) ? raw.length : 0)) await store.setJSON('requests', list);
  return list;
}

export default handler(async req => {
  const cfg = getConfig();
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) return methodNotAllowed(['GET', 'PATCH', 'DELETE']);
  if (req.method !== 'GET') assertSameOrigin(req, cfg);
  await requireAdmin(req, cfg);
  const store = await getStore();
  const list = await load(store);

  if (req.method === 'GET') return json({ requests: list });

  const body = await readJson(req, 1024);
  const id = SCHEMA.id(body.id);
  const idx = id ? list.findIndex(r => r.id === id) : -1;
  if (idx < 0) return fail(404, 'Kayıt bulunamadı.');
  if (req.method === 'PATCH') list[idx].read = body.read === true;
  else list.splice(idx, 1);
  await store.setJSON('requests', list);
  return json({ ok: true });
}, 'requests');

export const config = { path: '/api/requests' };
