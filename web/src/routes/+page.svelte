<script lang="ts">
  import { base } from "$app/paths";
  import Tombstone from "$lib/components/Tombstone.svelte";
  import EventBadge from "$lib/components/EventBadge.svelte";
  import Head from "$lib/components/Head.svelte";
  import { priceLabel } from "$lib/format.ts";
  import { meta, SITE_URL, SITE_NAME } from "$lib/seo.ts";

  let { data } = $props();
  const summary = $derived(data.summary);
  const graveyard = $derived(data.graveyard);
  const crossRef = $derived(data.crossRef);

  const recentBurials = $derived(graveyard.buried.slice(0, 6));
  const upcoming = $derived(summary.scheduled_funerals.slice(0, 8));
  const disagreements = $derived(crossRef?.disagreements ?? []);

  const m = meta({
    path: "/",
    description: `Public lifecycle ledger for ${summary.active_count} LLMs on OpenRouter. ${summary.dead_count} retired models in the graveyard, ${summary.scheduled_funerals.length} scheduled funerals. Atom feed, raw JSON, per-model status badges.`,
  });

  const jsonLd = $derived({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: m.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/graveyard?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });
</script>

<Head meta={m} {jsonLd} />

<section class="text-center mb-12">
  <h1 class="font-serif text-5xl font-bold tracking-tight mb-2">
    Here lie the models<br />we used to call.
  </h1>
  <p class="epitaph text-lg max-w-2xl mx-auto">
    A running record of every LLM that appeared on, vanished from, or quietly
    cost more on
    <a
      href="https://openrouter.ai"
      target="_blank"
      rel="noopener"
      class="underline decoration-tomb-300 hover:text-tomb-900">OpenRouter</a
    > — so the next outage isn&rsquo;t a surprise.
  </p>
  <p class="mt-3 text-sm text-tomb-500">
    <a
      href="{base}/about"
      class="underline decoration-tomb-300 hover:text-tomb-900"
      >Why this exists →</a
    >
  </p>
</section>

<section class="mb-12 rounded-lg border border-tomb-200 bg-white p-5 sm:p-6">
  <h2 class="font-serif text-xl font-bold mb-2">What this is</h2>
  <p class="text-sm leading-relaxed text-tomb-700 mb-3">
    <a
      href="https://openrouter.ai"
      target="_blank"
      rel="noopener"
      class="text-moss-600 hover:underline">OpenRouter</a
    > is the unified gateway thousands of apps use to call 300+ LLMs from Anthropic, OpenAI,
    Google, Meta, Mistral, xAI, and others. Its
    <a
      href="https://openrouter.ai/api/v1/models"
      target="_blank"
      rel="noopener"
      class="text-moss-600 hover:underline"
      ><code class="font-mono text-xs bg-tomb-100 px-1 rounded">/api/v1/models</code></a
    > catalog mutates constantly — models appear, get retired, change price.
  </p>
  <p class="text-sm leading-relaxed text-tomb-700">
    The problem: many models disappear silently. The canonical receipt is
    <a
      href="https://github.com/BerriAI/litellm/issues/20521"
      target="_blank"
      rel="noopener"
      class="text-rose-700 hover:underline font-semibold">BerriAI/litellm #20521</a
    > — 39 OpenRouter models vanished from the live API while still appearing in
    pricing JSONs, with no <code class="font-mono text-xs bg-tomb-100 px-1 rounded">deprecation_date</code> to warn downstream apps. ModelGraveyard fetches the catalog every 6 hours,
    diffs it, and publishes the diff as typed events + an
    <a
      href="{base}/feeds/all.xml"
      class="text-moss-600 hover:underline">Atom feed</a
    >.
    <a
      href="{base}/about"
      class="text-moss-600 hover:underline">Read more →</a
    >
  </p>
</section>

<section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12 text-center font-mono">
  <div class="rounded-lg border border-tomb-200 bg-white py-4">
    <div class="text-3xl font-bold">{summary.active_count}</div>
    <div class="text-xs text-tomb-500 mt-1">models tracked</div>
  </div>
  <div class="rounded-lg border border-tomb-200 bg-white py-4">
    <div class="text-3xl font-bold">{summary.dead_count}</div>
    <div class="text-xs text-tomb-500 mt-1">in the graveyard</div>
  </div>
  <div class="rounded-lg border border-tomb-200 bg-white py-4">
    <div class="text-3xl font-bold">{upcoming.length}</div>
    <div class="text-xs text-tomb-500 mt-1">scheduled funerals</div>
  </div>
  <div class="rounded-lg border border-tomb-200 bg-white py-4">
    <div class="text-3xl font-bold">{summary.recent_events.length}</div>
    <div class="text-xs text-tomb-500 mt-1">recent events</div>
  </div>
