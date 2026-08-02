import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = [
  'index.html',
  'app.js',
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

console.log(`Vite dist verified with ${javascriptAssets.length} JavaScript bundle(s).`);
