// The hand written pages: Markdown under src/content/docs, English at the
// root and Arabic under ar/. Component, style and coverage pages are not
// here: they are built from the manifests and the style packs.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: ['**/*.md', '!components/**', '!ar/components/**'], base: './src/content/docs' }),
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      eyebrow: z.string().optional(),
    }),
  }),
};
