import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { destroySession, generateTemporaryPassword, issueCsrfToken, regenerateSession, requireCsrf } from './security.js';

const app = express();
const PgSession = connectPgSimple(session);
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);
const registrationPattern = /^[\p{L}\p{N}._/-]{2,32}$/u;
const passwordHashOptions = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 };
const hashPassword = password => argon2.hash(password, passwordHashOptions);
const dummyPasswordHash = await hashPassword(randomBytes(24));

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET precisa ter pelo menos 32 caracteres.');
}

app.disable('x-powered-by');
if (production) app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '512kb' }));
app.use(session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
  name: 'servnet.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

const csrf = requireCsrf;
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const safeMember = row => ({ id: row.id, name: row.name, registration: row.registration, active: row.active, createdAt: row.created_at });

function requireMember(req, res, next) {
  if (req.session?.user?.role !== 'member') return res.status(401).json({ error: 'Faça login como associado para continuar.' });
  next();
}

function requireAdmin(req, res, next) {
  if (req.session?.user?.role !== 'admin') return res.status(401).json({ error: 'Acesso restrito à equipe TI/CPD.' });
  next();
}

function audit(adminId, action, memberId = null) {
  return pool.query('INSERT INTO audit_log (admin_id, action, member_id) VALUES ($1, $2, $3)', [adminId, action, memberId]);
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

app.get('/api/csrf', (req, res) => res.json({ csrfToken: issueCsrfToken(req) }));

app.get('/api/auth/me', asyncRoute(async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Sessão não autenticada.' });
  if (req.session.user.role === 'member') {
    const { rows } = await pool.query('SELECT id, name, registration, active FROM members WHERE id = $1', [req.session.user.id]);
    if (!rows[0]?.active) {
      await destroySession(req);
      return res.status(401).json({ error: 'Conta desativada.' });
    }
    return res.json({ user: { ...safeMember(rows[0]), role: 'member' } });
  }
  return res.json({ user: req.session.user });
}));

app.post('/api/auth/member/login', loginLimiter, csrf, asyncRoute(async (req, res) => {
  const registration = typeof req.body?.registration === 'string' ? req.body.registration.trim() : '';
  const password = req.body?.password;
  if (!registrationPattern.test(registration) || typeof password !== 'string' || password.length > 256) {
    return res.status(400).json({ error: 'Informe uma matrícula e uma senha válidas.' });
  }
  const { rows } = await pool.query('SELECT id, name, registration, password_hash, active FROM members WHERE LOWER(registration) = LOWER($1) LIMIT 1', [registration]);
  const member = rows[0];
  const matches = await argon2.verify(member?.password_hash || dummyPasswordHash, password).catch(() => false);
  if (!member || !member.active || !matches) return res.status(401).json({ error: 'Matrícula ou senha incorreta.' });
  await regenerateSession(req, { user: { id: member.id, role: 'member' } });
  res.json({ user: { ...safeMember(member), role: 'member' } });
}));

app.post('/api/auth/admin/login', loginLimiter, csrf, asyncRoute(async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = req.body?.password;
  if (!validText(username, 80) || typeof password !== 'string' || password.length > 256) return res.status(400).json({ error: 'Informe usuário e senha.' });
  const { rows } = await pool.query('SELECT id, username, password_hash, active FROM admins WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
  const admin = rows[0];
  const matches = await argon2.verify(admin?.password_hash || dummyPasswordHash, password).catch(() => false);
  if (!admin || !admin.active || !matches) return res.status(401).json({ error: 'Usuário ou senha incorreta.' });
  await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);
  await regenerateSession(req, { user: { id: admin.id, username: admin.username, role: 'admin' } });
  res.json({ user: req.session.user });
}));

app.post('/api/auth/logout', csrf, asyncRoute(async (req, res) => {
  await destroySession(req);
  res.clearCookie('servnet.sid', { httpOnly: true, secure: production, sameSite: 'lax' });
  res.status(204).end();
}));

app.get('/api/member/card', requireMember, asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, registration, active FROM members WHERE id = $1 AND active = TRUE', [req.session.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Associado não encontrado.' });
  res.json({ member: safeMember(rows[0]) });
}));

app.get('/api/admin/members', requireAdmin, asyncRoute(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const { rows } = await pool.query(
    `SELECT id, name, registration, active, created_at FROM members
     WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR registration ILIKE '%' || $1 || '%')
     ORDER BY name ASC LIMIT 1000`, [search],
  );
  res.json({ members: rows.map(safeMember) });
}));

