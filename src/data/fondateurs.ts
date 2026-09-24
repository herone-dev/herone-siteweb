// Les deux fondateurs, lus par la section « Les visages d'Hérone » de
// l'accueil et par « Qui anime » sur /formation. Un seul intitulé par
// personne sur tout le site : c'est ici qu'il se change.
import type { ImageMetadata } from 'astro';
import founderNolan from '../assets/images/founder-nolan.webp';
import founderMartin from '../assets/images/founder-martin.webp';

export const FONDATEURS: { nom: string; role: string; photo: ImageMetadata }[] = [
  { nom: 'Nolan Genty', role: 'Directeur Général', photo: founderNolan },
  { nom: 'Martin Talon', role: 'Directeur Technique', photo: founderMartin },
];
