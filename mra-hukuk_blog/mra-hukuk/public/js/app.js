/* =========================================================
   app.js — Yönlendirici (router) ve uygulama başlangıcı
   Sayfa adresleri:
     /                               Anasayfa
     /hakkimizda                     Hakkımızda
     /calisma-alanlari               Çalışma Alanları
     /calisma-alanlari/<adres>       Çalışma alanı detay sayfası
     /blog                           Blog
     /blog/<adres>                   Blog yazısı
     /iletisim                       İletişim
     /kvkk                           KVKK aydınlatma metni
     /admin                          Admin paneli (/yonetim da çalışır)
   Çalışma kipi index.html içinde belirlenir:
     history → gerçek adresler (Netlify vb. sunucuda, _redirects ile)
     hash    → #/calisma-alanlari/... (dosyadan açılınca veya önizlemede)
   ========================================================= */
(function (M) {
  const app = document.getElementById('app');
  const hdr = document.getElementById('site-header');
  const ftr = document.getElementById('site-footer');
  const HISTORY = (window.MRA_CONFIG || {}).router === 'history';
  let current = null;
  let first = true;

  M.href = path => (HISTORY ? path : '#' + path);

  function currentPath() {
    let p = HISTORY ? location.pathname : location.hash.slice(1);
    try { p = decodeURIComponent(p); } catch (e) { p = '/'; }
    p = p.slice(0, 200).replace(/[^a-zA-Z0-9/_-]/g, '');
    if (!p.startsWith('/')) p = '/' + p;
    return p.replace(/\/+$/, '') || '/';
  }

  function parse() {
    const path = currentPath();
    const seg = path.split('/').filter(Boolean);
    const [a, b] = seg;
    if (!a) return { name: 'home', group: '', key: '/' };
    if (seg.length > 2) return { name: '404', key: path };
    if (a === 'calisma-alanlari') return b ? { name: 'area', slug: b, group: a, key: path } : { name: 'areas', group: a, key: path };
    if (a === 'blog') return b ? { name: 'post', slug: b, group: a, key: path } : { name: 'posts', group: a, key: path };
    if (b) return { name: '404', key: path };
    const map = { hakkimizda: 'about', iletisim: 'contact', kvkk: 'kvkk', yonetim: 'admin', admin: 'admin' };
    if (!map[a]) return { name: '404', key: path };
    return { name: map[a], group: map[a] === 'admin' ? 'admin' : a, key: path };
  }

  function chrome(r) {
    hdr.innerHTML = M.views.header(r);
    ftr.innerHTML = M.views.footer();
    document.body.classList.toggle('is-admin', r.name === 'admin');
    const btn = hdr.querySelector('.menu-btn'), nav = hdr.querySelector('.nav');
    btn.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    });
  }

  function render(opts) {
    opts = opts || {};
    const r = parse();
    current = r;
    chrome(r);
    if (r.name === 'admin') M.admin.render(app);
    else { app.innerHTML = M.views.page(r); M.views.bind(app); }
    document.title = M.views.title(r);
    if (opts.silent) return;
    window.scrollTo(0, 0);
    if (!first && r.name !== 'admin') app.focus({ preventScroll: true });
    first = false;
  }

  M.go = path => {
    if (HISTORY) { history.pushState(null, '', path); render(); }
    else location.hash = path;
  };

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    const nav = hdr.querySelector('.nav.open');
    if (nav) { nav.classList.remove('open'); hdr.querySelector('.menu-btn').setAttribute('aria-expanded', 'false'); }
    const href = a.getAttribute('href');
    if (HISTORY) {
      if (!href.startsWith('/') || href.startsWith('//')) return;
      e.preventDefault();
      if (href !== location.pathname) history.pushState(null, '', href);
      render();
    } else if (href.startsWith('#/') && href === (location.hash || '#/')) {
      e.preventDefault();
      render();
    }
  });

  window.addEventListener(HISTORY ? 'popstate' : 'hashchange', () => render());

  M.store.on(src => {
    if (!current) return;
    if (current.name === 'admin') {
      chrome(current);
      if (src === 'remote' && !M.admin.isEditing()) M.admin.render(app);
    } else {
      render({ silent: true });
    }
  });

  document.addEventListener('scroll', () => hdr.classList.toggle('scrolled', window.scrollY > 8), { passive: true });

  /* Beklenmeyen hatalar: ziyaretçiye teknik ayrıntı gösterilmez */
  M.reportError = err => {
    if ((window.MRA_CONFIG || {}).debug) console.error(err);
    try { M.ui.toast('Beklenmeyen bir sorun oluştu. Lütfen sayfayı yenileyin.'); } catch (e) { }
  };
  window.addEventListener('error', e => { if (e.error) M.reportError(e.error); });
  window.addEventListener('unhandledrejection', e => M.reportError(e.reason));

  M.backend.init().catch(() => 'local').then(() => {
    try { render(); }
    catch (e) {
      app.innerHTML = '<section class="phead"><div class="wrap"><h1>Sayfa yüklenemedi</h1><p class="lead">Lütfen sayfayı yenileyin. Sorun devam ederse daha sonra tekrar deneyin.</p></div></section>';
      M.reportError(e);
    }
  });
})(window.MRA);
