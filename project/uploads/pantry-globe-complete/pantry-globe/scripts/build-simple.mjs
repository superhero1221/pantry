// The stripped-back build. Same engine, one-fifth of the interface.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
execSync('npx esbuild scripts/static-entry.ts --bundle --format=iife --global-name=PG --minify --target=es2020 --outfile=/tmp/engine.js', { stdio: 'inherit' });
const engine = readFileSync('/tmp/engine.js', 'utf8');
const shell = readFileSync('scripts/simple-shell.html', 'utf8');
const out = shell.replace('/*__ENGINE__*/', () => engine);
writeFileSync('/home/claude/pantry-simple.html', out);
console.log(`${(out.length / 1024).toFixed(0)} KB -> /home/claude/pantry-simple.html`);
