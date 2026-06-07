<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import uPlot from "uplot";
  import "uplot/dist/uPlot.min.css";

  interface Props {
    series: Array<{ ts: string; prompt: number | null; completion: number | null }>;
    height?: number;
  }
  let { series, height = 260 }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let chart: uPlot | undefined;

  function build(): uPlot.AlignedData {
    const xs: number[] = [];
    const prompt: (number | null)[] = [];
    const completion: (number | null)[] = [];
    for (const p of series) {
      xs.push(Date.parse(p.ts) / 1000);
      prompt.push(p.prompt === null ? null : p.prompt * 1_000_000);
      completion.push(p.completion === null ? null : p.completion * 1_000_000);
    }
    return [xs, prompt, completion] as uPlot.AlignedData;
  }

  function options(width: number): uPlot.Options {
    return {
      width,
      height,
      scales: { x: { time: true } },
      axes: [
        { stroke: "#5d5b53" },
        {
          stroke: "#5d5b53",
          values: (_, ticks) => ticks.map((v) => `$${v.toFixed(2)}`),
        },
      ],
      series: [
        {},
        { label: "prompt $/Mtok", stroke: "#46583f", width: 2, points: { space: 0 } },
        { label: "completion $/Mtok", stroke: "#b06b1e", width: 2, points: { space: 0 } },
      ],
      legend: { live: false },
    };
  }

  onMount(() => {
    if (!container) return;
    chart = new uPlot(options(container.clientWidth), build(), container);
    const ro = new ResizeObserver(() => {
      if (chart && container) chart.setSize({ width: container.clientWidth, height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  });

  $effect(() => {
    if (chart) chart.setData(build());
  });

  onDestroy(() => chart?.destroy());
</script>

<div bind:this={container} class="w-full"></div>
