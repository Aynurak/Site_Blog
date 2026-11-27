/* /api/content
   GET  — herkese açık: doğrulanmış site içeriği
   PUT  — yalnızca yönetici: içerik şema ile doğrulanır, sürüm çakışması kontrol edilir */
import { getConfig } from '../lib/config.mjs';
import { json, fail, readJson, assertSameOrigin, handler, methodNotAllowed } from '../lib/http.mjs';
import { requireAdmin } from '../lib/auth.mjs';
import { loadContent, saveContent } from '../lib/content.mjs';

const MAX_BODY = 2.5 * 1024 * 1024;

export default handler(async req => {
  if (req.method === 'GET') {
    const { content, rev } = await loadContent();
    return json({ content, rev }, 200, { 'Cache-Control': 'no-cache' });
  }
  if (req.method !== 'PUT') return methodNotAllowed(['GET', 'PUT']);

  const cfg = getConfig();
  assertSameOrigin(req, cfg);
  const session = await requireAdmin(req, cfg);
  const body = await readJson(req, MAX_BODY);
  if (!body.content || typeof body.content !== 'object') return fail(400, 'İçerik okunamadı.');
  const baseRev = Number.isInteger(body.baseRev) ? body.baseRev : undefined;

  const res = await saveContent(body.content, baseRev, session.sub);
  if (res.conflict) return fail(409, 'İçerik başka bir oturumda değiştirilmiş. Sayfayı yenileyip tekrar deneyin.', { rev: res.current.rev });
  return json({ content: res.content, rev: res.rev, updatedAt: res.updatedAt });
}, 'content');

export const config = { path: '/api/content' };
