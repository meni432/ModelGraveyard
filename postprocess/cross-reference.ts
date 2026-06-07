// Compare OpenRouter and LiteLLM catalogs by canonical slug. Surfaces:
//   - which models are tracked by both, only-OR, only-LL
//   - "disagreement" entries: a model present in one source's current
//     catalog while absent (or buried) in the other. The marquee case
//     is BerriAI/litellm #20521 — model removed from OR but still in LL.

import { canonicalize } from "./canonicalize.ts";
import type { NormalizedModel } from "./normalize.ts";
import type { GraveyardEntry, Event } from "./diff.ts";
import type { LiteLLMModel } from "./litellm-normalize.ts";

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

export interface CrossRefInputs {
  activeOR: NormalizedModel[];
  buriedOR: GraveyardEntry[];
  activeLL: LiteLLMModel[];
  /** Previous disagreement list — used to detect newly-noted disagreements. */
  priorDisagreements: DisagreementEntry[];
  stamp: string;
}

export interface CrossRefResult {
  file: CrossReferenceFile;
  newEvents: Event[];
}

function slugForOR(m: { id: string; provider: string }): string {
  return canonicalize(m.id, m.provider);
}

export function crossReference(input: CrossRefInputs): CrossRefResult {
  const orBySlug = new Map<string, NormalizedModel>();
  for (const m of input.activeOR) orBySlug.set(slugForOR(m), m);

  const buriedBySlug = new Map<string, GraveyardEntry>();
  for (const b of input.buriedOR) buriedBySlug.set(slugForOR(b), b);

  const llBySlug = new Map<string, LiteLLMModel>();
  for (const m of input.activeLL) llBySlug.set(m.canonical_slug, m);

  const allSlugs = new Set<string>([
    ...orBySlug.keys(),
    ...buriedBySlug.keys(),
    ...llBySlug.keys(),
  ]);

  const disagreements: DisagreementEntry[] = [];
  const pairings: Array<{ slug: string; openrouter_id: string; litellm_id: string }> = [];
  let sharedCount = 0;
  let orOnly = 0;
  let llOnly = 0;

  for (const slug of allSlugs) {
    const orActive = orBySlug.get(slug);
    const orBuried = buriedBySlug.get(slug);
    const ll = llBySlug.get(slug);

    const orStatus: DisagreementEntry["openrouter_status"] = orActive
      ? "active"
      : orBuried
        ? "removed"
        : "absent";
    const llStatus: DisagreementEntry["litellm_status"] = ll ? "active" : "absent";

    if (orStatus === "active" && llStatus === "active") {
      sharedCount++;
      pairings.push({
        slug,
        openrouter_id: orActive!.id,
        litellm_id: ll!.id,
      });
      continue;
    }

    if (orStatus === "active" && llStatus === "absent") {
      orOnly++;
      continue;
    }
    if (orStatus === "absent" && llStatus === "active") {
      llOnly++;
      continue;
    }

    // The interesting cases: a model is in one catalog but the other
    // catalog used to have it (or vice versa). Emit a disagreement.
    if (orStatus === "removed" && llStatus === "active") {
      disagreements.push({
        slug,
        openrouter_status: "removed",
        openrouter_id: orBuried!.id,
        openrouter_removed_at: orBuried!.buried_at,
        litellm_status: "active",
        litellm_id: ll!.id,
        litellm_deprecation_date: ll!.deprecation_date,
        severity: ll!.deprecation_date ? "medium" : "high",
        noted_at: input.stamp,
      });
    }
  }

  // Preserve `noted_at` for previously-known disagreements so the page
  // can show "first noticed on YYYY-MM-DD" instead of always today.
  const priorByKey = new Map(
    input.priorDisagreements.map((d) => [`${d.slug}|${d.openrouter_status}|${d.litellm_status}`, d]),
  );
  for (const d of disagreements) {
    const key = `${d.slug}|${d.openrouter_status}|${d.litellm_status}`;
    const prior = priorByKey.get(key);
    if (prior) d.noted_at = prior.noted_at;
  }

  const newEvents: Event[] = [];
  const priorSlugs = new Set(input.priorDisagreements.map((d) => d.slug));
  for (const d of disagreements) {
    if (!priorSlugs.has(d.slug)) {
      newEvents.push({
        ts: input.stamp,
        type: "disagreement_detected",
        id: d.openrouter_id ?? d.litellm_id ?? d.slug,
        provider: d.slug.split(":")[0] ?? "unknown",
        disagreement: {
          slug: d.slug,
          openrouter_status: d.openrouter_status,
          litellm_status: d.litellm_status,
          litellm_id: d.litellm_id,
        },
      } as Event);
    }
  }

  return {
    file: {
      generated_at: input.stamp,
      openrouter_catalog_size: orBySlug.size,
      litellm_catalog_size: llBySlug.size,
      shared_count: sharedCount,
      openrouter_only_count: orOnly,
      litellm_only_count: llOnly,
      disagreements: disagreements.sort((a, b) => a.slug.localeCompare(b.slug)),
      pairings: pairings.sort((a, b) => a.slug.localeCompare(b.slug)),
    },
    newEvents,
  };
}
