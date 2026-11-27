/* Kalıcı depolama: Netlify Blobs (sunucu tarafı, ziyaretçiye kapalı).
   Netlify ortamı dışında (yerel test) yalnızca açıkça izin verilirse bellek içi depo kullanılır. */

const memory = new Map();
const memoryStore = {
  async get(key, opts) {
    if (!memory.has(key)) return null;
    const v = memory.get(key);
    return opts && opts.type === 'json' ? JSON.parse(v) : v;
  },
  async setJSON(key, value) { memory.set(key, JSON.stringify(value)); },
  async delete(key) { memory.delete(key); }
};

let cached = null;

export async function getStore() {
  if (cached) return cached;
  if (process.env.MRA_MEMORY_STORE === '1') { cached = memoryStore; return cached; }
  const { getStore: blobs } = await import('@netlify/blobs');
  const store = blobs({ name: 'mra-hukuk', consistency: 'strong' });
  cached = {
    get: (key, opts) => store.get(key, opts),
    setJSON: (key, value) => store.setJSON(key, value),
    delete: key => store.delete(key)
  };
  return cached;
}

export function resetMemoryStore() { memory.clear(); cached = null; }
