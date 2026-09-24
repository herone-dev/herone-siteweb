/* Plan de marquage Hérone, GA4 (G-GT6JCYY2SF).
 *
 * La référence de chaque événement et de chaque paramètre est dans
 * docs/plan-de-marquage.md. Toute modification ici se reporte là-bas, et
 * inversement : la page Statistiques de /admin lit ces noms d'événements.
 *
 * Principes.
 * 1. Le consentement est géré dans Layout.astro (Consent Mode v2). Ce fichier
 *    n'en tient pas compte : gtag décide lui-même de ce qu'il envoie.
 * 2. Les pages vues sont envoyées ici, à chaque « astro:page-load », parce que
 *    les transitions de page d'Astro ne rechargent pas la page.
 * 3. Un seul écouteur de clic, posé sur le document, classe chaque clic. Rien
 *    n'est à ajouter dans les composants, sauf un data-suivi pour renommer
 *    une zone si besoin.
 */

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __hrnSuivi?: boolean;
  }
}

const HOTE = window.location.hostname;
const SEUILS_DEFILEMENT = [25, 50, 75, 100];
const LECTURE_SECONDES = 30;
const LECTURE_POURCENT = 75;

let contexte: Params = {};
let seuilsAtteints = new Set<number>();
let secondesActives = 0;
let lectureEnvoyee = false;
let minuteur: number | undefined;
// Pendant une transition de page, le défilement mesuré n'a plus de sens :
// l'ancien article s'efface et le nouveau n'est pas encore attribué.
let enTransition = false;

function envoyer(nom: string, params: Params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', nom, { ...contexte, ...params });
}

function groupeDeContenu(chemin: string): string {
  if (chemin === '/' || chemin === '') return 'accueil';
  if (chemin === '/blog' || chemin === '/blog/') return 'blog_liste';
  if (chemin.startsWith('/blog/')) return 'article';
  if (chemin.startsWith('/formation')) return 'offre_formation';
  if (chemin.startsWith('/automatisation')) return 'offre_automatisation';
  return 'autre';
}

