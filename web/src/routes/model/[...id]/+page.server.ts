import fs from "node:fs/promises";
import path from "node:path";
import type { EntryGenerator } from "./$types.js";

// Enumerate prerender targets at build time using fs directly — entries()
// can't accept a fetch arg, so we read the JSON the static symlink points at.
export const entries: EntryGenerator = async () => {
  const root = process.cwd();
  const [modelsText, graveyardText] = await Promise.all([
    fs.readFile(path.join(root, "static/data/derived/models-current.json"), "utf8"),
    fs.readFile(path.join(root, "static/data/derived/graveyard.json"), "utf8"),
  ]);
  const models = JSON.parse(modelsText) as { models: Array<{ id: string }> };
  const graveyard = JSON.parse(graveyardText) as { buried: Array<{ id: string }> };
  const all = new Set<string>();
  for (const m of models.models) all.add(m.id);
  for (const g of graveyard.buried) all.add(g.id);
  return [...all].map((id) => ({ id }));
};
