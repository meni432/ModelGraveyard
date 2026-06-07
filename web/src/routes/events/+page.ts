import { loadEvents } from "$lib/data.ts";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ fetch }) => {
  const { events } = await loadEvents(fetch);
  // Most recent first.
  events.sort((a, b) => b.ts.localeCompare(a.ts));
  return { events };
};
