// Shared SEO config so titles/descriptions/canonical URLs stay consistent.

export const SITE_URL = "https://modelgraveyard.com";
export const SITE_NAME = "ModelGraveyard";
export const SITE_TAGLINE =
  "Tracking the lifecycle of every LLM on OpenRouter — additions, silent removals, price changes, deprecations.";

export interface MetaInput {
  title?: string;
  description?: string;
  path: string; // route path, e.g. "/about" or "/model/openai/gpt-4o"
  noindex?: boolean;
}

export interface MetaOutput {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
}

export function meta(input: MetaInput): MetaOutput {
  const title = input.title ? `${input.title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  return {
    title,
    description: input.description ?? SITE_TAGLINE,
    canonical: `${SITE_URL}${input.path}`,
    noindex: !!input.noindex,
  };
}
