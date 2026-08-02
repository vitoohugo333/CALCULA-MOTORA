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
  'didactic-language.js',
  'didactic-language.css',
  'onboarding-experience.js',
  'onboarding-experience.css',
];

const branch = process.env.VETTA_DEV_BRANCH || 'local';
const sha = process.env.VETTA_DEV_SHA || 'local';
const pullRequest = process.env.VETTA_DEV_PR || 'local';
const generatedAt = new Date().toISOString();

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of rootFiles) {
  await cp(file, path.join(output, file));
}

await mkdir(path.join(output, 'src', 'pwa'), { recursive: true });
await cp('src/pwa/install-gate-core.js', path.join(output, 'src', 'pwa', 'install-gate-core.js'));
await mkdir(path.join(output, 'src', 'ui'), { recursive: true });
await cp('src/ui/didactic-language-core.js', path.join(output, 'src', 'ui', 'didactic-language-core.js'));
await mkdir(path.join(output, 'src', 'onboarding'), { recursive: true });
await cp('src/onboarding/onboarding-core.js', path.join(output, 'src', 'onboarding', 'onboarding-core.js'));
await cp('src/domain', path.join(output, 'src', 'domain'), { recursive: true });
await cp('src/storage', path.join(output, 'src', 'storage'), { recursive: true });
await cp('src/vite', path.join(output, 'src', 'vite'), { recursive: true });

const sourceHtml = await readFile('index.html', 'utf8');
if (!sourceHtml.includes('</head>') || !sourceHtml.includes('</body>')) {
  throw new Error('index.html sem marcadores de fechamento esperados.');
}

const stylesheets = [
  '<link href="./didactic-language.css?v=phase-2" rel="stylesheet">',
  '<link href="./onboarding-experience.css?v=phase-3" rel="stylesheet">',
  '<link href="./pwa-install-gate.css?v=exp-1" rel="stylesheet">',
].join('');
const scripts = [
  '<script type="module" src="./didactic-language.js?v=phase-2"></script>',
  '<script type="module" src="./onboarding-experience.js?v=phase-3"></script>',
  '<script type="module" src="./src/vite/main.js?v=phase-4"></script>',
  '<script type="module" src="./pwa-install-gate.js?v=exp-1"></script>',
].join('');
const sourceMeta = [
  `<meta name="vetta-dev-branch" content="${escapeHtml(branch)}">`,
  `<meta name="vetta-dev-sha" content="${escapeHtml(sha)}">`,
].join('');
const sourceBadge = `<aside id="vettaDevSource" aria-label="Versão publicada para testes" style="position:fixed;right:10px;bottom:10px;z-index:500;max-width:calc(100vw - 20px);padding:7px 10px;border-radius:999px;background:#0b1121;color:#fff;font:700 10px/1.2 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">DEV · ${escapeHtml(branch)} · ${escapeHtml(sha.slice(0, 8))}</aside>`;

const developmentHtml = sourceHtml
  .replace('<link rel="apple-touch-icon" href="./icon.svg">', '<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png">')
  .replace('</head>', `${stylesheets}${sourceMeta}</head>`)
  .replace('</body>', `${sourceBadge}${scripts}</body>`);

if (!developmentHtml.includes('didactic-language.js')
  || !developmentHtml.includes('onboarding-experience.js')
  || !developmentHtml.includes('src/vite/main.js')
  || !developmentHtml.includes('pwa-install-gate.js')
  || !developmentHtml.includes('vettaDevSource')) {
  throw new Error('Fases de linguagem, onboarding, Vite, instalação ou identificação da branch não foram injetadas no GitHub Pages.');
}

const buildInfo = {
  environment: 'github-pages-development',
  buildSystem: 'vite',
  branch,
  sha,
  pullRequest,
  generatedAt,
};

await writeFile(path.join(output, 'index.html'), developmentHtml);
await writeFile(path.join(output, 'dev-build.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log(`Vite source artifact prepared from ${branch}@${sha}.`);
