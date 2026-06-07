// Postprocess for the LiteLLM model_prices_and_context_window.json fetch.
// Diffs against the prior snapshot, writes data/derived/litellm-current.json,
// and triggers a cross-reference pass that compares LiteLLM vs OpenRouter
// and emits any new disagreement_detected events.

import {
  normalizeLiteLLM,
  type LiteLLMModel,
  type LiteLLMRawFile,
} from "./litellm-normalize.ts";
import { today } from "./normalize.ts";
import { runCrossReference } from "./run-cross-reference.ts";
import { writeFeeds } from "./build-feeds.ts";
import type { Event } from "./diff.ts";

const RAW_PATH = "data/raw/litellm-prices.json";
const CURRENT_PATH = "data/derived/litellm-current.json";
const EVENTS_PATH = "data/derived/events.json";

interface CurrentFile {
  generated_at: string;
  models: LiteLLMModel[];
}
interface EventsFile {
  events: Event[];
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

function mapFromList(models: LiteLLMModel[]): Map<string, LiteLLMModel> {
  return new Map(models.map((m) => [m.canonical_slug, m]));
}

export async function run(now: string = today()): Promise<void> {
  const raw = await readJson<LiteLLMRawFile>(RAW_PATH, {});
  const prior = await readJson<CurrentFile>(CURRENT_PATH, {
    generated_at: now,
    models: [],
  });

  const priorMap = mapFromList(prior.models);
  const currentMap = normalizeLiteLLM(raw, now);

  // Merge: preserve first_seen for survivors, bump last_seen.
  let added = 0;
  let removed = 0;
  const merged = new Map<string, LiteLLMModel>();
  for (const [slug, cur] of currentMap) {
    const prev = priorMap.get(slug);
    if (!prev) {
      added++;
      merged.set(slug, cur);
    } else {
      merged.set(slug, { ...cur, first_seen: prev.first_seen, last_seen: now });
    }
  }
  for (const slug of priorMap.keys()) {
    if (!currentMap.has(slug)) removed++;
  }

  const sorted = [...merged.values()].sort((a, b) =>
    a.canonical_slug.localeCompare(b.canonical_slug),
  );
  await writeJson(CURRENT_PATH, { generated_at: now, models: sorted });

  await runCrossReference(now);

  const eventsAfter = await readJson<EventsFile>(EVENTS_PATH, { events: [] });
  await writeFeeds(eventsAfter.events);

  console.log(
    `litellm: ${sorted.length} models (relevant modes) · +${added} new · -${removed} dropped`,
  );
}

if (import.meta.main) {
  await run();
}
