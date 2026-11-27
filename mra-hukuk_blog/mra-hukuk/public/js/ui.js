/* =========================================================
   ui.js — Ortak yardımcılar ve görsel bileşenler
   - Güvenli metin (escape), basit metin biçimlendirme
   - Telefon / WhatsApp / e-posta bağlantıları
   - MRA logosu (SVG) ve hero cephe illüstrasyonu (SVG)
   - Bildirim (toast) ve onay penceresi
   ========================================================= */
(function (M) {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ESC[c]);

  const TR = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'i̇': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  const slugify = s => String(s || '').toLocaleLowerCase('tr-TR')
    .replace(/i̇/g, 'i').replace(/[çğıöşüâîû]/g, c => TR[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

  /* Biçim: boş satır = paragraf, "## " = ara başlık, "- " = madde */
  function rich(text) {
    return String(text || '').trim().split(/\n\s*\n/).map(block => {
      const lines = block.split('\n').map(l => l.trimEnd());
      if (lines.length === 1 && /^##\s+/.test(lines[0])) return `<h3>${esc(lines[0].replace(/^##\s+/, ''))}</h3>`;
      if (/^##\s+/.test(lines[0])) {
        return `<h3>${esc(lines[0].replace(/^##\s+/, ''))}</h3>` + rich(lines.slice(1).join('\n'));
      }
      if (lines.every(l => /^[-•]\s+/.test(l))) return `<ul>${lines.map(l => `<li>${esc(l.replace(/^[-•]\s+/, ''))}</li>`).join('')}</ul>`;
      return `<p>${lines.map(esc).join('<br>')}</p>`;
    }).join('');
  }

  const digits = p => String(p || '').replace(/\D/g, '');
  function local10(p) {
    let d = digits(p);
    if (d.length === 12 && d.startsWith('90')) d = d.slice(2);
    if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
    return d;
  }
  function fmtPhone(p) {
    const d = local10(p);
    return d.length === 10 ? `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}` : String(p || '');
  }
  /* Bağlantılar yalnızca doğrulanmış değerlerden üretilir; geçersizse '#' döner */
  const SCHEMA = globalThis.MRA_SCHEMA;
  const telHref = p => { const d = SCHEMA.phone10(p); return d ? `tel:+90${d}` : '#'; };
  const waHref = (p, text) => { const d = SCHEMA.phone10(p); return d ? `https://wa.me/90${d}${text ? '?text=' + encodeURIComponent(String(text).slice(0, 1800)) : ''}` : '#'; };
  const mailHref = (e, subject, body) => {
    const addr = SCHEMA.email(e);
    if (!addr) return '#';
    const q = [];
    if (subject) q.push('subject=' + encodeURIComponent(String(subject).slice(0, 200)));
    if (body) q.push('body=' + encodeURIComponent(String(body).slice(0, 1800)));
    return `mailto:${encodeURIComponent(addr).replace('%40', '@')}${q.length ? '?' + q.join('&') : ''}`;
  };
  const safeHref = v => (SCHEMA.isSafeHref(v) ? String(v).trim() : '#');

  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : '';
  }
  function fmtDateTime(ts) {
    const d = new Date(ts);
    if (isNaN(d)) return '';
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
  }

  /* Büro logosu: monogram (240×213) veya tam logo (520×627), şeffaf PNG */
  function logo(cls, variant) {
    const full = variant === 'full';
    return `<img class="${cls || 'mono-mark'}" src="${esc(full ? M.ASSETS.full : M.ASSETS.mono)}" width="${full ? 520 : 240}" height="${full ? 627 : 213}" alt="${full ? 'MRA — Mehmet Raşit Akbulut Hukuk &amp; Danışmanlık logosu' : ''}"${full ? '' : ' aria-hidden="true"'}>`;
  }

  /* Yüklenen görseli küçültüp sıkıştırır (localStorage sınırı için) */
  function shrinkImage(file, maxW, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Dosya okunamadı.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Görsel açılamadı.'));
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const safeUrl = raw => SCHEMA.safeUrl(raw);
  const extractMapSrc = raw => SCHEMA.mapEmbedSrc(raw);
  function mapInfo(s) {
    const addr = String(s.address || '').trim();
    const custom = extractMapSrc(s.mapEmbed);
    const embed = custom || (addr ? `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&z=16&output=embed` : '');
    const link = safeUrl(s.mapLink);
    const view = link ? link.href : (addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : '');
    const route = addr ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}` : view;
    return { embed, view, route };
  }

  /* Bildirim */
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  /* Onay penceresi (tarayıcı confirm() yerine) */
  function confirmDialog({ title, text, ok = 'Onayla', cancel = 'Vazgeç', danger = false }) {
    return new Promise(resolve => {
      const root = document.getElementById('dialog-root');
      const prev = document.activeElement;
      root.innerHTML = `<div class="dlg-back"><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">
        <h2 id="dlg-t">${esc(title)}</h2><p id="dlg-d">${esc(text)}</p>
        <div class="dlg-acts"><button type="button" class="btn btn-line" data-r="0">${esc(cancel)}</button>
        <button type="button" class="btn ${danger ? 'btn-danger-solid' : 'btn-brass'}" data-r="1">${esc(ok)}</button></div></div></div>`;
      const close = v => {
        root.innerHTML = '';
        document.removeEventListener('keydown', onKey);
        if (prev && prev.focus) prev.focus();
        resolve(v);
      };
      const onKey = e => { if (e.key === 'Escape') close(false); };
      document.addEventListener('keydown', onKey);
      root.querySelector('.dlg-back').addEventListener('click', e => {
        if (e.target.classList.contains('dlg-back')) return close(false);
        const b = e.target.closest('[data-r]');
        if (b) close(b.dataset.r === '1');
      });
      root.querySelector('[data-r="1"]').focus();
    });
  }

  M.ui = { esc, slugify, uid, today, rich, digits, local10, fmtPhone, telHref, waHref, mailHref, safeHref, fmtDate, fmtDateTime, logo, shrinkImage, extractMapSrc, mapInfo, safeUrl, toast, confirm: confirmDialog };
})(window.MRA);
