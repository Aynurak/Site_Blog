/* Sunucu güvenlik testleri — çalıştırma: npm test
   Netlify Blobs yerine bellek içi depo kullanılır; ağ bağlantısı gerekmez. */
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MRA_MEMORY_STORE = '1';
const ORIGIN = 'https://akbuluthukukburosu.com';
const PASS = 'Gizli-Parola-2026!';

const { hashPassword, verifyPassword } = await import('../netlify/lib/auth.mjs');
const { resetMemoryStore } = await import('../netlify/lib/storage.mjs');
const login = (await import('../netlify/functions/auth-login.mjs')).default;
const logout = (await import('../netlify/functions/auth-logout.mjs')).default;
const session = (await import('../netlify/functions/auth-session.mjs')).default;
const content = (await import('../netlify/functions/content.mjs')).default;
const contact = (await import('../netlify/functions/contact.mjs')).default;
const requests = (await import('../netlify/functions/requests.mjs')).default;

const HASH = await hashPassword(PASS, { N: 16384 });
function configure() {
  Object.assign(process.env, { ADMIN_USERNAME: 'mra-yonetici', ADMIN_PASSWORD_HASH: HASH, SESSION_SECRET: 'x'.repeat(48), SITE_ORIGIN: ORIGIN });
}

let ipCounter = 0;
function req(path, { method = 'GET', body, cookie, origin = ORIGIN, xrw = true, type = 'application/json', ip } = {}) {
  const headers = new Headers();
  if (body !== undefined) headers.set('content-type', type);
  if (origin) headers.set('origin', origin);
  if (xrw) headers.set('x-requested-with', 'mra');
  if (cookie) headers.set('cookie', cookie);
  return [new Request(ORIGIN + path, { method, headers, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) }), { ip: ip || `10.0.0.${++ipCounter}` }];
}
const call = (fn, ...a) => fn(...req(...a));
const cookieOf = res => (res.headers.get('set-cookie') || '').split(';')[0];

async function adminCookie() {
  const res = await call(login, '/api/auth/login', { method: 'POST', body: { username: 'mra-yonetici', password: PASS } });
  assert.equal(res.status, 200);
  return cookieOf(res);
}

test('eksik ortam değişkenlerinde yönetim kapalı, ayrıntı sızdırılmaz', async () => {
  resetMemoryStore();
  for (const k of ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'SESSION_SECRET']) delete process.env[k];
  const s = await (await call(session, '/api/auth/session')).json();
  assert.equal(s.adminAvailable, false);
  assert.ok(!JSON.stringify(s).includes('SESSION_SECRET'));
  const l = await call(login, '/api/auth/login', { method: 'POST', body: { username: 'a', password: 'b' } });
  assert.equal(l.status, 503);
});

test('scrypt parola özeti doğrulanır, yanlış parola reddedilir', async () => {
  assert.match(HASH, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword(PASS, HASH), true);
  assert.equal(await verifyPassword(PASS + 'x', HASH), false);
  assert.equal(await verifyPassword(PASS, 'duz-metin-parola'), false);
});

test('giriş: tek tip hata, deneme sınırlama ve güvenli çerez', async () => {
  resetMemoryStore(); configure();
  const ip = '192.0.2.10';
  const bad = await login(...req('/api/auth/login', { method: 'POST', body: { username: 'mra-yonetici', password: 'yanlis' }, ip }));
  assert.equal(bad.status, 401);
  const badUser = await login(...req('/api/auth/login', { method: 'POST', body: { username: 'baska', password: PASS }, ip: '192.0.2.11' }));
  assert.equal((await badUser.json()).error, (await bad.json()).error, 'kullanıcı adı varlığı sızdırılmamalı');
  let last;
  for (let i = 0; i < 5; i++) last = await login(...req('/api/auth/login', { method: 'POST', body: { username: 'mra-yonetici', password: 'yanlis' + i }, ip: `192.0.2.${20 + i}` }));
  assert.equal(last.status, 429, 'kullanıcı adı bazlı kilit');
  const locked = await login(...req('/api/auth/login', { method: 'POST', body: { username: 'mra-yonetici', password: PASS }, ip: '192.0.2.99' }));
  assert.equal(locked.status, 429, 'kilit süresince doğru parola da reddedilir');

  resetMemoryStore(); configure();
  const ok = await call(login, '/api/auth/login', { method: 'POST', body: { username: 'mra-yonetici', password: PASS } });
  assert.equal(ok.status, 200);
  const sc = ok.headers.get('set-cookie');
  assert.match(sc, /^__Host-mra_session=/);
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(sc.includes(flag), flag);
  assert.equal(ok.headers.get('cache-control'), 'no-store');
});

