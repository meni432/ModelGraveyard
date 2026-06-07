// Postprocess entrypoint invoked by the Flat action after raw fetch lands.
// Stays self-contained so swapping Flat for plain curl + git is trivial.

import {
  normalizeResponse,
  today,
  type NormalizedModel,
  type OpenRouterRawResponse,
} from "./normalize.ts";
import { diffSnapshots, type Event, type GraveyardEntry } from "./diff.ts";
import { writeFeeds } from "./build-feeds.ts";
import { runCrossReference } from "./run-cross-reference.ts";

const RAW_PATH = "data/raw/openrouter-models.json";
const CURRENT_PATH = "data/derived/models-current.json";
const EVENTS_PATH = "data/derived/events.json";
const GRAVEYARD_PATH = "data/derived/graveyard.json";
const SUMMARY_PATH = "data/derived/summary.json";

const EVENTS_SIZE_LIMIT = 5 * 1024 * 1024;

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

interface CurrentFile {
  generated_at: string;
  models: NormalizedModel[];
}

interface EventsFile {
  events: Event[];
}

interface GraveyardFile {
  buried: GraveyardEntry[];
}

interface SummaryFile {
  generated_at: string;
  active_count: number;
  dead_count: number;
  last_event_ts: string | null;
  recent_events: Event[];
  scheduled_funerals: Array<{ id: string; provider: string; expiration_date: string }>;
}

function mapFromList(models: NormalizedModel[]): Map<string, NormalizedModel> {
  return new Map(models.map((m) => [m.id, m]));
}

async function maybeShardEvents(events: Event[]): Promise<Event[]> {
  const enc = new TextEncoder();
  const size = enc.encode(JSON.stringify(events)).byteLength;
  if (size <= EVENTS_SIZE_LIMIT) return events;

  const currentYear = new Date().getUTCFullYear();
  const keep: Event[] = [];
  const archiveByYear = new Map<number, Event[]>();
  for (const ev of events) {
    const year = Number(ev.ts.slice(0, 4));
    if (year === currentYear) {
      keep.push(ev);
    } else {
      const bucket = archiveByYear.get(year) ?? [];
      bucket.push(ev);
      archiveByYear.set(year, bucket);
    }
  }
  for (const [year, bucket] of archiveByYear) {
    await writeJson(`data/derived/events-${year}.json`, { events: bucket });
  }
  return keep;
}

export async function run(now: string = today()): Promise<void> {
  const raw = await readJson<OpenRouterRawResponse>(RAW_PATH, { data: [] });
  const currentFile = await readJson<CurrentFile>(CURRENT_PATH, {
    generated_at: now,
    models: [],
  });
  const eventsFile = await readJson<EventsFile>(EVENTS_PATH, { events: [] });
  const graveyardFile = await readJson<GraveyardFile>(GRAVEYARD_PATH, { buried: [] });

  const prior = mapFromList(currentFile.models);
  const current = normalizeResponse(raw, now);

  const { events, buried, next } = diffSnapshots(prior, current, now);

  eventsFile.events.push(...events);
  eventsFile.events = await maybeShardEvents(eventsFile.events);

  // Avoid duplicate graveyard entries on re-runs of the same day.
  const buriedIds = new Set(graveyardFile.buried.map((b) => b.id));
  for (const entry of buried) {
    if (!buriedIds.has(entry.id)) graveyardFile.buried.push(entry);
  }

  const sortedNext = [...next.values()].sort((a, b) => a.id.localeCompare(b.id));
  const sortedBuried = [...graveyardFile.buried].sort((a, b) =>
    b.buried_at.localeCompare(a.buried_at) || a.id.localeCompare(b.id)
  );

  await writeJson(CURRENT_PATH, {
    generated_at: now,
    models: sortedNext,
  } satisfies CurrentFile);

  await writeJson(EVENTS_PATH, eventsFile satisfies EventsFile);

  await writeJson(GRAVEYARD_PATH, { buried: sortedBuried } satisfies GraveyardFile);

  const scheduled = sortedNext
    .filter((m) => m.expiration_date && m.expiration_date >= now)
    .map((m) => ({
      id: m.id,
      provider: m.provider,
      expiration_date: m.expiration_date as string,
    }))
    .sort((a, b) => a.expiration_date.localeCompare(b.expiration_date));

  const recent = eventsFile.events.slice(-20).reverse();
  const last = eventsFile.events.at(-1)?.ts ?? null;

  await writeJson(SUMMARY_PATH, {
    generated_at: now,
    active_count: sortedNext.length,
    dead_count: sortedBuried.length,
    last_event_ts: last,
    recent_events: recent,
    scheduled_funerals: scheduled,
  } satisfies SummaryFile);

  // Cross-reference against the latest LiteLLM snapshot (if any) and emit
  // any newly-detected disagreement events. Done before writeFeeds so the
  // new events flow into the Atom feeds on this run.
  await runCrossReference(now);

  const eventsAfter = await readJson<EventsFile>(EVENTS_PATH, { events: [] });
  await writeFeeds(eventsAfter.events);

  console.log(
    `processed: +${events.filter((e) => e.type === "model_added").length} added · ` +
      `-${events.filter((e) => e.type === "model_removed").length} removed · ` +
      `${events.filter((e) => e.type === "price_changed").length} price · ` +
      `${events.filter((e) => e.type === "context_changed").length} context · ` +
      `${events.filter((e) => e.type === "deprecation_announced").length} deprecations`,
  );
}

if (import.meta.main) {
  await run();
}
