import { SITE_URL } from "$lib/seo.ts";
import type { RequestHandler } from "./$types.js";

export const prerender = true;

export const GET: RequestHandler = () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
