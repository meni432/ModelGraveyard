<script lang="ts">
  import type { EventType } from "$lib/types.ts";

  interface Props {
    type: EventType;
  }
  let { type }: Props = $props();

  const palette: Record<EventType, string> = {
    model_added: "bg-moss-500/15 text-moss-600 border-moss-500/30",
    model_removed: "bg-tomb-800/10 text-tomb-800 border-tomb-800/30",
    price_changed: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    context_changed: "bg-sky-500/15 text-sky-700 border-sky-500/30",
    deprecation_announced: "bg-rose-500/15 text-rose-700 border-rose-500/30",
  };

  const label: Record<EventType, string> = {
    model_added: "added",
    model_removed: "removed",
    price_changed: "price",
    context_changed: "context",
    deprecation_announced: "deprecation",
  };
</script>

<span class="pill border {palette[type]}">{label[type]}</span>
