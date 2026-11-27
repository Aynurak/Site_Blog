/* =========================================================
   admin.js — Admin paneli (/admin)
   Giriş/oturum, çalışma alanları, yazılar, büro bilgileri,
   gelen talepler, güvenlik ve veri (yedek, sıfırlama).
   ========================================================= */
(function (M) {
  const U = M.ui;
  const { esc } = U;
  const st = () => M.store.get();
  const SCHEMA = globalThis.MRA_SCHEMA;
  const A = () => M.backend.auth;
  const R = () => M.backend.requests;
  const TABS = [
    ['ozet', 'Genel bakış'], ['alanlar', 'Çalışma alanları'], ['yazilar', 'Blog yazıları'],
    ['buro', 'Büro ve iletişim'], ['talepler', 'Ön görüşme talepleri'], ['ayarlar', 'Güvenlik ve veri']
  ];
  const FORMAT_HINT = 'Biçim: boş satır yeni paragraf; "## " ile başlayan satır ara başlık; "- " ile başlayan satırlar madde listesi.';
  let view = { tab: 'ozet', edit: null };
  let appEl = null;
  let pendingHero = null;
  let reqCache = null;
  let reqLoading = false;

  /* ---------- Oturum ve yetki ---------- */
  const authed = () => A().isAuthed();

  /* Her yazma işlemi önce yetki kontrolünden geçer; sunucu kipinde API ayrıca doğrular */
  async function guarded(task) {
    if (!authed()) { view = { tab: 'ozet', edit: null }; rerender(true); U.toast('Oturum süresi doldu; lütfen yeniden giriş yapın.'); return false; }
    try { await task(); return true; }
    catch (e) {
      if (e && e.status === 401) { await A().logout(); rerender(true); U.toast('Oturum sona erdi; lütfen yeniden giriş yapın.'); return false; }
      if (e && e.status === 409) { U.toast('İçerik başka bir oturumda değiştirilmiş. Sayfayı yenileyip tekrar deneyin.'); return false; }
      U.toast(e && e.message ? e.message : 'İşlem tamamlanamadı.');
      rerender();
      return false;
    }
  }

  async function loadRequests(force) {
    if (reqLoading || (reqCache && !force)) return;
    reqLoading = true;
    try { reqCache = await R().list(); } catch (e) { reqCache = []; U.toast(e.message || 'Talepler yüklenemedi.'); }
    reqLoading = false;
    if (authed()) rerender();
  }

  /* ---------- Küçük parçalar ---------- */
  const field = (name, label, value, o = {}) => `<div class="f-row"><label for="ad-${name}">${label}</label>
    <input id="ad-${name}" name="${name}" value="${esc(value)}" ${o.type ? `type="${o.type}"` : ''} ${o.required ? 'required' : ''} ${o.attrs || ''}>
    ${o.hint ? `<small class="hint">${o.hint}</small>` : ''}</div>`;
  const tarea = (name, label, value, rows, hint) => `<div class="f-row"><label for="ad-${name}">${label}</label>
    <textarea id="ad-${name}" name="${name}" rows="${rows}">${esc(value)}</textarea>${hint ? `<small class="hint">${hint}</small>` : ''}</div>`;
  const pill = on => `<span class="pill${on ? ' on' : ''}">${on ? 'Yayında' : 'Taslak'}</span>`;
  const coll = (s, kind) => kind === 'area' ? s.areas : kind === 'post' ? s.posts : s.requests;
  const unread = () => (reqCache || []).filter(r => !r.read).length;

  /* ---------- Görünümler ---------- */
  function login() {
    const demo = A().demo();
    const remote = A().mode === 'remote';
    return `<section class="login"><div class="login-card">
      <div class="login-brand">${U.logo('login-mark', 'full')}<p class="muted">Admin paneli</p></div>
      <h1>Giriş yapın</h1>
      ${demo ? `<div class="demo"><strong>Demo giriş bilgileri (test için)</strong>
        <span>Kullanıcı adı: <code>${esc(M.DEMO.user)}</code></span><span>Şifre: <code>${esc(M.DEMO.pass)}</code></span>
        <small>Bu bilgiler yalnızca sunucusuz deneme kipinde geçerlidir; ilk girişten sonra “Güvenlik ve veri” bölümünden değiştirin.</small></div>` : ''}
      <form id="login-form" class="a-form" novalidate>
        ${field('user', 'Kullanıcı adı', '', { required: true, attrs: 'autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="60"' })}
        <div class="f-row"><label for="ad-pass">Şifre</label>
          <div class="pw"><input id="ad-pass" name="pass" type="password" required autocomplete="current-password" maxlength="200">
          <button type="button" class="link" data-act="reveal" aria-controls="ad-pass">Göster</button></div></div>
        <p class="f-err" role="alert" hidden></p>
        <button class="btn btn-brass btn-block" type="submit">Giriş yap</button>
      </form>
      <a class="back" href="${M.href('/')}"><span aria-hidden="true">←</span> Siteye dön</a>
      <p class="fine">${remote ? 'Güvenli bağlantı. Oturum, tarayıcı betiklerinin erişemediği korumalı bir çerezde tutulur ve 2 saat sonra sona erer.' : 'Deneme kipi: sunucu bağlantısı bulunamadı. Bu kipte değişiklikler yalnızca bu tarayıcıda saklanır; gerçek yayında sunucu kipi kullanılmalıdır.'}</p>
    </div></section>`;
  }

  function panel() {
    const n = unread();
    return `<div class="admin">
      <aside class="a-side">
        <div class="a-brand">${U.logo('mono-mark')}<div><p class="a-brand-t">Admin paneli</p><p class="a-brand-s">${esc(st().settings.title + ' ' + st().settings.name)}</p></div></div>
        <nav class="a-tabs" aria-label="Yönetim bölümleri">${TABS.map(([id, label]) => `<button type="button" data-act="tab" data-tab="${id}" class="${view.tab === id ? 'on' : ''}"${view.tab === id ? ' aria-current="page"' : ''}>
          <span>${label}</span>${id === 'talepler' && n ? `<span class="badge" aria-label="${n} okunmamış">${n}</span>` : ''}</button>`).join('')}</nav>
        <div class="a-side-foot"><a href="${M.href('/')}">Siteyi görüntüle <span aria-hidden="true">→</span></a><button type="button" data-act="logout">Çıkış yap</button></div>
      </aside>
      <section class="a-main">${content()}</section>
    </div>`;
  }

  function content() {
    if (view.edit) return view.edit.kind === 'area' ? areaForm() : postForm();
    switch (view.tab) {
      case 'alanlar': return areasList();
      case 'yazilar': return postsList();
      case 'buro': return buroForm();
      case 'talepler': return requestsList();
      case 'ayarlar': return settingsView();
      default: return overview();
    }
  }

  function overview() {
    const s = st();
    const pa = s.areas.filter(a => a.published).length, pp = s.posts.filter(p => p.published).length;
    if (!reqCache) loadRequests();
    const recent = (reqCache || []).slice(0, 3);
    return `<div class="a-head"><div><h1>Genel bakış</h1><p class="muted">Yapılan değişiklikler kaydedildiği anda siteye yansır.</p></div></div>
      <div class="stats">
        <div class="stat"><span class="stat-n">${pa}<small> / ${s.areas.length}</small></span><span>yayındaki çalışma alanı</span></div>
        <div class="stat"><span class="stat-n">${pp}<small> / ${s.posts.length}</small></span><span>yayındaki blog yazısı</span></div>
        <div class="stat"><span class="stat-n">${unread()}</span><span>okunmamış ön görüşme talebi</span></div>
      </div>
      <p class="mode-note">${M.store.mode() === 'remote' ? 'Sunucu kipi: değişiklikler tüm ziyaretçiler için yayınlanır.' : 'Deneme kipi: değişiklikler yalnızca bu tarayıcıda saklanır.'}</p>
      ${M.store.available() ? '' : `<p class="f-err">Tarayıcı yerel depolamaya izin vermiyor; değişiklikler sayfa kapanınca kaybolur.</p>`}
      <div class="a-quick">
        <button type="button" class="btn btn-brass" data-act="new" data-kind="area">Yeni çalışma alanı</button>
        <button type="button" class="btn btn-line" data-act="new" data-kind="post">Yeni blog yazısı</button>
        <button type="button" class="btn btn-line" data-act="tab" data-tab="buro">Büro bilgilerini düzenle</button>
      </div>
      <h2 class="a-h2">Son talepler</h2>
      ${recent.length ? recent.map(reqCard).join('') : `<p class="empty">Henüz talep yok. Sitedeki ön görüşme formu doldurulduğunda burada listelenir.</p>`}`;
  }

  function row(x, i, n, kind) {
    const path = (kind === 'area' ? '/calisma-alanlari/' : '/blog/') + x.slug;
    const href = esc(M.href(path));
    return `<div class="a-row">
      <div class="a-row-main"><p class="a-row-title">${esc(x.title)} ${pill(x.published)}</p>
        <p class="a-row-sub">${kind === 'area' ? `Adres: ${esc(path)}` : `${esc(x.category || 'Kategorisiz')} · ${esc(U.fmtDate(x.date))}`}</p></div>
      <div class="a-row-acts">
        ${kind === 'area' ? `<button type="button" class="ib" data-act="move" data-id="${esc(x.id)}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="${esc(x.title)} yukarı taşı">↑</button>
          <button type="button" class="ib" data-act="move" data-id="${esc(x.id)}" data-dir="1" ${i === n - 1 ? 'disabled' : ''} aria-label="${esc(x.title)} aşağı taşı">↓</button>` : ''}
        <button type="button" class="btn btn-sm btn-line" data-act="edit" data-kind="${kind}" data-id="${esc(x.id)}">Düzenle</button>
        <button type="button" class="btn btn-sm btn-line" data-act="toggle" data-kind="${kind}" data-id="${esc(x.id)}">${x.published ? 'Yayından kaldır' : 'Yayınla'}</button>
        ${x.published ? `<a class="btn btn-sm btn-line" href="${href}">Görüntüle</a>` : ''}
        <button type="button" class="btn btn-sm btn-danger" data-act="del" data-kind="${kind}" data-id="${esc(x.id)}">Sil</button>
      </div></div>`;
  }

  function areasList() {
    const a = st().areas;
    return `<div class="a-head"><div><h1>Çalışma alanları</h1><p class="muted">Buradaki sıra, sitedeki çalışma alanı sırasını belirler.</p></div>
      <button type="button" class="btn btn-brass" data-act="new" data-kind="area">Yeni çalışma alanı</button></div>
      <div class="a-list">${a.length ? a.map((x, i) => row(x, i, a.length, 'area')).join('') : `<p class="empty">Henüz çalışma alanı yok.</p>`}</div>`;
  }

  function postsList() {
    const p = st().posts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return `<div class="a-head"><div><h1>Blog yazıları</h1><p class="muted">Yazılar sitede tarihe göre, en yeniden eskiye sıralanır.</p></div>
      <button type="button" class="btn btn-brass" data-act="new" data-kind="post">Yeni blog yazısı</button></div>
      <div class="a-list">${p.length ? p.map((x, i) => row(x, i, p.length, 'post')).join('') : `<p class="empty">Henüz blog yazısı yok.</p>`}</div>`;
  }

  function editHead(title) {
    return `<div class="a-head"><div><button type="button" class="link" data-act="cancel"><span aria-hidden="true">←</span> Listeye dön</button><h1>${title}</h1></div></div>`;
  }
  const formEnd = `<p class="f-err" role="alert" hidden></p>
    <div class="a-actions"><button class="btn btn-brass" type="submit">Kaydet</button><button type="button" class="btn btn-line" data-act="cancel">Vazgeç</button></div>`;

  function areaForm() {
    const x = view.edit.id ? st().areas.find(a => a.id === view.edit.id) : { title: '', slug: '', summary: '', scope: '', topics: [], notes: '', published: true, featured: false };
    if (!x) { view.edit = null; return areasList(); }
    return `${editHead(view.edit.id ? 'Çalışma alanını düzenle' : 'Yeni çalışma alanı')}
      <form id="edit-form" class="a-form" data-kind="area" novalidate>
        ${field('title', 'Başlık', x.title, { required: true, attrs: 'maxlength="80" data-slug-src' })}
        ${field('slug', 'Sayfa adresi', x.slug, { attrs: `maxlength="80" data-slug ${view.edit.id ? 'data-touched="1"' : ''}`, hint: 'Sayfa adresi /calisma-alanlari/… biçiminde oluşur. Başlıktan otomatik üretilir; yalnızca küçük harf, rakam ve tire.' })}
        ${tarea('summary', 'Kısa özet (kartta ve sayfa girişinde görünür)', x.summary, 3)}
        ${tarea('scope', 'Kapsam', x.scope, 7, FORMAT_HINT)}
        ${tarea('topics', 'Sık karşılaşılan hukuki konular (her satıra bir konu)', (x.topics || []).join('\n'), 7)}
        ${tarea('notes', 'Bilgilendirme notları', x.notes, 12, FORMAT_HINT)}
        <label class="check"><input type="checkbox" name="published" ${x.published ? 'checked' : ''}><span>Sitede yayımla</span></label>
        ${formEnd}
      </form>`;
  }

  function postForm() {
    const x = view.edit.id ? st().posts.find(p => p.id === view.edit.id) : { title: '', slug: '', category: '', date: U.today(), summary: '', body: '', published: true };
    if (!x) { view.edit = null; return postsList(); }
    const cats = [...new Set([...st().areas.map(a => a.title), ...st().posts.map(p => p.category)].filter(Boolean))];
    return `${editHead(view.edit.id ? 'Blog yazısını düzenle' : 'Yeni blog yazısı')}
      <form id="edit-form" class="a-form" data-kind="post" novalidate>
        ${field('title', 'Başlık', x.title, { required: true, attrs: 'maxlength="140" data-slug-src' })}
        ${field('slug', 'Sayfa adresi', x.slug, { attrs: `maxlength="80" data-slug ${view.edit.id ? 'data-touched="1"' : ''}`, hint: 'Sayfa adresi /blog/… biçiminde oluşur.' })}
        <div class="f-2">
          ${field('category', 'Kategori', x.category, { attrs: 'list="cat-list" maxlength="80"', hint: 'Çalışma alanı adıyla aynı yazılırsa yazı o alanın sayfasında “İlgili yazılar” bölümünde de görünür.' })}
          ${field('date', 'Yayın tarihi', x.date, { type: 'date' })}
        </div>
        <datalist id="cat-list">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
        ${tarea('summary', 'Özet', x.summary, 3)}
        ${tarea('body', 'Tam metin', x.body, 16, FORMAT_HINT)}
        <label class="check"><input type="checkbox" name="published" ${x.published ? 'checked' : ''}><span>Sitede yayımla</span></label>
        ${formEnd}
      </form>`;
  }

  function buroForm() {
    const s = st().settings;
    return `<div class="a-head"><div><h1>Büro ve iletişim bilgileri</h1><p class="muted">Ana Sayfa, Hakkımızda, İletişim sayfası ve footer bu bilgileri kullanır.</p></div></div>
      <form id="buro-form" class="a-form" novalidate>
        <fieldset><legend>Kimlik</legend>
          <div class="f-2 f-2-narrow">${field('title', 'Unvan', s.title, { attrs: 'maxlength="10"' })}${field('name', 'Avukat adı soyadı', s.name, { required: true, attrs: 'maxlength="80"' })}</div>
          ${field('firmName', 'Büro adı', s.firmName, { required: true, attrs: 'maxlength="100"' })}
          ${field('brandSub', 'Logo yanındaki alt satır', s.brandSub, { attrs: 'maxlength="40"' })}
        </fieldset>
        <fieldset><legend>İletişim</legend>
          <div class="f-2">${field('phone', 'Telefon', s.phone, { type: 'tel', required: true, hint: 'Yalnızca İletişim sayfasında ve altbilgi künyesinde görünür.' })}${field('email', 'E-posta', s.email, { type: 'email', required: true })}</div>
          ${tarea('address', 'Büro adresi (İletişim sayfası, footer ve harita için kullanılır)', s.address, 2)}
          ${field('addressNote', 'Adresin altındaki kısa not (isteğe bağlı)', s.addressNote, { attrs: 'maxlength="160"', hint: 'Örnek: Binanın arka girişini kullanınız. Boş bırakılırsa gösterilmez.' })}
          ${field('mapLink', 'Haritada görüntüle bağlantısı (isteğe bağlı)', s.mapLink, { type: 'url', attrs: 'placeholder="https://maps.app.goo.gl/..." maxlength="500"', hint: 'Google Haritalar’da büronuzu bulup “Paylaş > Bağlantıyı kopyala” ile alınan adres. Boş bırakılırsa adres üzerinden arama bağlantısı oluşturulur.' })}
          ${tarea('mapEmbed', 'Harita yerleştirme kodu (isteğe bağlı)', s.mapEmbed, 3, 'Google Haritalar’da “Paylaş > Harita yerleştirin > HTML’yi kopyala” ile alınan &lt;iframe&gt; kodunu yapıştırın. Boş bırakılırsa harita yazdığınız adrese göre otomatik gösterilir.')}
          ${field('workingHours', 'Çalışma saatleri', s.workingHours, { attrs: 'maxlength="100"' })}
          ${tarea('officeNote', 'İletişim sayfası giriş metni', s.officeNote, 3)}
        </fieldset>
        <fieldset><legend>Ana Sayfa</legend>
          <div class="f-row"><span class="f-label">Giriş görseli</span>
            <div class="img-pick">
              <div class="img-prev" id="hero-prev"><img src="${esc(s.heroImage || M.HERO_DEFAULT)}" alt="Giriş görseli önizlemesi"></div>
              <div class="img-acts">
                <label class="btn btn-line btn-sm" for="ad-heroFile">Görsel seç</label>
                <input id="ad-heroFile" type="file" accept="image/*" class="sr-only">
                <button type="button" class="btn btn-line btn-sm" data-act="hero-clear">Hazır görsele dön</button>
              </div>
              <small class="hint">Ana sayfanın üstünde tam genişlikte görünür. Yatay, sakin tonlu bir büro fotoğrafı önerilir; görsel otomatik olarak küçültülür ve üzerine okuma için koyu bir geçiş eklenir.</small>
            </div></div>
          ${field('heroSub', 'Başlığın üstündeki kısa satır', s.heroSub, { attrs: 'maxlength="60"' })}
          ${tarea('heroLead', 'Başlığın altındaki tanıtım cümlesi', s.heroLead, 2)}
          ${field('homeTitle', 'Tanıtım bölümü başlığı', s.homeTitle, { attrs: 'maxlength="120"' })}
          ${tarea('homeText', 'Tanıtım metni', s.homeText, 8, FORMAT_HINT)}
        </fieldset>
        <fieldset><legend>Hakkımızda</legend>
          ${field('aboutTitle', 'Başlık', s.aboutTitle, { attrs: 'maxlength="120"' })}
          ${tarea('aboutText', 'Metin', s.aboutText, 12, FORMAT_HINT)}
          ${tarea('principles', 'Çalışma ilkeleri (her satıra: Başlık | Açıklama)', (s.principles || []).map(p => `${p.t} | ${p.d}`).join('\n'), 4)}
        </fieldset>
        <fieldset><legend>Yasal metinler</legend>
          ${tarea('kvkkText', 'KVKK aydınlatma metni', s.kvkkText, 10, FORMAT_HINT)}
        </fieldset>
        <p class="f-err" role="alert" hidden></p>
        <div class="a-actions"><button class="btn btn-brass" type="submit">Bilgileri kaydet</button></div>
      </form>`;
  }

  function reqCard(r) {
    const s = st().settings;
    const reply = `Sayın ${r.ad}, ${r.konu} konusundaki ön görüşme talebiniz için teşekkür ederiz.`;
    return `<article class="req${r.read ? '' : ' unread'}">
      <div class="req-top"><p class="req-name">${esc(r.ad)} ${r.read ? '' : '<span class="pill on">Yeni</span>'}</p><time>${esc(U.fmtDateTime(r.at))}</time></div>
      <p class="req-meta">${esc(r.konu)} · <a href="${esc(U.telHref(r.tel))}">${esc(U.fmtPhone(r.tel))}</a>${r.eposta ? ` · <a href="${esc(U.mailHref(r.eposta))}">${esc(r.eposta)}</a>` : ''}</p>
      <p class="req-msg">${esc(r.mesaj)}</p>
      <div class="a-row-acts">
        <a class="btn btn-sm btn-line" href="${esc(U.waHref(r.tel, reply))}" target="_blank" rel="noopener noreferrer">WhatsApp ile yanıtla</a>
        ${r.eposta ? `<a class="btn btn-sm btn-line" href="${esc(U.mailHref(r.eposta, 'Ön görüşme talebiniz – ' + s.firmName, reply))}">E-posta ile yanıtla</a>` : ''}
        <button type="button" class="btn btn-sm btn-line" data-act="req-read" data-id="${esc(r.id)}">${r.read ? 'Okunmadı yap' : 'Okundu işaretle'}</button>
        <button type="button" class="btn btn-sm btn-danger" data-act="del" data-kind="req" data-id="${esc(r.id)}">Sil</button>
      </div></article>`;
  }

  function requestsList() {
    if (!reqCache) loadRequests();
    const r = reqCache || [];
    const remote = M.store.mode() === 'remote';
    return `<div class="a-head"><div><h1>Ön görüşme talepleri</h1>
      <p class="muted">${remote ? 'Ziyaretçi formundan gelen talepler sunucuda saklanır.' : 'Deneme kipinde talepler yalnızca formun doldurulduğu tarayıcıda saklanır; ziyaretçi talebi WhatsApp veya e-posta ile ayrıca iletir.'}
      Veri minimizasyonu gereği talepler ${SCHEMA.REQUEST_TTL_DAYS} gün sonra otomatik silinir; işi biten talepleri silmeniz önerilir.</p></div></div>
      ${reqCache ? (r.length ? r.map(reqCard).join('') : `<p class="empty">Henüz talep yok.</p>`) : '<p class="empty">Yükleniyor…</p>'}`;
  }

  function settingsView() {
    const a = st().auth;
    const remote = A().mode === 'remote';
    return `<div class="a-head"><div><h1>Güvenlik ve veri</h1></div></div>
      <section class="a-card"><h2 class="a-h2">Giriş bilgileri</h2>
      ${remote ? `<p class="muted">Sunucu kipinde kullanıcı adı ve parola özeti hosting panelindeki ortam değişkenlerinde (<code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD_HASH</code>) tutulur. Parolayı değiştirmek için <code>npm run hash-password</code> ile yeni özet üretip ortam değişkenini güncelleyin.</p>`
      : `<p class="muted">${a.hash ? 'Özel giriş bilgileri tanımlı.' : 'Şu anda demo giriş bilgileri kullanılıyor; lütfen değiştirin.'} Parola, PBKDF2-SHA256 (210.000 tur, rastgele tuz) ile özetlenerek saklanır.</p>
        <form id="cred-form" class="a-form" novalidate>
          <div class="f-row"><label for="ad-cur">Mevcut şifre</label><input id="ad-cur" name="cur" type="password" autocomplete="current-password" required maxlength="200"></div>
          ${field('nuser', 'Yeni kullanıcı adı', a.user, { required: true, attrs: 'autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="40" pattern="[A-Za-z0-9._-]{3,40}"' })}
          <div class="f-2">
            <div class="f-row"><label for="ad-np">Yeni şifre</label><input id="ad-np" name="np" type="password" autocomplete="new-password" required minlength="12" maxlength="200"><small class="hint">En az 12 karakter; büyük harf, küçük harf, rakam ve sembolden en az üçü.</small></div>
            <div class="f-row"><label for="ad-np2">Yeni şifre (tekrar)</label><input id="ad-np2" name="np2" type="password" autocomplete="new-password" required maxlength="200"></div>
          </div>
          <p class="f-err" role="alert" hidden></p>
          <div class="a-actions"><button class="btn btn-brass" type="submit">Giriş bilgilerini güncelle</button></div>
        </form>`}</section>
      <section class="a-card"><h2 class="a-h2">Yedekleme</h2>
        <p class="muted">Site içeriğini (büro bilgileri, çalışma alanları, yazılar) JSON olarak kopyalayın; başka bir tarayıcıda veya yayındaki sitede “Yedekten geri yükle” ile aktarın. Giriş bilgileri yedeğe dahil edilmez.</p>
        <div class="a-actions"><button type="button" class="btn btn-line" data-act="copy-backup">Yedeği panoya kopyala</button></div>
        <div id="backup-out"></div>
        <form id="import-form" class="a-form" novalidate>
          ${tarea('json', 'Yedekten geri yükle (JSON metnini yapıştırın)', '', 5)}
          <p class="f-err" role="alert" hidden></p>
          <div class="a-actions"><button class="btn btn-line" type="submit">Yedeği içe aktar</button></div>
        </form></section>
      <section class="a-card danger-zone"><h2 class="a-h2">Varsayılan içeriklere sıfırla</h2>
        <p class="muted">Tüm büro bilgileri, çalışma alanları ve yazılar başlangıçtaki örnek içeriklere döner. Giriş bilgileri ve gelen talepler korunur.</p>
        <div class="a-actions"><button type="button" class="btn btn-danger" data-act="reset">Varsayılan İçeriklere Sıfırla</button></div></section>`;
  }

  /* ---------- Kaydetme işlemleri ---------- */
  function formErr(form, msg) { const e = form.querySelector('.f-err'); e.textContent = msg; e.hidden = !msg; if (msg) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }

  async function saveEdit(form) {
    const kind = form.dataset.kind;
    const fd = new FormData(form);
    const g = k => String(fd.get(k) || '');
    const title = SCHEMA.str(g('title'), kind === 'area' ? 100 : 160);
    const slug = U.slugify(g('slug') || title);
    if (!title) return formErr(form, 'Başlık boş bırakılamaz.');
    if (!slug) return formErr(form, 'Geçerli bir sayfa adresi oluşturulamadı; başlığı veya adresi kontrol edin.');
    const id = view.edit.id;
    if (coll(st(), kind).some(o => o.slug === slug && o.id !== id)) return formErr(form, 'Bu sayfa adresi başka bir kayıtta kullanılıyor.');
    const draft = kind === 'area'
      ? { id: id || U.uid(), title, slug, summary: g('summary'), scope: g('scope'), topics: g('topics').split('\n'), notes: g('notes'), published: fd.get('published') === 'on', featured: false }
      : { id: id || U.uid(), title, slug, category: g('category'), date: g('date') || U.today(), summary: g('summary'), body: g('body'), published: fd.get('published') === 'on' };
    const rec = kind === 'area' ? SCHEMA.area(draft) : SCHEMA.post(draft);
    if (!rec) return formErr(form, kind === 'post' ? 'Başlık ve geçerli bir yayın tarihi gereklidir.' : 'Başlık ve sayfa adresi gereklidir.');
    const saved = await guarded(() => M.store.update(s => {
      const L = coll(s, kind);
      const cur = id && L.find(o => o.id === id);
      if (cur) Object.assign(cur, rec, { featured: cur.featured }); else L.push(rec);
    }));
    if (!saved) return;
    view.edit = null;
    rerender(true);
    U.toast(rec.published ? 'Kaydedildi ve sitede yayında.' : 'Taslak olarak kaydedildi.');
  }

  async function saveBuro(form) {
    const fd = new FormData(form);
    const g = k => String(fd.get(k) || '');
    const raw = {};
    ['title', 'name', 'firmName', 'brandSub', 'phone', 'email', 'address', 'addressNote', 'mapLink', 'mapEmbed', 'workingHours', 'officeNote', 'heroSub', 'heroLead', 'homeTitle', 'homeText', 'aboutTitle', 'aboutText', 'kvkkText'].forEach(k => { raw[k] = g(k); });
    const errors = SCHEMA.validateSettingsInput(raw);
    if (errors.length) return formErr(form, errors[0]);
    raw.principles = g('principles').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const i = l.indexOf('|');
      return i < 0 ? { t: l, d: '' } : { t: l.slice(0, i).trim(), d: l.slice(i + 1).trim() };
    });
    if (pendingHero !== null && pendingHero !== '' && !SCHEMA.image(pendingHero)) return formErr(form, 'Görsel çok büyük veya desteklenmeyen bir biçimde. Lütfen JPEG/PNG/WebP biçiminde daha küçük bir görsel seçin.');
    const cur = st().settings;
    raw.heroImage = pendingHero !== null ? pendingHero : cur.heroImage;
    const next = SCHEMA.settings(raw, cur);
    const saved = await guarded(() => M.store.update(s => { s.settings = next; }));
    if (!saved) return;
    if (!M.store.available() && pendingHero) {
      await M.store.update(s => { s.settings.heroImage = ''; });
      pendingHero = null;
      rerender();
      return U.toast('Görsel tarayıcı depolama sınırını aştı; daha küçük bir görsel seçin. Diğer bilgiler kaydedildi.');
    }
    pendingHero = null;
    formErr(form, '');
    U.toast('Büro bilgileri kaydedildi ve siteye yansıdı.');
  }

  async function saveCred(form) {
    const fd = new FormData(form);
    const g = k => String(fd.get(k) || '');
    if (g('np') !== g('np2')) return formErr(form, 'Yeni şifreler birbiriyle eşleşmiyor.');
    const res = await A().changeCredentials(g('cur'), g('nuser').trim(), g('np'));
    if (!res.ok) return formErr(form, res.error);
    rerender();
    U.toast('Giriş bilgileri güncellendi.');
  }

  function doImport(form) {
    const raw = String(new FormData(form).get('json') || '').trim();
    if (!raw) return formErr(form, 'Lütfen yedek metnini yapıştırın.');
    let obj;
    try { obj = JSON.parse(raw); } catch (e) { return formErr(form, 'Metin geçerli bir JSON değil.'); }
    if (raw.length > 4000000) return formErr(form, 'Yedek metni çok büyük.');
    U.confirm({ title: 'Yedeği içe aktar', text: 'Mevcut büro bilgileri, çalışma alanları ve yazılar yedekteki içerikle değiştirilecek. Yedekteki her alan doğrulanır; geçersiz kayıtlar alınmaz.', ok: 'İçe aktar' }).then(async yes => {
      if (!yes) return;
      let r = null;
      const ok = await guarded(async () => { r = await M.store.importContent(obj); });
      if (!ok || !r) return;
      rerender();
      U.toast(`İçe aktarıldı: ${r.areas} çalışma alanı, ${r.posts} blog yazısı.`);
    });
  }

  /* ---------- Olaylar ---------- */
  async function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const { act, kind, id } = b.dataset;
    if (act === 'reveal') {
      const inp = document.getElementById(b.getAttribute('aria-controls'));
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      b.textContent = show ? 'Gizle' : 'Göster';
      return;
    }
    if (act === 'hero-clear') {
      pendingHero = '';
      appEl.querySelector('#hero-prev').innerHTML = `<img src="${esc(M.HERO_DEFAULT)}" alt="Giriş görseli önizlemesi">`;
      U.toast('Kaydettiğinizde hazır görsel kullanılır.');
      return;
    }
    if (act === 'tab') { pendingHero = null; if (b.dataset.tab === 'talepler') reqCache = null; view = { tab: b.dataset.tab, edit: null }; return rerender(true); }
    if (act === 'logout') { await A().logout(); reqCache = null; view = { tab: 'ozet', edit: null }; rerender(true); return U.toast('Çıkış yapıldı. Tekrar düzenleme yapmak için giriş yapın.'); }
    if (!authed()) { rerender(true); return U.toast('Oturum süresi doldu; lütfen yeniden giriş yapın.'); }
    if (act === 'new') { view = { tab: kind === 'area' ? 'alanlar' : 'yazilar', edit: { kind, id: null } }; return rerender(true); }
    if (act === 'edit') { view.edit = { kind, id }; return rerender(true); }
    if (act === 'cancel') { view.edit = null; return rerender(true); }
    if (act === 'toggle') {
      let on;
      if (!await guarded(() => M.store.update(s => { const o = coll(s, kind).find(o => o.id === id); if (o) { o.published = !o.published; on = o.published; } }))) return;
      rerender();
      return U.toast(on ? 'Yayına alındı.' : 'Yayından kaldırıldı; kayıt taslak olarak duruyor.');
    }
    if (act === 'move') {
      const d = +b.dataset.dir;
      if (!await guarded(() => M.store.update(s => { const L = s.areas, i = L.findIndex(o => o.id === id), j = i + d; if (i < 0 || j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; }))) return;
      rerender();
      const again = appEl.querySelector(`[data-act="move"][data-id="${CSS.escape(id)}"][data-dir="${d}"]:not([disabled])`);
      if (again) again.focus();
      return;
    }
    if (act === 'req-read') {
      const item = (reqCache || []).find(r => r.id === id);
      if (!item) return;
      if (!await guarded(() => R().setRead(id, !item.read))) return;
      item.read = !item.read;
      return rerender();
    }
    if (act === 'del') {
      const item = kind === 'req' ? (reqCache || []).find(o => o.id === id) : coll(st(), kind).find(o => o.id === id);
      if (!item) return;
      const name = item.title || item.ad;
      const yes = await U.confirm({ title: 'Kaydı sil', text: `“${name}” kalıcı olarak silinecek. Bu işlem geri alınamaz.`, ok: 'Sil', danger: true });
      if (!yes) return;
      const done = kind === 'req'
        ? await guarded(async () => { await R().remove(id); reqCache = reqCache.filter(r => r.id !== id); })
        : await guarded(() => M.store.update(s => { const L = coll(s, kind); const i = L.findIndex(o => o.id === id); if (i > -1) L.splice(i, 1); }));
      if (!done) return;
      rerender();
      return U.toast('Silindi.');
    }
    if (act === 'copy-backup') {
      const json = JSON.stringify(M.store.exportContent(), null, 2);
      const out = appEl.querySelector('#backup-out');
      const showBox = () => { out.innerHTML = `<div class="f-row"><label for="ad-bk">Yedek metni (seçip kopyalayın)</label><textarea id="ad-bk" rows="6" readonly>${esc(json)}</textarea></div>`; out.querySelector('textarea').select(); };
      try {
        await navigator.clipboard.writeText(json);
        U.toast('Yedek panoya kopyalandı.');
      } catch (err) { showBox(); U.toast('Otomatik kopyalama desteklenmedi; metni elle kopyalayın.'); }
      return;
    }
    if (act === 'reset') {
      const yes = await U.confirm({ title: 'Varsayılan içeriklere sıfırla', text: 'Yaptığınız tüm içerik değişiklikleri silinecek ve başlangıçtaki örnek içerikler geri yüklenecek. Giriş bilgileri ve talepler korunur.', ok: 'Sıfırla', danger: true });
      if (!yes) return;
      if (!await guarded(() => M.store.reset())) return;
      view = { tab: 'ozet', edit: null };
      rerender(true);
      return U.toast('Varsayılan içerikler geri yüklendi.');
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'login-form') {
      const fd = new FormData(f);
      const btn = f.querySelector('button[type=submit]');
      btn.disabled = true;
      const res = await A().login(String(fd.get('user') || ''), String(fd.get('pass') || ''));
      btn.disabled = false;
      f.querySelector('#ad-pass').value = '';
      if (!res.ok) return formErr(f, res.retryAfter ? `${res.error} (yaklaşık ${Math.max(1, Math.ceil(res.retryAfter / 60))} dk)` : res.error);
      view = { tab: 'ozet', edit: null };
      reqCache = null;
      rerender(true);
      return U.toast('Hoş geldiniz.');
    }
    if (!authed()) { rerender(true); return U.toast('Oturum süresi doldu; lütfen yeniden giriş yapın.'); }
    if (f.id === 'edit-form') return saveEdit(f);
    if (f.id === 'buro-form') return saveBuro(f);
    if (f.id === 'cred-form') return saveCred(f);
    if (f.id === 'import-form') return doImport(f);
  }

  async function onChange(e) {
    const t = e.target;
    if (t.id !== 'ad-heroFile' || !t.files || !t.files[0]) return;
    try {
      const file = t.files[0];
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 15 * 1024 * 1024) { t.value = ''; return U.toast('Lütfen 15 MB’tan küçük bir JPEG, PNG veya WebP görsel seçin.'); }
      let data = await U.shrinkImage(file, 1920, 0.72);
      if (!SCHEMA.image(data)) data = await U.shrinkImage(file, 1400, 0.65);
      if (!SCHEMA.image(data)) { t.value = ''; return U.toast('Görsel küçültüldükten sonra da çok büyük; daha sade bir görsel seçin.'); }
      pendingHero = data;
      appEl.querySelector('#hero-prev').innerHTML = `<img src="${esc(pendingHero)}" alt="Giriş görseli önizlemesi">`;
      U.toast('Görsel hazır. Uygulamak için “Bilgileri kaydet”e basın.');
    } catch (err) { U.toast('Görsel işlenemedi.'); }
  }

  function onInput(e) {
    const t = e.target;
    if (t.matches('[data-slug]')) { t.dataset.touched = '1'; return; }
    if (t.matches('[data-slug-src]')) {
      const s = t.form.querySelector('[data-slug]');
      if (s && !s.dataset.touched) s.value = U.slugify(t.value);
    }
  }

  function rerender(toTop) {
    M.admin.render(appEl);
    if (toTop) window.scrollTo(0, 0);
  }

  M.admin = {
    render(el) {
      appEl = el;
      el.innerHTML = `<div class="admin-root">${authed() ? panel() : login()}</div>`;
      const root = el.firstElementChild;
      root.addEventListener('click', onClick);
      root.addEventListener('submit', onSubmit);
      root.addEventListener('input', onInput);
      root.addEventListener('change', onChange);
      const first = root.querySelector('#ad-user');
      if (first && !authed()) first.focus({ preventScroll: true });
    },
    isEditing() { return !!view.edit; }
  };
})(window.MRA);
