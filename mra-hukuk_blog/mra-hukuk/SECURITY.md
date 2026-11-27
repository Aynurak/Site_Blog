# Güvenlik Notu — Akbulut Hukuk & Danışmanlık Web Uygulaması

Bu belge, uygulamada alınan önlemleri ve bilinen sınırları açıklar. Hiçbir sistem için “kırılamaz” garantisi
verilemez; amaç, OWASP Top 10 ilkelerine göre katmanlı savunma (defense-in-depth) ile saldırı yüzeyini
küçültmek ve bir katman aşılsa bile diğerlerinin korumaya devam etmesidir.

## Mimari

```
Ziyaretçi tarayıcısı ──► public/ (statik ön yüz, CSP ile)
                     └─► /api/* (Netlify Functions) ──► Netlify Blobs (sunucu tarafı depo)
```

- **Okuma** herkese açıktır (`GET /api/content`).
- **Her yazma/güncelleme/silme** işlemi sunucuda oturum doğrulamasından geçer (`requireAdmin`).
  Tarayıcıdaki arayüzü gizlemek veya değiştirmek yetki kazandırmaz.
- Sunucu bulunamazsa uygulama **deneme (prototip) kipinde** çalışır; bu kip yalnızca önizleme içindir.

## Hangi açığa karşı ne önlem alındı

| Risk (OWASP) | Önlem | Dosya |
|---|---|---|
| **A01 Bozuk erişim kontrolü** | Tüm yazma uç noktalarında sunucu tarafı oturum kontrolü; talepler yalnızca yöneticiye açık; Admin bağlantısı menüde yok, `/admin` arama motorlarına kapalı (`X-Robots-Tag`, `robots.txt`) | `netlify/lib/auth.mjs`, `netlify/functions/*.mjs` |
| **A02 Kriptografik hatalar** | Parola `scrypt` (N=2¹⁵, r=8, p=1, 16 bayt tuz) ile özetlenir; düz metin hiçbir yerde saklanmaz. Oturum belirteci HMAC-SHA256 ile imzalanır. Karşılaştırmalar sabit sürelidir (`timingSafeEqual`). HSTS ile yalnızca HTTPS | `netlify/lib/auth.mjs`, `netlify.toml` |
| **A03 Enjeksiyon / XSS** | Tüm metinler render sırasında HTML-escape edilir; ham HTML kabul edilmez (`rich()` yalnızca paragraf/başlık/liste üretir). CSP `script-src 'self'`: satır içi ve yabancı betik çalışmaz. Kontrol ve yön karakterleri (RLO vb.) temizlenir | `public/js/ui.js`, `public/js/schema.js`, `netlify.toml` |
| **Tehlikeli bağlantı şemaları** | Bağlantılar yalnızca `https:`, `http:`, `tel:`, `mailto:` ile; `javascript:`/`data:` reddedilir. Telefon ve e-posta doğrulanmış değerden üretilir. Harita yalnızca Google / OpenStreetMap / Yandex “embed” adreslerinden; iframe kodunun içindeki yalnızca `src` alınır | `public/js/schema.js` (`safeUrl`, `isSafeHref`, `mapEmbedSrc`) |
| **CSRF** | Oturum çerezi `SameSite=Strict`; durum değiştiren isteklerde `Origin`/`Sec-Fetch-Site` kontrolü, özel `X-Requested-With` başlığı ve `application/json` zorunluluğu | `netlify/lib/http.mjs` (`assertSameOrigin`, `readJson`) |
| **A07 Kimlik doğrulama hataları** | IP başına 15 dk’da 10, kullanıcı adı başına 5 hatalı deneme sonrası kilit; tek tip hata mesajı (kullanıcı adı varlığı sızdırılmaz); rastgele gecikme; 2 saatlik oturum; çıkışta belirteç iptal listesine alınır | `netlify/functions/auth-login.mjs`, `auth-logout.mjs` |
| **Oturum çalınması** | Çerez `__Host-` önekli, `HttpOnly` (JavaScript okuyamaz), `Secure`, `Path=/` | `netlify/lib/auth.mjs` |
| **A04 / A08 Veri bütünlüğü** | Hem tarayıcıda hem sunucuda aynı şema (`schema.js`): bilinmeyen alanlar atılır, tipler zorlanır, uzunluklar sınırlanır, slug/tarih/telefon/e-posta biçimleri doğrulanır. Bozuk `localStorage` uygulamayı çökertmez, varsayılana düşer. İçerik güncellemelerinde sürüm numarası ile çakışma (409) kontrolü; bir önceki sürüm yedeklenir | `public/js/schema.js`, `public/js/store.js`, `netlify/lib/content.mjs` |
| **Spam / bot / kötüye kullanım** | Tuzak alan (honeypot), en az 3 sn doldurma süresi, IP başına saatte 5 mesaj, gövde boyutu sınırları (form 8 KB, giriş 2 KB, içerik 2,5 MB) | `netlify/functions/contact.mjs`, `netlify/lib/http.mjs` |
| **A05 Güvenlik yapılandırması** | Yalnızca `public/` yayınlanır (sunucu kodu, testler, `package.json` dışarıdan erişilemez). Eksik/zayıf ortam değişkeninde yönetim güvenli biçimde kapanır (503) | `netlify.toml`, `netlify/lib/config.mjs` |
| **Gizli anahtar sızıntısı** | Gizli değerler yalnızca ortam değişkenlerinde (`.env.example` şablonu); `.env` depoya alınmaz (`.gitignore`) | `.env.example`, `.gitignore` |
| **A09 Hata/bilgi sızıntısı** | İstemciye yalnızca genel hata mesajı; yığın izi (stack trace) yalnızca sunucu günlüğüne | `netlify/lib/http.mjs` (`internal`), `public/js/app.js` (`reportError`) |
| **Clickjacking** | `X-Frame-Options: DENY` ve CSP `frame-ancestors 'none'` | `netlify.toml` |
| **KVKK / veri minimizasyonu** | Formda yalnızca ad, telefon, isteğe bağlı e-posta, konu ve mesaj; talepler 90 gün sonra otomatik silinir; hız sınırlamada ham IP değil SHA-256 özeti tutulur | `public/js/schema.js`, `netlify/lib/ratelimit.mjs` |

