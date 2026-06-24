#!/usr/bin/env node
/**
 * cinematic-scroll-skill installer
 * ---------------------------------
 * Copies the skill payload into ~/.claude/skills/cinematic-scroll/ so Claude Code
 * (or any Agent-Skill-compatible client that reads ~/.claude/skills) can load it.
 *
 *   npx cinematic-scroll-skill            → install / update
 *   npx cinematic-scroll-skill --dir DIR  → install into a custom skills directory
 *   npx cinematic-scroll-skill --help
 *
 * This is a convenience layer. The native channels are the Claude Code plugin
 * marketplace (/plugin marketplace add MustBeSimo/cinematic-scroll-skill) and a
 * plain `git clone` into ~/.claude/skills/ — see the repo README.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL_NAME = 'cinematic-scroll';

/* The skill payload — everything the agent needs at runtime. The marketing
   landing page (index.html) and its assets/ are intentionally excluded. */
const PAYLOAD = [
  'SKILL.md',
  // The v2.5.0 design system — SKILL.md routes to these, so the install is
  // incomplete without them. Must stay in sync with package.json "files".
  'design.md',
  'tokens',
  'themes',
  'components',
  'evals',
  'manifest.json',
  'manifest.md',
  'taste-guardrails.md',
  'audit-mode.md',
  'troubleshooting.md',
  'decision-log.md',
  'scroll-choreography.json',
  'scroll-choreography-compilation.md',
  'compile-choreography.mjs',
  'MODELS.md',
  'COMPATIBILITY.md',
  'ASSETS-3D.md',      // SKILL.md routes here (3D asset hand-off)
  'FRAME.md',          // SKILL.md routes here (launch-film / video pipeline)
  'REVIEW.md',         // adversarial self-review referenced by the docs
  'references',
  'tools',             // cinematic-doctor (the quality gate SKILL.md tells agents to run), verify, heygen, …
  'templates',
  'examples',
  'LICENSE',
  'README.md',
];

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`cinematic-scroll-skill — install the skill into your Claude skills directory

Usage:
  npx cinematic-scroll-skill [--dir <skills-dir>]

Default target: ~/.claude/skills/${SKILL_NAME}
`);
  process.exit(0);
}

const dirFlag = args.indexOf('--dir');
const skillsDir = dirFlag !== -1 && args[dirFlag + 1]
  ? resolve(args[dirFlag + 1])
  : join(homedir(), '.claude', 'skills');

const dest = join(skillsDir, SKILL_NAME);

try {
  if (existsSync(dest)) {
    console.log(`↻ Updating existing skill at ${dest}`);
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dest, { recursive: true });

  let copied = 0;
  for (const item of PAYLOAD) {
    const src = join(PKG_ROOT, item);
    if (!existsSync(src)) continue; // tolerate a trimmed npm tarball
    cpSync(src, join(dest, item), { recursive: true });
    copied++;
  }

  if (copied === 0) {
    console.error('✗ No skill files were found to copy. This package may be corrupted — try reinstalling.');
    process.exit(1);
  }

  console.log(`\n✓ Installed the cinematic-scroll skill (${copied} items) →\n  ${dest}\n`);
  console.log('Next: restart Claude Code (or your client), then invoke the skill in chat.');
  console.log('Docs & live examples: https://mustbesimo.github.io/cinematic-scroll-skill/');
} catch (err) {
  console.error(`✗ Install failed: ${err.message}`);
  process.exit(1);
}
