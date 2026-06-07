import { error } from "@sveltejs/kit";
import {
  loadModels,
  loadEvents,
  loadGraveyard,
  loadCrossReference,
} from "$lib/data.ts";
import type { PageLoad } from "./$types.js";

export const prerender = true;

export const load: PageLoad = async ({ fetch, params }) => {
  const [models, events, graveyard, crossRef] = await Promise.all([
    loadModels(fetch),
    loadEvents(fetch),
    loadGraveyard(fetch),
    loadCrossReference(fetch).catch(() => null),
  ]);
  const active = models.models.find((m) => m.id === params.id);
  const buried = graveyard.buried.find((g) => g.id === params.id);
  if (!active && !buried) {
    error(404, `Model ${params.id} not found`);
  }
  const history = events.events
    .filter((e) => e.id === params.id)
    .sort((a, b) => a.ts.localeCompare(b.ts));

  // Cross-source status. params.id is the OpenRouter id; look up the matching
  // pairing or disagreement so the page can show "also in LiteLLM as X" or
  // "DISAGREEMENT: removed from OR but still in LiteLLM."
  const pairing = crossRef?.pairings.find((p) => p.openrouter_id === params.id) ?? null;
  const disagreement =
    crossRef?.disagreements.find((d) => d.openrouter_id === params.id) ?? null;

  return { id: params.id, active, buried, history, pairing, disagreement };
};
