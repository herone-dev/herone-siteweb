import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Hérone'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.enum(['Automatisation', 'Devis', 'CRM', 'BTP']),
    readingTime: z.number(),
    systemTitle: z.string(),
  }),
});

export const collections = { blog };
