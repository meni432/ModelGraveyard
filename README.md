# ModelGraveyard

A public record of every LLM that appeared on, vanished from, or quietly changed price on OpenRouter.

Existing trackers (PricePerToken, llmrates.live, simonw/llm-prices) show *current* pricing. ModelGraveyard shows the **lifecycle**: when a model was added, when it silently disappeared, when its price doubled, when its context window shifted, when a sunset date was announced. Built around the receipt in [BerriAI/litellm #20521](https://github.com/BerriAI/litellm/issues/20521): 39 OpenRouter models vanished from the live API while still appearing in pricing JSONs, with no `deprecation_date`.

**Live site:** https://modelgraveyard.com
**Atom feeds:** [`feeds/all.xml`](feeds/all.xml), per-provider feeds under [`feeds/by-provider/`](feeds/by-provider/)

## How it works

```
OpenRouter /api/v1/models  ──►  data/raw/openrouter-models.json
                                          │
              (Flat Data, every 6 hours)  │
                                          ▼
                         postprocess/process-openrouter.ts
                                          │
                                          ├──►  data/derived/models-current.json
                                          ├──►  data/derived/events.json
                                          ├──►  data/derived/graveyard.json
                                          ├──►  data/derived/summary.json
                                          └──►  feeds/all.xml + feeds/by-provider/*.xml
                                                          │
                                                          ▼
                                            SvelteKit static build (web/)
                                                          │
                                                          ▼
                                              GitHub Pages (docs/)
```

Every 6 hours a GitHub Action fetches the OpenRouter catalog. The Deno postprocess script diffs it against the last known state and emits typed events:

| Event | When |
|---|---|
| `model_added` | A new model ID appears in the catalog |
| `model_removed` | A previously-seen ID is gone — buried in the graveyard with an epitaph |
| `price_changed` | Any of prompt/completion/image/request pricing changed |
| `context_changed` | `context_length` changed |
| `deprecation_announced` | `expiration_date` is newly present or changed |

`build-site.yml` rebuilds the SvelteKit dashboard whenever derived data changes. A [Dependabot config](.github/dependabot.yml) keeps `web/` deps and the actions themselves fresh, and its weekly merges double as a heartbeat so the public-repo scheduler doesn't auto-disable the cron during quiet stretches (in practice the 6-hourly catalog commits already do that).

## Repo layout

| Path | What lives here |
|---|---|
| `.github/workflows/` | `fetch-openrouter`, `build-site` |
| `data/raw/` | Untouched OpenRouter snapshot (overwritten each run) |
| `data/derived/` | The site's source of truth: events, current state, graveyard, summary |
| `postprocess/` | Deno: normalize, diff, build Atom feeds; fixture-based tests |
| `feeds/` | Generated Atom 1.0 feeds — global + per-provider |
| `web/` | SvelteKit (static adapter) + Tailwind + uPlot |
| `docs/` | Build output served by GitHub Pages |

## Development

Diff engine and feed builder (no network needed):

```sh
cd postprocess
deno test --allow-read           # fixture tests
deno run --allow-read --allow-write --allow-env process-openrouter.ts
```

SvelteKit:

```sh
cd web
npm install
npm run dev                      # http://localhost:5173
npm run build                    # writes ../docs
```

`web/static/data` and `web/static/feeds` are symlinks to the repo-root `data/` and `feeds/` directories so the SvelteKit dev server and static build pick up the latest committed state.

## Embed a badge

Every model page (`/model/<provider>/<id>`) has a **copy svg** button that produces a paste-able status pill — green for alive, slate for deceased — with the latest `last_seen` date. Drop it into your README or status page.

## Roadmap (v2)

- LiteLLM cross-reference (`model_prices_and_context_window.json`) to surface the "in LiteLLM but no longer in OpenRouter" silent-drop signal from issue #20521.
- Direct provider scrapers (Anthropic, OpenAI, Google) for sources OpenRouter doesn't mirror.
- "Price half-life" chart computed from the events feed.
- Per-provider RSS subscriptions surfaced more prominently.

## License

MIT.
