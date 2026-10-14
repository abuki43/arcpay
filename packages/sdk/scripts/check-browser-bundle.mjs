#!/usr/bin/env node
/**
 * Guard against Node built-ins leaking into the browser bundle.
 *
 * tsup defaults to `--platform node`, which makes esbuild ignore the `browser`
 * field of every dependency. Any package that ships a Node entry alongside a
 * browser entry then gets bundled with its Node code, and esbuild's
 * `__commonJS` shim throws at module-eval time in the browser:
 *
 *   Error: Dynamic require of "fs" is not supported
 *
 * That failure is invisible to `tsc` and to `next build` — the bundle is valid
 * JS and correctly typed, it just explodes when a browser executes it. This
 * check runs after `tsup` so the class of bug cannot ship silently again.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

let files;
try {
  files = readdirSync(DIST).filter((f) => f.endsWith('.mjs'));
} catch {
  console.error(`check-browser-bundle: cannot read ${DIST} — did the build run?`);
  process.exit(1);
}

const offenders = [];

for (const file of files) {
  const source = readFileSync(join(DIST, file), 'utf8');
  const found = source.match(/__require\("[a-z:]+"\)/g);
  if (found) {
    offenders.push({ file, builtins: [...new Set(found)].sort() });
  }
}

if (offenders.length > 0) {
  console.error('check-browser-bundle: Node built-ins leaked into the browser bundle.\n');
  for (const { file, builtins } of offenders) {
    console.error(`  ${file}`);
    for (const b of builtins) console.error(`    ${b}`);
  }
  console.error(
    '\n  The SDK builds with `--platform browser` so esbuild honours each package\'s\n' +
      '  "browser" field. If this reappears, a dependency likely dropped that field\n' +
      '  or you added an entry that imports a Node-only module.\n'
  );
  process.exit(1);
}

console.log(`check-browser-bundle: clean (${files.length} files scanned)`);