// Atom 1.0 feed generator. Reads from the in-memory event list so the
// postprocess script can call it without re-reading derived JSON.

import type { Event, PriceChange } from "./diff.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://modelgraveyard.com";
const FEED_DIR = "feeds";
const PROVIDER_DIR = `${FEED_DIR}/by-provider`;
const TYPE_DIR = `${FEED_DIR}/by-type`;
const MAX_ITEMS = 100;

const TYPE_LABELS: Record<string, string> = {
  model_added: "additions",
  model_removed: "removals",
  price_changed: "price changes",
  context_changed: "context changes",
  deprecation_announced: "deprecations",
  disagreement_detected: "catalog disagreements",
};

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const fmtPrice = (s: string | null): string => {
  if (s === null) return "—";
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  // OpenRouter prices are per token; show per million tokens.
  return `$${(n * 1_000_000).toFixed(4)}/Mtok`;
};

const renderPriceChanges = (changes: PriceChange[] | undefined): string => {
  if (!changes || changes.length === 0) return "";
  return changes
    .map((c) => {
      const pct = c.pct_change === null ? "" : ` (${c.pct_change > 0 ? "+" : ""}${c.pct_change}%)`;
      return `${c.field}: ${fmtPrice(c.prev)} → ${fmtPrice(c.next)}${pct}`;
    })
    .join("; ");
};

function title(ev: Event): string {
  switch (ev.type) {
    case "model_added":
      return `Added: ${ev.id}`;
    case "model_removed":
      return `Removed: ${ev.id}`;
    case "price_changed":
      return `Price changed: ${ev.id}`;
    case "context_changed":
      return `Context window changed: ${ev.id}`;
    case "deprecation_announced":
      return `Deprecation announced: ${ev.id} (sunset ${ev.next_expiration})`;
    case "disagreement_detected":
      return `Catalog disagreement: ${ev.id}`;
  }
}

function summary(ev: Event): string {
  switch (ev.type) {
    case "model_added":
      return `New model on OpenRouter. Initial prompt price: ${fmtPrice(ev.snapshot?.pricing.prompt ?? null)}, context: ${ev.snapshot?.context_length ?? "?"}.`;
    case "model_removed":
      return `Model no longer present in OpenRouter catalog. Final prompt price: ${fmtPrice(ev.snapshot?.pricing.prompt ?? null)}.`;
    case "price_changed":
      return renderPriceChanges(ev.changes);
    case "context_changed":
      return `${ev.prev_context ?? "?"} → ${ev.next_context ?? "?"} tokens`;
    case "deprecation_announced":
      return `Provider announced retirement on ${ev.next_expiration}.`;
    case "disagreement_detected":
      return `OpenRouter says ${ev.disagreement?.openrouter_status}; LiteLLM still lists it as ${ev.disagreement?.litellm_id ?? "active"}.`;
  }
}

const eventId = (ev: Event): string =>
  `tag:modelgraveyard,${ev.ts}:${ev.type}:${encodeURIComponent(ev.id)}`;

function renderFeed(opts: {
  title: string;
  selfPath: string;
  events: Event[];
}): string {
  const updated = opts.events[0]?.ts ?? new Date().toISOString().slice(0, 10);
  const entries = opts.events
    .map((ev) => {
      const link = `${SITE_URL}/model/${encodeURIComponent(ev.id)}`;
      return `  <entry>
    <id>${esc(eventId(ev))}</id>
    <title>${esc(title(ev))}</title>
    <updated>${ev.ts}T00:00:00Z</updated>
    <link rel="alternate" href="${esc(link)}"/>
    <category term="${esc(ev.type)}"/>
    <category term="provider:${esc(ev.provider)}"/>
    <summary>${esc(summary(ev))}</summary>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(opts.title)}</title>
  <id>${esc(SITE_URL + "/" + opts.selfPath)}</id>
  <link rel="self" href="${esc(SITE_URL + "/" + opts.selfPath)}"/>
  <link rel="alternate" href="${esc(SITE_URL)}"/>
  <updated>${updated}T00:00:00Z</updated>
${entries}
</feed>
`;
}

async function writeText(path: string, content: string): Promise<void> {
  const dir = path.split("/").slice(0, -1).join("/");
  if (dir) await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(path, content);
}

export async function writeFeeds(events: Event[]): Promise<void> {
  const sorted = [...events].sort((a, b) => b.ts.localeCompare(a.ts));
  const recent = sorted.slice(0, MAX_ITEMS);

  await writeText(
    `${FEED_DIR}/all.xml`,
    renderFeed({
      title: "ModelGraveyard — all events",
      selfPath: "feeds/all.xml",
      events: recent,
    }),
  );

  const byProvider = new Map<string, Event[]>();
  for (const ev of sorted) {
    const bucket = byProvider.get(ev.provider) ?? [];
    bucket.push(ev);
    byProvider.set(ev.provider, bucket);
  }

  // Remove any provider feeds that no longer have events (cleanup).
  try {
    for await (const entry of Deno.readDir(PROVIDER_DIR)) {
      if (entry.isFile && entry.name.endsWith(".xml")) {
        const provider = entry.name.slice(0, -4);
        if (!byProvider.has(provider)) {
          await Deno.remove(`${PROVIDER_DIR}/${entry.name}`);
        }
      }
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }

  for (const [provider, list] of byProvider) {
    await writeText(
      `${PROVIDER_DIR}/${provider}.xml`,
      renderFeed({
        title: `ModelGraveyard — ${provider}`,
        selfPath: `feeds/by-provider/${provider}.xml`,
        events: list.slice(0, MAX_ITEMS),
      }),
    );
  }

  // Per-event-type feeds. Always emit one per known type (even if empty) so
  // subscription URLs are stable from day one — an empty Atom feed is valid
  // and just tells subscribers "nothing yet." The "removals" feed is the
  // most-subscribed slice since it maps directly to the production-app
  // outage signal.
  const byType = new Map<string, Event[]>(
    Object.keys(TYPE_LABELS).map((t) => [t, []]),
  );
  for (const ev of sorted) {
    const bucket = byType.get(ev.type) ?? [];
    bucket.push(ev);
    byType.set(ev.type, bucket);
  }
  for (const [type, list] of byType) {
    const label = TYPE_LABELS[type] ?? type;
    await writeText(
      `${TYPE_DIR}/${type}.xml`,
      renderFeed({
        title: `ModelGraveyard — ${label}`,
        selfPath: `feeds/by-type/${type}.xml`,
        events: list.slice(0, MAX_ITEMS),
      }),
    );
  }
}
