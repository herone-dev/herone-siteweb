# CLAUDE.md, site Hérone (herone.fr)

> Contexte permanent lu à chaque session. On met ici les décisions, les
> conventions et les PIÈGES, pas ce qui se déduit du code. Moins de 200 lignes.

## Ce qu'est ce dépôt

Site vitrine et blog d'Hérone (Les Herbiers, Vendée). Astro 5 en sortie
statique, GSAP pour les animations, hébergé sur **Netlify**. Chaque push sur
`main` déclenche un build et un déploiement. Il n'y a pas de déploiement
manuel, et pas d'environnement de préproduction.

Pages : accueil, `/automatisation`, `/formation`, `/blog`, `/blog/<slug>`,
pages légales. `/admin` sert l'interface d'édition du blog.

## Le blog, source et cycle de vie

- Un article = un fichier `.md` dans `src/content/blog/`, nommé en kebab-case.
  **Le nom du fichier est le slug, donc l'URL.** Le renommer casse l'adresse
  d'un article déjà en ligne, et Google la garde en mémoire.
- Les articles arrivent d'une **tâche programmée**, deux par jour, en commit
  direct sur `main`. Personne ne les relit avant la mise en ligne.
- Le corps de l'article vit aussi sur Google Drive et la fiche dans Airtable
  (base « HÉRONE, Contenu blog »). Le commit GitHub vient en plus, pas à la
  place. Le dépôt n'est pas la source de vérité éditoriale.
- Retirer un article du site se fait en passant `draft: true`, **jamais** en
  supprimant le fichier. Voir plus bas.

### Frontmatter

Le schéma fait foi, il est dans `src/content.config.ts`. Un champ hors schéma,
ou un obligatoire manquant, **casse le build, donc tout le site**, pas
seulement l'article fautif.

Obligatoires : `title`, `description`, `pubDate` (AAAA-MM-JJ), `category`,
`readingTime` (entier), `systemTitle`.
Facultatifs : `updatedDate`, `author` (défaut `Hérone`), `image`, `tags`,
`draft` (défaut `false`), `summary` (4 phrases max). `cover` est encore
toléré par le schéma mais n'est plus lu depuis la refonte du 22 septembre
2026 : ne plus l'écrire.

Pièges :

- `category` est un **champ libre** (`z.string()`). C'était une liste fermée de
  quatre valeurs, et un article portant une cinquième catégorie cassait le
  build. La barre de filtres de `/blog` déduit ses thèmes des articles
  présents : une nouvelle catégorie apparaît sans toucher au code. En revanche
  rien ne rattrape une faute de frappe, qui crée un thème de plus.
- `author` doit correspondre à une clé de `src/data/authors.ts`, sinon c'est la
  fiche « Hérone » qui s'affiche, sans erreur.
- Le point de couleur d'une catégorie vient de `src/data/blog-categories.ts`.
  Une catégorie absente de ce fichier s'affiche quand même, avec la couleur de
  la marque : l'ajouter au fichier seulement si elle mérite sa propre couleur.
- `readingTime` n'est pas calculé, il est écrit à la main. Le script de
  contrôle vérifie qu'il vaut bien le nombre de mots divisé par 200, arrondi.

### Le champ `draft`, archivage et retour en ligne

Chaque article porte `draft` explicitement (`true` ou `false`) : l'interface
/admin filtre et affiche le statut à partir de ce champ, et un article sans
lui n'y apparaîtrait pas comme « en ligne ».

`draft: true` retire l'article de la liste, du flux RSS, du plan de site, et
sa page n'est plus construite (son URL renvoie un 404). Le fichier reste dans
le dépôt, modifiable. `draft: false` le remet en ligne au build suivant.

Le filtrage est appliqué à **chaque** lecture de la collection. Aujourd'hui il
y en a trois, et toute nouvelle lecture doit le reprendre :

- `src/pages/blog/index.astro` (liste, compteurs, article à la une) ;
- `src/pages/blog/[slug].astro`, deux fois : dans `getStaticPaths` et pour les
  articles liés de « À lire ensuite » ;
- `src/pages/rss.xml.js`.

Piège : `getStaticPaths()` s'exécute **dans une portée isolée** et ne voit rien
du reste du frontmatter du fichier `.astro`. Le prédicat de filtrage y est donc
écrit en clair, il ne peut pas être sorti dans une constante locale.

## Règles de rédaction (elles ne se déduisent d'aucun fichier)

