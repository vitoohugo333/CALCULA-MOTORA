import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url));
const preparedRoot = path.join(repositoryRoot, '_site');
const outputRoot = path.join(repositoryRoot, 'dist');
const compatibilityFiles = [
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
