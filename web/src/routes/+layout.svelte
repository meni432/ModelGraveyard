<script lang="ts">
  import "../app.css";
  import { base } from "$app/paths";
  import { page } from "$app/stores";

  let { children } = $props();

  const nav = [
    { href: "", label: "Home" },
    { href: "/graveyard", label: "Graveyard" },
    { href: "/events", label: "Events" },
    { href: "/about", label: "About" },
  ];
</script>

<header class="border-b border-tomb-200 bg-tomb-50/80 backdrop-blur sticky top-0 z-10">
  <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="{base}/" class="flex items-center gap-2 font-serif text-xl font-bold">
      <span class="text-tomb-400">✡</span>
      <span>ModelGraveyard</span>
    </a>
    <nav class="flex items-center gap-1 text-sm font-mono">
      {#each nav as link}
        {@const active = $page.url.pathname === `${base}${link.href}` ||
          (link.href !== "" && $page.url.pathname.startsWith(`${base}${link.href}`))}
        <a
          href="{base}{link.href}"
          class="px-3 py-1.5 rounded-md hover:bg-tomb-200/60 transition-colors"
          class:bg-tomb-200={active}
        >
          {link.label}
        </a>
      {/each}
      <a
        href="{base}/feeds/all.xml"
        class="px-3 py-1.5 rounded-md hover:bg-tomb-200/60 text-tomb-500"
        title="Atom feed"
      >
        RSS
      </a>
    </nav>
  </div>
</header>

<main class="max-w-5xl mx-auto px-4 py-8">
  {@render children?.()}
</main>

<footer class="border-t border-tomb-200 mt-16">
  <div
    class="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm font-mono"
  >
    <div>
      <div class="font-serif text-lg font-bold mb-2 text-tomb-900">ModelGraveyard</div>
      <p class="text-tomb-500 leading-relaxed">
        A public ledger of LLM lifecycle events on OpenRouter — additions, silent
        removals, price changes, scheduled retirements.
      </p>
    </div>
    <div>
      <div class="text-tomb-700 font-semibold mb-2">Data</div>
      <ul class="space-y-1.5 text-tomb-500">
        <li><a href="{base}/feeds/all.xml" class="hover:text-tomb-900 underline">Atom feed (all events)</a></li>
        <li>
          <a
            href="https://github.com/meni432/ModelGraveyard/tree/main/feeds/by-provider"
            class="hover:text-tomb-900 underline"
            target="_blank"
            rel="noopener">Per-provider feeds</a
          >
        </li>
        <li>
          <a
            href="https://github.com/meni432/ModelGraveyard/tree/main/data/derived"
            class="hover:text-tomb-900 underline"
            target="_blank"
            rel="noopener">Raw JSON</a
          >
        </li>
        <li>
          <a href="{base}/sitemap.xml" class="hover:text-tomb-900 underline">Sitemap</a>
        </li>
      </ul>
    </div>
    <div>
      <div class="text-tomb-700 font-semibold mb-2">References</div>
      <ul class="space-y-1.5 text-tomb-500">
        <li>
          <a
            href="https://openrouter.ai"
            class="hover:text-tomb-900 underline"
            target="_blank"
            rel="noopener">OpenRouter</a
          >
          <span class="text-tomb-400"> · </span>
          <a
            href="https://openrouter.ai/api/v1/models"
            class="hover:text-tomb-900 underline"
            target="_blank"
            rel="noopener">API</a
          >
        </li>
        <li>
          <a
            href="https://github.com/BerriAI/litellm/issues/20521"
            class="hover:text-tomb-900 underline"
            target="_blank"
            rel="noopener">litellm #20521</a
          >
          <span class="text-tomb-400"> — the silent-deprecation incident</span>
        </li>
        <li>
          <a
            href="https://github.com/simonw/llm-prices"
            class="hover:text-tomb-900 underline"
            target="_blank"
            rel="noopener">simonw/llm-prices</a
          >
        </li>
        <li>
          <a
            href="https://github.com/meni432/ModelGraveyard"
            class="hover:text-tomb-900 underline"
            target="_blank"
            rel="noopener">Source code</a
          >
        </li>
      </ul>
    </div>
  </div>
  <div class="border-t border-tomb-200 py-4 text-center text-xs font-mono text-tomb-400">
    Updated every 6 hours from OpenRouter's public catalog · MIT licensed
  </div>
</footer>
