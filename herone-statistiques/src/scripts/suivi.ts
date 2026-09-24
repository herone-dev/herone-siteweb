/* Plan de marquage Hérone, GA4 (G-GT6JCYY2SF).
 *
 * La référence de chaque événement et de chaque paramètre est dans
 * docs/plan-de-marquage.md. Toute modification ici se reporte là-bas, dans la
 * liste EVENEMENTS et les dimensions de netlify/functions/stats.mjs.
 *
 * Principes.
 * 1. Le consentement est géré dans Layout.astro (Consent Mode v2). Ce fichier
 *    n'en tient pas compte : gtag décide lui-même de ce qu'il envoie.
 * 2. Les pages vues sont envoyées ici, à chaque « astro:page-load », parce que
 *    les transitions de page d'Astro ne rechargent pas la page.
 * 3. Tout est capté par des écouteurs posés sur le document (clics, copies,
 *    dépliants, erreurs) ou rattachés à chaque page (vidéos, sections vues).
 *    Rien n'est à ajouter dans les composants : un nouveau bouton, une
 *    nouvelle section ou une nouvelle vidéo sont suivis d'office. Un attribut
 *    data-suivi="nom" renomme la zone d'un élément si besoin.
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
const PALIERS_TEMPS = [30, 60, 120, 300];
const PALIERS_VIDEO = [10, 25, 50, 75, 90];
const LECTURE_SECONDES = 30;
const LECTURE_POURCENT = 75;
const EXTENSIONS_FICHIERS = /\.(pdf|docx?|xlsx?|pptx?|csv|zip|odt|ods|txt|ics|vcf|mp4|mp3)$/i;
const MAX_ERREURS_PAR_PAGE = 5;

let contexte: Params = {};
let seuilsAtteints = new Set<number>();
let secondesActives = 0;
let lectureEnvoyee = false;
let minuteur: number | undefined;
let erreursPage = 0;
let observateurSections: IntersectionObserver | undefined;
// Pendant une transition de page, le défilement mesuré n'a plus de sens :
// l'ancien contenu s'efface et le nouveau n'est pas encore attribué.
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
  if (/^\/(mentions-legales|confidentialite|cookies)/.test(chemin)) return 'legal';
  return 'autre';
}

function texteCourt(el: Element | null, max = 80): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/* Nom lisible d'une section : son id, sinon sa première classe. */
function nomSection(el: Element | null): string {
  if (!el) return 'page';
  const s = el as HTMLElement;
  if (s.dataset?.suivi) return s.dataset.suivi;
  if (s.id) return s.id;
  const cls = (s.getAttribute('class') || '').split(/\s+/).find((c) => c && !c.startsWith('astro-'));
  return cls || 'page';
}

/* La zone dit où, dans la page, l'action a eu lieu. Un data-suivi posé sur
 * un ancêtre l'emporte sur la détection automatique. */
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
  const section = el.closest('section[id], [id^="hrn-"]');
  if (section?.id) return section.id;
  return nomSection(el.closest('section'));
}

function versRdv(url: URL): boolean {
  return (url.hostname === HOTE && url.hash === '#reserver') || url.hostname.endsWith('calendly.com');
}

/* ---------- Clics ---------- */

// Clics répétés : trois clics ou plus en moins d'une seconde sur le même
// élément, signe d'un bouton qui ne réagit pas ou d'un visiteur agacé.
let dernierElement: Element | null = null;
let rafale: number[] = [];
let rafaleSignalee = false;

function surveillerRafale(el: Element) {
  const t = Date.now();
  if (el !== dernierElement) {
    dernierElement = el;
    rafale = [];
    rafaleSignalee = false;
  }
  rafale = rafale.filter((x) => t - x < 1000).concat(t);
  if (rafale.length >= 3 && !rafaleSignalee) {
    rafaleSignalee = true;
    envoyer('clic_repete', { cta_zone: zoneDe(el), cta_texte: texteCourt(el) || el.tagName.toLowerCase() });
  }
}

