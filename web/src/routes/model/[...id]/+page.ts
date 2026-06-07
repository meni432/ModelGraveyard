import { error } from "@sveltejs/kit";
import { loadModels, loadEvents, loadGraveyard } from "$lib/data.ts";
import type { PageLoad, EntryGenerator } from "./$types.js";

export const prerender = true;

export const entries: EntryGenerator = async () => {
  // Build from data/derived/models-current.json + graveyard.json at build time.
  const base = process.env.NODE_ENV === "production" ? "/ModelGraveyard" : "";
  const root = process.cwd();
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

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

export const load: PageLoad = async ({ fetch, params }) => {
  const [models, events, graveyard] = await Promise.all([
    loadModels(fetch),
    loadEvents(fetch),
    loadGraveyard(fetch),
  ]);
  const active = models.models.find((m) => m.id === params.id);
  const buried = graveyard.buried.find((g) => g.id === params.id);
  if (!active && !buried) {
    error(404, `Model ${params.id} not found`);
  }
  const history = events.events
    .filter((e) => e.id === params.id)
    .sort((a, b) => a.ts.localeCompare(b.ts));
  return { id: params.id, active, buried, history };
};
