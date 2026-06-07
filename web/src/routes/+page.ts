import { loadSummary, loadGraveyard, loadCrossReference } from "$lib/data.ts";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ fetch }) => {
  const [summary, graveyard, crossRef] = await Promise.all([
    loadSummary(fetch),
    loadGraveyard(fetch),
    loadCrossReference(fetch).catch(() => null),
  ]);
  return { summary, graveyard, crossRef };
};
