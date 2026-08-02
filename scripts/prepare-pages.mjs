import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = '_site';
const rootFiles = [
  'index.html',
  'app.js',
  'styles.css',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'sw.js',
  'pwa-install-gate.js',
  'pwa-install-gate.css',
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of rootFiles) {
  await cp(file, path.join(output, file));
}

await mkdir(path.join(output, 'src', 'pwa'), { recursive: true });
await cp('src/pwa/install-gate-core.js', path.join(output, 'src', 'pwa', 'install-gate-core.js'));

const sourceHtml = await readFile('index.html', 'utf8');
if (!sourceHtml.includes('</head>') || !sourceHtml.includes('</body>')) {
  throw new Error('index.html sem marcadores de fechamento esperados.');
}

const stylesheet = '<link href="./pwa-install-gate.css?v=exp-1" rel="stylesheet">';
const script = '<script type="module" src="./pwa-install-gate.js?v=exp-1"></script>';
let developmentHtml = sourceHtml
  .replace('<link rel="apple-touch-icon" href="./icon.svg">', '<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png">')
  .replace('</head>', `${stylesheet}</head>`)
  .replace('</body>', `${script}</body>`);

if (!developmentHtml.includes(stylesheet) || !developmentHtml.includes(script)) {
  throw new Error('Gate experimental não foi injetado no HTML do GitHub Pages.');
}

await writeFile(path.join(output, 'index.html'), developmentHtml);
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log('GitHub Pages development artifact prepared with experimental PWA install gate.');
