// Normalized model shape used across the pipeline.
// Stays small on purpose — only fields we actually diff or render.

export interface Pricing {
  prompt: string | null;
  completion: string | null;
  image: string | null;
  request: string | null;
}

export interface NormalizedModel {
  id: string;
  name: string;
  provider: string;
  pricing: Pricing;
  context_length: number | null;
  max_completion_tokens: number | null;
  expiration_date: string | null;
  created: number | null;
  first_seen: string;
  last_seen: string;
}

export interface OpenRouterRawModel {
  id: string;
  name?: string;
  created?: number;
  context_length?: number | null;
  pricing?: Record<string, string | null | undefined>;
  top_provider?: { max_completion_tokens?: number | null };
  expiration_date?: string | null;
}

export interface OpenRouterRawResponse {
  data: OpenRouterRawModel[];
}

const today = (): string => new Date().toISOString().slice(0, 10);

const pickProvider = (id: string): string => {
  const idx = id.indexOf("/");
  return idx === -1 ? id : id.slice(0, idx);
};

const normPricing = (raw: Record<string, string | null | undefined> | undefined): Pricing => ({
  prompt: raw?.prompt ?? null,
  completion: raw?.completion ?? null,
  image: raw?.image ?? null,
  request: raw?.request ?? null,
});

export function normalizeModel(
  raw: OpenRouterRawModel,
  options: { firstSeen?: string; lastSeen?: string } = {},
): NormalizedModel {
  const stamp = options.lastSeen ?? today();
  return {
    id: raw.id,
    name: raw.name ?? raw.id,
    provider: pickProvider(raw.id),
    pricing: normPricing(raw.pricing),
    context_length: raw.context_length ?? null,
    max_completion_tokens: raw.top_provider?.max_completion_tokens ?? null,
    expiration_date: raw.expiration_date ?? null,
    created: raw.created ?? null,
    first_seen: options.firstSeen ?? stamp,
    last_seen: stamp,
  };
}

export function normalizeResponse(
  response: OpenRouterRawResponse,
  stamp: string = today(),
): Map<string, NormalizedModel> {
  const out = new Map<string, NormalizedModel>();
  for (const raw of response.data) {
    if (!raw?.id) continue;
    out.set(raw.id, normalizeModel(raw, { firstSeen: stamp, lastSeen: stamp }));
  }
  return out;
}

export { today };
