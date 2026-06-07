// Shared step: read both source catalogs from data/derived, run the
// cross-reference, write cross-reference.json + append disagreement events.

import { crossReference, type DisagreementEntry } from "./cross-reference.ts";
import type { NormalizedModel } from "./normalize.ts";
import type { GraveyardEntry, Event } from "./diff.ts";
import type { LiteLLMModel } from "./litellm-normalize.ts";
import { today } from "./normalize.ts";

const CURRENT_PATH = "data/derived/models-current.json";
const GRAVEYARD_PATH = "data/derived/graveyard.json";
const LITELLM_PATH = "data/derived/litellm-current.json";
const CROSS_REF_PATH = "data/derived/cross-reference.json";
const EVENTS_PATH = "data/derived/events.json";

interface CurrentFile {
  generated_at: string;
  models: NormalizedModel[];
}
interface GraveyardFile {
  buried: GraveyardEntry[];
}
interface LiteLLMFile {
  generated_at: string;
  models: LiteLLMModel[];
}
interface EventsFile {
  events: Event[];
}
interface CrossRefFileOnDisk {
  generated_at: string;
  openrouter_catalog_size: number;
  litellm_catalog_size: number;
  shared_count: number;
  openrouter_only_count: number;
  litellm_only_count: number;
  disagreements: DisagreementEntry[];
  pairings: Array<{ slug: string; openrouter_id: string; litellm_id: string }>;
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return fallback;
    throw err;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  const dir = path.split("/").slice(0, -1).join("/");
  if (dir) await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(path, JSON.stringify(value, null, 2) + "\n");
}

export async function runCrossReference(now: string = today()): Promise<void> {
  const [orCurrent, graveyard, litellm, prior, eventsFile] = await Promise.all([
    readJson<CurrentFile>(CURRENT_PATH, { generated_at: now, models: [] }),
    readJson<GraveyardFile>(GRAVEYARD_PATH, { buried: [] }),
    readJson<LiteLLMFile>(LITELLM_PATH, { generated_at: "", models: [] }),
    readJson<CrossRefFileOnDisk>(CROSS_REF_PATH, {
      generated_at: "",
      openrouter_catalog_size: 0,
      litellm_catalog_size: 0,
      shared_count: 0,
      openrouter_only_count: 0,
      litellm_only_count: 0,
      disagreements: [],
      pairings: [],
    }),
    readJson<EventsFile>(EVENTS_PATH, { events: [] }),
  ]);

  // If LiteLLM hasn't been fetched yet, write a minimal cross-reference
  // file so the SPA's loader doesn't 404.
  if (litellm.models.length === 0) {
    await writeJson(CROSS_REF_PATH, {
      generated_at: now,
      openrouter_catalog_size: orCurrent.models.length,
      litellm_catalog_size: 0,
      shared_count: 0,
      openrouter_only_count: orCurrent.models.length,
      litellm_only_count: 0,
      disagreements: [],
      pairings: [],
    });
    return;
  }

  const { file, newEvents } = crossReference({
    activeOR: orCurrent.models,
    buriedOR: graveyard.buried,
    activeLL: litellm.models,
    priorDisagreements: prior.disagreements,
    stamp: now,
  });

  await writeJson(CROSS_REF_PATH, file);

  if (newEvents.length > 0) {
    eventsFile.events.push(...newEvents);
    await writeJson(EVENTS_PATH, eventsFile);
    console.log(
      `cross-reference: ${file.disagreements.length} active disagreements (+${newEvents.length} new)`,
    );
  } else {
    console.log(
      `cross-reference: ${file.disagreements.length} disagreements (no new)`,
    );
  }
}
