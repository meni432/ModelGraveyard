<script lang="ts">
  import "../app.css";
  import { base } from "$app/paths";
  import { page } from "$app/stores";

  let { children } = $props();

  const nav = [
    { href: "", label: "Home" },
    { href: "/graveyard", label: "Graveyard" },
    { href: "/events", label: "Events" },
  ];
</script>

<header class="border-b border-tomb-200 bg-tomb-50/80 backdrop-blur sticky top-0 z-10">
  <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="{base}/" class="flex items-center gap-2 font-serif text-xl font-bold">
      <span class="text-tomb-400">✝</span>
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

<footer class="border-t border-tomb-200 mt-16 py-6 text-center text-xs font-mono text-tomb-500">
  Tracks the OpenRouter catalog every 6 hours · data lives in this <a
    href="https://github.com/meni432/ModelGraveyard"
    class="underline hover:text-tomb-700">git repo</a
  >
</footer>
