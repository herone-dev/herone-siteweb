import { defineConfig } from 'astro/config';
import rehypeEncartRdv from './src/plugins/rehype-encart-rdv.mjs';

export default defineConfig({
  site: 'https://herone.fr',
  trailingSlash: 'never',
  markdown: {
    // L'encart rendez-vous des articles de blog est posé ici plutôt que
    // recopié dans chaque fichier Markdown.
    rehypePlugins: [rehypeEncartRdv],
  },
});
