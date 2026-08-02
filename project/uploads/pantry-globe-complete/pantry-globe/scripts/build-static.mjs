// Builds a single self-contained HTML file: the real engine (bundled from the
// same TypeScript the deployed app uses) plus a vanilla-JS shell. No server,
// no build step for the end user, no key. Open it and it works.
//
// The same output is also assembled into dist/ as a static site, so the file you
// download and the site that gets deployed are byte-identical rather than two
// builds that can drift apart.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

execSync('node scripts/build-photos.mjs', { stdio: 'inherit' });
execSync('node scripts/build-dishpix.mjs', { stdio: 'inherit' });
execSync('node scripts/build-ingpix.mjs', { stdio: 'inherit' });
execSync('npx esbuild scripts/static-entry.ts --bundle --format=iife --global-name=PG --minify --target=es2020 --outfile=/tmp/engine.js', { stdio: 'inherit' });
const engine = readFileSync('/tmp/engine.js', 'utf8');
const shell = readFileSync('scripts/static-shell.html', 'utf8');
if (!shell.includes('/*__ENGINE__*/')) throw new Error('shell is missing the engine placeholder');
const out = shell.replace('/*__ENGINE__*/', () => engine);

writeFileSync('/home/claude/pantry-globe.html', out);
console.log(`built ${(out.length / 1024).toFixed(0)} KB -> /home/claude/pantry-globe.html`);

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
writeFileSync(join('dist', 'index.html'), out);
// public/ now has a pix/ directory in it, so this has to recurse
function copyInto(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const e of readdirSync(src, { withFileTypes: true })) {
    const a = join(src, e.name), b = join(dst, e.name);
    if (e.isDirectory()) copyInto(a, b); else copyFileSync(a, b);
  }
}
copyInto('public', 'dist');
// A download of the exact same build, offered from inside the site itself.
writeFileSync(join('dist', 'pantry-globe.html'), out);
console.log(`dist/ ready: ${readdirSync('dist').join(', ')}`);
