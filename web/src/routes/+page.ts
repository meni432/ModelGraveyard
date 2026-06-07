import { loadSummary, loadGraveyard } from "$lib/data.ts";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ fetch }) => {
  const [summary, graveyard] = await Promise.all([
    loadSummary(fetch),
    loadGraveyard(fetch),
  ]);
  return { summary, graveyard };
};