function surClic(ev: MouseEvent) {
  const cible = ev.target as Element | null;
  if (!cible) return;
  surveillerRafale(cible);

  // Façade de la vidéo YouTube de témoignage : le lecteur n'existe qu'après
  // ce clic, c'est donc ici que la lecture commence.
  const carteVideo = cible.closest<HTMLElement>('[data-youtube-id]');
  if (carteVideo && !carteVideo.classList.contains('is-playing')) {
    envoyer('video_start', {
      video_provider: 'youtube',
      video_title: carteVideo.dataset.suivi || carteVideo.getAttribute('aria-label') || `temoignage_${carteVideo.dataset.youtubeId}`,
      video_url: `https://youtu.be/${carteVideo.dataset.youtubeId}`,
      cta_zone: zoneDe(carteVideo),
    });
  }

  const lien = cible.closest<HTMLAnchorElement>('a[href]');
  const bouton = cible.closest<HTMLElement>('.hrn-btn, button, [role="button"], summary');
  const el = lien ?? bouton;
  if (!el) return;
  if (el.tagName === 'SUMMARY') return; // compté à l'ouverture, voir surDepliant

  const zone = zoneDe(el);
  const texte = texteCourt(el) || el.getAttribute('aria-label') || '';
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

  // Téléchargement : attribut download ou extension de fichier connue.
  // Nom d'événement recommandé par Google, il remonte dans les rapports natifs.
  if (url && (lien?.hasAttribute('download') || EXTENSIONS_FICHIERS.test(url.pathname))) {
    const fichier = url.pathname.split('/').pop() || '';
    envoyer('file_download', {
      file_name: fichier,
      file_extension: (fichier.split('.').pop() || '').toLowerCase(),
      link_url: url.href,
      cta_zone: zone,
    });
    return;
  }

  const estBouton = el.matches('.hrn-btn, .hrn-article-cta__lien, button, [role="button"]') || !!el.closest('.hrn-btn');
  if (url && versRdv(url)) {
    envoyer('clic_rdv', { cta_zone: zone, cta_texte: texte, lien_cible: url.hostname === HOTE ? url.pathname + url.hash : url.href });
    return;
  }
  if (!lien) {
    // Bouton sans lien : menu, carrousel, filtres du blog, lecture vidéo, cookies.
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

/* ---------- Dépliants (FAQ, sommaire mobile) ---------- */

function surDepliant(ev: Event) {
  const d = ev.target as HTMLDetailsElement;
  if (!(d instanceof HTMLDetailsElement) || !d.open) return;
  // Le premier élément ouvert d'office au chargement n'est pas une action.
  if (!d.dataset.suiviPret) return;
  const question = texteCourt(d.querySelector('summary'), 100);
  if (d.closest('.hrn-faq, [class*="faq"]') || d.classList.contains('hrn-faq__item')) {
    envoyer('ouverture_faq', { question, cta_zone: zoneDe(d) });
  } else {
    envoyer('ouverture_depliant', { cta_texte: question, cta_zone: zoneDe(d) });
  }
}

function armerDepliants() {
  // Marque les dépliants après le premier affichage, pour ignorer l'état
  // d'ouverture initial.
  window.setTimeout(() => {
    document.querySelectorAll<HTMLDetailsElement>('details').forEach((d) => { d.dataset.suiviPret = '1'; });
  }, 300);
}

/* ---------- Vidéos hébergées sur le site ---------- */

function suivreVideos() {
  document.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
    if (v.dataset.suiviVideo) return;
    // Les vidéos d'ambiance (muettes, en boucle, lancées seules) ne sont pas
    // regardées volontairement : elles ne sont pas suivies.
    if (v.muted && v.loop && v.autoplay) return;
    v.dataset.suiviVideo = '1';
    const titre = v.getAttribute('aria-label') || v.dataset.suivi || v.id || 'video';
    const paliers = new Set<number>();
    let demarree = false;
    const base = (): Params => ({
      video_provider: 'herone',
      video_title: titre,
      video_duration: Math.round(v.duration || 0),
      video_current_time: Math.round(v.currentTime || 0),
      cta_zone: zoneDe(v),
    });
    v.addEventListener('play', () => {
      if (!demarree) {
        demarree = true;
        envoyer('video_start', base());
      } else {
        envoyer('video_reprise', base());
      }
    });
    v.addEventListener('pause', () => {
      if (v.ended) return;
      const p = v.duration ? Math.round((100 * v.currentTime) / v.duration) : 0;
      envoyer('video_pause', { ...base(), video_percent: p });
    });
    v.addEventListener('timeupdate', () => {
      if (!v.duration) return;
      const p = (100 * v.currentTime) / v.duration;
      for (const palier of PALIERS_VIDEO) {
        if (p >= palier && !paliers.has(palier)) {
          paliers.add(palier);
          envoyer('video_progress', { ...base(), video_percent: palier });
        }
      }
    });
    v.addEventListener('ended', () => envoyer('video_complete', { ...base(), video_percent: 100 }));
  });
}

/* ---------- Sections vues ---------- */

function suivreSections() {
  observateurSections?.disconnect();
  if (!('IntersectionObserver' in window)) return;
  const vues = new Set<string>();
  observateurSections = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      // Une section est « vue » quand la moitié d'elle est à l'écran, ou
      // qu'elle occupe la moitié de l'écran pour les sections très hautes.
      const seuil = Math.min(e.boundingClientRect.height, window.innerHeight) * 0.5;
      if (e.intersectionRect.height < seuil) continue;
      const nom = nomSection(e.target);
      if (vues.has(nom)) continue;
      vues.add(nom);
      envoyer('section_vue', { section: nom });
      observateurSections?.unobserve(e.target);
    }
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  document.querySelectorAll('main section, main [data-suivi-section]').forEach((s) => observateurSections?.observe(s));
}

/* ---------- Calendly ---------- */

