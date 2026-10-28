import 'dotenv/config';
import argon2 from 'argon2';
import { pool } from './db.js';

const username = process.env.ADMIN_USERNAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!username || !password || password.length < 14) {
  console.error('Defina ADMIN_USERNAME e ADMIN_PASSWORD (mínimo de 14 caracteres) no arquivo .env.');
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 });
    await pool.query(
      `INSERT INTO admins (username, password_hash) VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE`,
      [username, passwordHash],
    );
    console.log(`Administrador "${username}" criado/atualizado.`);
  } catch (error) {
    console.error('Falha ao criar administrador:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
