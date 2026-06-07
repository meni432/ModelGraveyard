// Mirror of postprocess types — kept narrow so the SPA bundle stays small.

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

export type EventType =
  | "model_added"
  | "model_removed"
  | "price_changed"
  | "context_changed"
  | "deprecation_announced"
  | "disagreement_detected";

export interface PriceChange {
  field: keyof Pricing;
  prev: string | null;
  next: string | null;
  pct_change: number | null;
}

export interface Event {
  ts: string;
  type: EventType;
  id: string;
  provider: string;
  snapshot?: NormalizedModel;
  changes?: PriceChange[];
  prev_context?: number | null;
  next_context?: number | null;
  prev_expiration?: string | null;
  next_expiration?: string | null;
  // disagreement_detected
  disagreement?: {
    slug: string;
    openrouter_status: "active" | "removed" | "absent";
    litellm_status: "active" | "absent";
    litellm_id: string | null;
  };
}

export interface DisagreementEntry {
  slug: string;
  openrouter_status: "active" | "removed" | "absent";
  openrouter_id: string | null;
  openrouter_removed_at: string | null;
  litellm_status: "active" | "absent";
  litellm_id: string | null;
  litellm_deprecation_date: string | null;
  severity: "high" | "medium" | "low";
  noted_at: string;
}

export interface CrossReferenceFile {
  generated_at: string;
  openrouter_catalog_size: number;
  litellm_catalog_size: number;
  shared_count: number;
  openrouter_only_count: number;
  litellm_only_count: number;
  disagreements: DisagreementEntry[];
  pairings: Array<{ slug: string; openrouter_id: string; litellm_id: string }>;
}

export interface GraveyardEntry {
  id: string;
  name: string;
  provider: string;
  cause: "removed" | "expired";
  final_pricing: Pricing;
  final_context_length: number | null;
  first_seen: string;
  last_seen: string;
  buried_at: string;
  suggested_replacement: string | null;
}

export interface SummaryFile {
  generated_at: string;
  active_count: number;
  dead_count: number;
  last_event_ts: string | null;
  recent_events: Event[];
  scheduled_funerals: Array<{ id: string; provider: string; expiration_date: string }>;
}

export interface ModelsCurrentFile {
  generated_at: string;
  models: NormalizedModel[];
}

export interface EventsFile {
  events: Event[];
}

export interface GraveyardFile {
  buried: GraveyardEntry[];
}