test('CSRF: farklı köken, eksik özel başlık ve yanlış içerik türü reddedilir', async () => {
  resetMemoryStore(); configure();
  const evil = await call(login, '/api/auth/login', { method: 'POST', body: { username: 'mra-yonetici', password: PASS }, origin: 'https://saldirgan.example' });
  assert.equal(evil.status, 403);
  const noXrw = await call(login, '/api/auth/login', { method: 'POST', body: { username: 'mra-yonetici', password: PASS }, xrw: false });
  assert.equal(noXrw.status, 403);
  const form = await call(login, '/api/auth/login', { method: 'POST', body: 'username=a&password=b', type: 'application/x-www-form-urlencoded' });
  assert.equal(form.status, 415);
});

test('yetkisiz içerik yazma engellenir; sahte/değiştirilmiş çerez geçersizdir', async () => {
  resetMemoryStore(); configure();
  const pub = await call(content, '/api/content');
  assert.equal(pub.status, 200);
  const { content: c, rev } = await pub.json();
  const anon = await call(content, '/api/content', { method: 'PUT', body: { content: c, baseRev: rev } });
  assert.equal(anon.status, 401);
  const cookie = await adminCookie();
  const forged = cookie.replace(/.$/, ch => (ch === 'A' ? 'B' : 'A'));
  const bad = await call(content, '/api/content', { method: 'PUT', body: { content: c, baseRev: rev }, cookie: forged });
  assert.equal(bad.status, 401);
  const tampered = '__Host-mra_session=' + Buffer.from(JSON.stringify({ sub: 'mra-yonetici', exp: Date.now() + 9e9, jti: 'a'.repeat(32) })).toString('base64url') + '.imza';
  assert.equal((await call(content, '/api/content', { method: 'PUT', body: { content: c, baseRev: rev }, cookie: tampered })).status, 401);
});

test('içerik doğrulama: tehlikeli bağlantılar, yabancı alanlar ve geçersiz görseller temizlenir', async () => {
  resetMemoryStore(); configure();
  const cookie = await adminCookie();
  const { content: c, rev } = await (await call(content, '/api/content')).json();
  c.settings.mapLink = 'javascript:alert(1)';
  c.settings.mapEmbed = '<iframe src="https://saldirgan.example/embed"></iframe>';
  c.settings.heroImage = 'https://saldirgan.example/takip.gif';
  c.settings.email = 'x@y.com" onmouseover="alert(1)';
  c.settings.__proto__polluted = 'evet';
  c.settings.isAdmin = true;
  c.areas[0].title = '<img src=x onerror=alert(1)>';
  c.areas[0].slug = '../../etc/passwd';
  c.posts.push({ id: 'zz', slug: 'gecerli-yazi', title: 'Geçerli', date: '2026-11-01', body: 'Metin‮ ters', extra: 'atılmalı' });
  const res = await call(content, '/api/content', { method: 'PUT', body: { content: c, baseRev: rev }, cookie });
  assert.equal(res.status, 200);
  const saved = (await res.json()).content;
  assert.equal(saved.settings.mapLink, '');
  assert.equal(saved.settings.mapEmbed, '');
  assert.equal(saved.settings.heroImage, '');
  assert.notEqual(saved.settings.email, c.settings.email);
  assert.equal('isAdmin' in saved.settings, false);
  assert.equal(saved.areas.some(a => a.slug.includes('/')), false, 'geçersiz slug kaydı alınmaz');
  const p = saved.posts.find(x => x.id === 'zz');
  assert.ok(p && !('extra' in p) && !p.body.includes('‮'));
});

