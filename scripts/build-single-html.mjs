// Build a single self-contained dist/daslight-midi-pad-editor.html.
//
// 1. esbuild bundles src/app.js (resolving 'lit' from node_modules) into one
//    minified ESM string.
// 2. We read index.html, strip the <script type="importmap"> and the
//    <script type="module" src="..."> tag, inline the bundled JS as a single
//    <script type="module"> at the same spot, and inline the stylesheet too.
// 3. Output → dist/daslight-midi-pad-editor.html (the project name is the
//    file name so emailing or downloading the artifact stays self-describing).

import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const result = await build({
  entryPoints: [join(root, 'src/app.js')],
  bundle: true,
  format: 'esm',
  minify: true,
  write: false,
  target: 'es2022',
  legalComments: 'none',
});
const js = result.outputFiles[0].text;

const html = await readFile(join(root, 'index.html'), 'utf8');
const css = await readFile(join(root, 'src/style.css'), 'utf8');

const inlined = html
  .replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '')
  .replace(/\s*<link rel="stylesheet" href="\.\/src\/style\.css" \/>/, `\n    <style>${css}</style>`)
  .replace(/<script type="module" src="\.\/src\/app\.js"><\/script>/, () => `<script type="module">${js}</script>`);

const distDir = join(root, 'dist');
await mkdir(distDir, { recursive: true });
const outPath = join(distDir, 'daslight-midi-pad-editor.html');
await writeFile(outPath, inlined, 'utf8');

const sizeKb = (Buffer.byteLength(inlined, 'utf8') / 1024).toFixed(1);
console.log(`built ${outPath} (${sizeKb} KB)`);
