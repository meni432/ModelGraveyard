<script lang="ts">
  import { base } from "$app/paths";
  import { priceLabel, lifespanLabel, contextLabel } from "$lib/format.ts";
  import Head from "$lib/components/Head.svelte";
  import { meta } from "$lib/seo.ts";
  let { data } = $props();

  let query = $state("");
  let providerFilter = $state("");

  const providers = $derived(
    [...new Set(data.buried.map((b) => b.provider))].sort(),
  );

  const filtered = $derived(
    data.buried.filter((b) => {
      if (providerFilter && b.provider !== providerFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return b.id.toLowerCase().includes(q) || b.name.toLowerCase().includes(q);
    }),
  );

  const m = meta({
    path: "/graveyard",
    title: "Graveyard — retired and removed LLMs",
    description: `${data.buried.length} models have been retired or silently removed from OpenRouter. Searchable index with final pricing, lifespan, and suggested replacements.`,
  });
</script>

<Head meta={m} />

<section class="mb-8">
  <h1 class="font-serif text-4xl font-bold mb-2">The Graveyard</h1>
  <p class="epitaph">
    {data.buried.length} model{data.buried.length === 1 ? "" : "s"} have left the OpenRouter
    catalog. Sorted most recent first.
  </p>
</section>

<div class="flex flex-wrap gap-2 mb-6">
  <input
    bind:value={query}
    type="search"
    placeholder="search id or name…"
    class="flex-1 min-w-[200px] rounded-md border border-tomb-300 bg-white px-3 py-2 text-sm font-mono"
  />
  <select
    bind:value={providerFilter}
    class="rounded-md border border-tomb-300 bg-white px-3 py-2 text-sm font-mono"
  >
    <option value="">all providers</option>
    {#each providers as p}
      <option value={p}>{p}</option>
    {/each}
  </select>
</div>

{#if filtered.length === 0}
  <p class="text-center text-tomb-500 italic py-12">
    {data.buried.length === 0
      ? "No burials yet. Check back after the catalog churns."
      : "No matches."}
  </p>
{:else}
  <div class="overflow-x-auto rounded-lg border border-tomb-200 bg-white">
    <table class="w-full text-sm">
      <thead class="bg-tomb-100 text-tomb-600 text-xs uppercase font-mono">
        <tr>
          <th class="text-left px-4 py-2">Model</th>
          <th class="text-left px-4 py-2">Provider</th>
          <th class="text-right px-4 py-2">Prompt</th>
          <th class="text-right px-4 py-2">Context</th>
          <th class="text-left px-4 py-2">Lifespan</th>
          <th class="text-left px-4 py-2">Buried</th>
          <th class="text-left px-4 py-2">Survivor</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-tomb-100">
        {#each filtered as entry}
          <tr class="hover:bg-tomb-50">
            <td class="px-4 py-2">
              <a
                href="{base}/model/{entry.id}"
                class="font-mono hover:underline"
              >
                {entry.id}
              </a>
            </td>
            <td class="px-4 py-2 font-mono text-tomb-500">{entry.provider}</td>
            <td class="px-4 py-2 text-right price">{priceLabel(entry.final_pricing.prompt)}</td>
            <td class="px-4 py-2 text-right font-mono">{contextLabel(entry.final_context_length)}</td>
            <td class="px-4 py-2 text-tomb-600">{lifespanLabel(entry.first_seen, entry.last_seen)}</td>
            <td class="px-4 py-2 font-mono text-tomb-500">{entry.buried_at}</td>
            <td class="px-4 py-2">
              {#if entry.suggested_replacement}
                <a
                  href="{base}/model/{entry.suggested_replacement}"
                  class="font-mono text-moss-600 hover:underline"
                >
                  {entry.suggested_replacement}
                </a>
              {:else}
                <span class="text-tomb-400">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
