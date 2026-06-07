<script lang="ts">
  import Head from "$lib/components/Head.svelte";
  import { meta } from "$lib/seo.ts";

  const m = meta({
    path: "/about",
    title: "About — what this tracks and why",
    description:
      "Why a public lifecycle ledger for LLMs matters: OpenRouter's catalog churns silently. Read the BerriAI/litellm #20521 incident, see the data sources, and learn how the graveyard is built.",
  });
</script>

<Head meta={m} />

<article class="prose-tomb max-w-3xl mx-auto">
  <h1 class="font-serif text-4xl font-bold mb-2">About ModelGraveyard</h1>
  <p class="epitaph text-lg mb-10">
    A public, machine-readable ledger of every LLM that has appeared on, vanished from,
    or quietly changed price on <a class="moss" href="https://openrouter.ai" target="_blank" rel="noopener">OpenRouter</a>.
  </p>

  <section class="mb-10">
    <h2 class="font-serif text-2xl font-bold mb-3">What is OpenRouter?</h2>
    <p class="mb-3">
      <a class="moss" href="https://openrouter.ai" target="_blank" rel="noopener">OpenRouter</a>
      is a unified API in front of 300+ LLMs from dozens of providers — Anthropic, OpenAI,
      Google, Meta, Mistral, xAI, DeepSeek, Qwen, and many more. You point your code at
      one endpoint, pick a model by ID like
      <code class="font-mono text-sm bg-tomb-100 px-1 rounded">anthropic/claude-3.5-sonnet</code>,
      and OpenRouter handles routing, billing, and provider fallback. For thousands of
      production apps it is the de facto registry of "which models exist and what do they cost."
    </p>
    <p class="mb-3">
      That registry is exposed at
      <a
        class="moss"
        href="https://openrouter.ai/api/v1/models"
        target="_blank"
        rel="noopener"
        ><code class="font-mono text-sm bg-tomb-100 px-1 rounded">/api/v1/models</code></a
      >
      — a public, no-auth JSON catalog. ModelGraveyard fetches it every 6 hours, diffs
      the snapshot against the last one, and writes a typed event for every change. The
      data is committed straight into
      <a
        class="moss"
        href="https://github.com/meni432/ModelGraveyard/tree/main/data/derived"
        target="_blank"
        rel="noopener">this git repo</a
      >
      so the history is auditable and portable.
    </p>
    <p>
      OpenRouter's own
      <a
        class="moss"
        href="https://openrouter.ai/docs/api-reference/list-available-models"
        target="_blank"
        rel="noopener">API reference</a
      >
      and
      <a
        class="moss"
        href="https://openrouter.ai/docs/quickstart"
        target="_blank"
        rel="noopener">quickstart</a
      >
      explain how to call it; this site is the lens for watching how it changes over time.
    </p>
  </section>

  <section class="mb-10 rounded-lg border border-rose-300 bg-rose-50 p-5">
    <h2 class="font-serif text-2xl font-bold mb-3 text-rose-900">
      Why this matters: the silent-deprecation problem
    </h2>
    <p class="mb-3">
      Models on OpenRouter disappear without warning. The canonical receipt is
      <a
        class="font-semibold text-rose-800 underline"
        href="https://github.com/BerriAI/litellm/issues/20521"
        target="_blank"
        rel="noopener">BerriAI/litellm issue #20521</a
      >
      — a community report cataloguing
      <strong>39 OpenRouter models</strong> that vanished from the live API while
      still appearing in downstream pricing JSONs, with no
      <code class="font-mono text-sm bg-rose-100 px-1 rounded">deprecation_date</code> field
      to warn anyone. The issue body breaks them down by provider: 9 Anthropic, 7 OpenAI,
      6 Meta Llama, 4 Google, 3 Mistral, 10 others.
    </p>
    <p class="mb-3">
      For a production app this is a real outage waiting to happen: a request that
      worked yesterday returns
      <code class="font-mono text-sm bg-rose-100 px-1 rounded">404 model_not_found</code>
      today, with no upstream notification, no migration window, and no audit trail of
      what the model used to cost or how it behaved.
    </p>
    <p class="mb-0">
      OpenRouter <em>does</em> populate an
      <code class="font-mono text-sm bg-rose-100 px-1 rounded">expiration_date</code> field
      on some models — those become the "scheduled funerals" list. But the silent
      removals are the dangerous ones, and the only way to catch them is to keep a
      time-series of the catalog. That is what this project is.
    </p>
  </section>

  <section class="mb-10">
    <h2 class="font-serif text-2xl font-bold mb-3">What gets tracked</h2>
    <dl class="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm">
      <dt class="font-mono text-moss-600">model_added</dt>
      <dd>A new model ID appears in the catalog.</dd>
      <dt class="font-mono text-moss-600">model_removed</dt>
      <dd>
        A previously-seen ID is gone — buried in the <a href="/graveyard" class="moss">graveyard</a> with
        a final-state epitaph and a same-provider suggested replacement.
      </dd>
      <dt class="font-mono text-moss-600">price_changed</dt>
      <dd>Any of <code>prompt</code>, <code>completion</code>, <code>image</code>, or <code>request</code> pricing changed, with old/new values and percentage delta.</dd>
      <dt class="font-mono text-moss-600">context_changed</dt>
      <dd>The model's <code>context_length</code> changed.</dd>
      <dt class="font-mono text-moss-600">deprecation_announced</dt>
      <dd>
        <code>expiration_date</code> is newly present — the model has been formally scheduled for retirement.
      </dd>
    </dl>
  </section>

  <section class="mb-10">
    <h2 class="font-serif text-2xl font-bold mb-3">How to consume it</h2>
    <ul class="space-y-2 text-sm list-disc list-inside marker:text-tomb-400">
      <li>
        <a href="/feeds/all.xml" class="moss">Atom feed of all events</a> — global
        subscription, drop into any RSS reader.
      </li>
      <li>
        Per-event-type feeds for narrower subscriptions:
        <a class="moss" href="/feeds/by-type/model_removed.xml">removals</a>,
        <a class="moss" href="/feeds/by-type/disagreement_detected.xml">catalog disagreements</a>,
        <a class="moss" href="/feeds/by-type/deprecation_announced.xml">deprecations</a>,
        <a class="moss" href="/feeds/by-type/price_changed.xml">price changes</a>,
        <a class="moss" href="/feeds/by-type/context_changed.xml">context changes</a>,
        <a class="moss" href="/feeds/by-type/model_added.xml">additions</a>.
        The <em>removals</em> and <em>disagreements</em> feeds are the most-subscribed
        slices — both map directly to production-app outage signals.
      </li>
      <li>
        Per-provider feeds under
        <a
          class="moss"
          href="https://github.com/meni432/ModelGraveyard/tree/main/feeds/by-provider"
          target="_blank"
          rel="noopener"><code>feeds/by-provider/</code></a
        > — for example
        <a class="moss" href="/feeds/by-provider/anthropic.xml">anthropic.xml</a>,
        <a class="moss" href="/feeds/by-provider/openai.xml">openai.xml</a>,
        <a class="moss" href="/feeds/by-provider/google.xml">google.xml</a>.
        Or pick a provider from the
        <a class="moss" href="/events">event log</a> filter to get the URL automatically.
      </li>
      <li>
        Raw JSON: <a
          class="moss"
          href="https://github.com/meni432/ModelGraveyard/blob/main/data/derived/events.json"
          target="_blank"
          rel="noopener"><code>data/derived/events.json</code></a
        >,
        <a
          class="moss"
          href="https://github.com/meni432/ModelGraveyard/blob/main/data/derived/graveyard.json"
          target="_blank"
          rel="noopener"><code>graveyard.json</code></a
        >,
        <a
          class="moss"
          href="https://github.com/meni432/ModelGraveyard/blob/main/data/derived/models-current.json"
          target="_blank"
          rel="noopener"><code>models-current.json</code></a
        >.
      </li>
      <li>
        Embed a status badge for any model — every
        <a href="/" class="moss">model page</a> has a <strong>copy svg</strong> button that
        produces a paste-able pill (green for alive, slate for deceased) with the latest
        <code>last_seen</code> date.
      </li>
    </ul>
  </section>

  <section class="mb-10">
    <h2 class="font-serif text-2xl font-bold mb-3">Catalog cross-reference</h2>
    <p class="mb-3">
      Alongside OpenRouter, a daily fetch pulls
      <a
        class="moss"
        href="https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json"
        target="_blank"
        rel="noopener">LiteLLM's <code>model_prices_and_context_window.json</code></a
      > — the other widely-used model registry. A canonicalization step strips
      provider prefixes, date stamps (e.g.
      <code class="font-mono text-xs bg-tomb-100 px-1 rounded">-20240620</code>),
      and routing namespaces (e.g.
      <code class="font-mono text-xs bg-tomb-100 px-1 rounded">bedrock/anthropic.</code>)
      so the same underlying model collapses to a shared canonical slug across
      both sources.
    </p>
    <p class="mb-3">
      When a model is <strong>removed from OpenRouter but still listed by LiteLLM</strong>,
      the system emits a high-severity <code class="font-mono text-xs bg-tomb-100 px-1 rounded">disagreement_detected</code>
      event. That is the exact pattern issue #20521 describes — a model that
      production apps may still try to call because their pricing JSON still
      lists it, even though the upstream gateway no longer serves it.
    </p>
    <p>
      The cross-reference snapshot is published at
      <a
        class="moss"
        href="https://github.com/meni432/ModelGraveyard/blob/main/data/derived/cross-reference.json"
        target="_blank"
        rel="noopener"><code>data/derived/cross-reference.json</code></a
      >, and disagreements feed into the
      <a class="moss" href="/feeds/by-type/disagreement_detected.xml">RSS feed</a>.
    </p>
  </section>

  <section class="mb-10">
    <h2 class="font-serif text-2xl font-bold mb-3">Methodology</h2>
    <p class="mb-3">
      A scheduled GitHub Action runs every 6 hours, fetches OpenRouter's catalog via the
      <a
        class="moss"
        href="https://github.com/githubocto/flat"
        target="_blank"
        rel="noopener">Flat Data</a
      >
      action, and runs a Deno postprocess script that diffs the snapshot against the
      last committed state. Each typed event lands in
      <code class="font-mono text-sm bg-tomb-100 px-1 rounded">data/derived/events.json</code>;
      removed models also get a graveyard entry with a heuristic survivor suggestion
      (closest same-provider context window). A second daily workflow does the same
      for LiteLLM, then cross-references the two catalogs. The SvelteKit site is
      rebuilt and redeployed to GitHub Pages whenever derived data changes.
    </p>
    <p>
      Everything is in
      <a
        class="moss"
        href="https://github.com/meni432/ModelGraveyard"
        target="_blank"
        rel="noopener">the public repo</a
      >. Fork it, audit it, or open an issue if you spot a bug in the diff logic.
    </p>
  </section>

  <section class="mb-10">
    <h2 class="font-serif text-2xl font-bold mb-3">Related projects</h2>
    <ul class="space-y-2 text-sm list-disc list-inside marker:text-tomb-400">
      <li>
        <a
          class="moss"
          href="https://github.com/simonw/llm-prices"
          target="_blank"
          rel="noopener">simonw/llm-prices</a
        > — Simon Willison's curated price index. Cross-referenced when reasoning about
        the right replacement model.
      </li>
      <li>
        <a
          class="moss"
          href="https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json"
          target="_blank"
          rel="noopener">LiteLLM model_prices_and_context_window.json</a
        > — the other canonical model registry. The v2 roadmap includes
        cross-referencing this with OpenRouter to surface "in LiteLLM but no longer in
        OpenRouter" silent drops.
      </li>
      <li>
        <a
          class="moss"
          href="https://openrouter.ai/rankings"
          target="_blank"
          rel="noopener">OpenRouter Rankings</a
        > — the upstream view of which models are getting traffic. Useful signal for
        guessing which models are at risk of being sunsetted.
      </li>
    </ul>
  </section>

  <section>
    <h2 class="font-serif text-2xl font-bold mb-3">FAQ</h2>

    <h3 class="font-serif text-lg font-bold mt-5 mb-1">Why every 6 hours?</h3>
    <p class="text-sm mb-3">
      A balance between catching deprecations quickly and not spamming the repo with
      empty commits. Most OpenRouter catalog updates land within a 6-hour window of
      each other.
    </p>

    <h3 class="font-serif text-lg font-bold mt-5 mb-1">Why only OpenRouter and not directly from providers?</h3>
    <p class="text-sm mb-3">
      OpenRouter is the largest single source of LLM availability data and already
      normalizes pricing fields across providers. Direct provider scrapers (Anthropic,
      OpenAI, Google) are on the v2 roadmap; their pricing pages are JS-rendered
      and brittle.
    </p>

    <h3 class="font-serif text-lg font-bold mt-5 mb-1">My model just disappeared. What do I do?</h3>
    <p class="text-sm mb-3">
      Open its graveyard page — the <strong>survivor</strong> link suggests the closest
      same-provider replacement. Confirm by checking the
      <a
        class="moss"
        href="https://openrouter.ai/models"
        target="_blank"
        rel="noopener">OpenRouter models page</a
      > and the survivor's docs. For Anthropic models, also check the
      <a
        class="moss"
        href="https://docs.anthropic.com/en/docs/about-claude/model-deprecations"
        target="_blank"
        rel="noopener">Anthropic deprecation policy</a
      >; for OpenAI,
      <a
        class="moss"
        href="https://platform.openai.com/docs/deprecations"
        target="_blank"
        rel="noopener">platform.openai.com/docs/deprecations</a
      >.
    </p>

    <h3 class="font-serif text-lg font-bold mt-5 mb-1">License?</h3>
    <p class="text-sm">MIT for the code. Data is from OpenRouter under their terms of service.</p>
  </section>
</article>

<style>
  :global(.moss) {
    color: theme("colors.moss.600");
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  :global(.moss:hover) {
    color: theme("colors.moss.500");
  }
</style>
