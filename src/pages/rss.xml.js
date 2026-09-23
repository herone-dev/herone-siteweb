/* Flux RSS du blog, servi sur /rss.xml.
 *
 * Il ne liste que les articles publiés : un brouillon n'a pas de page, il n'a
 * donc pas non plus d'entrée dans le flux. C'est ce flux que lisent les
 * agrégateurs et les automatisations de diffusion branchées plus tard.
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = (await getCollection('blog', ({ data }) => data.draft !== true)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: 'Blog Hérone',
    description:
      'Des cas réels, des méthodes, des systèmes qui font gagner des heures aux TPE et PME.',
    site: context.site,
    trailingSlash: false,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.pubDate,
      link: `/blog/${article.id}`,
      categories: [article.data.category, ...article.data.tags],
    })),
    customData: '<language>fr-fr</language>',
  });
}