function texteCourt(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/* La zone dit où, dans la page, le clic a eu lieu. Un data-suivi posé sur un
 * ancêtre l'emporte sur la détection automatique. */
function zoneDe(el: Element): string {
  const force = el.closest<HTMLElement>('[data-suivi]');
  if (force?.dataset.suivi) return force.dataset.suivi;
  if (el.closest('.hrn-mobile-menu')) return 'menu_mobile';
  if (el.closest('header.hrn-header, .hrn-header')) return 'entete';
  if (el.closest('footer')) return 'pied_de_page';
  if (el.closest('.hrn-article-cta')) return 'encart_rdv_article';
  if (el.closest('.hrn-article-cote__carte')) return 'carte_rdv_article';
  if (el.closest('.hrn-toc, .hrn-article-sommaire-mobile, .hrn-article-cote__sommaire')) return 'sommaire';
  if (el.closest('.hrn-prose')) return 'corps_article';
  if (el.closest('.hrn-cookie')) return 'bandeau_cookies';
  const section = el.closest<HTMLElement>('section[id], [id^="hrn-"]');
  if (section?.id) return section.id;
  const cls = el.closest<HTMLElement>('section[class]')?.className.split(' ')[0];
  return cls || 'page';
}

function versRdv(url: URL): boolean {
  return (url.hostname === HOTE && url.hash === '#reserver') || url.hostname.endsWith('calendly.com');
}

function surClic(ev: MouseEvent) {
  const cible = ev.target as Element | null;
  if (!cible) return;
  const lien = cible.closest<HTMLAnchorElement>('a[href]');
  const bouton = cible.closest<HTMLElement>('.hrn-btn, button');
  const el = lien ?? bouton;
  if (!el) return;

  const zone = zoneDe(el);
  const texte = texteCourt(el);
  const href = lien?.getAttribute('href') ?? '';

  if (href.startsWith('tel:')) {
    envoyer('clic_telephone', { cta_zone: zone, cta_texte: texte });
    return;
  }
  if (href.startsWith('mailto:')) {
    envoyer('clic_email', { cta_zone: zone, cta_texte: texte });
    return;
  }

  let url: URL | null = null;
  if (lien) {
    try { url = new URL(lien.href, window.location.href); } catch { url = null; }
  }

  const estBouton = el.matches('.hrn-btn, .hrn-article-cta__lien, button') || !!el.closest('.hrn-btn');
  if (url && versRdv(url)) {
    envoyer('clic_rdv', { cta_zone: zone, cta_texte: texte, lien_cible: url.hostname === HOTE ? url.pathname + url.hash : url.href });
    return;
  }
  if (estBouton && !lien) {
    // Bouton sans lien (bandeau cookies, menu) : compté comme clic de bouton.
    envoyer('clic_bouton', { cta_zone: zone, cta_texte: texte });
    return;
  }
  if (!url) return;

  if (url.hostname !== HOTE) {
    envoyer('clic_sortant', { cta_zone: zone, cta_texte: texte, lien_domaine: url.hostname, lien_cible: url.href });
    return;
  }

  const memePage = url.pathname === window.location.pathname && url.hash;
  if (memePage) {
    envoyer('clic_ancre', { cta_zone: zone, cta_texte: texte, lien_cible: url.hash });
    return;
  }

  envoyer(estBouton ? 'clic_bouton' : 'clic_lien_interne', {
    cta_zone: zone,
    cta_texte: texte,
    lien_cible: url.pathname,
  });
}

/* Calendly : l'agenda intégré prévient la page par postMessage. */
function surMessage(ev: MessageEvent) {
  if (typeof ev.origin !== 'string' || !ev.origin.endsWith('calendly.com')) return;
  const nom = ev.data?.event;
  if (nom === 'calendly.date_and_time_selected') envoyer('rdv_creneau_choisi');
  if (nom === 'calendly.event_scheduled') {
    envoyer('rdv_reserve', { methode: 'calendly' });
    // Événement recommandé par Google pour les prospects : il remonte tel quel
    // dans les rapports d'acquisition et peut servir pour Google Ads.
    envoyer('generate_lead', { methode: 'calendly' });
  }
}

function pourcentageDefile(): number {
  const article = document.querySelector<HTMLElement>('.hrn-prose');
  const bas = window.scrollY + window.innerHeight;
  if (article) {
    const debut = article.getBoundingClientRect().top + window.scrollY;
    const hauteur = article.offsetHeight || 1;
    return Math.max(0, Math.min(100, ((bas - debut) / hauteur) * 100));
  }
  const total = document.documentElement.scrollHeight || 1;
  return Math.min(100, (bas / total) * 100);
}

function surDefilement() {
  if (enTransition) return;
  const p = pourcentageDefile();
  for (const seuil of SEUILS_DEFILEMENT) {
    if (p >= seuil && !seuilsAtteints.has(seuil)) {
      seuilsAtteints.add(seuil);
      envoyer('defilement', { pourcentage: seuil });
    }
  }
  verifierLecture();
}

function verifierLecture() {
  if (lectureEnvoyee || contexte.content_group !== 'article') return;
  if (secondesActives >= LECTURE_SECONDES && seuilsAtteints.has(LECTURE_POURCENT)) {
    lectureEnvoyee = true;
    envoyer('lecture_article', { secondes_actives: secondesActives });
  }
}

let defilementPrevu = false;
function surDefilementRegule() {
  if (defilementPrevu) return;
  defilementPrevu = true;
  window.requestAnimationFrame(() => {
    defilementPrevu = false;
    surDefilement();
  });
}

let dernierePage = '';
let dernierEnvoi = 0;

function surPage() {
  // Au premier chargement, ce module et le routeur d'Astro démarrent dans un
  // ordre qui n'est pas garanti : surPage est appelé ici ET sur
  // astro:page-load, et le doublon est écarté.
  const maintenant = Date.now();
  if (window.location.href === dernierePage && maintenant - dernierEnvoi < 2000) return;
  dernierePage = window.location.href;
  dernierEnvoi = maintenant;

  const chemin = window.location.pathname;
  const racine = document.querySelector<HTMLElement>('[data-article-slug]');
  contexte = {
    content_group: groupeDeContenu(chemin),
    article_slug: racine?.dataset.articleSlug ?? 'hors_article',
    article_categorie: racine?.dataset.articleCategorie ?? 'hors_article',
  };

  if (typeof window.gtag === 'function') {
    window.gtag('set', {
      page_location: window.location.href,
      page_title: document.title,
      page_referrer: document.referrer,
    });
  }
  envoyer('page_view', { page_location: window.location.href, page_title: document.title });

  enTransition = false;
  seuilsAtteints = new Set();
  secondesActives = 0;
  lectureEnvoyee = false;
  window.clearInterval(minuteur);
  // Le temps actif ne compte que lorsque l'onglet est visible.
  minuteur = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      secondesActives += 1;
      verifierLecture();
    }
  }, 1000);
  window.setTimeout(surDefilement, 1500);
}

if (!window.__hrnSuivi) {
  window.__hrnSuivi = true;
  document.addEventListener('click', surClic, { capture: true });
  window.addEventListener('message', surMessage);
  window.addEventListener('scroll', surDefilementRegule, { passive: true });
  document.addEventListener('astro:before-preparation', () => { enTransition = true; });
  document.addEventListener('astro:page-load', surPage);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', surPage, { once: true });
  } else {
    surPage();
  }
}

export {};
