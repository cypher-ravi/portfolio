# Portfolio

Ravi's personal site. Theme: **First Contact**. The page opens with *The Signal*, a five-act Three.js scroll story (Cosmos, Pulse, Mind, Growth, Reply) built from what drives the work: space tech, healthcare, the mind, and life as a force of nature. The engine is `src/scripts/story-engine.js`.

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
