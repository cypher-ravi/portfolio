# Portfolio

**Live site:** https://cypher-ravi.github.io/portfolio/

Ravi's personal site. Theme: **particle field**. It's a cool dark page with one accent colour (`--accent`) and one cloud of about 15k particles (Three.js) that follows the reader. The cloud rebuilds itself into a new shape for each section: a sphere in the hero, `</>` in Experience, three project cards, a brain for How I use AI, and an `@` for Contact. The cursor scatters the particles, a click bursts the shape, and a mouse drag turns it. The engine is `src/scripts/field.js`, with the shapes in `src/scripts/scenes/shapes.js`, and sections choose their shape with `data-scene`. Motion (Lenis smooth scroll, word-by-word headlines, fade-ups) lives in `src/scripts/motion.ts`. Everything respects `prefers-reduced-motion`, and without WebGL a static dotted sphere is shown instead. Type: Space Grotesk for text and Space Mono for labels, both self-hosted (SIL Open Font License).

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run check    # type-check
npm run build    # static output in dist/
```

Content lives in `src/data/profile.ts`. Values in `[brackets]` are placeholders.

## Deploy

The live site is on GitHub Pages at https://cypher-ravi.github.io/portfolio/. Every push to `main` runs `.github/workflows/pages.yml`, which builds with `BASE_PATH=/portfolio` and publishes the result, usually within a minute. You can also start it by hand from the Actions tab ("Deploy to GitHub Pages" → Run workflow). If the site still shows an old version after a deploy, hard-refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac).

It also works on Cloudflare Pages: connect the repo with build command `npm run build` and output directory `dist`, and every pull request gets its own preview URL.
