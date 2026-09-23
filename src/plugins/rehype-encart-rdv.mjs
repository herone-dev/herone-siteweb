/* Encart rendez-vous inséré au milieu de chaque article de blog.
 *
 * Avant la refonte, le bloc était recopié en HTML dans chaque fichier
 * Markdown. Il vit désormais ici, en un seul endroit : les articles
 * redeviennent du Markdown pur, et changer le texte de l'encart ne demande
 * plus de rouvrir sept fichiers.
 *
 * Placement, repris du cahier des charges de la refonte :
 *   - quatre titres de section ou plus : après la deuxième section, donc
 *     juste avant le troisième titre ;
 *   - moins de quatre titres : juste avant le dernier ;
 *   - un seul titre ou aucun : à la fin de l'article, faute de coupure
 *     naturelle où le poser sans couper la lecture dès la première ligne.
 * Une seule occurrence par article, toujours.
 */

const LIEN_RDV = '/#reserver';

// Sans point final : c'est un titre (règle du site depuis le 22 septembre 2026).
const TITRE = 'Nous regardons votre cas en trente minutes';
const PHRASE = "Sans jargon, sans engagement. Nous repérons ce qui peut être automatisé chez vous.";
const BOUTON = 'Réserver 30 minutes';

function texte(valeur) {
  return { type: 'text', value: valeur };
}

function element(tagName, properties, children = []) {
  return { type: 'element', tagName, properties, children };
}

function encart() {
  return element('aside', { className: ['hrn-article-cta'], 'aria-label': 'Prendre rendez-vous' }, [
    element('p', { className: ['hrn-article-cta__titre'] }, [texte(TITRE)]),
    element('p', { className: ['hrn-article-cta__phrase'] }, [texte(PHRASE)]),
    element('a', { className: ['hrn-article-cta__lien'], href: LIEN_RDV }, [texte(BOUTON)]),
  ]);
}

export default function rehypeEncartRdv() {
  return (arbre) => {
    const enfants = arbre.children ?? [];

    // Garde-fou : si un article porte encore l'encart en dur, on n'en ajoute
    // pas un second.
    const dejaPresent = enfants.some(
      (n) =>
        n.type === 'element' &&
        []
          .concat(n.properties?.className ?? [])
          .includes('hrn-article-cta'),
    );
    if (dejaPresent) return;

    const titres = [];
    enfants.forEach((n, i) => {
      if (n.type === 'element' && n.tagName === 'h2') titres.push(i);
    });

    let position;
    if (titres.length >= 4) {
      position = titres[2];
    } else if (titres.length >= 2) {
      position = titres[titres.length - 1];
    } else {
      position = enfants.length;
    }

    enfants.splice(position, 0, encart());
  };
}
