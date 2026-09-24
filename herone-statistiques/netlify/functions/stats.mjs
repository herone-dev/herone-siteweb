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
  'clic_sortant', 'clic_ancre', 'defilement', 'lecture_article', 'rdv_creneau_choisi',
  'rdv_reserve', 'generate_lead',
];
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

async function tokenGoogle() {
  if (jetonGoogle && jetonGoogle.expire > Date.now() + 60_000) return jetonGoogle.valeur;
  const email = process.env.GOOGLE_SA_EMAIL;
  let cle = process.env.GOOGLE_SA_KEY;
  if (!email || !cle) throw new Error('Compte de service absent : GOOGLE_SA_EMAIL et GOOGLE_SA_KEY à renseigner dans Netlify.');
  cle = cle.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = b64url({ alg: 'RS256', typ: 'JWT' });
  const charge = b64url({
    iss: email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: maintenant,
    exp: maintenant + 3600,
  });
  const signature = createSign('RSA-SHA256').update(`${entete}.${charge}`).sign(cle, 'base64')
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
  jetonGoogle = { valeur: d.access_token, expire: Date.now() + d.expires_in * 1000 };
  return jetonGoogle.valeur;
}

async function appelGoogle(url, corps) {
  const jeton = await tokenGoogle();
  const r = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${jeton}`, 'content-type': 'application/json' },
    body: JSON.stringify(corps),
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
  if (chemin) {
    const url = `${SITE}${chemin === '/' ? '/' : chemin}`;
    const req = await gsc(site, {
      startDate: p.debut,
      endDate: p.fin,
      dimensions: ['query'],
      rowLimit: 25,
      dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: url }] }],
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
  for (const { d, m } of valeurs(rPages.rows, 5)) {
    const c = cheminDe(d[0]);
    const a = pages[c] || { vues: 0, visiteurs: 0, engagement: 0, tauxEngagementPondere: 0, conversions: 0, evenements: {} };
    a.vues += m[0];
    a.visiteurs += m[1];
    a.engagement += m[2];
    a.tauxEngagementPondere += m[3] * m[1];
    a.conversions += m[4];
    pages[c] = a;
  }
  for (const { d, m } of valeurs(rEvts.rows, 1)) {
    const c = cheminDe(d[0]);
    pages[c] = pages[c] || { vues: 0, visiteurs: 0, engagement: 0, tauxEngagementPondere: 0, conversions: 0, evenements: {} };
    pages[c].evenements[d[1]] = (pages[c].evenements[d[1]] || 0) + m[0];
  }
  for (const c of Object.keys(pages)) {
    const a = pages[c];
    pages[c] = {
      vues: a.vues,
      visiteurs: a.visiteurs,
      tempsMoyen: a.visiteurs ? a.engagement / a.visiteurs : 0,
      tauxEngagement: a.visiteurs ? a.tauxEngagementPondere / a.visiteurs : 0,
      conversions: a.conversions,
      evenements: a.evenements,
    };
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
  };

  if (chemin) {
    const filtrePage = {
      filter: { fieldName: 'pagePath', stringFilter: { matchType: 'EXACT', value: chemin } },
    };
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
    const s = await appelGoogle(`${base}:runReport`, {
      dateRanges: [periode],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: filtrePage,
      limit: 20,
    });
    resultat.sources = valeurs(s.rows, 1).map(({ d, m }) => ({ canal: d[0], vues: m[0] }));
  }
  return resultat;
}

/* ---------- Point d'entrée ---------- */

export default async (req) => {
  if (req.method !== 'GET') return reponse(405, { erreur: 'Méthode non autorisée.' });
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