test('sürüm çakışması 409 döner (eski sürüm üzerine yazılamaz)', async () => {
  resetMemoryStore(); configure();
  const cookie = await adminCookie();
  const { content: c, rev } = await (await call(content, '/api/content')).json();
  assert.equal((await call(content, '/api/content', { method: 'PUT', body: { content: c, baseRev: rev }, cookie })).status, 200);
  assert.equal((await call(content, '/api/content', { method: 'PUT', body: { content: c, baseRev: rev }, cookie })).status, 409);
});

test('gövde boyutu sınırı uygulanır', async () => {
  resetMemoryStore(); configure();
  const big = await call(login, '/api/auth/login', { method: 'POST', body: { username: 'a', password: 'b'.repeat(5000) } });
  assert.equal(big.status, 413);
});

test('iletişim formu: tuzak alan, hız sınırı ve doğrulama', async () => {
  resetMemoryStore(); configure();
  const valid = { ad: 'Ali Veli', tel: '0555 111 22 33', eposta: 'ali@example.com', konu: 'Ceza Hukuku', mesaj: 'Ceza davası hakkında bilgi almak istiyorum.', kvkk: true, elapsed: 8000, website: '' };
  const ip = '198.51.100.7';
  const bot = await contact(...req('/api/contact', { method: 'POST', body: { ...valid, website: 'http://spam.example' }, ip }));
  assert.equal(bot.status, 200);
  const fast = await contact(...req('/api/contact', { method: 'POST', body: { ...valid, elapsed: 500 }, ip }));
  assert.equal(fast.status, 400);
  const badPhone = await contact(...req('/api/contact', { method: 'POST', body: { ...valid, tel: '<script>' }, ip }));
  assert.equal(badPhone.status, 422);
  const noKvkk = await contact(...req('/api/contact', { method: 'POST', body: { ...valid, kvkk: false }, ip }));
  assert.equal(noKvkk.status, 422);
  for (let i = 0; i < 4; i++) assert.equal((await contact(...req('/api/contact', { method: 'POST', body: valid, ip }))).status, 201);
  assert.equal((await contact(...req('/api/contact', { method: 'POST', body: valid, ip }))).status, 201);
  assert.equal((await contact(...req('/api/contact', { method: 'POST', body: valid, ip }))).status, 429);

  const anon = await call(requests, '/api/requests');
  assert.equal(anon.status, 401, 'talepler yalnızca yöneticiye açık');
  const cookie = await adminCookie();
  const list = (await (await call(requests, '/api/requests', { cookie })).json()).requests;
  assert.equal(list.length, 5, 'tuzak alanlı bot kaydı saklanmaz');
  assert.deepEqual(Object.keys(list[0]).sort(), ['ad', 'at', 'eposta', 'id', 'konu', 'mesaj', 'read', 'tel'].sort(), 'yalnızca gerekli alanlar saklanır');
  const del = await call(requests, '/api/requests', { method: 'DELETE', body: { id: list[0].id }, cookie });
  assert.equal(del.status, 200);
  assert.equal((await (await call(requests, '/api/requests', { cookie })).json()).requests.length, 4);
});

test('çıkış yapılan oturum belirteci tekrar kullanılamaz', async () => {
  resetMemoryStore(); configure();
  const cookie = await adminCookie();
  assert.equal((await (await call(session, '/api/auth/session', { cookie })).json()).authenticated, true);
  const out = await call(logout, '/api/auth/logout', { method: 'POST', body: {}, cookie });
  assert.match(out.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await (await call(session, '/api/auth/session', { cookie })).json()).authenticated, false);
});

test('beklenmeyen hatada iç ayrıntı sızdırılmaz', async () => {
  resetMemoryStore(); configure();
  const { handler } = await import('../netlify/lib/http.mjs');
  const boom = handler(async () => { throw new Error('/var/task/gizli/yol veritabani parolasi'); }, 'test');
  const orig = console.error; console.error = () => {};
  const res = await boom(new Request(ORIGIN + '/x'), {});
  console.error = orig;
  assert.equal(res.status, 500);
  const text = await res.text();
  assert.ok(!text.includes('/var/task') && !text.includes('parolasi'));
});