</section>

{#if crossRef}
  <section class="mb-12">
    <div class="flex items-baseline justify-between mb-3">
      <h2 class="font-serif text-2xl font-bold">Catalog cross-reference</h2>
      <a href="{base}/about" class="text-xs font-mono text-tomb-500 hover:text-tomb-900 underline"
        >how this works</a
      >
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center font-mono">
      <div class="rounded-lg border border-tomb-200 bg-white py-3">
        <div class="text-2xl font-bold">{crossRef.openrouter_catalog_size}</div>
        <div class="text-xs text-tomb-500 mt-1">in OpenRouter</div>
      </div>
      <div class="rounded-lg border border-tomb-200 bg-white py-3">
        <div class="text-2xl font-bold">{crossRef.litellm_catalog_size}</div>
        <div class="text-xs text-tomb-500 mt-1">in LiteLLM</div>
      </div>
      <div class="rounded-lg border border-tomb-200 bg-white py-3">
        <div class="text-2xl font-bold">{crossRef.shared_count}</div>
        <div class="text-xs text-tomb-500 mt-1">cross-paired</div>
      </div>
      <div
        class="rounded-lg border bg-white py-3 {disagreements.length > 0
          ? 'border-rose-400'
          : 'border-tomb-200'}"
      >
        <div
          class="text-2xl font-bold {disagreements.length > 0 ? 'text-rose-700' : ''}"
        >
          {disagreements.length}
        </div>
        <div class="text-xs text-tomb-500 mt-1">disagreements</div>
      </div>
    </div>
    {#if disagreements.length > 0}
      <ul class="mt-4 divide-y divide-rose-200 border border-rose-300 bg-rose-50/40 rounded-lg">
        {#each disagreements.slice(0, 5) as d}
          <li class="px-4 py-2 flex items-center gap-3 text-sm">
            <span class="pill bg-rose-600 text-rose-50 text-[10px] py-px">disagreement</span>
            <a
              href="{base}/model/{d.openrouter_id}"
              class="font-mono hover:underline truncate flex-1"
            >
              {d.openrouter_id}
            </a>
            <span class="text-xs text-rose-700 hidden sm:inline">
              OR removed {d.openrouter_removed_at} · still in LiteLLM
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

{#if recentBurials.length > 0}
  <section class="mb-12">
    <h2 class="font-serif text-2xl font-bold mb-4">Recent burials</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each recentBurials as entry}
        <Tombstone {entry} />
      {/each}
    </div>
    <a
      href="{base}/graveyard"
      class="block mt-4 text-center font-mono text-sm text-moss-600 hover:underline"
    >
      visit the full graveyard →
    </a>
  </section>
{/if}

{#if upcoming.length > 0}
  <section class="mb-12">
    <h2 class="font-serif text-2xl font-bold mb-4">Scheduled funerals</h2>
    <p class="epitaph mb-4">Models that have announced a retirement date.</p>
    <ul class="divide-y divide-tomb-200 border border-tomb-200 rounded-lg bg-white">
      {#each upcoming as item}
        <li class="px-4 py-3 flex items-center justify-between text-sm">
          <a
            href="{base}/model/{item.id}"
            class="font-mono hover:underline truncate"
          >
            {item.id}
          </a>
          <span class="font-mono text-rose-700">{item.expiration_date}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<section>
  <h2 class="font-serif text-2xl font-bold mb-4">Latest events</h2>
  <ul class="divide-y divide-tomb-200 border border-tomb-200 rounded-lg bg-white">
    {#each summary.recent_events as ev}
      <li class="px-4 py-3 flex items-center gap-3 text-sm">
        <EventBadge type={ev.type} />
        <span class="font-mono text-tomb-500 w-24 shrink-0">{ev.ts}</span>
        <a
          href="{base}/model/{ev.id}"
          class="font-mono hover:underline truncate flex-1"
        >
          {ev.id}
        </a>
        {#if ev.type === "price_changed" && ev.changes}
          <span class="text-xs text-tomb-500 truncate hidden md:inline">
            {#each ev.changes as c, i}
              {i > 0 ? "; " : ""}{c.field}: {priceLabel(c.prev)}→{priceLabel(c.next)}
            {/each}
          </span>
        {:else if ev.type === "context_changed"}
          <span class="text-xs text-tomb-500 hidden md:inline">
            {ev.prev_context}→{ev.next_context} tokens
          </span>
        {:else if ev.type === "deprecation_announced"}
          <span class="text-xs text-rose-700 hidden md:inline">
            sunset {ev.next_expiration}
          </span>
        {/if}
      </li>
    {/each}
  </ul>
</section>
