import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url));
const preparedRoot = path.join(repositoryRoot, '_site');
const outputRoot = path.join(repositoryRoot, 'dist');
const compatibilityFiles = [
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

function legacyCompatibilityPlugin() {
  return {
    name: 'vetta-legacy-compatibility',
    apply: 'build',
    closeBundle() {
      mkdirSync(outputRoot, { recursive: true });
      for (const file of compatibilityFiles) {
        const source = path.join(preparedRoot, file);
        if (!existsSync(source)) throw new Error(`Arquivo necessário ausente no preparo Vite: ${file}`);
        copyFileSync(source, path.join(outputRoot, file));
      }

      const outputIndex = path.join(outputRoot, 'index.html');
      const builtHtml = readFileSync(outputIndex, 'utf8');
      const stableManifestLink = '<link rel="manifest" href="./manifest.webmanifest">';
      const correctedHtml = builtHtml.replace(
        /<link rel="manifest"[^>]*href="\.\/assets\/manifest-[^"]+\.webmanifest"[^>]*>/,
        stableManifestLink,
      );
      if (!correctedHtml.includes(stableManifestLink)) {
        throw new Error('O HTML final não preservou o manifesto PWA na raiz do aplicativo.');
      }
      writeFileSync(outputIndex, correctedHtml);
    },
  };
}

export default defineConfig({
  root: preparedRoot,
  base: './',
  publicDir: false,
  build: {
    outDir: outputRoot,
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: true,
  },
  plugins: [legacyCompatibilityPlugin()],
});
