/* =========================================================
   data.js — Varsayılan (başlangıç) içerikler
   "Varsayılan İçeriklere Dön" bu verilere geri döner.
   Metinler örnek/taslak niteliğindedir; yönetim panelinden düzenlenir.
   ========================================================= */
var MRA = globalThis.MRA = globalThis.MRA || {};

/* Yalnızca sunucusuz prototip modunda kullanılan demo hesabı.
   Sunucu modunda giriş, ortam değişkenlerindeki ADMIN_USERNAME / ADMIN_PASSWORD_HASH ile yapılır. */
MRA.DEMO = { user: 'admin', pass: 'akbulut2026' };

/* Hazır giriş görseli (Admin panelinden başka bir görsel yüklenmediğinde kullanılır) */
MRA.HERO_DEFAULT = 'img/hero-law-office-brass.jpg';

/* Logo dosyaları: monogram (menü, küçük boyutlar) ve tam logo (footer, giriş ekranı) */
MRA.ASSETS = { mono: 'img/logo-mra-monogram.png', full: 'img/logo-mra-tam.png', about: 'img/buro-masa.jpg' };

MRA.DEFAULTS = {
  version: 1,

  settings: {
    title: 'Av.',
    name: 'Mehmet Raşit Akbulut',
    firmName: 'Akbulut Hukuk & Danışmanlık',
    brandSub: 'Hukuk & Danışmanlık',
    phone: '5525792820',
    email: 'av.mr.akbulut@gmail.com',
    address: 'Örnek Mahallesi, Adalet Caddesi No: 1, Kat 2, Daire 3, Merkez / İl',
    addressNote: 'Adres örnek niteliğindedir; büronun gerçek adresiyle güncellenecektir.',
    mapLink: '',
    mapEmbed: '',
    workingHours: 'Hafta içi 09.00 – 18.00, randevu ile',
    officeNote: 'Görüşmeler randevu ile yapılır. Ön görüşme talebinizi telefon, WhatsApp veya e-posta yoluyla iletebilirsiniz.',
    heroSub: 'Hukuk & Danışmanlık Bürosu',
    heroImage: '',
    heroLead: 'Ceza ve aile hukuku başta olmak üzere bireysel ve kurumsal uyuşmazlıklarda, dosyanın her aşamasında doğrudan takip ve ölçülü hukuki danışmanlık.',
    homeTitle: 'Büro hakkında',
    homeText: `Akbulut Hukuk & Danışmanlık, kurucu avukat Av. Mehmet Raşit Akbulut tarafından yürütülen bir hukuk bürosudur. Büro; ceza ve aile hukuku başta olmak üzere iş, ticaret ve sözleşmeler ile idare hukuku alanlarında bireysel ve kurumsal müvekkillere danışmanlık ve dava takibi hizmeti sunar.

Her dosya, ilk görüşmeden itibaren olay örgüsü, deliller ve süreler bakımından ayrıntılı biçimde incelenir. Müvekkil, izlenebilecek yollar ve bu yolların taşıdığı riskler hakkında açık bir dille bilgilendirilir ve sürecin her aşamasında düzenli olarak haberdar edilir.

Blogumuzda yer alan yazılar, sık karşılaşılan hukuki konularda genel bilgi sunmak amacıyla hazırlanmıştır; somut durumlar için bireysel değerlendirme gerekir.`,
    principles: [
      { t: 'Doğrudan takip', d: 'Her dosya, ilk görüşmeden karara kadar kurucu avukat tarafından bizzat yürütülür.' },
      { t: 'Meslek sırrı', d: 'Müvekkil bilgileri, Avukatlık Kanunu ve meslek kuralları çerçevesinde korunur.' },
      { t: 'Usule özen', d: 'Süreler, tebligatlar ve kanun yolları dosya boyunca düzenli olarak izlenir.' }
    ],
    aboutTitle: 'Av. Mehmet Raşit Akbulut',
    aboutText: `Akbulut Hukuk & Danışmanlık, kurucu avukat Av. Mehmet Raşit Akbulut'un doğrudan yürüttüğü butik bir hukuk bürosudur. Büro, sınırlı sayıda dosyayı derinlemesine çalışmayı ve her müvekkille kesintisiz bir iletişim kurmayı tercih eder.

## Mesleki yaklaşım
Her uyuşmazlık, ilk görüşmede olay örgüsü, deliller ve süreler bakımından ayrıntılı biçimde incelenir. Müvekkile, izlenebilecek yollar ve bu yolların taşıdığı riskler açık bir dille aktarılır; karar, bu değerlendirme ışığında birlikte verilir.

## Odak alanları
Çalışmaların ağırlık merkezini ceza hukuku ve aile hukuku oluşturur. Bunun yanında iş ve sosyal güvenlik hukuku, ticaret ve sözleşmeler hukuku ile idare hukuku alanlarında danışmanlık ve dava takibi yürütülür.

## Çalışma disiplini
Büro; Avukatlık Kanunu, Türkiye Barolar Birliği Meslek Kuralları ve reklam yasağına ilişkin düzenlemeler çerçevesinde çalışır. Hiçbir dosyada sonuç taahhüdünde bulunulmaz; müvekkil, sürecin her aşamasında yazılı ve sözlü olarak bilgilendirilir.`,
    kvkkText: `## Veri sorumlusu
6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla Av. Mehmet Raşit Akbulut tarafından aşağıda açıklanan kapsamda işlenmektedir.

## İşlenen veriler ve amaç
Ön görüşme formu aracılığıyla paylaştığınız ad soyad, telefon, e-posta ve talep içeriği; yalnızca talebinizin değerlendirilmesi, sizinle iletişime geçilmesi ve randevu planlanması amacıyla işlenir.

## Hukuki sebep
Verileriniz, bir sözleşmenin kurulmasına doğrudan ilişkin olması ve veri sorumlusunun meşru menfaati hukuki sebeplerine dayanılarak işlenir.

## Haklarınız
Kanunun 11. maddesi kapsamındaki taleplerinizi av.mr.akbulut@gmail.com adresine iletebilirsiniz.

Bu metin örnek niteliğindedir; yayın öncesinde büronun fiilî veri işleme süreçlerine göre güncellenmelidir.`
  },

  areas: [
    {
      id: 'a-ceza', slug: 'ceza-hukuku', title: 'Ceza Hukuku', published: true, featured: true,
      summary: 'Soruşturma ve kovuşturma evrelerinde şüpheli, sanık, müşteki ve mağdur vekilliği; savunmanın hazırlanması ve kanun yollarının takibi.',
      scope: `Ceza hukuku alanındaki çalışmalar; soruşturma evresinde kolluk ve savcılık ifadelerine katılımdan başlayarak kovuşturma evresindeki duruşmalar ile istinaf ve temyiz aşamalarına kadar uzanır. Her aşamada delillerin hukuka uygunluğu, usul kurallarına riayet ve savunma hakkının etkin biçimde kullanılması esas alınır.

Müşteki ve mağdur vekilliğinde ise şikâyetin süresinde yapılması, delillerin korunması ve davaya katılma gibi usul işlemleri titizlikle takip edilir.`,
      topics: [
        'Kolluk ve savcılık ifadesinde müdafilik',
        'Gözaltı, tutuklama ve adli kontrol kararlarına itiraz',
        'Mala karşı suçlar (hırsızlık, dolandırıcılık, güveni kötüye kullanma)',
        'Kişilere karşı suçlar (kasten yaralama, tehdit, hakaret)',
        'Bilişim suçları',
        'Uzlaştırma süreci',
        'Hükmün açıklanmasının geri bırakılması değerlendirmesi',
        'İstinaf ve temyiz başvuruları'
      ],
      notes: `## İfade vermeden önce
Şüpheli sıfatıyla ifadeye çağrılan kişi, müdafi yardımından yararlanma ve susma hakkına sahiptir; bu hakların ifadeden önce kendisine hatırlatılması zorunludur (CMK m. 147).

## Şikâyet süresi
Şikâyete bağlı suçlarda şikâyet hakkı, fiilin ve failin öğrenildiği tarihten itibaren altı ay içinde kullanılmalıdır (TCK m. 73). Süre geçirildiğinde şikâyet hakkı düşer.

## Kanun yolu süreleri
Tutuklamaya itiraz ile istinaf ve temyiz başvurularında süreler kısadır. Kararın tebliğ veya tefhim edildiği tarihin not edilmesi ve vakit kaybetmeden avukata danışılması önemlidir.

## Soruşturma ve kovuşturma evreleri
Soruşturma evresi, suç şüphesinin yetkili makamlarca öğrenilmesiyle başlar ve iddianamenin kabulüne kadar sürer; bu aşamada delillerin toplanması Cumhuriyet savcılığının yönetimindedir. İddianamenin kabulüyle kovuşturma evresi başlar ve yargılama mahkeme önünde sürdürülür.

## Uzlaştırma
Kanunda sayılan bazı suçlarda, soruşturma veya kovuşturmaya devam edilmeden önce taraflar arasında uzlaştırma yoluna gidilir (CMK m. 253). Uzlaşmanın gerçekleşip gerçekleşmemesi dosyanın seyrini doğrudan etkiler; bu nedenle teklifin hukuki sonuçları önceden değerlendirilmelidir.

## Müdafi ile çalışma
Dosyaya ilişkin belge ve bilgilerin eksiksiz paylaşılması, savunmanın doğru kurulabilmesi için önemlidir. Avukat ile müvekkil arasındaki görüşmeler meslek sırrı kapsamındadır.`
    },
    {
      id: 'a-aile', slug: 'aile-hukuku', title: 'Aile Hukuku', published: true, featured: true,
      summary: 'Anlaşmalı ve çekişmeli boşanma, velayet, nafaka, mal rejiminin tasfiyesi ve aile içi koruma tedbirlerinde danışmanlık ve dava takibi.',
      scope: `Aile hukuku uyuşmazlıkları, hukuki olduğu kadar kişisel ve duygusal boyutu da olan süreçlerdir. Bu nedenle her dosyada öncelikle tarafların ve varsa çocukların durumu bütünlüklü olarak değerlendirilir; mümkün olan hâllerde uzlaşma yolları araştırılır.

Çekişmeli süreçlerde ise delillerin düzenli biçimde toplanması, taleplerin doğru kurulması ve geçici tedbirlerin zamanında istenmesi üzerinde durulur.`,
      topics: [
        'Anlaşmalı boşanma protokolünün hazırlanması',
        'Çekişmeli boşanma davaları',
        'Velayet ve çocukla kişisel ilişki tesisi',
        'Tedbir, yoksulluk ve iştirak nafakası',
        'Edinilmiş mallara katılma rejiminin tasfiyesi',
        'Boşanmada maddi ve manevi tazminat',
        '6284 sayılı Kanun kapsamında koruyucu ve önleyici tedbirler',
        'Yabancı mahkeme kararlarının tanınması ve tenfizi'
      ],
      notes: `## Anlaşmalı boşanma
Anlaşmalı boşanma için evliliğin en az bir yıl sürmüş olması, eşlerin birlikte başvurması veya bir eşin diğerinin davasını kabul etmesi ve hâkimin tarafları bizzat dinlemesi gerekir (TMK m. 166/3).

## Nafaka türleri
Dava süresince bağlanan tedbir nafakası, boşanmanın ardından talep edilebilen yoksulluk nafakası ve çocuk için ödenen iştirak nafakası farklı koşullara tabidir.

## Çocuğun üstün yararı
Velayete ilişkin kararlarda belirleyici ölçüt çocuğun üstün yararıdır; mahkeme gerekli gördüğünde sosyal inceleme raporu aldırabilir.

## Çekişmeli boşanma süreci
Çekişmeli boşanma davası; dilekçeler aşaması, ön inceleme, tahkikat ve sözlü yargılama aşamalarından oluşur. Tanık, yazışma ve belge gibi delillerin dilekçeler aşamasında eksiksiz bildirilmesi önem taşır.

## Geçici önlemler
Boşanma veya ayrılık davası açılınca hâkim, davanın devamı süresince gerekli geçici önlemleri kendiliğinden alır. Bu önlemler; eşlerin barınması, geçimi, malların yönetimi ve çocukların bakım ve korunmasına ilişkindir (TMK m. 169).

## Uzlaşma imkânı
Aile hukukundan doğan uyuşmazlıklarda tarafların anlaşması, süreci kısaltır ve çocuklar üzerindeki olumsuz etkileri azaltır. Bu nedenle uygun durumlarda anlaşmalı çözüm yolları birlikte değerlendirilir.`
    },
    {
      id: 'a-is', slug: 'is-hukuku', title: 'İş Hukuku', published: true, featured: false,
      summary: 'İşçi ve işveren uyuşmazlıklarında zorunlu arabuluculuk, işe iade ve işçilik alacakları; iş sözleşmelerinin hazırlanması ve hizmet tespiti.',
      scope: `İş hukuku çalışmaları; iş sözleşmesinin kurulmasından sona ermesine kadar doğan uyuşmazlıkları kapsar. İşçi tarafında alacakların ve fesih sonuçlarının değerlendirilmesi, işveren tarafında ise fesih süreçlerinin mevzuata uygun yürütülmesi ve önleyici danışmanlık öne çıkar.

Dava öncesinde zorunlu arabuluculuk aşaması, uyuşmazlığın çözümü için önemli bir fırsat olarak ele alınır.`,
      topics: [
        'İşe iade talepleri',
        'Kıdem ve ihbar tazminatı',
        'Fazla çalışma, yıllık izin ve diğer işçilik alacakları',
        'İş kazası ve meslek hastalığından doğan tazminat',
        'İşyerinde psikolojik taciz (mobbing)',
        'İş sözleşmesi ve işyeri yönetmeliklerinin hazırlanması',
        'Zorunlu arabuluculuk görüşmeleri',
        'Hizmet tespiti davaları',
        'SGK işlemlerine itiraz ve sosyal güvenlik uyuşmazlıkları'
      ],
      notes: `## Arabuluculuk dava şartı
İşçi veya işveren alacağı ve tazminatı ile işe iade taleplerinde dava açmadan önce arabulucuya başvurulması zorunludur (7036 sayılı İş Mahkemeleri Kanunu m. 3).

## İşe iade için süre
Feshin geçersizliği iddiasıyla, fesih bildiriminin tebliğinden itibaren bir ay içinde arabulucuya başvurulmalıdır (4857 sayılı İş Kanunu m. 20).

## Kıdem tazminatı
Kıdem tazminatına hak kazanılabilmesi için aynı işverene bağlı olarak en az bir yıl çalışılmış olması ve sözleşmenin kanunda sayılan hâllerden biriyle sona ermesi gerekir.`
    },
    {
      id: 'a-ticaret', slug: 'ticaret-ve-sozlesmeler-hukuku', title: 'Ticaret ve Sözleşmeler Hukuku', published: true, featured: false,
      summary: 'Şirketlerin kuruluş ve işleyişi, ticari sözleşmelerin hazırlanması ve incelenmesi, ticari alacak ve tazminat uyuşmazlıkları.',
      scope: `Ticari hayatta uyuşmazlıkların önemli bir kısmı, sözleşme aşamasında öngörülebilir. Bu nedenle sözleşmelerin hazırlanması ve imza öncesi incelenmesi, çalışmaların merkezinde yer alır.

Uyuşmazlık doğduğunda ise arabuluculuk, ihtarname ve dava süreçleri, ticari ilişkinin geleceği de gözetilerek planlanır.`,
      topics: [
        'Şirket kuruluşu ve esas sözleşme değişiklikleri',
        'Pay devri ve ortaklık uyuşmazlıkları',
        'Ticari sözleşmelerin hazırlanması ve incelenmesi',
        'Ticari alacak ve tazminat davaları',
        'Haksız rekabet',
        'Çek, poliçe ve bonodan doğan uyuşmazlıklar',
        'Ticari uyuşmazlıklarda arabuluculuk'
      ],
      notes: `## Ticari davalarda arabuluculuk
Konusu bir miktar paranın ödenmesi olan alacak ve tazminat taleplerine ilişkin ticari davalarda, dava açılmadan önce arabulucuya başvurulması dava şartıdır (TTK m. 5/A).

## İmza öncesi kontrol
İfa süreleri, cezai şart, fesih koşulları, yetkili mahkeme ve uyuşmazlık çözüm yöntemine ilişkin maddelerin birlikte değerlendirilmesi, ileride doğabilecek uyuşmazlıkların önemli bir kısmını önler.`
    },
    {
      id: 'a-idare', slug: 'idare-hukuku', title: 'İdare Hukuku', published: true, featured: false,
      summary: 'İdari işlemlere karşı iptal ve tam yargı davaları, kamu görevlilerinin hakları, imar uygulamaları ve idari yaptırımlara itiraz.',
      scope: `İdare hukuku alanında, idarenin işlem ve eylemlerinden etkilenen kişi ve kurumlara; idari başvuru, dava ve yürütmenin durdurulması süreçlerinde destek verilir.

İdari yargıda süreler hak düşürücü nitelikte olduğundan, işlemin tebliğ tarihinin tespiti ve sürenin doğru hesaplanması öncelikli konudur.`,
      topics: [
        'İptal ve tam yargı davaları',
        'Kamu görevlilerine ilişkin disiplin ve atama işlemleri',
        'İmar uygulamaları ve yapı ruhsatı uyuşmazlıkları',
        'Kamulaştırma ve kamulaştırmasız el atma',
        'İdari para cezalarına itiraz',
        'Kamu ihale uyuşmazlıkları'
      ],
      notes: `## Dava açma süresi
Özel kanunlarda ayrı bir süre öngörülmeyen hâllerde dava açma süresi, Danıştay ve idare mahkemelerinde altmış, vergi mahkemelerinde otuz gündür (İYUK m. 7).

## Yürütmenin durdurulması
İdari işlemin uygulanması hâlinde telafisi güç veya imkânsız zararların doğması ve işlemin açıkça hukuka aykırı olması koşullarının birlikte gerçekleşmesi hâlinde yürütmenin durdurulmasına karar verilebilir (İYUK m. 27).`
    },
    {
      id: 'a-icra', slug: 'icra-ve-iflas-hukuku', title: 'İcra ve İflas Hukuku', published: false, featured: false,
      summary: 'İlamlı ve ilamsız icra takipleri, takibe itiraz, itirazın iptali ve kaldırılması, haciz işlemleri ve alacak tahsili.',
      scope: `İcra ve iflas hukuku çalışmaları, alacaklı tarafında alacağın etkin biçimde tahsilini; borçlu tarafında ise usulsüz takip ve işlemlere karşı haklarının korunmasını kapsar.

Takip yolunun doğru seçilmesi ve itiraz sürelerinin kaçırılmaması, sonucu doğrudan etkileyen başlıca hususlardır.`,
      topics: [
        'İlamlı ve ilamsız icra takipleri',
        'Ödeme emrine itiraz',
        'İtirazın iptali ve itirazın kaldırılması davaları',
        'Menfi tespit ve istirdat davaları',
        'Haciz ve satış işlemleri',
        'Şikâyet yoluyla icra işlemlerine itiraz'
      ],
      notes: `## Ödeme emrine itiraz
İlamsız takipte borçlu, ödeme emrinin tebliğinden itibaren yedi gün içinde itiraz edebilir (İİK m. 62). Süresinde yapılan itiraz takibi durdurur; alacaklı itirazın iptali veya kaldırılması yoluna gidebilir.

## Takip öncesi değerlendirme
Alacağı gösteren belgelerin niteliği, ilamsız takip, kambiyo senetlerine özgü takip veya ilamlı takip yollarından hangisinin uygun olduğunu belirler.`
    },
    {
      id: 'a-miras', slug: 'miras-hukuku', title: 'Miras Hukuku', published: false, featured: false,
      summary: 'Mirasçılık belgesi, mirasın paylaşımı, ortaklığın giderilmesi, vasiyetname düzenlenmesi ve iptali, tenkis ve mirasın reddi.',
      scope: `Miras hukuku uyuşmazlıkları çoğu zaman aile ilişkileriyle iç içe ilerler. Bu nedenle mümkün olduğunca paylaşımın anlaşma yoluyla sağlanması hedeflenir; anlaşma sağlanamadığında ortaklığın giderilmesi, tenkis veya iptal davaları gündeme gelir.

Sağlığında mal varlığını planlamak isteyenler için vasiyetname ve miras sözleşmesi seçenekleri değerlendirilir.`,
      topics: [
        'Mirasçılık belgesi (veraset ilamı) alınması',
        'Ortaklığın giderilmesi (izale-i şuyu) davaları',
        'Vasiyetname düzenlenmesi ve vasiyetnamenin iptali',
        'Tenkis ve muris muvazaası davaları',
        'Mirasın reddi',
        'Miras paylaşım sözleşmeleri'
      ],
      notes: `## Mirasın reddi
Mirasın reddi için süre üç aydır; bu süre yasal mirasçılar için mirasbırakanın ölümünü öğrendikleri tarihten, atanmış mirasçılar için ise tasarrufun kendilerine resmen bildirildiği tarihten başlar (TMK m. 606).

## Saklı pay
Mirasbırakan, saklı paylı mirasçıların haklarını zedeleyecek şekilde tasarrufta bulunduğunda tenkis davası gündeme gelebilir.`
    }
  ],

  posts: [
    {
      id: 'p-gozalti', slug: 'gozaltinda-bilinmesi-gereken-temel-haklar', published: true,
      title: 'Gözaltında Bilinmesi Gereken Temel Haklar', category: 'Ceza Hukuku', date: '2026-11-18',
      summary: 'Gözaltına alınan kişinin yakınlarına haber verilmesi, müdafiden yararlanma ve susma hakkı gibi temel güvenceler.',
      body: `Gözaltı, kişi özgürlüğüne yönelik ağır bir müdahale olduğundan Ceza Muhakemesi Kanunu bu süreçte bir dizi güvence öngörür. Bu güvencelerin bilinmesi, sürecin hukuka uygun ilerlemesi açısından önemlidir.

## Yakınlara haber verilmesi
Yakalanan veya gözaltına alınan kişinin durumu, gecikmeksizin bir yakınına veya belirlediği bir kişiye bildirilir (CMK m. 95).

## Müdafi ve susma hakkı
Şüpheli, ifadesinden önce müdafi yardımından yararlanabileceği ve isnat edilen suç hakkında açıklamada bulunmama hakkına sahip olduğu konusunda bilgilendirilmelidir (CMK m. 147). Kanunda sayılan hâllerde, talep olmasa dahi baro tarafından müdafi görevlendirilir (CMK m. 150).

## Gözaltı süresi ve itiraz
Bireysel suçlarda gözaltı süresi, yakalama yerine en yakın hâkim veya mahkemeye gönderilmesi için gerekli süre hariç, yakalama anından itibaren yirmi dört saati geçemez (CMK m. 91). Gözaltı işlemine karşı sulh ceza hâkimliğine başvurulabilir.

- İfade tutanağını imzalamadan önce dikkatle okuyun.
- Hatırlamadığınız veya emin olmadığınız konularda tahmine dayalı beyanda bulunmayın.
- Avukatınızla görüşme talebinizi açıkça dile getirin.

Bu yazı genel bilgilendirme amacı taşır; somut durumlarda bir avukata danışılmalıdır.`
    },
    {
      id: 'p-protokol', slug: 'anlasmali-bosanma-protokolunde-dikkat-edilecekler', published: true,
      title: 'Anlaşmalı Boşanma Protokolünde Nelere Dikkat Edilmeli?', category: 'Aile Hukuku', date: '2026-11-06',
      summary: 'Velayet, nafaka, mal paylaşımı ve tazminat konularının protokolde açık ve uygulanabilir biçimde düzenlenmesi.',
      body: `Anlaşmalı boşanmada tarafların iradesi, mahkemeye sunulan protokolde somutlaşır. Protokolün eksik veya belirsiz düzenlenmesi, boşanmadan sonra yeni uyuşmazlıklara yol açabilir.

## Velayet ve kişisel ilişki
Velayetin kime bırakılacağı ile diğer ebeveynin çocukla görüşme günleri, saatleri ve tatil dönemleri ayrıntılı olarak yazılmalıdır.

## Nafaka
İştirak nafakası ve varsa yoksulluk nafakasının miktarı, ödeme günü ve yıllık artış esası belirlenmelidir.

## Mal paylaşımı ve tazminat
Taşınmazlar, araçlar, banka hesapları ve borçlar konusunda tarafların anlaşması açıkça yazılmalı; maddi ve manevi tazminat talebinden feragat edilip edilmediği belirtilmelidir.

Hâkim, protokolü uygun bulmazsa gerekli değişiklikleri önerebilir; değişikliklerin taraflarca kabulü hâlinde boşanmaya karar verilir (TMK m. 166/3).`
    },
    {
      id: 'p-isten', slug: 'isten-cikarildiniz-ilk-bir-ayda-yapilmasi-gerekenler', published: true,
      title: 'İşten Çıkarıldınız: İlk Bir Ayda Yapılması Gerekenler', category: 'İş Hukuku', date: '2026-10-24',
      summary: 'Fesih bildiriminin ardından belgelerin korunması, sürelerin takibi ve arabuluculuk başvurusu.',
      body: `İş sözleşmesinin feshedilmesinin ardından atılacak ilk adımlar, ileride ileri sürülecek talepler bakımından belirleyicidir.

## Belgeleri saklayın
Fesih bildirimi, bordrolar, banka hesap dökümleri, yazışmalar ve varsa tanık bilgileri bir arada tutulmalıdır.

## Süreye dikkat edin
İşe iade talebinde bulunmak isteyen işçi, fesih bildiriminin tebliğinden itibaren bir ay içinde arabulucuya başvurmalıdır (İş Kanunu m. 20). Bu süre kaçırıldığında işe iade talebi ileri sürülemez.

## İbraname ve ödemeler
Fesih sırasında imzalanması istenen belgelerin içeriği dikkatle incelenmeli; ödenen tutarların hangi alacaklara karşılık geldiği kayıt altına alınmalıdır.

Bu yazı genel bilgilendirme amacı taşır; somut durumlarda bir avukata danışılmalıdır.`
    },
    {
      id: 'p-idari', slug: 'idari-islemlere-karsi-dava-acma-sureleri', published: true,
      title: 'İdari İşlemlere Karşı Dava Açma Süreleri', category: 'İdare Hukuku', date: '2026-10-09',
      summary: 'İdari yargıda sürelerin başlangıcı, hesaplanması ve idareye başvurunun süreye etkisi.',
      body: `İdari yargıda dava açma süreleri hak düşürücü niteliktedir; sürenin geçirilmesi, işlemin hukuka aykırı olup olmadığı incelenmeden davanın reddine yol açar.

## Genel süre
Özel kanunlarda ayrı bir süre öngörülmeyen hâllerde dava açma süresi Danıştay ve idare mahkemelerinde altmış, vergi mahkemelerinde otuz gündür (İYUK m. 7).

## Sürenin başlangıcı
Süre, kural olarak idari işlemin ilgiliye yazılı olarak bildirildiği tarihi izleyen günden başlar. İlanı gereken işlemlerde ilan tarihi esas alınır.

## Üst makama başvuru
İlgililer, dava açmadan önce işlemin kaldırılması veya değiştirilmesi için üst makama, yoksa işlemi yapan makama başvurabilir; bu başvuru dava açma süresini durdurur (İYUK m. 11).

Bu yazı genel bilgilendirme amacı taşır; somut durumlarda bir avukata danışılmalıdır.`
    },
    {
      id: 'p-cezai-sart', slug: 'ticari-sozlesmelerde-cezai-sart', published: true,
      title: 'Ticari Sözleşmelerde Cezai Şart', category: 'Ticaret ve Sözleşmeler Hukuku', date: '2026-09-22',
      summary: 'Cezai şartın işlevi, türleri ve tacirler bakımından indirim talebine ilişkin sınırlama.',
      body: `Cezai şart, borcun hiç veya gereği gibi ifa edilmemesi hâlinde ödenmesi önceden kararlaştırılan bir edimdir. Sözleşmeye bağlılığı güçlendirir ve zararın ispatı güçlüğünü büyük ölçüde ortadan kaldırır.

## Türleri
Türk Borçlar Kanunu, seçimlik cezai şart ile ifaya eklenen cezai şartı ayrı ayrı düzenler (TBK m. 179). Hangi türün kararlaştırıldığı, alacaklının hem ifayı hem cezayı isteyip isteyemeyeceğini belirler.

## Zarar şartı aranmaz
Borçlu, alacaklının herhangi bir zarara uğramamış olduğu gerekçesiyle cezai şartı ödemekten kurtulamaz (TBK m. 180).

## Tacirler bakımından indirim
Aşırı cezai şartın hâkim tarafından indirilebileceği genel kural olarak kabul edilmiş olsa da, tacir sıfatını taşıyan borçlu, ödemeyi taahhüt ettiği cezai şartın fahiş olduğu iddiasıyla indirilmesini isteyemez (TTK m. 22). Bu nedenle ticari sözleşmelerde cezai şart miktarının imzadan önce dikkatle değerlendirilmesi önemlidir.

Bu yazı genel bilgilendirme amacı taşır; somut durumlarda bir avukata danışılmalıdır.`
    }
  ],

  requests: [],

  auth: { user: 'admin', hash: null }
};
