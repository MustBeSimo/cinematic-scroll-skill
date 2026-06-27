#!/usr/bin/env node
/* frontmatter.mjs — minimal zero-dep YAML-subset reader for Pattern IR frontmatter.
   Subset is documented in references/pattern-ir.md. NOT a general YAML parser. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseScalar(raw) {
  const s = raw.trim();
  if (s === "null") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith("[")) { try { return JSON.parse(s); } catch { throw new Error(`invalid inline array: ${s}`); } }
  if (s.startsWith('"')) { try { return JSON.parse(s); } catch { throw new Error(`invalid quoted string: ${s}`); } }
  return s;
}

export function parseFrontmatter(text) {
  const m = text.match(FM);
  if (!m) throw new Error("no YAML frontmatter (file must start with ---)");
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`line ${i + 1}: expected "key: value" — got "${line.trim()}"`);
    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (rest === "") { const child = {}; parent[key] = child; stack.push({ indent, obj: child }); }
    else parent[key] = parseScalar(rest);
  }
  return { data: root, body: m[2] };
}
export function readEntry(absPath) { const { data, body } = parseFrontmatter(readFileSync(absPath, "utf8")); return { data, body, path: absPath }; }

function selftest() {
  const sample = [
    "---", 'schema_version: "1.0"', 'entry_id: "learned-technique-0001"', "type: technique",
    "machine_distilled: true", "evidence:", "  observation_method: browser",
    '  source_elements: ["interaction","timing"]', "  copied_material: false",
    "scores:", "  confidence: 0.8", "  reuse: null", "applicability:",
    '  tags: ["a","b"]', '  empty: ""', "---", "## body", "hello",
  ].join("\n");
  const a = (c, m) => { if (!c) { console.error(`✗ frontmatter selftest: ${m}`); process.exit(1); } };
  const { data, body } = parseFrontmatter(sample);
  a(data.schema_version === "1.0", "schema_version string");
  a(data.entry_id === "learned-technique-0001", "entry_id");
  a(data.type === "technique", "bare string");
  a(data.machine_distilled === true, "boolean");
  a(data.evidence.observation_method === "browser", "nested scalar");
  a(Array.isArray(data.evidence.source_elements) && data.evidence.source_elements.length === 2, "inline array");
  a(data.evidence.copied_material === false, "nested false");
  a(data.scores.confidence === 0.8, "number");
  a(data.scores.reuse === null, "null");
  a(Array.isArray(data.applicability.tags) && data.applicability.tags[0] === "a", "tags array");
  a(data.applicability.empty === "", "empty quoted string");
  a(body.includes("## body"), "body extracted");
  console.log("✓ frontmatter selftest: nested maps, arrays, scalars, null, body.");
  process.exit(0);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) { if (process.argv.includes("--selftest")) selftest(); else { console.error("frontmatter.mjs is a library; run --selftest."); process.exit(2); } }
