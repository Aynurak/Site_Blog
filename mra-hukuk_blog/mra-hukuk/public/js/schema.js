/* =========================================================
   schema.js — Ortak veri şeması, doğrulama ve temizleme
   Tarayıcıda klasik script olarak, sunucuda (Netlify Functions)
   ES modülü olarak yüklenir; ikisi de globalThis.MRA_SCHEMA'yı kullanır.
   - Bilinmeyen alanlar atılır, tipler zorlanır, uzunluklar kırpılır.
   - Kontrol karakterleri temizlenir; HTML hiçbir zaman ham kabul edilmez
     (metinler render sırasında escape edilir).
   - Bağlantılarda yalnızca izinli protokoller kabul edilir.
   ========================================================= */
(function (G) {
  const LIMITS = {
    short: 120, line: 300, text: 4000, long: 40000,
    topics: 30, areas: 40, posts: 300, principles: 10, requests: 500,
    image: 1600000
  };
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const ID_RE = /^[a-zA-Z0-9_-]{1,40}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const EMAIL_RE = /^[^\s@<>"'`]{1,64}@[^\s@<>"'`]{1,190}\.[a-zA-Z]{2,24}$/;
  const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
  const HASH_RE = /^(pbkdf2|x)[$:a-f0-9A-Za-z+/=]{4,400}$/;
  const SAFE_PROTOCOLS = ['https:', 'http:', 'tel:', 'mailto:'];
  const MAP_EMBED_HOSTS = [/(^|\.)google\.[a-z.]+$/, /^maps\.google\.[a-z.]+$/, /(^|\.)openstreetmap\.org$/, /(^|\.)yandex\.(com\.tr|com|ru)$/];

  /* Kontrol karakterlerini (sekme/yeni satır hariç) ve sıfır genişlikli yön karakterlerini temizler */
  function cleanText(v, max, multiline) {
    let s = typeof v === 'string' ? v : (v == null ? '' : String(v));
    s = s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g, '');
    if (!multiline) s = s.replace(/\s+/g, ' ');
    s = s.trim();
    return s.length > max ? s.slice(0, max) : s;
  }
  const str = (v, max) => cleanText(v, max || LIMITS.line, false);
  const txt = (v, max) => cleanText(v, max || LIMITS.text, true);
  const bool = (v, d) => (typeof v === 'boolean' ? v : !!d);
  const slug = v => { const s = str(v, 80).toLowerCase(); return SLUG_RE.test(s) ? s : ''; };
  const id = v => { const s = str(v, 40); return ID_RE.test(s) ? s : ''; };
  const date = v => { const s = str(v, 10); return DATE_RE.test(s) && !isNaN(Date.parse(s)) ? s : ''; };
  const digits = v => String(v == null ? '' : v).replace(/\D/g, '');

  function phone10(v) {
    let d = digits(v);
    if (d.length === 12 && d.startsWith('90')) d = d.slice(2);
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return /^[2-5]\d{9}$/.test(d) ? d : '';
  }
  function email(v) { const s = str(v, 254); return EMAIL_RE.test(s) ? s : ''; }

  /* Yalnızca izinli protokollere sahip mutlak bağlantılar */
  function safeUrl(v, protocols) {
    const allowed = protocols || ['https:'];
    try {
      const u = new URL(String(v || '').trim());
      return allowed.includes(u.protocol) ? u : null;
    } catch (e) { return null; }
  }
  function isSafeHref(v) {
    const s = String(v || '').trim();
    if (s.startsWith('#/') || (s.startsWith('/') && !s.startsWith('//'))) return true;
    return !!safeUrl(s, SAFE_PROTOCOLS);
  }
  function mapEmbedSrc(raw) {
    const text = String(raw || '').trim();
    if (!text) return '';
    const m = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(text);
    const u = safeUrl(m ? m[1].replace(/&amp;/g, '&') : text);
    if (!u || !MAP_EMBED_HOSTS.some(rx => rx.test(u.hostname))) return null;
    return /\/maps\/embed|output=embed|\/export\/embed|\/map-widget\//.test(u.pathname + u.search) ? u.href : null;
  }
  function image(v) {
    const s = typeof v === 'string' ? v.trim() : '';
    if (!s) return '';
    return s.length <= LIMITS.image && IMAGE_RE.test(s) ? s : '';
  }

  const SETTINGS = {
    title: v => str(v, 12), name: v => str(v, 80), firmName: v => str(v, 120), brandSub: v => str(v, 60),
    phone: v => phone10(v), email: v => email(v),
    address: v => str(v, 240), addressNote: v => str(v, 200),
    mapLink: v => { const u = safeUrl(v); return u ? u.href.slice(0, 600) : ''; },
    mapEmbed: v => { const src = mapEmbedSrc(v); return src || ''; },
    workingHours: v => str(v, 120), officeNote: v => str(v, 400),
    heroSub: v => str(v, 80), heroImage: v => image(v), heroLead: v => txt(v, 400),
    homeTitle: v => str(v, 120), homeText: v => txt(v, LIMITS.text),
    aboutTitle: v => str(v, 120), aboutText: v => txt(v, 8000),
    principles: v => (Array.isArray(v) ? v : []).slice(0, LIMITS.principles)
      .map(p => ({ t: str(p && p.t, 80), d: str(p && p.d, 300) })).filter(p => p.t),
    kvkkText: v => txt(v, 12000)
  };

  function settings(raw, defaults) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const out = {};
    Object.keys(SETTINGS).forEach(k => {
      const has = Object.prototype.hasOwnProperty.call(src, k);
      out[k] = has ? SETTINGS[k](src[k]) : (defaults ? defaults[k] : SETTINGS[k](undefined));
      if (out[k] === undefined) out[k] = SETTINGS[k](undefined);
    });
    if (!out.phone && defaults) out.phone = defaults.phone;
    if (!out.email && defaults) out.email = defaults.email;
    if (!out.name && defaults) out.name = defaults.name;
    if (!out.firmName && defaults) out.firmName = defaults.firmName;
    return out;
  }

  function area(a) {
    if (!a || typeof a !== 'object') return null;
    const r = {
      id: id(a.id), slug: slug(a.slug), title: str(a.title, 100), summary: str(a.summary, 400),
      scope: txt(a.scope, LIMITS.text), topics: (Array.isArray(a.topics) ? a.topics : []).slice(0, LIMITS.topics).map(t => str(t, 200)).filter(Boolean),
      notes: txt(a.notes, LIMITS.long), published: bool(a.published, true), featured: bool(a.featured, false)
    };
    return r.id && r.slug && r.title ? r : null;
  }
  function post(p) {
    if (!p || typeof p !== 'object') return null;
    const r = {
      id: id(p.id), slug: slug(p.slug), title: str(p.title, 160), category: str(p.category, 100),
      date: date(p.date), summary: str(p.summary, 500), body: txt(p.body, LIMITS.long), published: bool(p.published, true)
    };
    return r.id && r.slug && r.title && r.date ? r : null;
  }
  function uniqueBy(list, key) {
    const seen = new Set();
    return list.filter(x => (seen.has(x[key]) ? false : (seen.add(x[key]), true)));
  }

  /* Ziyaretçi talebi: veri minimizasyonu — yalnızca gerekli alanlar */
  const REQUEST_TTL_DAYS = 90;
  function request(r) {
    if (!r || typeof r !== 'object') return null;
    const out = {
      id: id(r.id), at: Number.isFinite(+r.at) ? +r.at : 0, read: bool(r.read, false),
      ad: str(r.ad, 80), tel: phone10(r.tel), eposta: email(r.eposta), konu: str(r.konu, 100), mesaj: txt(r.mesaj, 1500)
    };
    return out.id && out.at && out.ad && out.tel && out.mesaj ? out : null;
  }
  function freshRequests(list, now) {
    const limit = (now || Date.now()) - REQUEST_TTL_DAYS * 864e5;
    return (Array.isArray(list) ? list : []).map(request).filter(r => r && r.at >= limit).slice(0, LIMITS.requests);
  }

  /* Ziyaretçi formu girdisi: hata mesajları sade ve genel */
  function contactInput(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const data = {
      ad: str(src.ad, 80), tel: phone10(src.tel), eposta: src.eposta ? email(src.eposta) : '',
      konu: str(src.konu, 100) || 'Genel', mesaj: txt(src.mesaj, 1500)
    };
    const errors = [];
    if (data.ad.length < 3 || /[<>{}]/.test(data.ad)) errors.push('Lütfen adınızı ve soyadınızı yazın.');
    if (!data.tel) errors.push('Lütfen geçerli bir telefon numarası yazın.');
    if (src.eposta && !data.eposta) errors.push('E-posta adresi geçerli görünmüyor.');
    if (data.mesaj.length < 10) errors.push('Lütfen mesajınızı birkaç cümleyle yazın.');
    if (src.kvkk !== true) errors.push('Devam etmek için aydınlatma metnini okuduğunuzu onaylayın.');
    return { ok: errors.length === 0, data, errors };
  }

  /* İçerik (ayarlar + alanlar + yazılar): bozuk/manipüle veri çökertmez */
  function content(raw, defaults) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const d = defaults || {};
    const areas = Array.isArray(src.areas) ? uniqueBy(uniqueBy(src.areas.slice(0, LIMITS.areas).map(area).filter(Boolean), 'id'), 'slug') : (d.areas || []);
    const posts = Array.isArray(src.posts) ? uniqueBy(uniqueBy(src.posts.slice(0, LIMITS.posts).map(post).filter(Boolean), 'id'), 'slug') : (d.posts || []);
    return { settings: settings(src.settings, d.settings), areas, posts };
  }

  function auth(raw, defaults) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const user = str(src.user, 40);
    const hash = typeof src.hash === 'string' && HASH_RE.test(src.hash) ? src.hash : null;
    return { user: user || (defaults && defaults.user) || 'admin', hash };
  }

  /* Tarayıcıdaki tüm durum: içerik + talepler + yerel kimlik bilgisi */
  function state(raw, defaults) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const c = content(src, defaults);
    return { version: 1, settings: c.settings, areas: c.areas, posts: c.posts, requests: freshRequests(src.requests), auth: auth(src.auth, defaults && defaults.auth) };
  }

  /* Admin formu için katı kontrol: hatalı alanlar sessizce düzeltilmez, bildirilir */
  function validateSettingsInput(raw) {
    const errors = [];
    if (!phone10(raw.phone)) errors.push('Telefon numarası 10 haneli ve 2–5 ile başlamalıdır (ör. 5525792820).');
    if (!email(raw.email)) errors.push('E-posta adresi geçerli görünmüyor.');
    if (!str(raw.name) || !str(raw.firmName)) errors.push('Avukat adı ve büro adı boş bırakılamaz.');
    if (raw.mapLink && !safeUrl(raw.mapLink)) errors.push('Harita bağlantısı https:// ile başlayan geçerli bir adres olmalıdır.');
    if (raw.mapEmbed && !mapEmbedSrc(raw.mapEmbed)) errors.push('Harita yerleştirme kodu tanınmadı. Google Haritalar’daki “Harita yerleştirin” bölümünden alınan <iframe> kodunu veya https://www.google.com/maps/embed?… adresini yapıştırın.');
    return errors;
  }

  G.MRA_SCHEMA = {
    LIMITS, REQUEST_TTL_DAYS, SAFE_PROTOCOLS,
    str, txt, slug, id, date, email, phone10, digits, safeUrl, isSafeHref, mapEmbedSrc, image,
    settings, area, post, request, freshRequests, contactInput, content, auth, state, validateSettingsInput
  };
})(globalThis);
