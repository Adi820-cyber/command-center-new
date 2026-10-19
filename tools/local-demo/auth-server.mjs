// LOCAL DEMO ONLY. A stand-in for Supabase Auth.
// An email nobody registered signs in with ANY password. An email created through the admin call
// (as the control API does for a new person) needs the password it was created with, and carries
// user_metadata such as must_change_password, like the real thing.
// Binds to 127.0.0.1, so nothing outside this computer can reach it. Never deploy it.
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(new URL('../../package.json', import.meta.url));
const { SignJWT, generateKeyPair, exportJWK, importJWK, jwtVerify } = await import(pathToFileURL(require.resolve('jose')).href);

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 54321;
const ISS = `http://127.0.0.1:${PORT}/auth/v1`;
const keyFile = join(here, 'key.json');
let privateJwk, publicJwk;
if (existsSync(keyFile)) ({ privateJwk, publicJwk } = JSON.parse(readFileSync(keyFile, 'utf8')));
else {
  const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
  privateJwk = { ...(await exportJWK(privateKey)), kid: 'demo-key', alg: 'ES256', use: 'sig' };
  publicJwk = { ...(await exportJWK(publicKey)), kid: 'demo-key', alg: 'ES256', use: 'sig' };
  writeFileSync(keyFile, JSON.stringify({ privateJwk, publicJwk }));
}
// Registered accounts: email -> { password, metadata }. Survives restarts, never committed.
const usersFile = join(here, 'users.json');
const registry = existsSync(usersFile) ? JSON.parse(readFileSync(usersFile, 'utf8')) : {};
const saveRegistry = () => writeFileSync(usersFile, JSON.stringify(registry));
const ADMIN_KEY = 'demo-secret';
// Every admin create attempt since start-up, so a test can tell whether one was even tried.
const adminAttempts = [];
const privateKey = await importJWK(privateJwk, 'ES256');
const publicKey = await importJWK(publicJwk, 'ES256');

export const subjectFor = (email) => {
  const h = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const userFor = (email) => ({
  id: subjectFor(email), aud: 'authenticated', role: 'authenticated', email,
  email_confirmed_at: '2026-01-01T00:00:00Z', phone: '', app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: registry[email.trim().toLowerCase()]?.metadata ?? {}, identities: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', is_anonymous: false,
});
async function session(email) {
  const now = Math.floor(Date.now() / 1000);
  const access_token = await new SignJWT({ email, role: 'authenticated', aal: 'aal1', session_id: subjectFor(email), is_anonymous: false })
    .setProtectedHeader({ alg: 'ES256', kid: 'demo-key', typ: 'JWT' })
    .setIssuer(ISS).setAudience('authenticated').setSubject(subjectFor(email)).setIssuedAt(now).setExpirationTime(now + 3600)
    .sign(privateKey);
  return { access_token, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600,
    refresh_token: 'rt.' + Buffer.from(email).toString('base64url'), user: userFor(email) };
}

const cors = (req) => ({
  'Access-Control-Allow-Origin': req.headers.origin ?? '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', Vary: 'Origin',
});
const send = (req, res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...cors(req) });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const readBody = (req) => new Promise((ok) => { let s = ''; req.on('data', (d) => (s += d)); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { ok({}); } }); });

createServer(async (req, res) => {
  const url = new URL(req.url, ISS);
  const path = url.pathname.replace(/^\/auth\/v1/, '');
  if (req.method === 'OPTIONS') return send(req, res, 204);
  try {
    if (path === '/.well-known/jwks.json') return send(req, res, 200, { keys: [publicJwk] });
    if (path === '/settings') return send(req, res, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: true });
    if (path === '/token' && req.method === 'POST') {
      const b = await readBody(req);
      const grant = url.searchParams.get('grant_type');
      let email = '';
      if (grant === 'password') email = String(b.email ?? '').trim().toLowerCase();
      else if (grant === 'refresh_token' && String(b.refresh_token).startsWith('rt.')) email = Buffer.from(String(b.refresh_token).slice(3), 'base64url').toString();
      if (!/^[^\s@]+@[^\s@]+$/.test(email)) return send(req, res, 400, { code: 'invalid_credentials', message: 'Invalid login credentials' });
      if (grant === 'password' && registry[email] && registry[email].password !== String(b.password ?? ''))
        return send(req, res, 400, { code: 'invalid_credentials', message: 'Invalid login credentials' });
      return send(req, res, 200, await session(email));
    }
    if (path === '/user') {
      const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
      const { payload } = await jwtVerify(token, publicKey, { issuer: ISS, audience: 'authenticated' });
      const email = String(payload.email).toLowerCase();
      if (req.method === 'PUT') {
        const b = await readBody(req);
        const entry = (registry[email] ??= { password: '', metadata: {} });
        if (typeof b.password === 'string') entry.password = b.password;
        if (b.data && typeof b.data === 'object') entry.metadata = { ...entry.metadata, ...b.data };
        saveRegistry();
      }
      return send(req, res, 200, userFor(email));
    }
    if (path === '/admin/attempts') return send(req, res, 200, { attempts: adminAttempts.length });
    if (path === '/admin/users') {
      if (req.headers.authorization !== `Bearer ${ADMIN_KEY}`) return send(req, res, 401, { message: 'admin key required' });
      if (req.method === 'POST') {
        const b = await readBody(req);
        const email = String(b.email ?? '').trim().toLowerCase();
        adminAttempts.push(email);
        if (!/^[^\s@]+@[^\s@]+$/.test(email) || typeof b.password !== 'string' || b.password.length < 6)
          return send(req, res, 422, { error_code: 'validation_failed', msg: 'invalid email or password' });
        if (registry[email]) return send(req, res, 422, { error_code: 'email_exists', msg: 'A user with this email address has already been registered' });
        registry[email] = { password: b.password, metadata: b.user_metadata ?? {} };
        saveRegistry();
        return send(req, res, 200, userFor(email));
      }
    }
    const adminDelete = /^\/admin\/users\/([0-9a-f-]+)$/.exec(path);
    if (adminDelete && req.method === 'PUT') {
      if (req.headers.authorization !== `Bearer ${ADMIN_KEY}`) return send(req, res, 401, { message: 'admin key required' });
      const b = await readBody(req);
      const email = Object.keys(registry).find((e) => subjectFor(e) === adminDelete[1]);
      if (!email) return send(req, res, 404, { message: 'user not found' });
      if (typeof b.password === 'string') registry[email].password = b.password;
      if (b.user_metadata && typeof b.user_metadata === 'object') registry[email].metadata = { ...registry[email].metadata, ...b.user_metadata };
      saveRegistry();
      return send(req, res, 200, userFor(email));
    }
    if (adminDelete && req.method === 'DELETE') {
      if (req.headers.authorization !== `Bearer ${ADMIN_KEY}`) return send(req, res, 401, { message: 'admin key required' });
      for (const email of Object.keys(registry)) if (subjectFor(email) === adminDelete[1]) delete registry[email];
      saveRegistry();
      return send(req, res, 200, {});
    }
    if (path === '/logout') return send(req, res, 204);
    return send(req, res, 404, { message: 'not implemented in the local demo auth server' });
  } catch (e) {
    return send(req, res, 401, { code: 'bad_jwt', message: String(e.message ?? e) });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`demo auth on ${ISS}`));
