/* =========================================================
   store.js — Veri katmanı
   İki kip:
   - local : sunucu yokken (prototip) veri bu tarayıcının localStorage'ında
   - remote: sunucu (Netlify Functions) varken içerik API'den gelir,
             yazma işlemleri yetkili API çağrısıyla yapılır
   Okunan her veri MRA_SCHEMA ile doğrulanır; bozuk veri varsayılana düşer.
   ========================================================= */
(function (M) {
  const KEY = 'mra-hukuk-v8';
  const SCHEMA = globalThis.MRA_SCHEMA;
  const clone = o => JSON.parse(JSON.stringify(o));
  const listeners = [];
  let mem = null;
  let ok = true;
  let mode = 'local';
  let remoteSaver = null;

  function readLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      if (raw.length > 5000000) return null;
      return JSON.parse(raw);
    } catch (e) { ok = false; return null; }
  }

  function emit(src) { listeners.forEach(fn => { try { fn(src); } catch (e) { M.reportError && M.reportError(e); } }); }

  function persistLocal() {
    if (mode !== 'local') return;
    try { localStorage.setItem(KEY, JSON.stringify(mem)); ok = true; }
    catch (e) { ok = false; }
  }

  M.store = {
    mode: () => mode,

    get() {
      if (!mem) mem = SCHEMA.state(mode === 'local' ? readLocal() : null, clone(M.DEFAULTS));
      return mem;
    },

    /* Sunucu kipine geçiş: içerik API'den gelir, localStorage kullanılmaz */
    useRemote(content, saver) {
      mode = 'remote';
      remoteSaver = saver;
      const s = SCHEMA.content(content, clone(M.DEFAULTS));
      mem = { version: 1, settings: s.settings, areas: s.areas, posts: s.posts, requests: [], auth: { user: '', hash: null } };
      emit('remote');
    },

    replaceContent(content) {
      const s = SCHEMA.content(content, clone(M.DEFAULTS));
      const cur = this.get();
      cur.settings = s.settings; cur.areas = s.areas; cur.posts = s.posts;
      emit('remote');
    },

    save(opts) {
      mem = SCHEMA.state(mem, clone(M.DEFAULTS));
      persistLocal();
      if (!(opts && opts.quiet)) emit('local');
    },

    /* fn(state) ile değiştirir. Sunucu kipinde içerik değişikliği API'ye gönderilir;
       başarısız olursa önceki içerik geri yüklenir. */
    async update(fn, opts) {
      const before = clone(this.get());
      fn(this.get());
      this.save(opts);
      if (mode === 'remote' && remoteSaver && !(opts && opts.localOnly)) {
        try {
          const saved = await remoteSaver({ settings: mem.settings, areas: mem.areas, posts: mem.posts });
          if (saved) this.replaceContent(saved);
        } catch (e) {
          mem = before;
          emit('local');
          throw e;
        }
      }
    },

    async reset() {
      const cur = this.get();
      const fresh = clone(M.DEFAULTS);
      await this.update(s => {
        s.settings = fresh.settings; s.areas = fresh.areas; s.posts = fresh.posts;
        s.auth = cur.auth; s.requests = cur.requests;
      });
    },

    exportContent() {
      const s = this.get();
      return { app: 'mra-hukuk', version: 1, exportedAt: new Date().toISOString(), settings: s.settings, areas: s.areas, posts: s.posts };
    },

    async importContent(obj) {
      if (!obj || typeof obj !== 'object' || !Array.isArray(obj.areas) || !Array.isArray(obj.posts)) {
        throw new Error('Yedek dosyası tanınmadı: "areas" ve "posts" listeleri bulunamadı.');
      }
      const c = SCHEMA.content(obj, clone(M.DEFAULTS));
      await this.update(s => { s.settings = c.settings; s.areas = c.areas; s.posts = c.posts; });
      return { areas: c.areas.length, posts: c.posts.length };
    },

    available() { this.get(); return mode === 'remote' || ok; },
    on(fn) { listeners.push(fn); }
  };

  window.addEventListener('storage', e => {
    if (mode === 'local' && e.key === KEY) { mem = null; emit('remote'); }
  });
})(window.MRA);
