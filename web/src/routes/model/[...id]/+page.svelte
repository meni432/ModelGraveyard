<script lang="ts">
  import { base } from "$app/paths";
  import PriceChart from "$lib/components/PriceChart.svelte";
  import EventBadge from "$lib/components/EventBadge.svelte";
  import Head from "$lib/components/Head.svelte";
  import { priceLabel, contextLabel, lifespanLabel } from "$lib/format.ts";
  import { meta, SITE_URL } from "$lib/seo.ts";
  import type { Pricing } from "$lib/types.ts";

  let { data } = $props();
  const id = $derived(data.id);
  const active = $derived(data.active);
  const buried = $derived(data.buried);
  const history = $derived(data.history);
  const pairing = $derived(data.pairing);
  const disagreement = $derived(data.disagreement);
  const isDead = $derived(!!buried && !active);
  const displayName = $derived(active?.name ?? buried?.name ?? id);

  const m = $derived(
    meta({
      path: `/model/${id}`,
      title: isDead
        ? `${displayName} (deceased)`
        : active?.expiration_date
          ? `${displayName} (sunset ${active.expiration_date})`
          : displayName,
      description: isDead
        ? `${displayName} was removed from OpenRouter on ${buried?.buried_at}. Final prompt price: ${priceLabel(buried?.final_pricing.prompt ?? null)}. ${buried?.suggested_replacement ? `Survivor: ${buried.suggested_replacement}.` : ""} View its lifecycle history and copy a status badge.`
        : `Lifecycle history for ${displayName} on OpenRouter — prompt ${priceLabel(active?.pricing.prompt ?? null)}, completion ${priceLabel(active?.pricing.completion ?? null)}, ${contextLabel(active?.context_length ?? null)} context. ${history.length} recorded events.`,
    }),
  );

  const jsonLd = $derived({
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayName,
    identifier: id,
    category: "AI Language Model",
    url: `${SITE_URL}/model/${id}`,
    brand: { "@type": "Brand", name: active?.provider ?? buried?.provider ?? "" },
    description: m.description,
    ...(isDead
      ? { offers: { "@type": "Offer", availability: "https://schema.org/Discontinued" } }
      : {}),
  });

  // Build price-over-time series. Seed from current/buried snapshot's first_seen,
  // then walk price_changed events.
  function buildSeries() {
    const start = active ?? buried?.final_pricing
      ? {
          first_seen: active?.first_seen ?? buried?.first_seen ?? "",
          prompt: active?.pricing.prompt ?? buried?.final_pricing.prompt ?? null,
          completion: active?.pricing.completion ?? buried?.final_pricing.completion ?? null,
        }
      : null;
    if (!start || !start.first_seen) return [];

    // Reverse-engineer: walk history backward to discover earliest prices.
    // Cheaper approximation: start at first_seen with current price, then
    // apply each price_changed delta forward.
    type Pt = { ts: string; prompt: number | null; completion: number | null };
    const result: Pt[] = [];
    const toNum = (s: string | null) => (s === null || s === "" ? null : Number(s));
    let prompt: number | null = toNum(start.prompt);
    let completion: number | null = toNum(start.completion);

    // If we have price_changed events, replay them; otherwise just one point.
    const priceEvents = history.filter((e) => e.type === "price_changed");
    if (priceEvents.length === 0) {
      result.push({ ts: start.first_seen, prompt, completion });
      result.push({
        ts: active?.last_seen ?? buried?.buried_at ?? start.first_seen,
        prompt,
        completion,
      });
      return result;
    }

    // Earliest known price = before the first event's prev value.
    const first = priceEvents[0];
    const earliestPrompt = toNum(first.changes?.find((c) => c.field === "prompt")?.prev ?? null);
    const earliestCompletion = toNum(
      first.changes?.find((c) => c.field === "completion")?.prev ?? null,
    );
    result.push({
      ts: start.first_seen,
      prompt: earliestPrompt ?? prompt,
      completion: earliestCompletion ?? completion,
    });
    let p = earliestPrompt ?? prompt;
    let c = earliestCompletion ?? completion;
    for (const ev of priceEvents) {
      const pc = ev.changes?.find((x) => x.field === "prompt");
      const cc = ev.changes?.find((x) => x.field === "completion");
      if (pc) p = toNum(pc.next);
      if (cc) c = toNum(cc.next);
      result.push({ ts: ev.ts, prompt: p, completion: c });
    }
    result.push({
      ts: active?.last_seen ?? buried?.buried_at ?? result[result.length - 1].ts,
      prompt: p,
      completion: c,
    });
    return result;
  }

  const series = $derived(buildSeries());
  const currentPricing = $derived<Pricing | null>(active?.pricing ?? buried?.final_pricing ?? null);

  function badgeSvg(): string {
    const status = isDead ? "deceased" : "alive";
    const date = isDead ? buried?.buried_at : active?.last_seen;
    const label = `${status} · ${date}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40">
  <rect width="320" height="40" rx="6" fill="${isDead ? "#23221f" : "#465840"}"/>
  <text x="160" y="18" fill="#f6f6f5" font-family="monospace" font-size="11" text-anchor="middle">${id}</text>
  <text x="160" y="32" fill="#cccac4" font-family="monospace" font-size="10" text-anchor="middle">${label}</text>
</svg>`;
  }

  function copyBadge() {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(badgeSvg());
  }
