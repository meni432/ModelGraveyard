// Map model IDs across catalogs to a shared canonical slug so OpenRouter's
// `anthropic/claude-3.5-sonnet` and LiteLLM's `claude-3-5-sonnet-20240620`
// (with litellm_provider: "anthropic") collapse to the same key.
//
// The slug shape is `<normalized-provider>:<normalized-name>`. False
// negatives (failing to match a real pair) are tolerable; false positives
// (collapsing two genuinely-different models) are not — so the rules
// prefer to keep things separate when unsure.

const PROVIDER_ALIASES: Record<string, string> = {
  // LiteLLM uses different provider tags depending on routing.
  bedrock: "anthropic",        // overwritten below by the sub-namespace
  vertex_ai: "google",
  vertex_ai_beta: "google",
  gemini: "google",
  google_genai: "google",
  azure: "openai",
  groq: "meta-llama",          // mostly Llama; the .name match still matters
  fireworks_ai: "",            // host-only; let .name carry the provider
  together_ai: "",
  deepinfra: "",
  ollama: "",
  perplexity: "perplexity",
  "anthropic.claude": "anthropic",
};

// Strip these prefixes from the raw id (after lowercasing).
const ROUTING_PREFIXES = [
  "bedrock/",
  "vertex_ai/",
  "vertex_ai_beta/",
  "azure/",
  "gemini/",
  "google_genai/",
  "groq/",
  "fireworks_ai/",
  "together_ai/",
  "deepinfra/",
  "ollama/",
  "perplexity/",
];

// Strip these vendor-style namespaces seen on AWS Bedrock keys
// (e.g. `anthropic.claude-3-5-sonnet-20240620-v1:0`).
const VENDOR_NAMESPACES = [
  "anthropic.",
  "amazon.",
  "meta.",
  "mistral.",
  "cohere.",
  "ai21.",
  "stability.",
  "deepseek.",
  "writer.",
];

// Suffix patterns we drop because they encode versions, not identity.
// Each pattern is applied repeatedly until stable.
const TRAILING_PATTERNS = [
  /[-@]20\d{6}$/,             // -20240620
  /[-@]20\d{2}[-_]?\d{2}[-_]?\d{2}$/, // -2024-06-20 / -2024_06_20
  /[-@]v\d+(\.\d+)?(:\d+)?$/, // -v1, -v1.0, :0
  /[:][0-9]+$/,               // :0 (bedrock revision)
  /[-_](latest|preview|stable|exp|experimental)$/,
];

function normalizeName(raw: string): string {
  let s = raw.toLowerCase();
  for (const p of ROUTING_PREFIXES) if (s.startsWith(p)) s = s.slice(p.length);
  for (const ns of VENDOR_NAMESPACES) if (s.startsWith(ns)) s = s.slice(ns.length);
  s = s.replace(/[._]/g, "-");
  s = s.replace(/\/+/g, "-");
  let prev = "";
  while (s !== prev) {
    prev = s;
    for (const pat of TRAILING_PATTERNS) s = s.replace(pat, "");
  }
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
  return s;
}

function normalizeProvider(raw: string): string {
  const lc = raw.toLowerCase();
  if (PROVIDER_ALIASES[lc] !== undefined) return PROVIDER_ALIASES[lc] || lc;
  // OpenRouter sometimes prefixes with `~` for special-tier providers — strip.
  return lc.replace(/^~/, "");
}

export function canonicalize(id: string, provider: string): string {
  // For Bedrock or other routed IDs, the provider field is the *router*;
  // the real provider is hidden inside the id (`anthropic.claude-…`).
  const routedProvider = inferProviderFromId(id);
  const finalProvider = routedProvider ?? normalizeProvider(provider);

  // Strip the leading "<finalProvider>/" or "<finalProvider>-" from the
  // id before normalizing the name half, so OpenRouter's
  // `anthropic/claude-3.5-sonnet` (where the id includes the provider)
  // collapses to the same name as LiteLLM's `claude-3-5-sonnet-20240620`
  // (where the id does not).
  let bareId = id;
  const lower = id.toLowerCase();
  const candidates = [finalProvider, normalizeProvider(provider)];
  for (const p of candidates) {
    if (!p) continue;
    if (lower.startsWith(`${p}/`)) {
      bareId = id.slice(p.length + 1);
      break;
    }
  }

  return `${finalProvider}:${normalizeName(bareId)}`;
}

function inferProviderFromId(id: string): string | null {
  const lower = id.toLowerCase();
  for (const p of ROUTING_PREFIXES) {
    if (lower.startsWith(p)) {
      const after = lower.slice(p.length);
      for (const ns of VENDOR_NAMESPACES) {
        if (after.startsWith(ns)) return ns.replace(/\.$/, "");
      }
    }
  }
  return null;
}

// Exported for testing.
export const _internal = { normalizeName, normalizeProvider, inferProviderFromId };
