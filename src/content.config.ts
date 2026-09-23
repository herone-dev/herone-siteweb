import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    // Renseignée quand un article publié est repris. Elle ne remplace jamais
    // pubDate, qui reste la date de première mise en ligne et sert au tri.
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Hérone'),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // Catégorie libre, volontairement. Une liste fermée cassait le build
    // Netlify, donc tout le site, dès qu'un article arrivait avec une valeur
    // non prévue. La barre de filtres du blog déduit ses thèmes des articles
    // présents : une nouvelle catégorie apparaît sans rien toucher au code.
    category: z.string(),
    readingTime: z.number(),
    systemTitle: z.string(),
    // Archivage. Un article à true disparaît de la liste, du flux, du plan de
    // site et n'a plus de page : il reste dans le dépôt, modifiable, et
    // repasse en ligne en remettant false. C'est le seul mécanisme de retrait,
    // il n'y a pas de suppression de fichier.
    draft: z.boolean().default(false),
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
