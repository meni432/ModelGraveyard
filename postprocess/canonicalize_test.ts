import { assertEquals } from "jsr:@std/assert@1";
import { canonicalize, _internal } from "./canonicalize.ts";

const { normalizeName, inferProviderFromId } = _internal;

Deno.test("normalizeName strips date stamps", () => {
  assertEquals(normalizeName("claude-3-5-sonnet-20240620"), "claude-3-5-sonnet");
  assertEquals(normalizeName("gpt-4o-mini-2024-07-18"), "gpt-4o-mini");
});

Deno.test("normalizeName strips routing prefixes and vendor namespaces", () => {
  assertEquals(
    normalizeName("bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0"),
    "claude-3-5-sonnet",
  );
  assertEquals(
    normalizeName("vertex_ai/claude-3-5-sonnet@20240620"),
    "claude-3-5-sonnet",
  );
});

Deno.test("normalizeName collapses dots and slashes to dashes", () => {
  assertEquals(normalizeName("anthropic/claude-3.5-sonnet"), "anthropic-claude-3-5-sonnet");
});

Deno.test("canonicalize unifies OpenRouter and LiteLLM ids for the same model", () => {
  const or = canonicalize("anthropic/claude-3.5-sonnet", "anthropic");
  const ll = canonicalize("claude-3-5-sonnet-20240620", "anthropic");
  const ll2 = canonicalize("bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0", "bedrock");
  assertEquals(ll, "anthropic:claude-3-5-sonnet");
  assertEquals(ll2, "anthropic:claude-3-5-sonnet");
  assertEquals(or, "anthropic:claude-3-5-sonnet");
});

Deno.test("canonicalize matches openai gpt-4o variants", () => {
  assertEquals(
    canonicalize("openai/gpt-4o", "openai"),
    canonicalize("gpt-4o-2024-08-06", "openai"),
  );
});

Deno.test("inferProviderFromId detects bedrock/anthropic", () => {
  assertEquals(
    inferProviderFromId("bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0"),
    "anthropic",
  );
  assertEquals(inferProviderFromId("gpt-4o"), null);
});
