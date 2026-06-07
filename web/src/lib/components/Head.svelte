<script lang="ts">
  import { SITE_NAME, SITE_URL, type MetaOutput } from "$lib/seo.ts";

  interface Props {
    meta: MetaOutput;
    /** Optional inline JSON-LD object (Article, BreadcrumbList, etc.) */
    jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  }
  let { meta, jsonLd }: Props = $props();

  const ldJson = $derived(jsonLd ? JSON.stringify(jsonLd) : "");
</script>

<svelte:head>
  <title>{meta.title}</title>
  <meta name="description" content={meta.description} />
  <link rel="canonical" href={meta.canonical} />
  {#if meta.noindex}
    <meta name="robots" content="noindex,nofollow" />
  {/if}

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:url" content={meta.canonical} />
  <meta property="og:title" content={meta.title} />
  <meta property="og:description" content={meta.description} />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={meta.title} />
  <meta name="twitter:description" content={meta.description} />

  {#if ldJson}
    {@html `<script type="application/ld+json">${ldJson}</` + `script>`}
  {/if}
</svelte:head>
