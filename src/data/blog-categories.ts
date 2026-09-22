/* Point de couleur de chaque catégorie du blog (refonte du 22 septembre 2026).
 *
 * Il précède le nom de la catégorie sur les cartes, l'article à la une et les
 * articles liés. Les valeurs sont celles du brief, et chacune existe déjà dans
 * la palette du site :
 *   Automatisation #13A89E, CRM #3E6B5A, Devis #518770, BTP #7C846B.
 *
 * Une catégorie ajoutée au schéma (src/content.config.ts) sans entrée ici
 * reçoit le jade de la marque plutôt qu'aucune couleur.
 */
const POINTS: Record<string, string> = {
  Automatisation: 'var(--amber-500)',
  CRM: 'var(--slate-500)',
  Devis: 'var(--slate-400)',
  BTP: 'var(--ink-400)',
};

export function pointDe(categorie: string): string {
  return POINTS[categorie] ?? 'var(--brand)';
}
