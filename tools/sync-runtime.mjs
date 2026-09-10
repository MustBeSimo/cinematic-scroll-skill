#!/usr/bin/env node
/** The template is standalone; copy its runtime deterministically from canonical source. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'runtime'), destination = join(root, 'templates/nextjs/lib/cinematic');
const check = process.argv.includes('--check');
let drift = false;
const copies=readdirSync(source).filter(name => !name.includes('.test.') && /\.(mjs|mts|tsx)$/.test(name))
  .map(name=>[join(source,name),join(destination,name)]);
for(const name of ['kinetic-headline.tsx','tilt-card.tsx','magnetic-cursor.tsx']) copies.push([
  join(root,'components/mode-b',name),join(root,'templates/nextjs/components/cinematic',name),
]);
for (const [from,to] of copies) {
  const expected = readFileSync(from);
  let actual;
  try { actual = readFileSync(to); } catch {}
  if (!actual?.equals(expected)) {
    if (check) { console.error('Runtime drift: '+to); drift = true; }
    else { mkdirSync(dirname(to), { recursive: true }); writeFileSync(to, expected); }
  }
}
if (drift) process.exitCode = 1;
else console.log(check ? 'Runtime copies match canonical source.' : 'Runtime synchronized to standalone Next.js template.');