function surMessage(ev: MessageEvent) {
  if (typeof ev.origin !== 'string' || !ev.origin.endsWith('calendly.com')) return;
  const nom = ev.data?.event;
  if (nom === 'calendly.event_type_viewed') envoyer('rdv_agenda_affiche');
  if (nom === 'calendly.date_and_time_selected') envoyer('rdv_creneau_choisi');
  if (nom === 'calendly.event_scheduled') {
    envoyer('rdv_reserve', { methode: 'calendly' });
    // Événement recommandé par Google pour les prospects : il remonte tel quel
    // dans les rapports d'acquisition et peut servir pour Google Ads.
    envoyer('generate_lead', { methode: 'calendly' });
  }
}

/* ---------- Défilement, temps actif, lecture ---------- */

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

/* ---------- Copie, impression, erreurs ---------- */

function surCopie() {
  const sel = window.getSelection();
  const texte = (sel?.toString() || '').replace(/\s+/g, ' ').trim();
  if (!texte) return;
  const noeud = sel?.anchorNode;
  const el = noeud instanceof Element ? noeud : noeud?.parentElement;
  envoyer('copie_texte', { cta_texte: texte.slice(0, 80), longueur: texte.length, cta_zone: el ? zoneDe(el) : 'page' });
}

function surErreur(ev: ErrorEvent) {
  // « Script error. » vient d'un script tiers : aucun détail exploitable.
  if (!ev.message || ev.message === 'Script error.' || erreursPage >= MAX_ERREURS_PAR_PAGE) return;
  erreursPage += 1;
  const fichier = (ev.filename || '').split('/').pop() || 'inline';
  envoyer('erreur_js', { message_erreur: `${ev.message}`.slice(0, 100), cta_texte: `${fichier}:${ev.lineno || 0}` });
}

/* ---------- Performance (Core Web Vitals) ---------- */

// Mesurés sur la première page de la visite, la seule qui se charge vraiment,
// et envoyés quand le visiteur quitte ou masque l'onglet.
const vitals: { lcp?: number; cls: number; inp: number } = { cls: 0, inp: 0 };
let vitalsEnvoyes = false;

function noter(nom: string, valeur: number, bon: number, moyen: number) {
  const note = valeur <= bon ? 'bon' : valeur <= moyen ? 'a_ameliorer' : 'mauvais';
  envoyer('web_vitals', { metric_name: nom, metric_value: Math.round(nom === 'CLS' ? valeur * 1000 : valeur), metric_rating: note, transport_type: 'beacon' });
}

function envoyerVitals() {
  if (vitalsEnvoyes) return;
  vitalsEnvoyes = true;
  if (vitals.lcp) noter('LCP', vitals.lcp, 2500, 4000);
  noter('CLS', vitals.cls, 0.1, 0.25);
  if (vitals.inp) noter('INP', vitals.inp, 200, 500);
}

function mesurerVitals() {
  if (!('PerformanceObserver' in window)) return;
  const observer = (type: string, rappel: (e: PerformanceEntry) => void) => {
    try {
      new PerformanceObserver((liste) => liste.getEntries().forEach(rappel)).observe({ type, buffered: true } as PerformanceObserverInit);
    } catch { /* type non pris en charge par ce navigateur */ }
  };
  observer('largest-contentful-paint', (e) => { vitals.lcp = e.startTime; });
  observer('layout-shift', (e) => {
    const s = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
    if (!s.hadRecentInput) vitals.cls += s.value;
  });
  observer('event', (e) => { vitals.inp = Math.max(vitals.inp, e.duration); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') envoyerVitals(); });
  window.addEventListener('pagehide', envoyerVitals);
}

/* ---------- Page ---------- */

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
  erreursPage = 0;
  window.clearInterval(minuteur);
  // Le temps actif ne compte que lorsque l'onglet est visible.
  minuteur = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    secondesActives += 1;
    if (PALIERS_TEMPS.includes(secondesActives)) envoyer('temps_actif', { secondes_actives: secondesActives });
    verifierLecture();
  }, 1000);
  window.setTimeout(surDefilement, 1500);
  armerDepliants();
  suivreVideos();
  suivreSections();
}

if (!window.__hrnSuivi) {
  window.__hrnSuivi = true;
  document.addEventListener('click', surClic, { capture: true });
  document.addEventListener('toggle', surDepliant, { capture: true });
  document.addEventListener('copy', surCopie);
  window.addEventListener('message', surMessage);
  window.addEventListener('error', surErreur);
  window.addEventListener('beforeprint', () => envoyer('impression_page'));
  window.addEventListener('scroll', surDefilementRegule, { passive: true });
  document.addEventListener('astro:before-preparation', () => {
    enTransition = true;
    observateurSections?.disconnect();
  });
  document.addEventListener('astro:page-load', surPage);
  mesurerVitals();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', surPage, { once: true });
  } else {
    surPage();
  }
}

export {};
