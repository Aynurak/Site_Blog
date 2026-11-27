/* =========================================================
   backend.js — Servis katmanı ve kimlik doğrulama
   remote kip (sunucu var):
     - Oturum HttpOnly + Secure + SameSite=Strict çerezde; JS erişemez
     - Yazma işlemleri yalnızca yetkili API çağrılarıyla yapılır
     - Parola doğrulama, deneme sınırlama ve yetki kontrolü sunucuda
   local kip (sunucu yok, prototip):
     - Parola PBKDF2-SHA256 (210.000 tur, rastgele tuz) ile özetlenir
     - Başarısız denemelerde artan bekleme süresi, tarayıcı kapanana kadar sürer
     - Oturum sessionStorage'da, 30 dk hareketsizlik / 2 sa mutlak süre sonunda biter
     - Bu kip yalnızca önizleme ve deneme içindir; gerçek koruma sunucu kipindedir
   ========================================================= */
(function (M) {
  const SCHEMA = globalThis.MRA_SCHEMA;
  const API = '/api';
  const SESSION_KEY = 'mra-admin-session';
  const LOCK_KEY = 'mra-admin-lock';
  const IDLE_MS = 30 * 60 * 1000;
  const ABSOLUTE_MS = 2 * 60 * 60 * 1000;
  const PBKDF2_ITER = 210000;
  let remote = false;
  let remoteSession = null;

  class ApiError extends Error {
    constructor(message, status, extra) { super(message); this.status = status; Object.assign(this, extra || {}); }
  }

  /* Sunucuya istek: JSON, aynı köken, zaman aşımı, sade hata mesajı */
  async function call(path, opts) {
    const o = opts || {};
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), o.timeout || 12000);
    try {
      const res = await fetch(API + path, {
        method: o.method || 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: o.body ? { 'Content-Type': 'application/json', 'X-Requested-With': 'mra' } : { 'X-Requested-With': 'mra' },
        body: o.body ? JSON.stringify(o.body) : undefined,
        signal: ctrl.signal
      });
      let data = null;
      const type = res.headers.get('content-type') || '';
      if (type.includes('application/json')) { try { data = await res.json(); } catch (e) { data = null; } }
      if (!res.ok) {
        const msg = data && typeof data.error === 'string' ? data.error.slice(0, 300) : 'İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.';
        throw new ApiError(msg, res.status, { retryAfter: data && +data.retryAfter || 0 });
      }
      return data;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.', 0);
    } finally { clearTimeout(timer); }
  }

  /* ---------- Yerel (prototip) kimlik doğrulama ---------- */
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  async function pbkdf2(pass, salt, iter) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
    return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
  }
  async function makeHash(pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return `pbkdf2$${PBKDF2_ITER}$${b64(salt)}$${b64(await pbkdf2(pass, salt, PBKDF2_ITER))}`;
  }
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let r = 0;
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }
  async function verifyHash(pass, stored) {
    const parts = String(stored || '').split('$');
    if (parts[0] !== 'pbkdf2' || parts.length !== 4) return false;
    const iter = Math.min(Math.max(parseInt(parts[1], 10) || 0, 100000), 1000000);
    try { return safeEqual(b64(await pbkdf2(pass, unb64(parts[2]), iter)), parts[3]); }
    catch (e) { return false; }
  }

  function readJSON(store, key) { try { return JSON.parse(store.getItem(key) || 'null'); } catch (e) { return null; } }
  function writeJSON(store, key, val) { try { val == null ? store.removeItem(key) : store.setItem(key, JSON.stringify(val)); } catch (e) { } }

  function lockInfo() {
    const v = readJSON(localStorage, LOCK_KEY) || {};
    return { fails: Math.min(+v.fails || 0, 50), until: +v.until || 0 };
  }
  function registerFail() {
    const l = lockInfo();
    l.fails += 1;
    if (l.fails >= 5) l.until = Date.now() + Math.min(15 * 60e3, 30e3 * 2 ** (l.fails - 5));
    writeJSON(localStorage, LOCK_KEY, l);
    return l;
  }

  function randomToken() { return b64(crypto.getRandomValues(new Uint8Array(24))); }

  function localSession() {
    const s = readJSON(sessionStorage, SESSION_KEY);
    if (!s || typeof s.token !== 'string' || !s.start || !s.seen) return null;
    const now = Date.now();
    if (now - s.start > ABSOLUTE_MS || now - s.seen > IDLE_MS) { writeJSON(sessionStorage, SESSION_KEY, null); return null; }
    return s;
  }

  const localAuth = {
    mode: 'local',
    demo: () => !M.store.get().auth.hash,
    isAuthed() {
      const s = localSession();
      if (s) { s.seen = Date.now(); writeJSON(sessionStorage, SESSION_KEY, s); }
      return !!s;
    },
    async login(user, pass) {
      const l = lockInfo();
      if (Date.now() < l.until) return { ok: false, error: 'Çok sayıda hatalı deneme. Lütfen bir süre sonra tekrar deneyin.', retryAfter: Math.ceil((l.until - Date.now()) / 1000) };
      const a = M.store.get().auth;
      const u = String(user || '').trim();
      let good = false;
      if (u === a.user) good = a.hash ? await verifyHash(pass, a.hash) : safeEqual(String(pass), M.DEMO.pass);
      if (!good) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
        const n = registerFail();
        return { ok: false, error: 'Kullanıcı adı veya şifre hatalı.', retryAfter: n.until > Date.now() ? Math.ceil((n.until - Date.now()) / 1000) : 0 };
      }
      writeJSON(localStorage, LOCK_KEY, null);
      const now = Date.now();
      writeJSON(sessionStorage, SESSION_KEY, { token: randomToken(), start: now, seen: now });
      return { ok: true };
    },
    async logout() { writeJSON(sessionStorage, SESSION_KEY, null); },
    async changeCredentials(cur, newUser, newPass) {
      const a = M.store.get().auth;
      const valid = a.hash ? await verifyHash(cur, a.hash) : safeEqual(String(cur), M.DEMO.pass);
      if (!valid) return { ok: false, error: 'Mevcut şifre hatalı.' };
      const pw = strongPassword(newPass);
      if (pw) return { ok: false, error: pw };
      const user = SCHEMA.str(newUser, 40);
      if (!/^[a-zA-Z0-9._-]{3,40}$/.test(user)) return { ok: false, error: 'Kullanıcı adı 3–40 karakter olmalı; yalnızca harf, rakam, nokta, tire ve alt çizgi içerebilir.' };
      const hash = await makeHash(newPass);
      await M.store.update(s => { s.auth = { user, hash }; });
      return { ok: true };
    }
  };

  function strongPassword(p) {
    const s = String(p || '');
    if (s.length < 12) return 'Yeni şifre en az 12 karakter olmalıdır.';
    const kinds = [/[a-zçğıöşü]/, /[A-ZÇĞİÖŞÜ]/, /\d/, /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/].filter(r => r.test(s)).length;
    if (kinds < 3) return 'Yeni şifre büyük harf, küçük harf, rakam ve sembolden en az üçünü içermelidir.';
    if (/^(.)\1+$/.test(s) || /akbulut|admin|parola|sifre|şifre|123456/i.test(s)) return 'Lütfen tahmin edilmesi zor bir şifre seçin.';
    return '';
  }

  /* ---------- Sunucu kimlik doğrulama ---------- */
  const remoteAuth = {
    mode: 'remote',
    demo: () => false,
    isAuthed() { return !!(remoteSession && remoteSession.authenticated && remoteSession.expiresAt > Date.now()); },
    async refresh() {
      try { remoteSession = await call('/auth/session'); } catch (e) { remoteSession = null; }
      return this.isAuthed();
    },
    async login(user, pass) {
      try {
        remoteSession = await call('/auth/login', { method: 'POST', body: { username: String(user || '').slice(0, 60), password: String(pass || '').slice(0, 200) } });
        return { ok: true };
      } catch (e) { return { ok: false, error: e.message, retryAfter: e.retryAfter || 0 }; }
    },
    async logout() {
      try { await call('/auth/logout', { method: 'POST', body: {} }); } catch (e) { }
      remoteSession = null;
    },
    async changeCredentials() { return { ok: false, error: 'Sunucu kipinde giriş bilgileri hosting panelindeki ortam değişkenlerinden yönetilir.' }; }
  };

  /* ---------- Talepler ---------- */
  const localRequests = {
    async submit(input) {
      const r = SCHEMA.contactInput(input);
      if (!r.ok) return { ok: false, error: r.errors[0] };
      const recent = M.store.get().requests.filter(x => x.at > Date.now() - 10 * 60e3).length;
      if (recent >= 3) return { ok: false, error: 'Kısa sürede çok sayıda mesaj gönderildi. Lütfen biraz sonra tekrar deneyin.' };
      await M.store.update(s => { s.requests.unshift({ id: M.ui.uid(), at: Date.now(), read: false, ...r.data }); }, { quiet: true, localOnly: true });
      return { ok: true, data: r.data, stored: 'local' };
    },
    async list() { return M.store.get().requests; },
    async setRead(id, read) { await M.store.update(s => { const x = s.requests.find(r => r.id === id); if (x) x.read = !!read; }, { localOnly: true }); },
    async remove(id) { await M.store.update(s => { s.requests = s.requests.filter(r => r.id !== id); }, { localOnly: true }); }
  };
  const remoteRequests = {
    async submit(input) {
      const r = SCHEMA.contactInput(input);
      if (!r.ok) return { ok: false, error: r.errors[0] };
      try { await call('/contact', { method: 'POST', body: { ...r.data, kvkk: true, website: input.website || '', elapsed: input.elapsed || 0 } }); return { ok: true, data: r.data, stored: 'server' }; }
      catch (e) { return { ok: false, error: e.message }; }
    },
    async list() { const d = await call('/requests'); return SCHEMA.freshRequests(d && d.requests); },
    async setRead(id, read) { await call('/requests', { method: 'PATCH', body: { id, read: !!read } }); },
    async remove(id) { await call('/requests', { method: 'DELETE', body: { id } }); }
  };

  /* ---------- Başlatma: sunucu var mı? ---------- */
  async function init() {
    const cfg = window.MRA_CONFIG || {};
    if (!cfg.tryServer) return 'local';
    try {
      const health = await call('/auth/session', { timeout: 4000 });
      if (!health || health.service !== 'mra-api') return 'local';
      const content = await call('/content');
      remote = true;
      remoteSession = health;
      M.store.useRemote(content && content.content, async next => {
        const res = await call('/content', { method: 'PUT', body: { content: next, baseRev: M.backend.rev } });
        M.backend.rev = res && res.rev;
        return res && res.content;
      });
      M.backend.rev = content && content.rev;
      return 'remote';
    } catch (e) { return 'local'; }
  }

  M.backend = {
    init,
    rev: null,
    isRemote: () => remote,
    get auth() { return remote ? remoteAuth : localAuth; },
    get requests() { return remote ? remoteRequests : localRequests; },
    strongPassword,
    ApiError
  };
})(window.MRA);