- Jamais de tiret cadratin ni demi-cadratin. Virgule, point ou parenthèse.
- Pas de deux-points dans le texte courant.
- Pas d'emoji, pas de liste à puces ni numérotée, pas de citation, pas de
  tableau, pas de bloc ni de code en ligne, **pas de HTML dans le corps**.
- Markdown pur, uniquement des titres `##` et `###` et des paragraphes.
- 1 200 à 1 500 mots, 1 500 étant un plafond strict.
- La voix est « nous », jamais « on ».
- Chaque « Hérone » du corps est un lien vers `https://herone.fr`.
- Liens internes en `/blog/<slug>`, vers un article existant et en ligne.
- L'encart rendez-vous est posé **automatiquement** au build par
  `src/plugins/rehype-encart-rdv.mjs`. Ne jamais le recopier dans le Markdown.

Les sept articles publiés avant septembre 2026 portent l'ancien gabarit
(listes, citations, HTML de CTA en dur) et **enfreignent ces règles**. Leur
reprise est un chantier à part. Ne pas les corriger au passage.

## Script de contrôle

`node scripts/check-articles.mjs <fichiers…>` vérifie un article contre les
règles ci-dessus et contre le schéma. Sans argument il ne vérifie rien ;
`--tous` passe le dossier entier (les anciens articles échoueront, c'est
attendu).

Il tourne en GitHub Action (`.github/workflows/controle-articles.yml`) sur les
pull requests et sur les push touchant `src/content/blog/`, et **seulement sur
les fichiers modifiés** par le commit ou la PR. Il signale, il ne bloque pas le
déploiement Netlify, qui a son propre déclencheur.

## CMS, l'édition depuis le navigateur

`/admin` sert **Sveltia CMS** (fork maintenu de Decap CMS), chargé depuis le
CDN par `public/admin/index.html`, configuré par `public/admin/config.yml`.

Il écrit directement les fichiers Markdown du dépôt sur `main` : enregistrer
depuis `/admin` produit un commit, et Netlify redéploie. Pas de base de
données, pas de brouillon côté serveur, l'interrupteur « Archivé » est le champ
`draft` du frontmatter.

**Règle** : `public/admin/config.yml` et `src/content.config.ts` décrivent le
même frontmatter. Toute évolution de l'un se reporte dans l'autre, et dans la
liste des champs de `scripts/check-articles.mjs`. Un champ oublié dans la
config du CMS est un champ que l'interface efface silencieusement à
l'enregistrement.

**Aperçu fidèle** : le panneau de droite de l'éditeur affiche l'article avec le
vrai gabarit du blog. `public/admin/apercu.js` télécharge une page article en
ligne, en reprend la structure et les feuilles de style, et y place le contenu
en cours d'édition (Markdown converti par `public/admin/marked.umd.js`, copie
locale de marked 15). Le gabarit n'est donc pas recopié : une évolution de
`src/pages/blog/[slug].astro` se retrouve dans l'aperçu au déploiement suivant.
Seuls les sélecteurs suivants doivent survivre à une refonte, sinon l'aperçu
perd la partie concernée sans casser l'éditeur : `.hrn-blog`, `#hrn-header`,
`.hrn-fil`, `.hrn-article-tete__meta`, `.hrn-article-tete h1`,
`.hrn-article-tete__chapeau`, `.hrn-prose`, `.hrn-article-cta`,
`.hrn-toc__liste`, `.hrn-toc__titre`, `.hrn-enbref`.

L'authentification GitHub demande une configuration hors dépôt (une OAuth App
GitHub, déclarée soit dans Netlify, soit sur un service Cloudflare Workers).
Elle n'est pas dans le code, et sans elle la page `/admin` s'affiche mais la
connexion échoue.

## SEO et diffusion

- Plan de site produit au build par `@astrojs/sitemap`, servi sur
  `/sitemap-index.xml`. L'ancien `public/sitemap.xml` écrit à la main a été
  supprimé, `netlify.toml` redirige l'ancienne adresse.
- Flux RSS sur `/rss.xml` (`src/pages/rss.xml.js`), articles en ligne
  seulement.
- `public/robots.txt` autorise explicitement les robots d'IA et annonce le plan
  de site.
- `/admin` n'est jamais indexée : balise `noindex` dans la page et en-tête
  `X-Robots-Tag: noindex` posé par `netlify.toml`. Elle n'est volontairement
  PAS bloquée dans `robots.txt` : un robot bloqué ne lit plus le `noindex`, et
  Google peut alors indexer l'adresse nue. Ne pas « renforcer » en ajoutant un
  `Disallow`.
