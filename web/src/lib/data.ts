import { base } from "$app/paths";
import type {
  EventsFile,
  GraveyardFile,
  ModelsCurrentFile,
  SummaryFile,
} from "./types.ts";

async function load<T>(fetchFn: typeof fetch, path: string): Promise<T> {
  const res = await fetchFn(`${base}/data/${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const loadSummary = (f: typeof fetch) =>
  load<SummaryFile>(f, "derived/summary.json");

export const loadGraveyard = (f: typeof fetch) =>
  load<GraveyardFile>(f, "derived/graveyard.json");

export const loadEvents = (f: typeof fetch) =>
  load<EventsFile>(f, "derived/events.json");

export const loadModels = (f: typeof fetch) =>
  load<ModelsCurrentFile>(f, "derived/models-current.json");
