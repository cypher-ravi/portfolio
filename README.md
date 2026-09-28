# Portfolio

Ravi's personal site. Theme: **First Contact**. The page opens with *The Signal*, a four-act Three.js scroll story (Cosmos, Mind, Growth, Reply). The hero shows the three-body problem: three suns on the stable figure-eight orbit, simulated live. The engine is `src/scripts/story-engine.js`.

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
