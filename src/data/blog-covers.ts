/* Association slug vers motif de couverture.
 *
 * Les couvertures du blog sont dessinées en SVG par BlogCover.astro : aucune
 * image à produire, aucun poids réseau, et le rendu suit la palette du blog.
 * Un slug absent de cette table reçoit le motif par défaut « soleil ».
 *
 * Le frontmatter d'un article peut porter un champ `cover` : il l'emporte
 * alors sur cette table (voir src/content.config.ts).
 */
export const BLOG_COVERS: Record<string, string> = {
  'remplir-son-agenda': 'agenda',
  'comptes-rendus': 'compte-rendu',
  'devis-excel': 'devis',
  'facebook-crm': 'formulaire',
  'reporting-mensuel': 'reporting',
  'relances-clients': 'relances',
  'administratif-mi-temps': 'tri-mails',
};

/** Motif retenu pour un article : le frontmatter d'abord, la table ensuite. */
export function motifDe(slug: string, cover?: string): string {
  return cover ?? BLOG_COVERS[slug] ?? 'soleil';
}
