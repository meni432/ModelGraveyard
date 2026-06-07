<script lang="ts">
  import { base } from "$app/paths";
  import Tombstone from "$lib/components/Tombstone.svelte";
  import EventBadge from "$lib/components/EventBadge.svelte";
  import { priceLabel } from "$lib/format.ts";

  let { data } = $props();
  const summary = $derived(data.summary);
  const graveyard = $derived(data.graveyard);

  const recentBurials = $derived(graveyard.buried.slice(0, 6));
  const upcoming = $derived(summary.scheduled_funerals.slice(0, 8));
</script>

<section class="text-center mb-12">
  <h1 class="font-serif text-5xl font-bold tracking-tight mb-2">
    Here lie the models<br />we used to call.
  </h1>
  <p class="epitaph text-lg max-w-2xl mx-auto">
    A running record of every LLM that appeared on, vanished from, or quietly
    cost more on OpenRouter — so the next outage isn&rsquo;t a surprise.
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
