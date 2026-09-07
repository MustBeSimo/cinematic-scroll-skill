#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const bundle = path.join(root, "skills", "cinematic-scroll");
const skillPath = path.join(bundle, "SKILL.md");
const packagePath = path.join(root, "package.json");
const allowed = new Set([".md", ".json", ".yaml", ".yml", ".toml", ".txt"]);
const maxBytes = 50 * 1024 * 1024;
const errors = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      errors.push(`symbolic link is not allowed: ${path.relative(bundle, file)}`);
      return [];
    }
    return entry.isDirectory() ? walk(file) : [file];
  });
}

if (!fs.existsSync(skillPath)) {
  console.error("FAIL ClawHub bundle is missing skills/cinematic-scroll/SKILL.md");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const skill = fs.readFileSync(skillPath, "utf8");
const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? "";
const name = frontmatter.match(/^name:\s*([^\n]+)$/mu)?.[1]?.trim();
const version = frontmatter.match(/^\s{2}version:\s*([^\n]+)$/mu)?.[1]?.trim();

if (name !== path.basename(bundle)) {
  errors.push(`frontmatter name ${JSON.stringify(name)} must match folder cinematic-scroll`);
}
if (version !== pkg.version) {
  errors.push(`frontmatter version ${JSON.stringify(version)} must match package ${pkg.version}`);
}
if (/^license:/mu.test(frontmatter)) {
  errors.push("ClawHub assigns MIT-0; remove conflicting license metadata from SKILL.md");
}
if (!/^description:\s*\S+/mu.test(frontmatter)) {
  errors.push("frontmatter description is required");
}

const files = walk(bundle);
let bytes = 0;
for (const file of files) {
  const relative = path.relative(bundle, file);
  const extension = path.extname(file).toLowerCase();
  bytes += fs.statSync(file).size;
  if (!allowed.has(extension) && path.basename(file) !== ".clawhubignore") {
    errors.push(`non-text bundle file: ${relative}`);
  }
}
if (bytes > maxBytes) {
  errors.push(`bundle is ${(bytes / 1024 / 1024).toFixed(2)} MB; ClawHub limit is 50 MB`);
}

for (const match of skill.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
  const target = match[1].split("#")[0];
  if (!target || /^(?:https?:|mailto:)/u.test(target)) continue;
  const resolved = path.resolve(bundle, target);
  if (!fs.existsSync(resolved)) errors.push(`missing local reference: ${target}`);
}

if (errors.length) {
  console.error(`FAIL ClawHub bundle\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`PASS ClawHub bundle: ${files.length} text files, ${(bytes / 1024).toFixed(1)} KiB, version ${version}`);
