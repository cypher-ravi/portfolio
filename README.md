# Portfolio

Ravi's personal site. Theme: **Quiet Bonsai**. It's a warm dark room with one living thing in it and one accent colour (moss, `--accent`). A low-poly bonsai, built in code with Three.js (`src/scripts/scenes/bonsai.js`), follows the reader down the page. It grows from seed on load, regrows chapter by chapter through Experience (2020 to now), turns when dragged, sways toward the cursor and drops leaves when tapped. Hovering a principle in the AI section lights a stone in its pot. The engine is `src/scripts/garden.js`, and sections tell it where to stand with `data-scene`. Motion (Lenis smooth scroll, word-by-word headlines, fade-ups) lives in `src/scripts/motion.ts` and uses one easing curve. Everything respects `prefers-reduced-motion`, and without WebGL a static SVG bonsai is shown instead. Type: Instrument Serif for headlines and Inter for text, both self-hosted (SIL Open Font License).

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run check    # type-check
npm run build    # static output in dist/
```

Content lives in `src/data/profile.ts`. Values in `[brackets]` are placeholders.

## Deploy (Cloudflare Pages)

Connect this repo in Cloudflare Pages with build command `npm run build` and output directory `dist`. Every pull request gets its own preview URL.
