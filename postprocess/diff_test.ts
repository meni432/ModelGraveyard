import { assertEquals, assert } from "jsr:@std/assert@1";
import { normalizeResponse, type OpenRouterRawResponse } from "./normalize.ts";
import { diffSnapshots } from "./diff.ts";

async function loadFixture(name: string): Promise<OpenRouterRawResponse> {
  const url = new URL(`./__fixtures__/${name}`, import.meta.url);
  const text = await Deno.readTextFile(url);
  return JSON.parse(text) as OpenRouterRawResponse;
}

Deno.test("empty -> populated emits model_added for every model", async () => {
  const b = await loadFixture("snapshot-b.json");
  const prior = new Map();
  const current = normalizeResponse(b, "2026-05-27");

  const { events, buried, next } = diffSnapshots(prior, current, "2026-05-27");

  assertEquals(events.length, 3);
  assert(events.every((e) => e.type === "model_added"));
  assertEquals(buried.length, 0);
  assertEquals(next.size, 3);
  for (const m of next.values()) {
    assertEquals(m.first_seen, "2026-05-27");
    assertEquals(m.last_seen, "2026-05-27");
  }
});

Deno.test("a -> b emits removed + price + context + deprecation + added", async () => {
  const a = await loadFixture("snapshot-a.json");
  const b = await loadFixture("snapshot-b.json");

  const prior = normalizeResponse(a, "2026-05-20");
  const current = normalizeResponse(b, "2026-05-27");

  const { events, buried, next } = diffSnapshots(prior, current, "2026-05-27");

  const byType = (t: string) => events.filter((e) => e.type === t);

  // gpt-3.5-turbo removed
  const removed = byType("model_removed");
  assertEquals(removed.length, 1);
  assertEquals(removed[0].id, "openai/gpt-3.5-turbo");

  // gemini added
  const added = byType("model_added");
  assertEquals(added.length, 1);
  assertEquals(added[0].id, "google/gemini-2.5-pro");

  // gpt-4o price dropped
  const priceChanges = byType("price_changed");
  assertEquals(priceChanges.length, 1);
  assertEquals(priceChanges[0].id, "openai/gpt-4o");
  const promptChange = priceChanges[0].changes?.find((c) => c.field === "prompt");
  assert(promptChange);
  assertEquals(promptChange?.prev, "0.0000025");
  assertEquals(promptChange?.next, "0.000002");
  assertEquals(promptChange?.pct_change, -20);

  // gpt-4o context grew
  const contextChanges = byType("context_changed");
  assertEquals(contextChanges.length, 1);
  assertEquals(contextChanges[0].id, "openai/gpt-4o");
  assertEquals(contextChanges[0].prev_context, 128000);
  assertEquals(contextChanges[0].next_context, 200000);

  // claude got an expiration_date
  const deprecations = byType("deprecation_announced");
  assertEquals(deprecations.length, 1);
  assertEquals(deprecations[0].id, "anthropic/claude-3-sonnet");
  assertEquals(deprecations[0].next_expiration, "2026-07-21");

  // graveyard
  assertEquals(buried.length, 1);
  assertEquals(buried[0].id, "openai/gpt-3.5-turbo");
  assertEquals(buried[0].cause, "removed");
  assertEquals(buried[0].buried_at, "2026-05-27");
  // suggestion: only other openai model present is gpt-4o
  assertEquals(buried[0].suggested_replacement, "openai/gpt-4o");

  // next preserves first_seen for survivors and bumps last_seen
  const claude = next.get("anthropic/claude-3-sonnet");
  assert(claude);
  assertEquals(claude?.first_seen, "2026-05-20");
  assertEquals(claude?.last_seen, "2026-05-27");
  assertEquals(claude?.expiration_date, "2026-07-21");
});

Deno.test("no-op when snapshots match", async () => {
  const a = await loadFixture("snapshot-a.json");
  const prior = normalizeResponse(a, "2026-05-20");
  const current = normalizeResponse(a, "2026-05-21");

  const { events, buried } = diffSnapshots(prior, current, "2026-05-21");
  assertEquals(events.length, 0);
  assertEquals(buried.length, 0);
});