- `netlify.toml` porte les redirections 301. `/systemes` renvoie vers
  `/automatisation` : ne jamais créer de lien interne vers `/systemes`, il
  passerait par une redirection.

## Mesure d'audience et statistiques

GA4 (`G-GT6JCYY2SF`) est chargé dans `Layout.astro` en mode de consentement v2 avancé : tout est refusé par défaut, `analytics_storage` passe à `granted` quand le visiteur accepte dans `CookieBanner.astro`. `send_page_view` est coupé ; `src/scripts/suivi.ts` envoie les pages vues à chaque `astro:page-load` (sinon les transitions Astro n'étaient pas comptées) et tous les événements du plan de marquage. La référence est `docs/plan-de-marquage.md` : un nom d'événement ne change jamais sans mettre à jour ce document, `suivi.ts` et la liste `EVENEMENTS` de `netlify/functions/stats.mjs`.

Le suivi ne demande rien dans les composants : des écouteurs posés sur le document classent les clics (RDV, téléphone, e-mail, téléchargement, interne, sortant, ancre, bouton, clics répétés), les ouvertures de FAQ, les copies, les erreurs ; chaque page suit en plus ses vidéos, ses sections vues, le défilement, le temps actif et la performance (Core Web Vitals). La zone se déduit de la position dans la page, et une section se nomme par son `id`. `data-suivi="zone"` sur un élément force la zone. Un article porte `data-article-slug` et `data-article-categorie` sur `.hrn-blog`.

`/admin/stats/` affiche Search Console et GA4, global et par article. Les données viennent de la fonction Netlify `netlify/functions/stats.mjs` (route `/api/stats`), qui lit Google avec un compte de service (variables `GOOGLE_SA_EMAIL`, `GOOGLE_SA_KEY`, `GA4_PROPERTY_ID`, facultative `GSC_SITE`) et n'accepte que le jeton GitHub d'un compte qui a le droit d'écriture sur le dépôt. `?action=installer` (bouton « Configurer Google Analytics ») crée dans GA4 les dimensions, métriques et événements clés du plan de marquage, règle la conservation et la mesure améliorée, et envoie le plan du site à la Search Console. Une nouvelle dimension du plan de marquage s'ajoute à la liste `DIMENSIONS` de la fonction. Aucun secret Google ne passe par le navigateur. La fonction n'a aucune dépendance.

## Animation et performance

- N'animer que `transform` et `opacity`. Jamais width/height/top/left/margin.
- GSAP uniquement en îlot (`client:visible` / `client:idle`), sur les seules
  pages qui l'utilisent. Jamais chargé sur tout le site.
- Avec `<ClientRouter />` : réinitialiser sur `astro:page-load`, nettoyer sur
  `astro:before-swap` (`gsap.context()`, `ScrollTrigger.kill()`, `AbortController`).
  Sinon flashs et doubles déclenchements.
- Reveals simples : CSS et IntersectionObserver, pas GSAP.
- Toujours respecter `prefers-reduced-motion`.
- Vidéos : poster immédiat (c'est le LCP), `autoplay muted loop playsinline`,
  `preload="none"`, espace réservé en `aspect-ratio`.
- Images par le composant `<Image />` d'Astro.

## Où se décide quoi

- **Apparence du texte d'un article** : le bloc `<style>` en bas de
  `src/pages/blog/[slug].astro`, règles `.hrn-prose` et ses `:global()`.
- **Structure d'affichage d'un article** : le balisage en haut du même fichier.
- **Liste du blog** : `src/pages/blog/index.astro` (dont le filtrage par thème,
  en JavaScript dans le `<script>` de fin).
- **Carte d'article** : `src/components/blog/ArticleCard.astro`.
- **Pages villes** : `src/data/villes.ts` (textes, lu aussi par le menu du pied de
  page), gabarit `src/pages/ia-entreprise/[slug].astro`, sources `docs/sources-pages-villes.md`.
- **Couleurs, polices, durées** : `src/styles/tokens.css`.

Les caractères invisibles (espace insécable, point médian) sont posés à
l'exécution avec `String.fromCodePoint`, jamais écrits en clair : les outils
d'édition les transforment en espaces ordinaires sans prévenir.

## Git

- Branche de production : `main`. Un push égale un déploiement.
- Pour toute modification du code du site, passer par une branche et une pull
  request. Les commits directs sur `main` sont réservés à la publication
  d'articles par la tâche programmée.
- Messages courts : `blog: ...`, `feat: ...`, `fix: ...`.
- Interdit : `git push --force` et `git reset --hard` sur `main`.
