import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const required = [
  'src/app.js',
  'src/engine/finance.js',
  'src/engine/calendar.js',
  'src/engine/costs.js',
  'src/engine/projections.js',
  'src/storage/database.js',
  'src/storage/migrations.js',
  'src/storage/backup.js',
  'src/pwa/install.js',
  'src/pwa/updates.js',
  'src/views/dashboard.js',
  'src/views/day.js',
  'src/views/history.js',
  'src/views/settings.js',
  'src/views/extras.js'
];

await Promise.all(required.map(file => access(file, constants.R_OK)));
const app = await readFile('src/app.js', 'utf8');
const index = await readFile('index.html', 'utf8');
for (const token of ['new Function(', 'patch-01', '.part']) {
  if (app.includes(token) || index.includes(token)) throw new Error(`Estrutura antiga encontrada: ${token}`);
}
console.log('Estrutura modular validada.');
