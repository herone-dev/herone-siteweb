// Contrôle de conformité d'un article de blog.
//
// Pourquoi : les articles arrivent d'une tâche programmée, deux par jour, en
// commit direct sur `main`. Personne ne les relit avant qu'ils soient en
// ligne. Ce script est le seul garde-fou entre le texte produit et le site.
// Il vérifie deux choses de nature différente : les règles de rédaction du
// blog (pas de tiret cadratin, pas de liste, pas de HTML) et la conformité du
// frontmatter au schéma Astro, qui casse le build Netlify quand elle manque.
//
// Comment : appel avec des chemins de fichiers. Sans argument, il ne vérifie
// rien plutôt que de tout vérifier, parce que les articles déjà en ligne
// portent l'ancien gabarit et ne passeront jamais ce contrôle. La reprise de
// ces articles est un chantier séparé, et l'action GitHub ne lui passe que les
// fichiers touchés par le commit ou la pull request.
//
//   node scripts/check-articles.mjs src/content/blog/mon-article.md
//   node scripts/check-articles.mjs --tous     (tout le dossier, pour un audit)
//
// Sortie : 0 si tout passe, 1 dès qu'un contrôle échoue. Chaque échec est
// imprimé en une ligne, préfixée du fichier.

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const DOSSIER = 'src/content/blog';

// Fourchette de longueur imposée par la ligne éditoriale. 1 500 est un
// plafond strict, décision de Martin du 23 septembre 2026.
const MOTS_MIN = 1200;
const MOTS_MAX = 1500;

// Vitesse de lecture retenue pour readingTime, en mots par minute.
const MOTS_PAR_MINUTE = 200;

// Champs du frontmatter, alignés sur src/content.config.ts. Toute évolution du
// schéma doit être reportée ici, et dans public/admin/config.yml.
const OBLIGATOIRES = ['title', 'description', 'pubDate', 'category', 'readingTime', 'systemTitle'];
const CONNUS = new Set([
  ...OBLIGATOIRES,
  'updatedDate',
  'author',
  'image',
  'tags',
  'draft',
  'summary',
  'cover',
]);

/* Découpe un fichier en frontmatter brut et corps. Le frontmatter est délimité
 * par deux lignes de trois tirets, la première devant être la toute première
 * ligne du fichier. */
function decouper(texte) {
  const lignes = texte.split('\n');
  if (lignes[0].trim() !== '---') return null;
  const fin = lignes.indexOf('---', 1);
  if (fin === -1) return null;
  return {
    frontmatter: lignes.slice(1, fin),
    corps: lignes.slice(fin + 1).join('\n'),
  };
}

/* Lecture volontairement minimale du frontmatter : une clé, deux points, une
 * valeur, sur une seule ligne. Le blog n'utilise pas d'autre forme, et une
 * vraie bibliothèque YAML serait une dépendance de plus pour rien. Les listes
 * écrites sur plusieurs lignes (tirets) sont reconnues et rattachées à leur
 * clé, sans quoi elles passeraient pour des clés inconnues. */
function lireFrontmatter(lignes) {
  const champs = {};
  let courante = null;

  for (const ligne of lignes) {
    if (ligne.trim() === '' || ligne.trim().startsWith('#')) continue;

    const suite = ligne.match(/^\s+-\s+(.*)$/);
    if (suite && courante) {
      if (!Array.isArray(champs[courante])) champs[courante] = [];
      champs[courante].push(suite[1].trim());
      continue;
    }

    const paire = ligne.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!paire) continue;
    const [, cle, valeur] = paire;
    courante = cle;
    champs[cle] = valeur.trim() === '' ? [] : valeur.trim();
  }

  return champs;
}

