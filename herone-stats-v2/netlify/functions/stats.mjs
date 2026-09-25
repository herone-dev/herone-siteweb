/* Statistiques du site pour la page /admin/stats.
 *
 * Lit Google Search Console (impressions, clics, CTR, position) et Google
 * Analytics 4 (visiteurs, pages vues, temps d'engagement, clics du plan de
 * marquage, rendez-vous) avec un compte de service Google, et renvoie le tout
 * en un seul JSON, global et par page.
 *
 * Accès : seulement pour un compte GitHub qui a le droit d'écriture sur le
 * dépôt du site, c'est à dire les mêmes personnes que l'interface /admin. La
 * page envoie le jeton GitHub de la session /admin, la fonction le vérifie
 * auprès de GitHub avant toute lecture chez Google.
 *
 * Variables d'environnement Netlify (Site configuration, Environment variables) :
 *   GOOGLE_SA_EMAIL   adresse du compte de service (…@….iam.gserviceaccount.com)
 *   GOOGLE_SA_KEY     sa clé privée, champ private_key du fichier JSON, telle quelle
 *   GA4_PROPERTY_ID   identifiant numérique de la propriété GA4 (pas le G-…)
 *   GSC_SITE          facultatif, sc-domain:herone.fr par défaut
 *   GITHUB_REPO       facultatif, herone-dev/herone-siteweb par défaut
 *
 * Aucune dépendance : la signature du jeton Google utilise le module crypto
 * de Node. Le détail des événements lus est dans docs/plan-de-marquage.md.
 */
import { createSign, createHash } from 'node:crypto';

export const config = { path: '/api/stats' };

const SITE = 'https://herone.fr';
const DEPOT = process.env.GITHUB_REPO || 'herone-dev/herone-siteweb';
const EVENEMENTS = [
  'clic_rdv', 'clic_telephone', 'clic_email', 'clic_bouton', 'clic_lien_interne',
  'clic_sortant', 'clic_ancre', 'clic_repete', 'file_download', 'defilement', 'temps_actif',
  'lecture_article', 'section_vue', 'ouverture_faq', 'ouverture_depliant', 'copie_texte',
  'impression_page', 'video_start', 'video_progress', 'video_complete', 'video_pause',
  'rdv_agenda_affiche', 'rdv_creneau_choisi', 'rdv_reserve', 'generate_lead', 'erreur_js',
];

/* Réglages GA4 posés par le bouton « Configurer Google Analytics » de la page
 * Statistiques (action=installer). Une dimension par paramètre du plan de
 * marquage, pour pouvoir lire le détail : quel bouton, quelle section, quelle
 * question de FAQ, quelle vidéo. */
const DIMENSIONS = [
  ['cta_zone', 'Zone du clic'], ['cta_texte', 'Texte du bouton ou du lien'], ['lien_cible', 'Cible du lien'],
  ['lien_domaine', 'Domaine du lien sortant'], ['article_slug', 'Article'], ['article_categorie', "Catégorie d'article"],
  ['pourcentage', 'Palier de défilement'], ['secondes_actives', 'Palier de temps actif'], ['section', 'Section vue'],
  ['question', 'Question de FAQ'], ['methode', 'Méthode de prise de RDV'], ['choix', 'Choix cookies'],
  ['video_title', 'Titre de la vidéo'], ['video_provider', 'Hébergeur de la vidéo'], ['video_percent', 'Palier de la vidéo'],
  ['file_name', 'Fichier téléchargé'], ['metric_name', 'Indicateur de performance'], ['metric_rating', 'Note de performance'],
  ['message_erreur', 'Erreur JavaScript'],
];
const METRIQUES = [['metric_value', 'Valeur de performance', 'STANDARD'], ['longueur', 'Longueur du texte copié', 'STANDARD']];
const EVENEMENTS_CLES = ['rdv_reserve', 'clic_telephone', 'clic_email'];
// Actions qui mènent à un contact : lues par source et par bouton.
const EVENEMENTS_CONVERSION = ['clic_rdv', 'rdv_agenda_affiche', 'rdv_creneau_choisi', 'rdv_reserve', 'clic_telephone', 'clic_email'];
const EVENEMENTS_BOUTONS = ['clic_rdv', 'clic_telephone', 'clic_email', 'clic_bouton', 'file_download'];
const MESURE = 'G-GT6JCYY2SF';
const DUREE_CACHE = 10 * 60 * 1000;

