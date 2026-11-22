import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { databaseFile } from '../lib/server/db.ts';

/* A safe copy of the database, even while the app is running: npm run backup */
const file = databaseFile();
if (!existsSync(file)) {
  console.log('There is no database yet.');
  process.exit(1);
}
const folder = path.join(path.dirname(file), 'backups');
mkdirSync(folder, { recursive: true });
const copy = path.join(folder, `app-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
const db = new DatabaseSync(file, { readOnly: true });
db.prepare('VACUUM INTO ?').run(copy);
db.close();
console.log(`Saved ${path.relative(process.cwd(), copy)}. It contains everyone's data: keep it private, and off this computer too.`);