function sansGuillemets(valeur) {
  if (typeof valeur !== 'string') return valeur;
  return valeur.replace(/^["'](.*)["']$/s, '$1');
}

/* Compte les mots du corps, frontmatter exclu. Les titres comptent, ils font
 * partie du texte lu. */
function compterMots(corps) {
  return corps.split(/\s+/).filter((mot) => /[\p{L}\p{N}]/u.test(mot)).length;
}

/* Contrôles portant sur le corps de l'article. Chaque entrée rend un message
 * quand la règle est enfreinte, et null sinon. */
function controlerCorps(corps) {
  const erreurs = [];
  const lignes = corps.split('\n');

  const signaler = (numero, message) => erreurs.push(`ligne ${numero} : ${message}`);

  lignes.forEach((ligne, i) => {
    const numero = i + 1;

    if (/[—]/.test(ligne)) signaler(numero, 'tiret cadratin, à remplacer par une virgule ou une parenthèse');
    if (/[–]/.test(ligne)) signaler(numero, 'tiret demi-cadratin, à remplacer par une virgule ou une parenthèse');

    // Le deux-points d'un lien Markdown (https:) ne compte pas : ce n'est pas
    // de la ponctuation de texte courant.
    const sansLiens = ligne.replace(/\]\([^)]*\)/g, ']()').replace(/https?:/g, '');
    if (sansLiens.includes(':')) signaler(numero, 'deux-points dans le corps du texte');

    if (/^\s*([-*+]|\d+[.)])\s+/.test(ligne)) signaler(numero, 'liste à puces ou numérotée');
    if (/^\s*>/.test(ligne)) signaler(numero, 'citation (blockquote)');
    if (/^\s*\|/.test(ligne)) signaler(numero, 'tableau');
    if (/^\s*(```|~~~)/.test(ligne)) signaler(numero, 'bloc de code');
    if (/<[a-zA-Z/!][^>]*>/.test(ligne)) signaler(numero, 'balise HTML dans le corps');

    // Emoji, au sens des caractères à présentation graphique d'Unicode. Le
    // texte du blog est en français, sans pictogramme.
    if (/\p{Extended_Pictographic}/u.test(ligne)) signaler(numero, 'emoji');
  });

  // Le code en ligne (`ainsi`) est aussi du code, même sans bloc.
  if (/`[^`\n]+`/.test(corps)) erreurs.push('code en ligne entre accents graves');

  return erreurs;
}

/* Contrôles portant sur le frontmatter, y compris la cohérence entre
 * readingTime et le nombre de mots. */
function controlerFrontmatter(champs, mots) {
  const erreurs = [];

  for (const cle of OBLIGATOIRES) {
    if (champs[cle] === undefined || champs[cle] === '') {
      erreurs.push(`frontmatter : champ « ${cle} » manquant`);
    }
  }

  for (const cle of Object.keys(champs)) {
    if (!CONNUS.has(cle)) erreurs.push(`frontmatter : champ « ${cle} » inconnu du schéma Astro`);
  }

  for (const cle of ['pubDate', 'updatedDate']) {
    const valeur = sansGuillemets(champs[cle]);
    if (valeur === undefined) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
      erreurs.push(`frontmatter : « ${cle} » doit être au format AAAA-MM-JJ`);
    } else if (Number.isNaN(Date.parse(valeur))) {
      erreurs.push(`frontmatter : « ${cle} » n'est pas une date valide`);
    }
  }

  if (champs.draft !== undefined && !['true', 'false'].includes(String(champs.draft))) {
    erreurs.push('frontmatter : « draft » doit valoir true ou false');
  }

  if (champs.category !== undefined && sansGuillemets(champs.category) === '') {
    erreurs.push('frontmatter : « category » ne peut pas être vide');
  }

  const lecture = Number(champs.readingTime);
  if (champs.readingTime !== undefined) {
    if (!Number.isInteger(lecture)) {
      erreurs.push('frontmatter : « readingTime » doit être un nombre entier');
    } else {
      const attendu = Math.round(mots / MOTS_PAR_MINUTE);
      if (lecture !== attendu) {
        erreurs.push(
          `frontmatter : « readingTime » vaut ${lecture} alors que ${mots} mots donnent ${attendu}`,
        );
      }
    }
  }

  if (Array.isArray(champs.summary) && champs.summary.length > 4) {
    erreurs.push('frontmatter : « summary » dépasse quatre phrases');
  }

  return erreurs;
}

/* Index de tous les articles du dossier, servant à vérifier l'unicité des
 * slugs et les liens internes. Il est construit une fois, sur le dossier
 * entier, même quand le contrôle ne porte que sur un fichier : un lien vers un
 * article non modifié doit quand même être vérifié. */
function indexerArticles() {
  const index = new Map();
  for (const nom of readdirSync(DOSSIER)) {
    if (!nom.endsWith('.md')) continue;
    const slug = nom.replace(/\.md$/, '');
    const parts = decouper(readFileSync(join(DOSSIER, nom), 'utf8'));
    const champs = parts ? lireFrontmatter(parts.frontmatter) : {};
    index.set(slug, { brouillon: String(champs.draft) === 'true' });
  }
  return index;
}

/* Liens internes /blog/<slug> : la cible doit exister et ne pas être un
 * brouillon, sinon le lien mène à un 404 au prochain build. */
function controlerLiens(corps, slug, index) {
  const erreurs = [];
  const vus = new Set();

  for (const trouve of corps.matchAll(/\]\((\/blog\/[a-z0-9-]+)\)/g)) {
    const cible = trouve[1].replace('/blog/', '');
    if (vus.has(cible)) continue;
    vus.add(cible);

    if (cible === slug) {
      erreurs.push(`lien interne : l'article pointe vers lui-même (/blog/${cible})`);
    } else if (!index.has(cible)) {
      erreurs.push(`lien interne : /blog/${cible} n'existe pas`);
    } else if (index.get(cible).brouillon) {
      erreurs.push(`lien interne : /blog/${cible} est archivé (draft: true)`);
    }
  }

  return erreurs;
}

function controler(chemin, index) {
  const erreurs = [];
  const slug = basename(chemin).replace(/\.md$/, '');
  const texte = readFileSync(chemin, 'utf8');
  const parts = decouper(texte);

  if (!parts) return [`${chemin} : frontmatter absent ou mal délimité`];

  const champs = lireFrontmatter(parts.frontmatter);
  const mots = compterMots(parts.corps);

  erreurs.push(...controlerFrontmatter(champs, mots));
  erreurs.push(...controlerCorps(parts.corps));
  erreurs.push(...controlerLiens(parts.corps, slug, index));

  // Voix de l'article, décision de Martin du 23 septembre 2026 : « nous »,
  // jamais « on ». Les cibles des liens sont retirées avant la recherche.
  const texteCourant = parts.corps.replace(/\]\([^)]*\)/g, ']');
  for (const trouve of texteCourant.matchAll(/(^|[^\p{L}'’])((?:l['’]|qu['’])?on)(?=[^\p{L}]|$)/giu)) {
    erreurs.push(`voix : « ${trouve[2]} » interdit, écrire « nous », « vous » ou reformuler`);
  }

  // Chaque « Hérone » du corps est un lien vers https://herone.fr.
  const nus = parts.corps.match(/(?<!\[)Hérone(?!\]\(https:\/\/herone\.fr\/?\))/g) ?? [];
  if (nus.length > 0) {
    erreurs.push(`marque : ${nus.length} « Hérone » sans lien vers https://herone.fr`);
  }

  if (mots < MOTS_MIN || mots > MOTS_MAX) {
    erreurs.push(`longueur : ${mots} mots, la fourchette est ${MOTS_MIN} à ${MOTS_MAX}`);
  }

  // Le slug est le nom du fichier : deux fichiers de même nom ne peuvent pas
  // coexister dans un dossier. Le doublon possible est le slug à la casse ou
  // aux accents près, qui produirait deux URLs voisines.
  const normalise = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const autre of index.keys()) {
    if (autre !== slug && normalise(autre) === normalise(slug)) {
      erreurs.push(`slug : « ${slug} » se confond avec « ${autre} »`);
    }
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    erreurs.push(`slug : « ${slug} » doit être en minuscules, sans accent, mots séparés par des tirets`);
  }

  return erreurs.map((e) => `${chemin} : ${e}`);
}

function main() {
  const args = process.argv.slice(2);
  const tous = args.includes('--tous');
  const fichiers = tous
    ? readdirSync(DOSSIER)
        .filter((n) => n.endsWith('.md'))
        .map((n) => join(DOSSIER, n))
    : args.filter((a) => a.endsWith('.md'));

  if (fichiers.length === 0) {
    console.log('check-articles : aucun article à vérifier.');
    return 0;
  }

  const index = indexerArticles();
  let echecs = 0;

  for (const fichier of fichiers) {
    const erreurs = controler(fichier, index);
    if (erreurs.length === 0) {
      console.log(`OK   ${fichier}`);
    } else {
      echecs += erreurs.length;
      for (const erreur of erreurs) console.error(`FAIL ${erreur}`);
    }
  }

  if (echecs > 0) {
    console.error(`\ncheck-articles : ${echecs} contrôle(s) en échec.`);
    return 1;
  }

  console.log(`\ncheck-articles : ${fichiers.length} article(s) conforme(s).`);
  return 0;
}

process.exit(main());
