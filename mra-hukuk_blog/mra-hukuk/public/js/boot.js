/* =========================================================
   boot.js — Erken yapılandırma (head içinde, stil dosyasından önce)
   - router: büronun kendi alan adında / Netlify'da gerçek adresler (history),
             dosyadan veya önizleme çerçevesinde #/ adresleri (hash)
   - tryServer: API (Netlify Functions) yalnızca kendi alan adında denenir
   Satır içi betik kullanılmaz; CSP "script-src 'self'" ile uyumludur.
   ========================================================= */
(function () {
  var top = true;
  try { top = window.self === window.top; } catch (e) { top = false; }
  var host = location.hostname;
  var http = /^https?:$/.test(location.protocol);
  var ownSite = /(^|\.)akbuluthukukburosu\.com$/.test(host) || /\.netlify\.app$/.test(host) || host === 'localhost' || host === '127.0.0.1';
  var history = http && top && ownSite;
  window.MRA_CONFIG = Object.freeze({
    router: history ? 'history' : 'hash',
    tryServer: http && ownSite,
    debug: host === 'localhost' || host === '127.0.0.1'
  });
  if (history) {
    var b = document.createElement('base');
    b.href = '/';
    document.head.appendChild(b);
  }
})();
