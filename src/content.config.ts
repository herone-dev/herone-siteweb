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
    // Encart « En bref » en tête d'article : quatre phrases au maximum,
    // numérotées par le gabarit. Absent, rien ne s'affiche.
    summary: z.array(z.string()).max(4).optional(),
    // Motif de couverture de l'ancienne version du blog. Les illustrations ont
    // été retirées le 22 septembre 2026 : le champ est toléré pour ne pas
    // casser un article qui le porterait encore, mais il n'est plus lu.
    cover: z.string().optional(),
  }),
});

export const collections = { blog }