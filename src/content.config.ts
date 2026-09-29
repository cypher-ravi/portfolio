// Research write-ups: one Markdown file per project in src/content/research/.
// The frontmatter drives the index card and the page header; the body is the write-up.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(), // one line for the index card
    field: z.string(), // for example "Quantum computing · Space"
    status: z.enum(['Planning', 'In progress', 'Published']),
    question: z.string(), // the research question, in one sentence
    updated: z.string(), // for example "29 Sep 2026"
    order: z.number().default(0), // lower comes first on the index
    stack: z.array(z.string()).default([]),
    phases: z.array(z.object({ title: z.string(), state: z.enum(['done', 'now', 'next']) })).default([]),
    links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
  }),
});

export const collections = { research };
