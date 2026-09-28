// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages serves the site from /portfolio/, so its workflow sets BASE_PATH.
// Anywhere else (local dev, a custom domain) it lives at the root.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://cypher-ravi.github.io',
  base: process.env.BASE_PATH ?? '/',
});
