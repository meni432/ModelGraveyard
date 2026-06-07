import type { NormalizedModel, Pricing } from "./normalize.ts";

export type EventType =
  | "model_added"
  | "model_removed"
  | "price_changed"
  | "context_changed"
  | "deprecation_announced";

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
  // model_added / model_removed
  snapshot?: NormalizedModel;
  // price_changed
  changes?: PriceChange[];
  // context_changed
  prev_context?: number | null;
  next_context?: number | null;
  // deprecation_announced
  prev_expiration?: string | null;
  next_expiration?: string | null;
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

export interface DiffResult {
  events: Event[];
  buried: GraveyardEntry[];
  // Updated map: prior + survivors (with refreshed last_seen) + newly added.
  next: Map<string, NormalizedModel>;
}

const pctChange = (prev: string | null, next: string | null): number | null => {
  const p = prev === null ? NaN : Number(prev);
  const n = next === null ? NaN : Number(next);
  if (!Number.isFinite(p) || !Number.isFinite(n) || p === 0) return null;
  return Math.round(((n - p) / p) * 10000) / 100;
};

const pricingDiff = (prev: Pricing, next: Pricing): PriceChange[] => {
  const fields: Array<keyof Pricing> = ["prompt", "completion", "image", "request"];
  const changes: PriceChange[] = [];
  for (const f of fields) {
    if (prev[f] !== next[f]) {
      changes.push({
        field: f,
        prev: prev[f],
        next: next[f],
        pct_change: pctChange(prev[f], next[f]),
      });
    }
  }
  return changes;
};

// Pick the same-provider model with the closest context_length to the deceased.
function suggestReplacement(
  dead: NormalizedModel,
  alive: Map<string, NormalizedModel>,
): string | null {
  let best: { id: string; delta: number } | null = null;
  for (const m of alive.values()) {
    if (m.provider !== dead.provider) continue;
    if (m.id === dead.id) continue;
    const deadCtx = dead.context_length ?? 0;
    const aliveCtx = m.context_length ?? 0;
    const delta = Math.abs(deadCtx - aliveCtx);
    if (best === null || delta < best.delta) {
      best = { id: m.id, delta };
    }
  }
  return best?.id ?? null;
}

export function diffSnapshots(
  prior: Map<string, NormalizedModel>,
  current: Map<string, NormalizedModel>,
  stamp: string,
): DiffResult {
  const events: Event[] = [];
  const buried: GraveyardEntry[] = [];
  const next = new Map<string, NormalizedModel>();

  // additions + updates
  for (const [id, cur] of current) {
    const prev = prior.get(id);
    if (!prev) {
      events.push({
        ts: stamp,
        type: "model_added",
        id,
        provider: cur.provider,
        snapshot: cur,
      });
      next.set(id, cur);
      continue;
    }

    const merged: NormalizedModel = {
      ...cur,
      first_seen: prev.first_seen,
      last_seen: stamp,
    };

    const priceChanges = pricingDiff(prev.pricing, cur.pricing);
    if (priceChanges.length > 0) {
      events.push({
        ts: stamp,
        type: "price_changed",
        id,
        provider: cur.provider,
        changes: priceChanges,
      });
    }

    if ((prev.context_length ?? null) !== (cur.context_length ?? null)) {
      events.push({
        ts: stamp,
        type: "context_changed",
        id,
        provider: cur.provider,
        prev_context: prev.context_length ?? null,
        next_context: cur.context_length ?? null,
      });
    }

    if ((prev.expiration_date ?? null) !== (cur.expiration_date ?? null) && cur.expiration_date) {
      events.push({
        ts: stamp,
        type: "deprecation_announced",
        id,
        provider: cur.provider,
        prev_expiration: prev.expiration_date ?? null,
        next_expiration: cur.expiration_date,
      });
    }

    next.set(id, merged);
  }

  // removals — bury those gone from current
  for (const [id, prev] of prior) {
    if (current.has(id)) continue;
    events.push({
      ts: stamp,
      type: "model_removed",
      id,
      provider: prev.provider,
      snapshot: prev,
    });
    buried.push({
      id,
      name: prev.name,
      provider: prev.provider,
      cause: "removed",
      final_pricing: prev.pricing,
      final_context_length: prev.context_length,
      first_seen: prev.first_seen,
      last_seen: prev.last_seen,
      buried_at: stamp,
      suggested_replacement: suggestReplacement(prev, current),
    });
  }

  return { events, buried, next };
}
