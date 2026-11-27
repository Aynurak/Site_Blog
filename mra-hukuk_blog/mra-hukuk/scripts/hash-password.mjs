/* Kullanım: npm run hash-password
   Parolayı ekrana yansıtmadan sorar ve ADMIN_PASSWORD_HASH değerini üretir.
   Üretilen değer hosting panelinde ortam değişkeni olarak saklanır; koda veya depoya eklenmez. */
import { createInterface } from 'node:readline';
import { randomBytes } from 'node:crypto';
import { hashPassword } from '../netlify/lib/auth.mjs';

function ask(question) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, answer => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

function strong(p) {
  if (p.length < 12) return 'En az 12 karakter olmalı.';
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(p)).length;
  return kinds >= 3 ? '' : 'Büyük harf, küçük harf, rakam ve sembolden en az üçünü içermeli.';
}

const pass = process.argv[2] === '--stdin'
  ? (await new Promise(r => { let d = ''; process.stdin.on('data', c => (d += c)); process.stdin.on('end', () => r(d.trim())); }))
  : await ask('Yeni yönetici parolası: ');
const problem = strong(pass);
if (problem) { console.error(`Parola yeterince güçlü değil: ${problem}`); process.exit(1); }
if (process.argv[2] !== '--stdin') {
  const again = await ask('Parola (tekrar): ');
  if (again !== pass) { console.error('Parolalar eşleşmiyor.'); process.exit(1); }
}
console.log('\nADMIN_PASSWORD_HASH=' + await hashPassword(pass));
console.log('SESSION_SECRET=' + randomBytes(48).toString('base64url'));
console.log('\nBu iki değeri Netlify > Site configuration > Environment variables bölümüne ekleyin.');
