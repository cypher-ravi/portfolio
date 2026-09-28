# Portfolio

Ravi's personal site. Theme: **First Contact**, the page as a transmission being decoded on the hydrogen line (1420.405 MHz).

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
