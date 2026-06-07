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
</script>

<Head meta={m} />

<section class="mb-6">
  <h1 class="font-serif text-4xl font-bold mb-2">Event log</h1>
  <p class="epitaph">
    {data.events.length} event{data.events.length === 1 ? "" : "s"} recorded. Subscribe via
    <a class="underline hover:text-tomb-700" href="{base}/feeds/all.xml">RSS</a>.
  </p>
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
  {#if providerFilter}
    <a
      class="pill border border-tomb-300 hover:bg-tomb-100 font-mono"
      href="{base}/feeds/by-provider/{providerFilter}.xml"
    >
      RSS for {providerFilter}
    </a>
  {/if}
</div>

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
