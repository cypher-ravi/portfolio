# Portfolio

Ravi's personal site. Theme: **Life × Tech**, living things drawn in light and code. The page opens with a four-act Three.js scroll story (Seed, Mind, Growth, Connect): a tree of life grows from seed to now in the hero, Mind is a connectome (neurons firing; tap to start a thought), Growth regrows the tree with scroll from 2020 to now, and Connect gathers everything into one beam. A page-long tree (`src/components/PageTree.astro`) runs down the page with a branch into each section and data rising through it like sap. The engine is `src/scripts/story-engine.js`, with the scenes in `src/scripts/scenes/`. Type: Orbitron for headings, Space Grotesk for text, Space Mono for labels, all self-hosted (SIL Open Font License).

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
