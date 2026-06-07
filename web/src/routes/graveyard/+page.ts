import { loadGraveyard } from "$lib/data.ts";
import type { PageLoad } from "./$types.js";

export const load: PageLoad = async ({ fetch }) => {
  const { buried } = await loadGraveyard(fetch);
  return { buried };
};
