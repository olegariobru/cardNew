import { randomBytes, timingSafeEqual } from 'node:crypto';

export function issueCsrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('hex');
  return req.session.csrfToken;
}

export function requireCsrf(req, res, next) {
  const expected = req.session?.csrfToken;
  const supplied = req.get('x-csrf-token');
  if (!expected || !supplied) return res.status(403).json({ error: 'Token de segurança ausente. Atualize a página.' });
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return res.status(403).json({ error: 'Token de segurança inválido. Atualize a página.' });
  }
  next();
}

export function regenerateSession(req, data) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => {
      if (error) return reject(error);
      Object.assign(req.session, data);
      issueCsrfToken(req);
      req.session.save(saveError => saveError ? reject(saveError) : resolve());
    });
  });
}

export function destroySession(req) {
  return new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
}

export function generateTemporaryPassword() {
  return randomBytes(12).toString('base64url');
}
