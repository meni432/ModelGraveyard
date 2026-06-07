import { canonicalize } from "./canonicalize.ts";

export interface LiteLLMRawEntry {
  litellm_provider?: string;
  mode?: string;
  max_input_tokens?: number | null;
  max_output_tokens?: number | null;
  max_tokens?: number | null;
  input_cost_per_token?: number | null;
  output_cost_per_token?: number | null;
  deprecation_date?: string | null;
  supports_function_calling?: boolean;
  supports_vision?: boolean;
}

export type LiteLLMRawFile = Record<string, LiteLLMRawEntry>;

export interface LiteLLMModel {
  id: string;                  // LiteLLM key as-is
  canonical_slug: string;      // shared cross-source slug
  provider: string;            // litellm_provider as-is
  mode: string;
  context_length: number | null;
  max_output_tokens: number | null;
  input_cost_per_token: string | null;
  output_cost_per_token: string | null;
  deprecation_date: string | null;
  first_seen: string;
  last_seen: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

// LiteLLM modes that align with OpenRouter's catalog. Image generation,
// embeddings, etc. exist in LiteLLM but not on OR, so cross-referencing
// them would only generate noise.
const RELEVANT_MODES = new Set([
  "chat",
  "completion",
  "responses",
]);

const toStr = (n: number | null | undefined): string | null =>
  n === null || n === undefined ? null : n.toString();

export function normalizeLiteLLM(
  raw: LiteLLMRawFile,
  stamp: string = today(),
): Map<string, LiteLLMModel> {
  const out = new Map<string, LiteLLMModel>();
  for (const [id, entry] of Object.entries(raw)) {
    if (id === "sample_spec") continue;
    if (!entry || typeof entry !== "object") continue;
    const mode = entry.mode ?? "chat";
    if (!RELEVANT_MODES.has(mode)) continue;
    const provider = entry.litellm_provider ?? "unknown";

    const slug = canonicalize(id, provider);
    const model: LiteLLMModel = {
      id,
      canonical_slug: slug,
      provider,
      mode,
      context_length: entry.max_input_tokens ?? entry.max_tokens ?? null,
      max_output_tokens: entry.max_output_tokens ?? null,
      input_cost_per_token: toStr(entry.input_cost_per_token ?? null),
      output_cost_per_token: toStr(entry.output_cost_per_token ?? null),
      deprecation_date: entry.deprecation_date ?? null,
      first_seen: stamp,
      last_seen: stamp,
    };

    // Multiple LiteLLM entries can collapse to the same canonical_slug
    // (e.g. anthropic/claude-3-5-sonnet plus bedrock/anthropic.claude-3-5-sonnet-20240620-v1:0).
    // Prefer the one that doesn't look like a routed variant.
    const existing = out.get(slug);
    if (!existing || preferOver(model, existing)) out.set(slug, model);
  }
  return out;
}

function preferOver(candidate: LiteLLMModel, current: LiteLLMModel): boolean {
  const isRouted = (m: LiteLLMModel) =>
    /^(bedrock|vertex|azure|gemini|google_genai|fireworks_ai|together_ai|groq|deepinfra|ollama|perplexity)\//
      .test(m.id);
  if (isRouted(candidate) && !isRouted(current)) return false;
  if (!isRouted(candidate) && isRouted(current)) return true;
  // Otherwise prefer the shorter ID — usually the canonical name.
  return candidate.id.length < current.id.length;
}
