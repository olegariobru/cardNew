import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

try {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const schema = await readFile(path.join(here, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Estrutura do banco SERVNET criada/atualizada.');
} catch (error) {
  console.error('Falha ao preparar o banco:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
