import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readEntry } from "./frontmatter.mjs";
import { TYPE_DIR } from "./schema.mjs";

export function collectEntries(root) {
  const out = [];
  for (const [type, dir] of Object.entries(TYPE_DIR)) {
    const d = join(root, "references", "learned", dir);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) {
      if (!f.endsWith(".md")) continue;
      const filePath = join(d, f);
      try {
        const { data, body } = readEntry(filePath);
        out.push({ type, dir, file: f, path: filePath, data, body });
      } catch (err) {
        out.push({ type, dir, file: f, path: filePath, error: err.message });
      }
    }
  }
  return out;
}
