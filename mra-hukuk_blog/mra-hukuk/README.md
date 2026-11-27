# Akbulut Hukuk & Danışmanlık — Web Uygulaması

Av. Mehmet Raşit Akbulut için hukuk bürosu ve blog sitesi: statik ön yüz (`public/`) ve güvenli yönetim
API’si (Netlify Functions). Güvenlik önlemlerinin ayrıntısı için **`SECURITY.md`** dosyasına bakın.

## Klasör yapısı

```
public/                     Yayınlanan tek klasör (ziyaretçinin gördüğü site)
  index.html                Sayfa iskeleti (satır içi betik yok; CSP uyumlu)
  _redirects                Gerçek adresler için yönlendirmeler
  robots.txt, sitemap.xml   Arama motorları
  css/style.css             Tasarım
  img/                      Logo, giriş görseli, büro görseli, paylaşım görseli
  js/boot.js                Erken yapılandırma (yönlendirme kipi, sunucu denemesi)
  js/schema.js              Ortak doğrulama/temizleme şeması (tarayıcı + sunucu)
  js/data.js                Varsayılan içerik
  js/store.js               Veri katmanı (sunucu / deneme kipi)
  js/backend.js             API servis katmanı ve kimlik doğrulama
  js/ui.js                  Güvenli metin, güvenli bağlantı, logo, harita yardımcıları
  js/views.js               Ziyaretçi sayfaları
  js/admin.js               Admin paneli (/admin)
  js/app.js                 Yönlendirici, açılış, genel hata yakalama
netlify/functions/          API uç noktaları (/api/...)
netlify/lib/                Sunucu yardımcıları (yapılandırma, HTTP, oturum, depo, hız sınırı)
netlify.toml                Yayın ayarları ve HTTP güvenlik başlıkları
scripts/hash-password.mjs   Yönetici parola özeti üretici
tests/server.test.mjs       Sunucu güvenlik testleri
.env.example                Ortam değişkeni şablonu
```

## API

| Uç nokta | Yöntem | Erişim | Açıklama |
|---|---|---|---|
| `/api/auth/session` | GET | Herkes | Oturum durumu |
| `/api/auth/login` | POST | Herkes (deneme sınırlı) | Yönetici girişi |
| `/api/auth/logout` | POST | Yönetici | Oturumu iptal eder |
| `/api/content` | GET | Herkes | Site içeriği |
| `/api/content` | PUT | Yönetici | İçeriği günceller |
| `/api/contact` | POST | Herkes (hız sınırlı) | Görüşme talebi |
| `/api/requests` | GET / PATCH / DELETE | Yönetici | Talepleri listeler, okundu işaretler, siler |

## Yayına alma (Netlify)

1. Projeyi bir Git deposuna (GitHub) yükleyin ve Netlify’da “Import from Git” ile bağlayın.
   `netlify.toml` yayın klasörünü (`public`) ve fonksiyonları otomatik tanır.
2. Bilgisayarınızda Node.js 20+ ile:
   ```
   npm install
   npm run hash-password
   ```
   Komut parolanızı sorar, `ADMIN_PASSWORD_HASH` ve `SESSION_SECRET` değerlerini üretir.
3. Netlify > Site configuration > Environment variables bölümüne ekleyin:
   `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `SITE_ORIGIN` (ör. `https://akbuluthukukburosu.com`).
4. Yeniden yayınlayın. `https://alanadiniz/admin` adresinden yeni bilgilerle giriş yapın.
   Bu kipte demo giriş bilgileri çalışmaz ve ekranda gösterilmez.
5. Kontrol: tarayıcıda `https://alanadiniz/api/auth/session` adresi `{"service":"mra-api",...}` döndürmelidir.

Testleri çalıştırmak için: `npm test`

## Deneme (prototip) kipi

`public/index.html` dosyası bilgisayardan açıldığında veya sunucu bulunamadığında site deneme kipinde çalışır:
içerik ve talepler yalnızca o tarayıcıda saklanır, Admin girişi tarayıcıda yapılır
(demo: **admin / akbulut2026**, ilk girişte değiştirilmesi istenir). Bu kip yalnızca önizleme içindir.

## Sayfalar

| Adres | Sayfa |
|---|---|
| `/` | Ana Sayfa |
| `/hakkimizda` | Hakkımızda |
| `/calisma-alanlari`, `/calisma-alanlari/<alan>` | Çalışma Alanları ve alan sayfaları |
| `/blog`, `/blog/<yazı>` | Blog ve yazı sayfaları |
| `/iletisim` | İletişim, adres ve harita |
| `/admin` | Admin paneli (menüde görünmez) |

## Metin biçimi (Admin panelindeki uzun alanlar)

- Boş satır → yeni paragraf
- `## Başlık` → ara başlık
- `- madde` → madde listesi

HTML yazılamaz; yazılan her şey düz metin olarak gösterilir.
