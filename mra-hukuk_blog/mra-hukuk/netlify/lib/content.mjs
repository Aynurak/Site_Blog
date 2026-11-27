/* İçerik deposu: ortak şema (js/schema.js) ile doğrulanmış içerik ve sürüm numarası.
   Varsayılan içerik js/data.js'ten gelir; böylece istemci ve sunucu aynı kaynaktan beslenir. */
import '../../public/js/schema.js';
import '../../public/js/data.js';
import { getStore } from './storage.mjs';

export const SCHEMA = globalThis.MRA_SCHEMA;
const DEFAULTS = () => JSON.parse(JSON.stringify(globalThis.MRA.DEFAULTS));

export async function loadContent() {
  const store = await getStore();
  const rec = await store.get('content', { type: 'json' });
  const content = SCHEMA.content(rec && rec.content, DEFAULTS());
  return { content, rev: rec && Number.isInteger(rec.rev) ? rec.rev : 0, updatedAt: rec && rec.updatedAt || null };
}

export async function saveContent(next, baseRev, user) {
  const store = await getStore();
  const current = await loadContent();
  if (Number.isInteger(baseRev) && baseRev !== current.rev) return { conflict: true, current };
  const content = SCHEMA.content(next, DEFAULTS());
  const rec = { content, rev: current.rev + 1, updatedAt: new Date().toISOString(), updatedBy: user };
  await store.setJSON('content-previous', { content: current.content, rev: current.rev, updatedAt: current.updatedAt });
  await store.setJSON('content', rec);
  return { content, rev: rec.rev, updatedAt: rec.updatedAt };
}
