import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeEncartRdv from './src/plugins/rehype-encart-rdv.mjs';

/* URLs des articles en brouillon.
 *
 * Le plan de site est produit par @astrojs/sitemap à partir des pages
 * réellement construites. Un brouillon n'en produit aucune, donc en théorie il
 * n'y apparaît pas. On le retire quand même explicitement : si un jour une
 * page de brouillon est construite (aperçu, route de secours), elle ne doit
 * pas partir dans le plan de site et se faire indexer.
 *
 * La lecture se fait à la main plutôt que par astro:content, indisponible dans
 * ce fichier, qui est évalué avant le contenu.
 */
const BROUILLONS = new Set(
  readdirSync('./src/content/blog')
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const tete = readFileSync(`./src/content/blog/${f}`, 'utf8').split(/^---\s*$/m)[1] ?? '';
      return /^draft:\s*true\s*$/m.test(tete);
    })
    .map((f) => `https://herone.fr/blog/${f.replace(/\.md$/, '')}`),
);

export default defineConfig({
  site: 'https://herone.fr',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      filter: (page) => !BROUILLONS.has(page.replace(/\/$/, '')),
    }),
  ],
  markdown: {
    // L'encart rendez-vous des articles de blog est posé ici plutôt que
    // recopié dans chaque fichier Markdown.
    rehypePlugins: [rehypeEncartRdv],
  },
});