app.post('/api/admin/members', requireAdmin, csrf, asyncRoute(async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
  const registration = typeof req.body?.registration === 'string' ? req.body.registration.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : generateTemporaryPassword();
  if (!validText(name, 160) || name.length < 2 || !registrationPattern.test(registration) || password.length < 12 || password.length > 256) {
    return res.status(400).json({ error: 'Nome, matrícula ou senha temporária inválidos. A senha precisa ter pelo menos 12 caracteres.' });
  }
  const passwordHash = await hashPassword(password);
  try {
    const { rows } = await pool.query(
      'INSERT INTO members (name, registration, password_hash) VALUES ($1, $2, $3) RETURNING id, name, registration, active, created_at',
      [name, registration, passwordHash],
    );
    await audit(req.session.user.id, 'member.created', rows[0].id);
    res.status(201).json({ member: safeMember(rows[0]), temporaryPassword: req.body?.password ? undefined : password });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Essa matrícula já está cadastrada.' });
    throw error;
  }
}));

app.patch('/api/admin/members/:id', requireAdmin, csrf, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().replace(/\s+/g, ' ') : '';
  const active = req.body?.active;
  if (!Number.isSafeInteger(id) || id <= 0 || !validText(name, 160) || name.length < 2 || typeof active !== 'boolean') {
    return res.status(400).json({ error: 'Dados inválidos para atualizar associado.' });
  }
  const { rows } = await pool.query(
    'UPDATE members SET name = $1, active = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, registration, active, created_at',
    [name, active, id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Associado não encontrado.' });
  await audit(req.session.user.id, active ? 'member.updated' : 'member.deactivated', id);
  res.json({ member: safeMember(rows[0]) });
}));

app.post('/api/admin/members/:id/reset-password', requireAdmin, csrf, asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido.' });
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const { rowCount } = await pool.query('UPDATE members SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND active = TRUE', [passwordHash, id]);
  if (!rowCount) return res.status(404).json({ error: 'Associado ativo não encontrado.' });
  await audit(req.session.user.id, 'member.password_reset', id);
  res.json({ temporaryPassword });
}));

app.post('/api/admin/members/import', requireAdmin, csrf, asyncRoute(async (req, res) => {
  const members = req.body?.members;
  if (!Array.isArray(members) || members.length === 0 || members.length > 1000) return res.status(400).json({ error: 'Envie entre 1 e 1.000 associados.' });
  const seen = new Set();
  const prepared = [];
  for (let index = 0; index < members.length; index += 1) {
    const item = members[index];
    const name = typeof item?.name === 'string' ? item.name.trim().replace(/\s+/g, ' ') : '';
    const registration = typeof item?.registration === 'string' ? item.registration.trim() : '';
    const key = registration.toLocaleLowerCase('pt-BR');
    if (!validText(name, 160) || name.length < 2 || !registrationPattern.test(registration)) return res.status(400).json({ error: `Dados inválidos na linha ${index + 1}.` });
    if (seen.has(key)) return res.status(409).json({ error: `Matrícula repetida no arquivo: ${registration}.` });
    seen.add(key);
    prepared.push({ name, registration, password: generateTemporaryPassword() });
  }
  const client = await pool.connect();
  const created = [];
  try {
    await client.query('BEGIN');
    for (let index = 0; index < prepared.length; index += 4) {
      const batch = prepared.slice(index, index + 4);
      const hashes = await Promise.all(batch.map(item => hashPassword(item.password)));
      for (const [offset, item] of batch.entries()) {
        const { rows } = await client.query(
          'INSERT INTO members (name, registration, password_hash) VALUES ($1, $2, $3) RETURNING id, name, registration, active, created_at',
          [item.name, item.registration, hashes[offset]],
        );
        created.push({ ...safeMember(rows[0]), temporaryPassword: item.password });
      }
    }
    for (const member of created) await client.query('INSERT INTO audit_log (admin_id, action, member_id) VALUES ($1, $2, $3)', [req.session.user.id, 'member.imported', member.id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Uma ou mais matrículas já estão cadastradas. Nenhuma linha foi importada.' });
    throw error;
  } finally {
    client.release();
  }
  res.status(201).json({ members: created });
}));

app.get('/api/admin/audit', requireAdmin, asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT a.id, a.action, a.created_at, m.name AS member_name, m.registration, u.username AS admin_username
     FROM audit_log a LEFT JOIN members m ON m.id = a.member_id LEFT JOIN admins u ON u.id = a.admin_id
     ORDER BY a.created_at DESC LIMIT 100`,
  );
  res.json({ events: rows });
}));

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '../dist');
app.use(express.static(distDir, { index: false, maxAge: production ? '1h' : 0 }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'), error => error && next(error));
});

app.use((error, _req, res, _next) => {
  console.error('Erro da API:', error.message);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Erro interno. Tente novamente ou contate a equipe de TI/CPD.' });
});

app.listen(port, () => console.log(`SERVNET API disponível em http://localhost:${port}`));

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    await pool.end();
    process.exit(0);
  });
}