## HTTP güvenlik başlıkları (`netlify.toml`)

| Başlık | Değer | Amaç |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-src` (yalnızca harita sağlayıcıları)`; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests` | Yetkisiz betik, stil, çerçeve ve bağlantıları engeller |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME türü tahmini saldırıları |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Adres bilgisi sızıntısı |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS zorunluluğu |
| `Permissions-Policy` | kamera, mikrofon, konum, ödeme kapalı | Gereksiz tarayıcı yetkileri |
| `Cross-Origin-Opener-Policy` | `same-origin` | Pencereler arası saldırılar |

## Testler

`npm test` — 11 sunucu testi: yapılandırma eksikliği, scrypt doğrulama, deneme kilidi, güvenli çerez bayrakları,
CSRF reddi, sahte/değiştirilmiş çerez, tehlikeli bağlantı ve yabancı alan temizliği, sürüm çakışması,
gövde boyutu, form koruması ve veri minimizasyonu, çıkış sonrası belirteç iptali, hata mesajı sızıntısı.

## Bilinen sınırlar ve öneriler

1. **Deneme (prototip) kipi gerçek koruma sağlamaz.** Sunucu yokken giriş kontrolü tarayıcıda yapılır;
   bilgili bir kullanıcı kendi tarayıcısındaki veriyi değiştirebilir (yalnızca kendi tarayıcısını etkiler).
   Yayında mutlaka sunucu kipi kullanılmalıdır.
2. **İki adımlı doğrulama (2FA) yoktur.** Daha yüksek güvence için Netlify Identity / Auth0 gibi bir
   kimlik sağlayıcısı ve TOTP eklenmesi önerilir.
3. Hız sınırlama sabit pencerelidir; yoğun dağıtık saldırılara karşı Netlify’ın WAF/hız sınırlama
   özellikleri veya Cloudflare gibi bir katman eklenebilir.
4. Ziyaretçi talepleri şu an yalnızca Admin panelinde görünür; e-posta bildirimi için bir e-posta
   servisinin (ör. Postmark) API anahtarı ortam değişkeni olarak eklenmelidir.
5. Bağımlılıkları düzenli güncelleyin (`npm audit`) ve Netlify günlüklerini periyodik olarak inceleyin.
