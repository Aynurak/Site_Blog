/* Ortam değişkenleri: gizli değerler koda gömülmez, yalnızca hosting ortamından okunur.
   Eksik veya zayıf yapılandırmada kimlik doğrulama uç noktaları güvenli biçimde kapanır (503). */

const HASH_RE = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9+/=]{16,})\$([A-Za-z0-9+/=]{40,})$/;

export function getConfig(env = process.env) {
  const problems = [];
  const username = String(env.ADMIN_USERNAME || '').trim();
  const passwordHash = String(env.ADMIN_PASSWORD_HASH || '').trim();
  const sessionSecret = String(env.SESSION_SECRET || '');
  const siteOrigin = String(env.SITE_ORIGIN || '').trim().replace(/\/+$/, '');
  const sessionHours = Math.min(Math.max(Number(env.SESSION_HOURS) || 2, 0.25), 12);

  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) problems.push('ADMIN_USERNAME');
  if (!HASH_RE.test(passwordHash)) problems.push('ADMIN_PASSWORD_HASH');
  if (sessionSecret.length < 32) problems.push('SESSION_SECRET');
  if (siteOrigin && !/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(siteOrigin) && !/^http:\/\/localhost(:\d+)?$/.test(siteOrigin)) problems.push('SITE_ORIGIN');

  return {
    ok: problems.length === 0,
    problems,
    username,
    passwordHash,
    sessionSecret,
    siteOrigin,
    sessionMs: sessionHours * 3600 * 1000,
    production: env.CONTEXT === 'production' || env.NODE_ENV === 'production'
  };
}

export { HASH_RE };
