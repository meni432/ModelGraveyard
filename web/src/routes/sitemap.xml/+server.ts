import fs from "node:fs/promises";
import path from "node:path";
import { SITE_URL } from "$lib/seo.ts";
import type { RequestHandler } from "./$types.js";

export const prerender = true;

interface ModelsFile {
  generated_at: string;
  models: Array<{ id: string; last_seen: string }>;
}
interface GraveyardFile {
  buried: Array<{ id: string; buried_at: string }>;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: RequestHandler = async () => {
  const root = process.cwd();
  const [modelsText, graveyardText] = await Promise.all([
    fs.readFile(path.join(root, "static/data/derived/models-current.json"), "utf8"),
    fs.readFile(path.join(root, "static/data/derived/graveyard.json"), "utf8"),
  ]);
  const models = JSON.parse(modelsText) as ModelsFile;
  const graveyard = JSON.parse(graveyardText) as GraveyardFile;

  const today = new Date().toISOString().slice(0, 10);

  type Entry = { loc: string; lastmod: string; priority: string };
  const entries: Entry[] = [
    { loc: SITE_URL + "/", lastmod: models.generated_at ?? today, priority: "1.0" },
    { loc: SITE_URL + "/about", lastmod: today, priority: "0.8" },
    { loc: SITE_URL + "/graveyard", lastmod: today, priority: "0.9" },
    { loc: SITE_URL + "/events", lastmod: models.generated_at ?? today, priority: "0.7" },
  ];

  for (const m of models.models) {
    entries.push({
      loc: `${SITE_URL}/model/${m.id}`,
      lastmod: m.last_seen,
      priority: "0.6",
    });
  }
  for (const g of graveyard.buried) {
    entries.push({
      loc: `${SITE_URL}/model/${g.id}`,
      lastmod: g.buried_at,
      priority: "0.5",
    });
  }

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url><loc>${esc(e.loc)}</loc><lastmod>${e.lastmod}</lastmod><priority>${e.priority}</priority></url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
