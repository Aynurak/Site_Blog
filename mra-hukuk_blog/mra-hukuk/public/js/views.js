/* =========================================================
   views.js — Ziyaretçi sayfaları
   Ana Sayfa, Hakkımızda, Çalışma Alanları (liste ve detay),
   Blog (liste ve yazı), İletişim, KVKK, 404;
   üst menü, footer ve görüşme talep formu.
   ========================================================= */
(function (M) {
  const U = M.ui;
  const { esc, rich } = U;
  const S = () => M.store.get();
  const set = () => S().settings;
  const L = p => M.href(p);
  const pubAreas = () => S().areas.filter(a => a.published);
  const pubPosts = () => S().posts.filter(p => p.published).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const arrow = '<span class="arr" aria-hidden="true">→</span>';
  const tlink = (path, text, attrs) => `<a class="tlink" href="${L(path)}"${attrs || ''}>${text} ${arrow}</a>`;
  const DRAFT = 'Bu sayfadaki metin genel bilgilendirme amaçlı taslak metindir; hukuki görüş niteliği taşımaz.';
  let presetTopic = '';
  const embeddable = () => { try { return window.self === window.top; } catch (e) { return false; } };

  /* ---------- Üst menü ve footer ---------- */
  function header(r) {
    const s = set();
    const nav = [['', 'Ana Sayfa'], ['hakkimizda', 'Hakkımızda'], ['calisma-alanlari', 'Çalışma Alanları'], ['blog', 'Blog'], ['iletisim', 'İletişim']];
    return `<div class="wrap hdr">
      <a class="brand" href="${L('/')}" aria-label="${esc(s.title + ' ' + s.name)} — Ana Sayfa">${U.logo('mono-mark')}
        <span class="brand-text"><span class="brand-name">${esc(s.title + ' ' + s.name)}</span><span class="brand-sub">${esc(s.brandSub)}</span></span></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Menüyü aç"><span></span></button>
      <nav id="main-nav" class="nav" aria-label="Ana menü">
        ${nav.map(([h, t]) => `<a href="${L('/' + h)}"${(r.group || '') === h && r.name !== '404' ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      </nav></div>`;
  }

  function footer() {
    const s = set();
    return `<div class="wrap ftr">
        <div class="ftr-logo">${U.logo('full-mark', 'full')}</div>
        <nav class="ftr-col" aria-label="Footer menüsü"><p class="ftr-h">Sayfalar</p><ul>
          <li><a href="${L('/hakkimizda')}">Hakkımızda</a></li>
          <li><a href="${L('/calisma-alanlari')}">Çalışma Alanları</a></li>
          <li><a href="${L('/blog')}">Blog</a></li>
          <li><a href="${L('/iletisim')}">İletişim</a></li></ul></nav>
        <div class="ftr-col"><p class="ftr-h">İletişim</p>
          <ul class="ftr-contact">
            <li><span>Telefon</span><a href="${U.telHref(s.phone)}">${esc(U.fmtPhone(s.phone))}</a></li>
            <li><span>E-posta</span><a href="${U.mailHref(s.email)}">${esc(s.email)}</a></li>
            ${s.address ? `<li><span>Adres</span><span class="ftr-addr">${esc(s.address)}<a href="${esc(U.mapInfo(s).route)}" target="_blank" rel="noopener noreferrer">Yol tarifi al →</a></span></li>` : ''}
            ${s.workingHours ? `<li><span>Görüşme</span>${esc(s.workingHours)}</li>` : ''}
          </ul></div>
      </div>`;
  }

  /* ---------- Ortak parçalar ---------- */
  function pageHead(title, lead, items) {
    return `<section class="phead"><div class="wrap">
      <nav class="crumbs" aria-label="Konum">${items.map((it, i) => i < items.length - 1
        ? `<a href="${L(it[0])}">${esc(it[1])}</a><span aria-hidden="true">/</span>`
        : `<span aria-current="page">${esc(it[1])}</span>`).join('')}</nav>
      <h1>${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    </div></section>`;
  }

  function areaList(areas) {
    if (!areas.length) return `<p class="empty">Yayında çalışma alanı bulunmuyor.</p>`;
    return `<ul class="alist">${areas.map(a => `
      <li><a class="arow" href="${L('/calisma-alanlari/' + a.slug)}">
        <span class="arow-title">${esc(a.title)}</span><span class="arow-sum">${esc(a.summary)}</span>${arrow}</a></li>`).join('')}</ul>`;
  }

  function postGrid(posts) {
    if (!posts.length) return `<p class="empty">Henüz yayımlanmış yazı bulunmuyor.</p>`;
    return `<div class="pgrid">${posts.map(p => `
      <article class="pcard" data-cat="${esc(p.category)}">
        <p class="pmeta"><time datetime="${esc(p.date)}">${esc(U.fmtDate(p.date))}</time>${p.category ? `<span>${esc(p.category)}</span>` : ''}</p>
        <h3><a href="${L('/blog/' + p.slug)}">${esc(p.title)}</a></h3>
        <p class="psum">${esc(p.summary)}</p>
        ${tlink('/blog/' + p.slug, 'Devamını oku')}
      </article>`).join('')}</div>`;
  }

  function sideList(title, items, current) {
    return `<div class="sbox"><p class="sbox-h">${esc(title)}</p><ul>${items.map(([path, t]) =>
      `<li><a href="${L(path)}"${path === current ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('')}</ul></div>`;
  }

  function sideNote(topic) {
    return `<div class="sbox snote"><p class="sbox-h">Bilgi ve randevu</p>
      <p>${esc(topic)} konusunda görüşme planlamak için iletişim sayfasındaki formu kullanabilirsiniz.</p>
      ${tlink('/iletisim', 'İletişim', ` data-topic="${esc(topic)}"`)}</div>`;
  }

  let formSeq = 0;
  function requestForm(preset) {
    const id = 'f' + (++formSeq);
    const opts = pubAreas().map(a => `<option${a.title === preset ? ' selected' : ''}>${esc(a.title)}</option>`).join('');
    return `<form class="req-form" data-form novalidate>
      <div class="f-row"><label for="${id}-ad">Ad soyad</label><input id="${id}-ad" name="ad" autocomplete="name" required minlength="3" maxlength="80"></div>
      <div class="f-2">
        <div class="f-row"><label for="${id}-tel">Telefon</label><input id="${id}-tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20"></div>
        <div class="f-row"><label for="${id}-ep">E-posta <span class="opt">(isteğe bağlı)</span></label><input id="${id}-ep" name="eposta" type="email" autocomplete="email" maxlength="120"></div>
      </div>
      <div class="f-row"><label for="${id}-konu">Konu</label><select id="${id}-konu" name="konu">${preset ? '' : '<option value="">Seçiniz</option>'}${opts}<option>Diğer</option></select></div>
      <div class="f-row"><label for="${id}-msg">Mesajınız</label><textarea id="${id}-msg" name="mesaj" rows="5" required minlength="10" maxlength="1500"></textarea></div>
      <div class="hp" aria-hidden="true"><label>Web siteniz<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <input type="hidden" name="t0" value="${Date.now()}">
      <label class="check"><input type="checkbox" name="kvkk" required><span><a href="${L('/kvkk')}">KVKK Aydınlatma Metni</a>'ni okudum.</span></label>
      <p class="f-err" role="alert" hidden></p>
      <div><button class="btn btn-dark" type="submit">Gönder</button></div>
    </form>`;
  }

  /* ---------- Ana Sayfa ---------- */
  function home() {
    const s = set();
    const img = s.heroImage || M.HERO_DEFAULT;
    return `
    <section class="hero">
      <img class="hero-img" src="${esc(img)}" alt="" aria-hidden="true">
      <div class="hero-shade"></div>
      <div class="wrap hero-in"><div class="hero-copy">
        <p class="eyebrow">${esc(s.heroSub)}</p>
        <h1>${esc(s.title + ' ' + s.name)}</h1>
        <p class="hero-lead">${esc(s.heroLead)}</p>
        <nav class="hero-links" aria-label="Sayfalara geçiş">${tlink('/calisma-alanlari', 'Çalışma Alanları')}${tlink('/blog', 'Blog')}${tlink('/iletisim', 'İletişim')}</nav>
      </div></div>
    </section>

    <section class="sec"><div class="wrap about-home">
      <figure class="about-fig"><img src="${esc(M.ASSETS.about)}" alt="Büroda çalışma masası, açık dosya, dolma kalem ve adalet heykeli" width="896" height="1200" loading="lazy"></figure>
      <div class="about-copy">
        <h2 class="h2">${esc(s.homeTitle)}</h2>
        <div class="prose">${rich(s.homeText)}</div>
        <p class="links-row">${tlink('/hakkimizda', 'Hakkımızda')}${tlink('/calisma-alanlari', 'Çalışma Alanları')}</p>
      </div>
    </div></section>

    <section class="sec sec-alt"><div class="wrap">
      <div class="sec-head"><h2 class="h2">Blog'dan seçkiler</h2>${tlink('/blog', 'Tüm yazılar')}</div>
      ${postGrid(pubPosts().slice(0, 3))}
    </div></section>`;
  }

  /* ---------- Hakkımızda ---------- */
  function aboutPage() {
    const s = set();
    return `${pageHead('Hakkımızda', s.heroLead, [['/', 'Ana Sayfa'], ['', 'Hakkımızda']])}
    <section class="sec"><div class="wrap split">
      <div><h2 class="h2">${esc(s.aboutTitle)}</h2><p class="muted">Kurucu Avukat</p></div>
      <div>
        <div class="prose">${rich(s.aboutText)}</div>
        ${s.principles && s.principles.length ? `<h3 class="h3">Çalışma ilkelerimiz</h3>
          <dl class="principles">${s.principles.map(p => `<div><dt>${esc(p.t)}</dt><dd>${esc(p.d)}</dd></div>`).join('')}</dl>` : ''}
        <p class="links-row">${tlink('/calisma-alanlari', 'Çalışma Alanları')}</p>
      </div>
    </div></section>`;
  }

  /* ---------- Çalışma Alanları ---------- */
  function areasPage() {
    return `${pageHead('Çalışma Alanları', 'Her alanın kapsamı, sık karşılaşılan hukuki konular ve bilgilendirme notları kendi sayfasında yer alır.', [['/', 'Ana Sayfa'], ['', 'Çalışma Alanları']])}
    <section class="sec"><div class="wrap">${areaList(pubAreas())}</div></section>`;
  }

  function areaPage(slug) {
    const areas = pubAreas();
    const a = areas.find(x => x.slug === slug);
    if (!a) return notFound();
    const path = '/calisma-alanlari/' + a.slug;
    const related = pubPosts().filter(p => p.category === a.title);
    return `${pageHead(a.title, a.summary, [['/', 'Ana Sayfa'], ['/calisma-alanlari', 'Çalışma Alanları'], ['', a.title]])}
    <section class="sec"><div class="wrap layout">
      <article class="prose">
        ${a.scope ? `<h2>Kapsam</h2>${rich(a.scope)}` : ''}
        ${a.topics && a.topics.length ? `<h2>Sık karşılaşılan hukuki konular</h2><ul class="topics">${a.topics.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${a.notes ? `<h2>Bilgilendirme notları</h2>${rich(a.notes)}` : ''}
        <p class="draft">${DRAFT}</p>
        ${related.length ? `<h2 class="rel-h">${esc(a.title)} alanındaki yazılar</h2>${postGrid(related)}` : ''}
      </article>
      <aside class="side">${sideList('Çalışma Alanları', areas.map(x => ['/calisma-alanlari/' + x.slug, x.title]), path)}${sideNote(a.title)}</aside>
    </div></section>`;
  }

  /* ---------- Blog ---------- */
  function postsPage() {
    const posts = pubPosts();
    const cats = [...new Set(posts.map(p => p.category).filter(Boolean))];
    return `${pageHead('Blog', 'Sık karşılaşılan hukuki konulara ilişkin kısa ve genel nitelikli yazılar.', [['/', 'Ana Sayfa'], ['', 'Blog']])}
    <section class="sec"><div class="wrap">
      ${cats.length > 1 ? `<div class="filters" role="group" aria-label="Kategoriye göre süz">
        <button type="button" class="fbtn on" data-filter="" aria-pressed="true">Tümü</button>
        ${cats.map(c => `<button type="button" class="fbtn" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>` : ''}
      ${postGrid(posts)}</div></section>`;
  }

  function postPage(slug) {
    const posts = pubPosts();
    const p = posts.find(x => x.slug === slug);
    if (!p) return notFound();
    const path = '/blog/' + p.slug;
    const area = pubAreas().find(a => a.title === p.category);
    return `${pageHead(p.title, p.summary, [['/', 'Ana Sayfa'], ['/blog', 'Blog'], ['', p.title]])}
    <section class="sec"><div class="wrap layout">
      <article>
        <p class="pmeta pmeta-lg"><time datetime="${esc(p.date)}">${esc(U.fmtDate(p.date))}</time>${p.category ? `<span>${area ? `<a href="${L('/calisma-alanlari/' + area.slug)}">${esc(p.category)}</a>` : esc(p.category)}</span>` : ''}</p>
        <div class="prose">${rich(p.body)}</div>
        <p class="draft">${DRAFT}</p>
        <p class="links-row"><a class="tlink back" href="${L('/blog')}"><span class="arr" aria-hidden="true">←</span> Tüm yazılar</a></p>
      </article>
      <aside class="side">${sideList('Son yazılar', posts.slice(0, 6).map(x => ['/blog/' + x.slug, x.title]), path)}${sideNote(p.category || 'Hukuki danışmanlık')}</aside>
    </div></section>`;
  }

  /* ---------- İletişim ---------- */
  function contactPage() {
    const s = set();
    const t = presetTopic; presetTopic = '';
    const preset = pubAreas().some(a => a.title === t) ? t : '';
    const map = U.mapInfo(s);
    return `${pageHead('İletişim', s.officeNote, [['/', 'Ana Sayfa'], ['', 'İletişim']])}
    <section class="sec"><div class="wrap split">
      <div>
        <h2 class="h3">Künye</h2>
        <dl class="kunye">
          <div><dt>Büro</dt><dd>${esc(s.firmName)}</dd></div>
          <div><dt>Avukat</dt><dd>${esc(s.title + ' ' + s.name)}</dd></div>
          ${s.address ? `<div><dt>Adres</dt><dd>${esc(s.address)}</dd></div>` : ''}
          <div><dt>Telefon</dt><dd><a href="${U.telHref(s.phone)}">${esc(U.fmtPhone(s.phone))}</a></dd></div>
          <div><dt>E-posta</dt><dd><a href="${U.mailHref(s.email)}">${esc(s.email)}</a></dd></div>
          <div><dt>WhatsApp</dt><dd><a href="${U.waHref(s.phone, 'Merhaba, bilgi almak istiyorum.')}" target="_blank" rel="noopener noreferrer">Mesaj gönderin</a></dd></div>
          ${s.workingHours ? `<div><dt>Görüşme</dt><dd>${esc(s.workingHours)}</dd></div>` : ''}
        </dl>
      </div>
      <div class="form-wrap">
        <h2 class="h3">Görüşme talebi</h2>
        <p class="muted">Mesajınız, e-posta veya WhatsApp üzerinden gönderilmek üzere hazırlanır. Dosyanıza ilişkin hassas ayrıntıları ilk mesajda paylaşmanız gerekmez.</p>
        ${requestForm(preset)}
      </div>
    </div></section>
    ${s.address || map.embed ? `<section class="sec sec-alt location" aria-labelledby="loc-h"><div class="wrap loc-grid">
      <div class="loc-copy">
        <p class="eyebrow">Adres ve konum</p>
        <h2 class="h2" id="loc-h">Büromuz</h2>
        ${s.address ? `<address class="loc-addr">${esc(s.address)}</address>` : ''}
        ${s.addressNote ? `<p class="loc-note">${esc(s.addressNote)}</p>` : ''}
        ${s.workingHours ? `<p class="loc-hours"><span>Görüşme</span>${esc(s.workingHours)}</p>` : ''}
        <p class="links-row">
          ${map.view ? `<a class="tlink" href="${esc(map.view)}" target="_blank" rel="noopener noreferrer">Haritada görüntüle ${arrow}</a>` : ''}
          ${map.route ? `<a class="tlink" href="${esc(map.route)}" target="_blank" rel="noopener noreferrer">Yol tarifi al ${arrow}</a>` : ''}
        </p>
      </div>
      ${map.embed ? `<figure class="loc-map">
        ${embeddable() ? `<iframe src="${esc(map.embed)}" title="${esc(s.firmName)} konum haritası" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        <figcaption>Harita yüklenmezse <a href="${esc(map.view)}" target="_blank" rel="noopener noreferrer">Google Haritalar'da açın</a>.</figcaption>`
        : `<div class="map-plate"><p>Harita, site kendi adresinde yayındayken burada gösterilir.</p><a class="tlink" href="${esc(map.view)}" target="_blank" rel="noopener noreferrer">Google Haritalar'da açın ${arrow}</a></div>`}
      </figure>` : ''}
    </div></section>` : ''}`;
  }

  function kvkkPage() {
    return `${pageHead('KVKK Aydınlatma Metni', '', [['/', 'Ana Sayfa'], ['', 'KVKK Aydınlatma Metni']])}
      <section class="sec"><div class="wrap"><div class="prose">${rich(set().kvkkText)}</div></div></section>`;
  }

  function notFound() {
    return `${pageHead('Sayfa bulunamadı', 'Aradığınız sayfa kaldırılmış veya adı değiştirilmiş olabilir.', [['/', 'Ana Sayfa'], ['', 'Sayfa bulunamadı']])}
      <section class="sec"><div class="wrap">${tlink('/', 'Ana Sayfa')}</div></section>`;
  }

  function page(r) {
    switch (r.name) {
      case 'home': return home();
      case 'about': return aboutPage();
      case 'areas': return areasPage();
      case 'area': return areaPage(r.slug);
      case 'posts': return postsPage();
      case 'post': return postPage(r.slug);
      case 'contact': return contactPage();
      case 'kvkk': return kvkkPage();
      default: return notFound();
    }
  }

  function title(r) {
    const s = set(), base = `${s.title} ${s.name} | ${s.firmName}`;
    const map = { about: 'Hakkımızda', areas: 'Çalışma Alanları', posts: 'Blog', contact: 'İletişim', kvkk: 'KVKK', admin: 'Admin', '404': 'Sayfa bulunamadı' };
    if (r.name === 'area') { const a = S().areas.find(x => x.slug === r.slug); return a ? `${a.title} | ${base}` : base; }
    if (r.name === 'post') { const p = S().posts.find(x => x.slug === r.slug); return p ? `${p.title} | ${base}` : base; }
    return map[r.name] ? `${map[r.name]} | ${base}` : base;
  }

  /* ---------- Form gönderimi ---------- */
  async function submitRequest(form) {
    const fd = new FormData(form);
    const g = k => String(fd.get(k) || '');
    const err = form.querySelector('.f-err');
    const btn = form.querySelector('button[type=submit]');
    const fail = msg => { err.textContent = msg; err.hidden = false; };
    err.hidden = true;
    const elapsed = Date.now() - (+g('t0') || Date.now());
    if (g('website')) { form.reset(); return; }
    if (elapsed < 3000) return fail('Lütfen formu doldurduktan sonra tekrar gönderin.');
    btn.disabled = true;
    let res;
    try {
      res = await M.backend.requests.submit({ ad: g('ad'), tel: g('tel'), eposta: g('eposta'), konu: g('konu'), mesaj: g('mesaj'), kvkk: fd.get('kvkk') === 'on', website: g('website'), elapsed });
    } catch (e) { res = { ok: false, error: 'İşlem şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.' }; }
    btn.disabled = false;
    if (!res.ok) return fail(res.error);
    showSent(form, res.data, res.stored === 'server');
  }

  function showSent(form, data, delivered) {
    const s = set();
    const text = `Görüşme talebi\nAd soyad: ${data.ad}\nTelefon: 0${data.tel}${data.eposta ? `\nE-posta: ${data.eposta}` : ''}\nKonu: ${data.konu}\n\n${data.mesaj}`;
    const box = document.createElement('div');
    box.className = 'req-ok';
    box.setAttribute('tabindex', '-1');
    box.innerHTML = delivered
      ? `<h3>Mesajınız iletildi</h3><p class="req-ok-status">Mesajınız büroya ulaştı; en kısa sürede sizinle iletişime geçilecektir.</p>
         <button type="button" class="link" data-reset-form>Yeni mesaj yaz</button>`
      : `<h3>Mesajınız hazır</h3>
      <p class="req-ok-status">Mesajınızı büroya ulaştırmak için aşağıdaki seçeneklerden birini kullanın; metin otomatik olarak doldurulur.</p>
      <pre class="req-preview">${esc(text)}</pre>
      <div class="req-acts">
        <a class="btn btn-dark" href="${esc(U.waHref(s.phone, text))}" target="_blank" rel="noopener noreferrer">WhatsApp ile gönder</a>
        <a class="btn btn-line" href="${esc(U.mailHref(s.email, `Görüşme talebi – ${data.konu}`, text))}">E-posta ile gönder</a>
      </div>
      <button type="button" class="link" data-reset-form>Yeni mesaj yaz</button>`;
    form.replaceWith(box);
    box.focus();
    box.querySelector('[data-reset-form]').addEventListener('click', () => {
      const tmp = document.createElement('div');
      tmp.innerHTML = requestForm(data.konu === 'Genel' ? '' : data.konu);
      const nf = tmp.firstElementChild;
      box.replaceWith(nf);
      bindForm(nf);
    });
  }

  function bindForm(f) { f.addEventListener('submit', e => { e.preventDefault(); submitRequest(f).catch(M.reportError); }); }

  function bind(root) {
    root.querySelectorAll('[data-form]').forEach(bindForm);
    root.querySelectorAll('[data-topic]').forEach(a => a.addEventListener('click', () => { presetTopic = a.dataset.topic; }));
    const btns = root.querySelectorAll('[data-filter]');
    btns.forEach(c => c.addEventListener('click', () => {
      btns.forEach(x => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); });
      root.querySelectorAll('.pcard').forEach(r => { r.hidden = !!c.dataset.filter && r.dataset.cat !== c.dataset.filter; });
    }));
  }

  M.views = { header, footer, page, title, bind };
})(window.MRA);
