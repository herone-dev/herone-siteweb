import type { ImageMetadata } from 'astro';
import founderNolan from '../assets/images/founder-nolan.webp';
import founderMartin from '../assets/images/founder-martin.webp';

export interface Auteur {
  nom: string;
  role: string;
  photo?: ImageMetadata;
  phrase: string;
  /** Le gabarit suffixe le rôle par « Hérone ». Inutile sur la fiche maison. */
  marque?: boolean;
}

/* Fiches auteurs du bloc de fin d'article.
 *
 * La clé est la valeur du champ `author` du frontmatter. Un article dont
 * l'auteur n'est pas listé retombe sur la fiche « Hérone », qui n'a pas de
 * photo : le rond bleu nuit affiche alors l'initiale « H » en turquoise.
 *
 * Les rôles sont ceux déjà publiés sous les portraits de la page d'accueil
 * (section « Les visages d'Hérone »), pour ne pas faire coexister deux
 * intitulés différents sur le même site.
 */
export const AUTEURS: Record<string, Auteur> = {
  'Hérone': {
    nom: "L'équipe Hérone",
    role: 'Les Herbiers, Vendée',
    marque: false,
    phrase:
      "Nous formons les équipes à l'IA et nous automatisons les tâches répétitives des TPE et PME, à moins de 45 minutes des Herbiers.",
  },
  'Nolan Genty': {
    nom: 'Nolan Genty',
    role: 'Directeur Général',
    photo: founderNolan,
    phrase:
      "Rencontre les dirigeants, cadre les projets et anime les journées de formation avec Martin.",
  },
  'Martin Talon': {
    nom: 'Martin Talon',
    role: 'Directeur Technique',
    photo: founderMartin,
    phrase:
      "Construit les automatisations sur le serveur d'Hérone et anime les journées de formation avec Nolan.",
  },
};

/** Fiche d'un auteur, avec repli sur la fiche « Hérone ». */
export function auteurDe(nom: string): Auteur {
  return AUTEURS[nom] ?? AUTEURS['Hérone'];
}