</script>

<Head meta={m} {jsonLd} />

<article>
  <header class="mb-6">
    <div class="flex items-center gap-2 mb-1">
      {#if isDead}
        <span class="pill bg-tomb-800 text-tomb-50">deceased</span>
      {:else}
        <span class="pill bg-moss-500 text-tomb-50">alive</span>
      {/if}
      {#if active?.expiration_date}
        <span class="pill bg-rose-100 text-rose-700">sunset {active.expiration_date}</span>
      {/if}
    </div>
    <h1 class="font-serif text-3xl font-bold">
      {active?.name ?? buried?.name ?? id}
    </h1>
    <p class="font-mono text-tomb-500 mt-1">{id}</p>
  </header>

  {#if disagreement}
    <section
      class="mb-6 rounded-lg border-2 border-rose-400 bg-rose-50 p-4 sm:p-5"
      aria-label="Catalog disagreement"
    >
      <div class="flex items-center gap-2 mb-2">
        <span class="pill bg-rose-600 text-rose-50">catalog disagreement</span>
        <span class="text-xs font-mono text-rose-700">
          first noticed {disagreement.noted_at}
        </span>
      </div>
      <p class="text-sm text-rose-900 leading-relaxed">
        OpenRouter removed this model on
        <span class="font-mono">{disagreement.openrouter_removed_at}</span>, but
        LiteLLM still lists it as
        <code class="font-mono text-xs bg-rose-100 px-1.5 py-0.5 rounded"
          >{disagreement.litellm_id}</code
        >. This is the exact pattern that
        <a
          href="https://github.com/BerriAI/litellm/issues/20521"
          target="_blank"
          rel="noopener"
          class="underline font-semibold">litellm #20521</a
        > describes — a model that production apps may still try to call even
        though the upstream gateway no longer serves it.
      </p>
    </section>
  {:else if pairing}
    <section
      class="mb-6 rounded-md border border-tomb-200 bg-tomb-50 px-4 py-3 text-sm"
      aria-label="Cross-source pairing"
    >
      <span class="font-mono text-xs text-tomb-500 mr-2">also tracked in</span>
      <a
        href="https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json"
        target="_blank"
        rel="noopener"
        class="font-mono text-moss-600 hover:underline">LiteLLM</a
      >
      <span class="text-tomb-500"> as </span>
      <code class="font-mono text-xs bg-white border border-tomb-200 px-1.5 py-0.5 rounded"
        >{pairing.litellm_id}</code
      >
    </section>
  {/if}

  <section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 text-center font-mono text-sm">
    <div class="rounded border border-tomb-200 bg-white py-3">
      <div class="text-tomb-500 text-xs">prompt</div>
      <div class="price text-base">{priceLabel(currentPricing?.prompt ?? null)}</div>
    </div>
    <div class="rounded border border-tomb-200 bg-white py-3">
      <div class="text-tomb-500 text-xs">completion</div>
      <div class="price text-base">{priceLabel(currentPricing?.completion ?? null)}</div>
    </div>
    <div class="rounded border border-tomb-200 bg-white py-3">
      <div class="text-tomb-500 text-xs">context</div>
      <div class="text-base">
        {contextLabel(active?.context_length ?? buried?.final_context_length ?? null)}
      </div>
    </div>
    <div class="rounded border border-tomb-200 bg-white py-3">
      <div class="text-tomb-500 text-xs">{isDead ? "served" : "tracked"}</div>
      <div class="text-base">
        {lifespanLabel(
          active?.first_seen ?? buried?.first_seen ?? "",
          active?.last_seen ?? buried?.buried_at ?? "",
        )}
      </div>
    </div>
  </section>

  {#if series.length >= 2}
    <section class="mb-8">
      <h2 class="font-serif text-xl font-bold mb-3">Price timeline</h2>
      <div class="border border-tomb-200 bg-white rounded p-4">
        <PriceChart {series} />
      </div>
    </section>
  {/if}

  {#if buried}
    <section class="mb-8 rounded-lg border border-tomb-300 bg-tomb-100 p-5">
      <h2 class="font-serif text-xl font-bold mb-2">Epitaph</h2>
      <p class="epitaph">
        Buried {buried.buried_at} after {lifespanLabel(buried.first_seen, buried.last_seen)} on
        OpenRouter. Final prompt price: <span class="price">{priceLabel(buried.final_pricing.prompt)}</span>.
        {#if buried.suggested_replacement}
          Survived by
          <a
            href="{base}/model/{buried.suggested_replacement}"
            class="font-mono text-moss-600 hover:underline"
          >
            {buried.suggested_replacement}
          </a>.
        {/if}
      </p>
    </section>
  {/if}

  <section class="mb-8">
    <h2 class="font-serif text-xl font-bold mb-3">History</h2>
    {#if history.length === 0}
      <p class="text-sm text-tomb-500 italic">No events recorded yet.</p>
    {:else}
      <ul class="divide-y divide-tomb-200 border border-tomb-200 rounded-lg bg-white">
        {#each history.toReversed() as ev}
          <li class="px-4 py-3 flex items-center gap-3 text-sm">
            <EventBadge type={ev.type} />
            <span class="font-mono text-tomb-500 w-24 shrink-0">{ev.ts}</span>
            <span class="text-tomb-700 truncate">
              {#if ev.type === "price_changed" && ev.changes}
                {#each ev.changes as c, i}
                  {i > 0 ? "; " : ""}{c.field}: {priceLabel(c.prev)}→{priceLabel(c.next)}
                {/each}
              {:else if ev.type === "context_changed"}
                {ev.prev_context}→{ev.next_context} tokens
              {:else if ev.type === "deprecation_announced"}
                sunset announced for {ev.next_expiration}
              {:else if ev.type === "model_added"}
                first seen on OpenRouter
              {:else if ev.type === "model_removed"}
                disappeared from OpenRouter
              {/if}
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2 class="font-serif text-xl font-bold mb-3">Badge</h2>
    <p class="text-sm text-tomb-600 mb-3">Copy the SVG into your README or status page.</p>
    <div class="flex items-center gap-3">
      {@html badgeSvg()}
      <button
        type="button"
        onclick={copyBadge}
        class="rounded-md border border-tomb-300 bg-white px-3 py-1.5 text-sm font-mono hover:bg-tomb-100"
      >
        copy svg
      </button>
    </div>
  </section>
</article>
