import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

// Served from modelgraveyard.com (apex), so no base path. The CNAME file in
// static/ tells GitHub Pages the custom domain on every deploy.
/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: "../docs",
      assets: "../docs",
      fallback: "404.html",
      precompress: false,
      strict: false,
    }),
    paths: {
      base: "",
    },
    prerender: {
      handleHttpError: ({ path, message }) => {
        if (path.startsWith("/model/")) return;
        throw new Error(message);
      },
    },
  },
};

export default config;