const cache = new Map();
const jetonsVerifies = new Map();
let jetonGoogle = null;

function reponse(statut, corps) {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
}

/* ---------- Accès : droit d'écriture GitHub ---------- */

async function verifierGitHub(jeton) {
  const empreinte = createHash('sha256').update(jeton).digest('hex');
  const connu = jetonsVerifies.get(empreinte);
  if (connu && Date.now() - connu < DUREE_CACHE) return true;
  const r = await fetch(`https://api.github.com/repos/${DEPOT}`, {
    headers: {
      authorization: `Bearer ${jeton}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'herone-stats',
    },
  });
  if (!r.ok) return false;
  const depot = await r.json();
  const ok = !!(depot.permissions && (depot.permissions.push || depot.permissions.admin));
  if (ok) jetonsVerifies.set(empreinte, Date.now());
  return ok;
}

/* ---------- Jeton Google (compte de service, JWT RS256) ---------- */

function b64url(v) {
  return Buffer.from(typeof v === 'string' ? v : JSON.stringify(v))
    .toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const PORTEE_LECTURE = 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly';
const PORTEE_REGLAGES = 'https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/analytics.edit';

/* La clé privée se colle dans Netlify de bien des façons : avec ou sans les
 * guillemets, avec des « \n » écrits en toutes lettres, avec des espaces à la
 * place des retours à la ligne, sans les lignes BEGIN et END, ou même le
 * fichier JSON entier. Tout est ramené ici au format PEM que Node attend. */
function clePrivee(brut) {
  let v = String(brut).trim();
  if (v.startsWith('{')) {
    try { v = JSON.parse(v).private_key || v; } catch { /* pas du JSON complet */ }
  }
  v = v.replace(/^['"]|['"],?$/g, '').replace(/\\n/g, '\n');
  const corps = v
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----/, '')
    .replace(/-----END [A-Z ]*PRIVATE KEY-----/, '')
    .replace(/[^A-Za-z0-9+/=]/g, '');
  if (corps.length < 1000) {
    throw new Error(`La clé GOOGLE_SA_KEY semble incomplète (${corps.length} caractères utiles au lieu d'environ 1 600). Recollez tout le texte de "private_key", de -----BEGIN PRIVATE KEY----- à -----END PRIVATE KEY-----.`);
  }
  const lignes = corps.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PRIVATE KEY-----\n${lignes}\n-----END PRIVATE KEY-----\n`;
}

async function tokenGoogle(portee = PORTEE_LECTURE) {
  jetonGoogle = jetonGoogle || {};
  const connu = jetonGoogle[portee];
  if (connu && connu.expire > Date.now() + 60_000) return connu.valeur;
  const email = process.env.GOOGLE_SA_EMAIL;
  if (!email || !process.env.GOOGLE_SA_KEY) throw new Error('Compte de service absent : GOOGLE_SA_EMAIL et GOOGLE_SA_KEY à renseigner dans Netlify.');
  const cle = clePrivee(process.env.GOOGLE_SA_KEY);
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = b64url({ alg: 'RS256', typ: 'JWT' });
  const charge = b64url({
    iss: email,
    scope: portee,
    aud: 'https://oauth2.googleapis.com/token',
    iat: maintenant,
    exp: maintenant + 3600,
  });
  let signature;
  try {
    signature = createSign('RSA-SHA256').update(`${entete}.${charge}`).sign(cle, 'base64');
  } catch {
    throw new Error('La clé GOOGLE_SA_KEY est illisible. Recollez dans Netlify le texte de "private_key" du fichier JSON, en entier, puis relancez un déploiement.');
  }
  signature = signature
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${entete}.${charge}.${signature}`,
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Google a refusé le compte de service : ${d.error_description || d.error || r.status}`);
  jetonGoogle[portee] = { valeur: d.access_token, expire: Date.now() + d.expires_in * 1000 };
  return d.access_token;
}

async function appelGoogle(url, corps, { methode = 'POST', portee } = {}) {
  const jeton = await tokenGoogle(portee);
  const r = await fetch(url, {
    method: methode,
    headers: { authorization: `Bearer ${jeton}`, 'content-type': 'application/json' },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(d.error?.message || `Erreur ${r.status}`);
    e.statut = r.status;
    throw e;
  }
  return d;
}

/* ---------- Dates (Europe/Paris) ---------- */

function jourParis(decalage = 0) {
  const d = new Date(Date.now() + decalage * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d);
}

function periodes(jours) {
  // La Search Console a deux à trois jours de retard : la période s'arrête hier,
  // les derniers jours peuvent donc être incomplets côté impressions.
  const fin = jourParis(-1);
  const debut = jourParis(-jours);
  const finPrec = jourParis(-jours - 1);
  const debutPrec = jourParis(-2 * jours);
  return { debut, fin, debutPrec, finPrec };
}

function cheminDe(valeur) {
  let p = valeur;
  try { p = new URL(valeur, SITE).pathname; } catch { /* déjà un chemin */ }
  p = decodeURI(p);
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

/* ---------- Search Console ---------- */

async function gsc(site, corps) {
  return appelGoogle(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    { dataState: 'all', ...corps },
  );
}

async function siteGsc(p) {
  const candidats = process.env.GSC_SITE ? [process.env.GSC_SITE] : ['sc-domain:herone.fr', 'https://herone.fr/'];
  let derniere;
  for (const site of candidats) {
    try {
      await gsc(site, { startDate: p.fin, endDate: p.fin, rowLimit: 1 });
      return site;
    } catch (e) {
      derniere = e;
    }
  }
  throw new Error(`Search Console inaccessible (${derniere?.message}). Le compte de service doit être ajouté comme utilisateur de la propriété herone.fr.`);
}

function totauxGsc(rows) {
  const r = rows?.[0];
  return r ? { impressions: r.impressions, clics: r.clicks, ctr: r.ctr, position: r.position }
    : { impressions: 0, clics: 0, ctr: 0, position: null };
}

async function lireGsc(p, chemin) {
  const site = await siteGsc(p);
  const [total, prec, parPage, parJour] = await Promise.all([
    gsc(site, { startDate: p.debut, endDate: p.fin }),
    gsc(site, { startDate: p.debutPrec, endDate: p.finPrec }),
    gsc(site, { startDate: p.debut, endDate: p.fin, dimensions: ['page'], rowLimit: 1000 }),
    gsc(site, { startDate: p.debut, endDate: p.fin, dimensions: ['date'], rowLimit: 500 }),
  ]);
  const pages = {};
  for (const r of parPage.rows || []) {
    const c = cheminDe(r.keys[0]);
    const a = pages[c] || { impressions: 0, clics: 0, sommePosition: 0 };
    a.impressions += r.impressions;
    a.clics += r.clicks;
    a.sommePosition += r.position * r.impressions;
    pages[c] = a;
  }
  for (const c of Object.keys(pages)) {
    const a = pages[c];
    pages[c] = {
      impressions: a.impressions,
      clics: a.clics,
      ctr: a.impressions ? a.clics / a.impressions : 0,
      position: a.impressions ? a.sommePosition / a.impressions : null,
    };
  }
  const resultat = {
    site,
    total: totauxGsc(total.rows),
    precedent: totauxGsc(prec.rows),
    pages,
    parJour: (parJour.rows || []).map((r) => ({ date: r.keys[0], impressions: r.impressions, clics: r.clicks })),
  };
  if (!chemin) {
    // Ce que les gens tapent dans Google avant d'arriver sur le site.
    const req = await gsc(site, { startDate: p.debut, endDate: p.fin, dimensions: ['query'], rowLimit: 50 });
    resultat.requetes = (req.rows || []).map((r) => ({
      requete: r.keys[0], impressions: r.impressions, clics: r.clicks, ctr: r.ctr, position: r.position,
    }));
  }
  if (chemin) {
    const url = `${SITE}${chemin === '/' ? '/' : chemin}`;
    const req = await gsc(site, {
      startDate: p.debut,
      endDate: p.fin,
      dimensions: ['query'],
      rowLimit: 25,
      dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'includingRegex', expression: `^${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/$/, '')}/?$` }] }],
    });
    resultat.requetes = (req.rows || []).map((r) => ({
      requete: r.keys[0], impressions: r.impressions, clics: r.clicks, ctr: r.ctr, position: r.position,
    }));
  }
  return resultat;
}

/* ---------- Google Analytics 4 ---------- */

function valeurs(rows, nb) {
  return (rows || []).map((r) => ({
    d: (r.dimensionValues || []).map((v) => v.value),
    m: (r.metricValues || []).slice(0, nb).map((v) => Number(v.value)),
  }));
}

async function lireGa(p, chemin) {
  const id = process.env.GA4_PROPERTY_ID;
  if (!id) throw new Error('GA4_PROPERTY_ID à renseigner dans Netlify (identifiant numérique de la propriété).');
  const base = `https://analyticsdata.googleapis.com/v1beta/properties/${id}`;
  const periode = { startDate: p.debut, endDate: p.fin };
  const filtreEvenements = {
    filter: { fieldName: 'eventName', inListFilter: { values: EVENEMENTS } },
  };
  const lot = await appelGoogle(`${base}:batchRunReports`, {
    requests: [
      {
        dateRanges: [periode, { startDate: p.debutPrec, endDate: p.finPrec }],
        metrics: [
          { name: 'sessions' }, { name: 'activeUsers' }, { name: 'screenPageViews' },
          { name: 'userEngagementDuration' }, { name: 'engagementRate' }, { name: 'keyEvents' },
        ],
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' }, { name: 'activeUsers' },
          { name: 'userEngagementDuration' }, { name: 'engagementRate' }, { name: 'keyEvents' },
          { name: 'bounceRate' },
        ],
        limit: 1000,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'pagePath' }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: filtreEvenements,
        limit: 5000,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        limit: 500,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'keyEvents' }],
        limit: 20,
      },
    ],
  });
  const [rTotal, rPages, rEvts, rJours, rCanaux] = lot.reports;

  const totalDe = (plage) => {
    // Avec deux périodes, GA4 ajoute la dimension dateRange (date_range_0 / 1).
    const ligne = (rTotal.rows || []).find((r) => r.dimensionValues?.[0]?.value === plage);
    const m = (ligne?.metricValues || []).map((v) => Number(v.value));
    const utilisateurs = m[1] || 0;
    return {
      sessions: m[0] || 0,
      visiteurs: utilisateurs,
      vues: m[2] || 0,
      tempsMoyen: utilisateurs ? (m[3] || 0) / utilisateurs : 0,
      tauxEngagement: m[4] || 0,
      conversions: m[5] || 0,
    };
  };

  const pages = {};
  const vide = () => ({ vues: 0, visiteurs: 0, engagement: 0, tauxEngagementPondere: 0, rebondPondere: 0, conversions: 0, entrees: 0, evenements: {} });
  for (const { d, m } of valeurs(rPages.rows, 6)) {
    const c = cheminDe(d[0]);
    const a = pages[c] || vide();
    a.vues += m[0];
    a.visiteurs += m[1];
    a.engagement += m[2];
    a.tauxEngagementPondere += m[3] * m[1];
    a.conversions += m[4];
    a.rebondPondere += (m[5] || 0) * m[1];
    pages[c] = a;
  }
  for (const { d, m } of valeurs(rEvts.rows, 1)) {
    const c = cheminDe(d[0]);
    pages[c] = pages[c] || vide();
    pages[c].evenements[d[1]] = (pages[c].evenements[d[1]] || 0) + m[0];
  }

  // Deuxième lot : comment les visiteurs arrivent (sources, pages d'entrée,
  // appareils, villes, nouveaux ou connus) et quelles sources convertissent.
  const lot2 = await appelGoogle(`${base}:batchRunReports`, {
    requests: [
      {
        dateRanges: [periode],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }, { name: 'userEngagementDuration' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 50,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'landingPage' }],
        metrics: [{ name: 'sessions' }, { name: 'engagementRate' }, { name: 'bounceRate' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 100,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }, { name: 'keyEvents' }],
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'city' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 25,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'newVsReturning' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'engagementRate' }, { name: 'keyEvents' }],
      },
    ],
  });
  const [rSources, rEntrees, rAppareils, rVilles, rFidelite] = lot2.reports;

  const lot3 = await appelGoogle(`${base}:batchRunReports`, {
    requests: [
      {
        dateRanges: [periode],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }, { name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: EVENEMENTS_CONVERSION } } },
        limit: 500,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'sessionCampaignName' }, { name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'keyEvents' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 50,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'hour' }],
        metrics: [{ name: 'sessions' }],
        limit: 24,
      },
      {
        dateRanges: [periode],
        dimensions: [{ name: 'dayOfWeek' }],
        metrics: [{ name: 'sessions' }],
        limit: 7,
      },
    ],
  });
  const [rConvSources, rCampagnes, rHeures, rJoursSemaine] = lot3.reports;

  for (const { d, m } of valeurs(rEntrees.rows, 1)) {
    const c = cheminDe(d[0]);
    if (!pages[c]) continue;
    pages[c].entrees += m[0];
  }
  for (const c of Object.keys(pages)) {
    const a = pages[c];
    pages[c] = {
      vues: a.vues,
      visiteurs: a.visiteurs,
      entrees: a.entrees,
      tempsMoyen: a.visiteurs ? a.engagement / a.visiteurs : 0,
      tauxEngagement: a.visiteurs ? a.tauxEngagementPondere / a.visiteurs : 0,
      tauxRebond: a.visiteurs ? a.rebondPondere / a.visiteurs : null,
      conversions: a.conversions,
      evenements: a.evenements,
    };
  }

  const convParSource = {};
  for (const { d, m } of valeurs(rConvSources.rows, 1)) {
    const k = `${d[0]}|${d[1]}`;
    convParSource[k] = convParSource[k] || {};
    convParSource[k][d[2]] = (convParSource[k][d[2]] || 0) + m[0];
  }
  const entreesParPage = {};
  for (const { d, m } of valeurs(rEntrees.rows, 4)) {
    const c = cheminDe(d[0]);
    if (c === '(not set)' || d[0] === '(not set)') continue;
    const a = entreesParPage[c] || { sessions: 0, engPond: 0, rebPond: 0, conversions: 0 };
    a.sessions += m[0]; a.engPond += m[1] * m[0]; a.rebPond += m[2] * m[0]; a.conversions += m[3];
    entreesParPage[c] = a;
  }

  const evenementsTotal = {};
  for (const page of Object.values(pages)) {
    for (const [nom, n] of Object.entries(page.evenements)) evenementsTotal[nom] = (evenementsTotal[nom] || 0) + n;
  }

  const resultat = {
    total: { ...totalDe('date_range_0'), evenements: evenementsTotal },
    precedent: totalDe('date_range_1'),
    pages,
    parJour: valeurs(rJours.rows, 2)
      .map(({ d, m }) => ({ date: `${d[0].slice(0, 4)}-${d[0].slice(4, 6)}-${d[0].slice(6, 8)}`, visiteurs: m[0], vues: m[1] }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    canaux: valeurs(rCanaux.rows, 2).map(({ d, m }) => ({ canal: d[0], sessions: m[0], conversions: m[1] })),
    sources: valeurs(rSources.rows, 5).map(({ d, m }) => ({
      source: d[0], support: d[1], sessions: m[0], visiteurs: m[1], tauxEngagement: m[2],
      tempsMoyen: m[1] ? m[3] / m[1] : 0, conversions: m[4], actions: convParSource[`${d[0]}|${d[1]}`] || {},
    })),
    pagesEntree: Object.entries(entreesParPage).map(([c, a]) => ({
      page: c, sessions: a.sessions, tauxEngagement: a.sessions ? a.engPond / a.sessions : 0,
      tauxRebond: a.sessions ? a.rebPond / a.sessions : 0, conversions: a.conversions,
    })).sort((x, y) => y.sessions - x.sessions),
    appareils: valeurs(rAppareils.rows, 4).map(({ d, m }) => ({ appareil: d[0], sessions: m[0], visiteurs: m[1], tauxEngagement: m[2], conversions: m[3] })),
    villes: valeurs(rVilles.rows, 3).map(({ d, m }) => ({ ville: d[0], sessions: m[0], visiteurs: m[1], conversions: m[2] })),
    fidelite: valeurs(rFidelite.rows, 4).map(({ d, m }) => ({ type: d[0], visiteurs: m[0], sessions: m[1], tauxEngagement: m[2], conversions: m[3] })),
    campagnes: valeurs(rCampagnes.rows, 2)
      .filter(({ d }) => !/^\(.*\)$/.test(d[0]))
      .map(({ d, m }) => ({ campagne: d[0], source: d[1], support: d[2], sessions: m[0], conversions: m[1] })),
    heures: valeurs(rHeures.rows, 1).map(({ d, m }) => ({ heure: Number(d[0]), sessions: m[0] })).sort((a, b) => a.heure - b.heure),
    joursSemaine: valeurs(rJoursSemaine.rows, 1).map(({ d, m }) => ({ jour: Number(d[0]), sessions: m[0] })).sort((a, b) => a.jour - b.jour),
  };

  if (chemin) {
    // Netlify sert les pages avec une barre finale (/blog/x/) alors que le site
    // la retire partout ailleurs : on accepte les deux formes.
    const filtrePage = chemin === '/'
      ? { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: '/' } } }
      : { orGroup: { expressions: [chemin, `${chemin}/`].map((value) => ({
          filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value } },
        })) } };
    // Les zones de clic demandent la dimension personnalisée cta_zone (voir le
    // tutoriel). Tant qu'elle n'est pas déclarée dans GA4, le détail se replie
    // sur les seuls noms d'événements.
    try {
      const z = await appelGoogle(`${base}:runReport`, {
        dateRanges: [periode],
        dimensions: [{ name: 'eventName' }, { name: 'customEvent:cta_zone' }, { name: 'customEvent:cta_texte' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { andGroup: { expressions: [filtrePage, filtreEvenements] } },
        limit: 200,
      });
      resultat.clics = valeurs(z.rows, 1).map(({ d, m }) => ({ evenement: d[0], zone: d[1], texte: d[2], nombre: m[0] }));
    } catch (e) {
      resultat.clicsErreur = 'Déclarez les dimensions personnalisées cta_zone et cta_texte dans GA4 pour voir le détail par bouton.';
    }
    const lotPage = await appelGoogle(`${base}:batchRunReports`, {
      requests: [
        {
          dateRanges: [periode],
          dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: filtrePage,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 25,
        },
        {
          dateRanges: [periode],
          dimensions: [{ name: 'pageReferrer' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: filtrePage,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 25,
        },
        {
          dateRanges: [periode],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: filtrePage,
        },
      ],
    });
    const [rSrc, rRef, rApp] = lotPage.reports;
    resultat.sources = valeurs(rSrc.rows, 1).map(({ d, m }) => ({ source: d[0], support: d[1], vues: m[0] }));
    resultat.precedentes = valeurs(rRef.rows, 1).map(({ d, m }) => ({ referent: d[0], vues: m[0] }));
    resultat.appareils = valeurs(rApp.rows, 1).map(({ d, m }) => ({ appareil: d[0], vues: m[0] }));
    // Pages suivantes : les liens internes cliqués, avec leur cible.
    try {
      const suiv = await appelGoogle(`${base}:runReport`, {
        dateRanges: [periode],
        dimensions: [{ name: 'customEvent:lien_cible' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { andGroup: { expressions: [filtrePage, { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'clic_lien_interne' } } }] } },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 25,
      });
      resultat.suivantes = valeurs(suiv.rows, 1).map(({ d, m }) => ({ page: d[0], nombre: m[0] }));
    } catch {
      resultat.suivantes = null;
    }
  } else {
    resultat.boutons = await lireBoutons(base, periode);
  }
  return resultat;
}

/* Chaque bouton ou lien d'action du site : son texte, sa zone, sa page, et
 * combien de fois il a été cliqué. Demande les dimensions personnalisées
 * cta_texte et cta_zone (bouton « Configurer Google Analytics »). */
async function lireBoutons(base, periode) {
  try {
    const r = await appelGoogle(`${base}:runReport`, {
      dateRanges: [periode],
      dimensions: [{ name: 'eventName' }, { name: 'customEvent:cta_texte' }, { name: 'customEvent:cta_zone' }, { name: 'pagePath' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: EVENEMENTS_BOUTONS } } },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 300,
    });
    return valeurs(r.rows, 1).map(({ d, m }) => ({ evenement: d[0], texte: d[1], zone: d[2], page: cheminDe(d[3]), nombre: m[0] }));
  } catch {
    return { erreur: 'Le détail par bouton demande les dimensions personnalisées : cliquez une fois sur « Configurer Google Analytics ». Il se remplit ensuite avec les nouveaux clics.' };
  }
}

/* ---------- Installation des réglages Google (une fois) ---------- */

async function installer() {
  const id = process.env.GA4_PROPERTY_ID;
  if (!id) throw new Error('GA4_PROPERTY_ID à renseigner dans Netlify.');
  const admin = `https://analyticsadmin.googleapis.com/v1beta/properties/${id}`;
  const opt = { portee: PORTEE_REGLAGES };
  const etapes = [];
  const etape = async (libelle, fn) => {
    try {
      const detail = await fn();
      etapes.push({ libelle, ok: true, detail });
    } catch (e) {
      const droits = e.statut === 403 ? ' Le compte de service doit avoir le rôle Éditeur dans GA4 (Administration, Gestion des accès à la propriété).' : '';
      etapes.push({ libelle, ok: false, detail: `${e.message}${droits}` });
    }
  };

  await etape('Dimensions personnalisées', async () => {
    const existantes = await appelGoogle(`${admin}/customDimensions?pageSize=200`, undefined, { ...opt, methode: 'GET' });
    const deja = new Set((existantes.customDimensions || []).map((d) => d.parameterName));
    const creees = [];
    for (const [parametre, nom] of DIMENSIONS) {
      if (deja.has(parametre)) continue;
      await appelGoogle(`${admin}/customDimensions`, { parameterName: parametre, displayName: nom, scope: 'EVENT' }, opt);
      creees.push(parametre);
    }
    return creees.length ? `${creees.length} créée(s) : ${creees.join(', ')}` : 'Déjà en place';
  });

  await etape('Métriques personnalisées', async () => {
    const existantes = await appelGoogle(`${admin}/customMetrics?pageSize=200`, undefined, { ...opt, methode: 'GET' });
    const deja = new Set((existantes.customMetrics || []).map((d) => d.parameterName));
    const creees = [];
    for (const [parametre, nom, unite] of METRIQUES) {
      if (deja.has(parametre)) continue;
      await appelGoogle(`${admin}/customMetrics`, { parameterName: parametre, displayName: nom, measurementUnit: unite, scope: 'EVENT' }, opt);
      creees.push(parametre);
    }
    return creees.length ? `${creees.length} créée(s) : ${creees.join(', ')}` : 'Déjà en place';
  });

  await etape('Événements clés (conversions)', async () => {
    const existants = await appelGoogle(`${admin}/keyEvents?pageSize=200`, undefined, { ...opt, methode: 'GET' });
    const deja = new Set((existants.keyEvents || []).map((k) => k.eventName));
    const crees = [];
    for (const nom of EVENEMENTS_CLES) {
      if (deja.has(nom)) continue;
      await appelGoogle(`${admin}/keyEvents`, { eventName: nom, countingMethod: 'ONCE_PER_EVENT' }, opt);
      crees.push(nom);
    }
    return crees.length ? `Créé(s) : ${crees.join(', ')}` : 'Déjà en place';
  });

  await etape('Conservation des données sur 14 mois', async () => {
    await appelGoogle(`${admin}/dataRetentionSettings?updateMask=eventDataRetention`,
      { eventDataRetention: 'FOURTEEN_MONTHS' }, { ...opt, methode: 'PATCH' });
    return 'Réglée';
  });

  await etape('Mesure améliorée (éviter les doublons)', async () => {
    const flux = await appelGoogle(`${admin}/dataStreams?pageSize=50`, undefined, { ...opt, methode: 'GET' });
    const web = (flux.dataStreams || []).find((f) => f.webStreamData?.measurementId === MESURE);
    if (!web) throw new Error(`Flux ${MESURE} introuvable dans cette propriété : vérifiez GA4_PROPERTY_ID.`);
    // Les pages vues des transitions Astro et les téléchargements sont envoyés
    // par le site lui-même : les laisser aussi à GA4 les compterait deux fois.
    await appelGoogle(`https://analyticsadmin.googleapis.com/v1alpha/${web.name}/enhancedMeasurementSettings?updateMask=pageChangesEnabled,fileDownloadsEnabled`,
      { pageChangesEnabled: false, fileDownloadsEnabled: false }, { ...opt, methode: 'PATCH' });
    return 'Changements de page par l\'historique et téléchargements automatiques désactivés';
  });

  await etape('Plan du site envoyé à la Search Console', async () => {
    const site = process.env.GSC_SITE || 'sc-domain:herone.fr';
    const plan = `${SITE}/sitemap-index.xml`;
    await appelGoogle(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(plan)}`,
      undefined, { ...opt, methode: 'PUT' }).catch((e) => {
      if (e.statut === 403) throw new Error('Refusé : donnez au compte de service l\'autorisation « Complet » dans la Search Console (facultatif, le reste fonctionne sans).');
      throw e;
    });
    return plan;
  });

  return etapes;
}

/* ---------- Point d'entrée ---------- */

export default async (req) => {
  const action = new URL(req.url).searchParams.get('action');
  if (req.method !== 'GET' && !(req.method === 'POST' && action === 'installer')) {
    return reponse(405, { erreur: 'Méthode non autorisée.' });
  }
  const auth = req.headers.get('authorization') || '';
  const jeton = auth.replace(/^Bearer\s+/i, '').trim();
  if (!jeton) return reponse(401, { erreur: 'Connectez-vous à /admin avec GitHub.' });
  try {
    if (!(await verifierGitHub(jeton))) {
      return reponse(403, { erreur: `Ce compte GitHub n'a pas le droit d'écriture sur ${DEPOT}.` });
    }
  } catch {
    return reponse(502, { erreur: 'GitHub ne répond pas, réessayez dans un instant.' });
  }

  if (action === 'installer') {
    try {
      const etapes = await installer();
      cache.clear();
      return reponse(200, { etapes });
    } catch (e) {
      return reponse(500, { erreur: e.message });
    }
  }

  const url = new URL(req.url);
  const jours = [7, 28, 90].includes(Number(url.searchParams.get('jours'))) ? Number(url.searchParams.get('jours')) : 28;
  const chemin = url.searchParams.get('chemin') ? cheminDe(url.searchParams.get('chemin')) : null;
  const cle = `${jours}|${chemin || ''}`;
  const enCache = cache.get(cle);
  if (enCache && Date.now() - enCache.t < DUREE_CACHE && url.searchParams.get('frais') !== '1') {
    return reponse(200, { ...enCache.data, cache: true });
  }

  const p = periodes(jours);
  const [g, a] = await Promise.allSettled([lireGsc(p, chemin), lireGa(p, chemin)]);
  const data = {
    genereLe: new Date().toISOString(),
    periode: { jours, ...p },
    chemin,
    searchConsole: g.status === 'fulfilled' ? g.value : null,
    analytics: a.status === 'fulfilled' ? a.value : null,
    erreurs: [
      g.status === 'rejected' ? `Search Console : ${g.reason?.message}` : null,
      a.status === 'rejected' ? `Google Analytics : ${a.reason?.message}` : null,
    ].filter(Boolean),
  };
  if (!data.erreurs.length) cache.set(cle, { t: Date.now(), data });
  return reponse(200, data);
};
