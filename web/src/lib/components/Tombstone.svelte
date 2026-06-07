<script lang="ts">
  import { base } from "$app/paths";
  import { priceLabel, lifespanLabel } from "$lib/format.ts";
  import type { GraveyardEntry } from "$lib/types.ts";

  interface Props {
    entry: GraveyardEntry;
  }
  let { entry }: Props = $props();
</script>

<article
  class="relative rounded-t-3xl border border-tomb-300 bg-tomb-100 px-5 pt-6 pb-4 shadow-sm hover:shadow-md transition-shadow"
>
  <div class="absolute -top-1 left-1/2 -translate-x-1/2 text-tomb-400 text-2xl">✝</div>
  <header class="text-center mb-3">
    <a
      href="{base}/model/{entry.id}"
      class="font-serif text-xl font-bold text-tomb-900 hover:underline"
    >
      {entry.name}
    </a>
    <div class="text-xs font-mono text-tomb-500 mt-1">{entry.id}</div>
  </header>
  <p class="epitaph text-center text-sm mb-3">
    Born {entry.first_seen}<br />
    Rested {entry.buried_at}<br />
    Served {lifespanLabel(entry.first_seen, entry.last_seen)}
  </p>
  <dl class="text-xs grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
    <dt class="text-tomb-500">Final prompt</dt>
    <dd class="price">{priceLabel(entry.final_pricing.prompt)}</dd>
    <dt class="text-tomb-500">Final completion</dt>
    <dd class="price">{priceLabel(entry.final_pricing.completion)}</dd>
    {#if entry.suggested_replacement}
      <dt class="text-tomb-500 col-span-1">Survivor</dt>
      <dd class="col-span-1">
        <a
          href="{base}/model/{entry.suggested_replacement}"
          class="font-mono text-moss-600 hover:underline truncate block"
        >
          {entry.suggested_replacement}
        </a>
      </dd>
    {/if}
  </dl>
  <span
    class="pill mt-3 bg-tomb-200 text-tomb-700 capitalize"
    title="cause of death"
  >
    {entry.cause}
  </span>
</article>
