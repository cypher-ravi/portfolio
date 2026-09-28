# Portfolio

Ravi's personal site. Theme: **First Contact**. The page opens with *The Signal*, a four-act Three.js scroll story (Cosmos, Mind, Growth, Reply). The hero shows a tree of life growing from seed to now. Mind is a connectome (neurons firing; tap to start a thought) and Growth is a tree of life that grows with scroll from 2020 to now, its leaves glowing as they open. The engine is `src/scripts/story-engine.js`, with the scenes in `src/scripts/scenes/`. Type: Orbitron for headings, Space Grotesk for text, Space Mono for labels, all self-hosted (SIL Open Font License).

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
