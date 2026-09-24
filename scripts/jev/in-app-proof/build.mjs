// One build for the in-app Jev proof (see proof.mjs for the whole recipe).
//
//   node scripts/jev/in-app-proof/build.mjs <outDir> on|off|cloud [sourceRoot]
//
// on    VITE_JEV=1 against a fake Supabase project (https://fakeproj.supabase.co)
// cloud the same fake project, no flag
// off   no project, no flag
// Vite's cache goes under PROOF_DIR, never node_modules/.cache or .vite.
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
const [outDir, flag, root] = process.argv.slice(2);
const SCRATCH = process.env.PROOF_DIR || join(tmpdir(), 'jev-in-app-proof');
const HERE = new URL('../../../', import.meta.url).pathname;
if (flag === 'on') {
  process.env.VITE_JEV = '1';
  process.env.VITE_SUPABASE_URL = 'https://fakeproj.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'fake-anon-key-public';
} else if (flag === 'cloud') {
  // Same fake project, no flag: proves the flag alone gates it.
  process.env.VITE_SUPABASE_URL = 'https://fakeproj.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'fake-anon-key-public';
}
await build({
  root: root || HERE,
  configFile: (root ? root + '/' : HERE) + 'vite.config.ts',
  cacheDir: SCRATCH + '/.vite-cache-' + flag + (root ? '-base' : ''),
  logLevel: 'warn',
  build: { outDir, emptyOutDir: true },
});
console.log('built', flag, outDir);
