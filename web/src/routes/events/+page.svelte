<script lang="ts">
  import { base } from "$app/paths";
  import EventBadge from "$lib/components/EventBadge.svelte";
  import Head from "$lib/components/Head.svelte";
  import { priceLabel } from "$lib/format.ts";
  import { meta } from "$lib/seo.ts";
  import type { EventType } from "$lib/types.ts";

  let { data } = $props();

  const types: Array<{ value: EventType | ""; label: string }> = [
    { value: "", label: "all" },
    { value: "model_added", label: "added" },
    { value: "model_removed", label: "removed" },
    { value: "price_changed", label: "price" },
    { value: "context_changed", label: "context" },
    { value: "deprecation_announced", label: "deprecation" },
  ];

  let typeFilter: EventType | "" = $state("");
  let providerFilter = $state("");

  const providers = $derived(
    [...new Set(data.events.map((e) => e.provider))].sort(),
  );

  const filtered = $derived(
    data.events.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (providerFilter && e.provider !== providerFilter) return false;
      return true;
    }),
  );

  const m = meta({
    path: "/events",
    title: "Event log — every OpenRouter catalog change",
    description: `${data.events.length} recorded events: model additions, silent removals, price changes, context-window updates, and announced deprecations. Filter by type or provider; subscribe via RSS.`,
  });

  // Which RSS feed matches the active filter? Returns null when the combination
  // isn't a single static feed (e.g. type AND provider both set).
  const activeFeed = $derived.by(() => {
    if (typeFilter && providerFilter) return null;
    if (typeFilter) {
      return {
        href: `${base}/feeds/by-type/${typeFilter}.xml`,
        label: `RSS · ${typeFilter.replace("_", " ")}`,
      };
    }
    if (providerFilter) {
      return {
        href: `${base}/feeds/by-provider/${providerFilter}.xml`,
        label: `RSS · ${providerFilter}`,
      };
    }
    return { href: `${base}/feeds/all.xml`, label: "RSS · all events" };
  });
</script>

<Head meta={m} />

<section class="mb-6">
  <div class="flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h1 class="font-serif text-4xl font-bold mb-2">Event log</h1>
      <p class="epitaph">
        {data.events.length} event{data.events.length === 1 ? "" : "s"} recorded.
        Pick a filter to get a narrower RSS feed.
      </p>
    </div>
    {#if activeFeed}
      <a
        href={activeFeed.href}
        class="inline-flex items-center gap-2 self-start rounded-md border border-tomb-300 bg-white px-3 py-2 text-sm font-mono shadow-sm hover:bg-tomb-100"
        title="Subscribe to this filter"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M6.18 17.82a2.18 2.18 0 1 1-4.36 0 2.18 2.18 0 0 1 4.36 0zM4 10.1V13a8 8 0 0 1 8 8h2.9C14.9 14.36 9.64 9.1 4 10.1zM4 4.18V7.1c8.27 0 14.9 6.64 14.9 14.9H22C22 12 13.93 4 4 4z"
          />
        </svg>
        {activeFeed.label}
      </a>
    {/if}
  </div>
</section>

<div class="flex flex-wrap gap-2 mb-6">
  <div class="flex gap-1 flex-wrap">
    {#each types as t}
      <button
        type="button"
        class="pill border border-tomb-300 hover:bg-tomb-100 transition-colors"
        class:bg-tomb-900={typeFilter === t.value}
        class:text-tomb-50={typeFilter === t.value}
        onclick={() => (typeFilter = t.value)}
      >
        {t.label}
      </button>
    {/each}
  </div>
  <select
    bind:value={providerFilter}
    class="rounded-md border border-tomb-300 bg-white px-3 py-1.5 text-sm font-mono ml-auto"
  >
    <option value="">all providers</option>
    {#each providers as p}
      <option value={p}>{p}</option>
    {/each}
  </select>
</div>

{#if typeFilter && providerFilter}
  <p class="text-xs text-tomb-500 -mt-3 mb-4 italic">
    Combined type + provider feeds aren&rsquo;t pre-generated. Drop one filter
    to get a subscribable feed, or watch the
    <a href="https://github.com/meni432/ModelGraveyard" class="underline hover:text-tomb-700" target="_blank" rel="noopener">repo</a>
    directly.
  </p>
{/if}

<ul class="divide-y divide-tomb-200 border border-tomb-200 rounded-lg bg-white">
  {#each filtered.slice(0, 500) as ev}
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

{#if filtered.length > 500}
  <p class="text-xs text-tomb-500 text-center mt-3">
    Showing first 500 of {filtered.length}. Refine with a filter.
  </p>
{/if}
