import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = [
  'index.html',
  'app.js',
  'styles.css',
  'sw.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'dev-build.json',
  '.nojekyll',
  'robots.txt',
];

for (const file of requiredFiles) {
  await access(path.join('dist', file));
}

const indexHtml = await readFile(path.join('dist', 'index.html'), 'utf8');
if (!/src="\.\/assets\/[^\"]+\.js"/.test(indexHtml)) {
  throw new Error('O HTML final não referencia um módulo empacotado em assets/.');
}
if (indexHtml.includes('./src/vite/main.js')) {
  throw new Error('O HTML final ainda referencia o módulo-fonte do Vite.');
}
if (!indexHtml.includes('./app.js')) {
  throw new Error('A entrada legada precisa permanecer no primeiro corte da migração.');
}
if (!indexHtml.includes('<link rel="manifest" href="./manifest.webmanifest">')) {
  throw new Error('O HTML final não referencia o manifesto estável na raiz do aplicativo.');
}
if (/href="\.\/assets\/manifest-[^"]+\.webmanifest"/.test(indexHtml)) {
  throw new Error('O manifesto não pode ser servido dentro de assets/, pois isso quebra scope, start_url e ícones relativos.');
}

const manifest = JSON.parse(await readFile(path.join('dist', 'manifest.webmanifest'), 'utf8'));
if (manifest.display !== 'standalone' || manifest.start_url !== './' || manifest.scope !== './') {
  throw new Error('O manifesto publicado não preserva display standalone, start_url e scope do aplicativo.');
}
for (const icon of manifest.icons || []) {
  if (!String(icon.src || '').startsWith('./')) {
    throw new Error(`Ícone do manifesto fora do escopo relativo esperado: ${icon.src}`);
  }
  await access(path.join('dist', String(icon.src).replace(/^\.\//, '')));
}

const serviceWorker = await readFile(path.join('dist', 'sw.js'), 'utf8');
const shellMatches = [...serviceWorker.matchAll(/'\.\/([^']+)'/g)].map(match => match[1].split('?')[0]);
for (const shellFile of shellMatches) {
  if (!shellFile || shellFile === '') continue;
  await access(path.join('dist', shellFile));
}

const assetsPath = path.join('dist', 'assets');
const assets = await readdir(assetsPath);
const javascriptAssets = assets.filter(file => file.endsWith('.js'));
if (!javascriptAssets.length) {
  throw new Error('Nenhum bundle JavaScript foi gerado pelo Vite.');
}

let bundledJavascript = '';
for (const file of javascriptAssets) {
  const assetPath = path.join(assetsPath, file);
  const info = await stat(assetPath);
  if (info.size <= 0) throw new Error(`Bundle vazio: ${file}`);
  bundledJavascript += await readFile(assetPath, 'utf8');
}

const requiredBundleMarkers = [
  'vettaPwaInstallGate',
  'vettaDidacticLanguage',
  'vettaOnboardingExperience',
  'vettaViteParity',
];
for (const marker of requiredBundleMarkers) {
  if (!bundledJavascript.includes(marker)) {
    throw new Error(`O bundle Vite não contém o módulo esperado: ${marker}`);
  }
}

const buildInfo = JSON.parse(await readFile(path.join('dist', 'dev-build.json'), 'utf8'));
if (buildInfo.buildSystem !== 'vite') {
  throw new Error('dev-build.json não identifica o build Vite.');
}
if (!buildInfo.branch || !buildInfo.sha) {
  throw new Error('dev-build.json não registra branch e SHA.');
}

const sourceIndex = await readFile('index.html', 'utf8');
if (sourceIndex.includes('src/vite/main.js') || sourceIndex.includes('pwa-install-gate.js')) {
  throw new Error('A entrada oficial foi alterada; o experimento deve continuar isolado no build de desenvolvimento.');
}

console.log(`Vite dist verified with ${javascriptAssets.length} JavaScript bundle(s) and an installable root manifest.`);
