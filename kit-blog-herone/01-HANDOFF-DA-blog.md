# Refonte du blog herone.fr, cahier des charges pour l'intégration

Direction retenue par Nolan le 21 septembre 2026 sur le canvas Claude Design « Refonte du blog Hérone » : **Option B « Plein soleil »**, fond prune sombre et orange soleil. Une déclinaison claire (fond crème) existe aussi sur le canvas, elle n'est pas retenue pour l'instant mais ses valeurs figurent en annexe.

Ce document s'adresse à Claude Code, qui travaille dans le repo `herone-dev/herone-siteweb` (Astro 5, contenu markdown dans `src/content/blog`, styles en CSS natif avec des variables dans `src/styles/tokens.css`). Les maquettes HTML de référence sont dans `03-maquettes/`. Quand ce document et une maquette se contredisent, la maquette fait foi pour le visuel, ce document fait foi pour le comportement.

## 1. Périmètre

Phase 1, à livrer d'un bloc :

- `src/pages/blog/index.astro` : la liste des articles (hero, filtres, article à la une, grille de cartes, carte d'appel à l'action).
- `src/pages/blog/[slug].astro` : la page article (en-tête, bandeau illustré, sommaire collant, prose, encart rendez-vous inséré automatiquement, bandeau final, auteur, articles liés).
- `src/components/blog/ArticleCard.astro` : la carte avec couverture illustrée.
- `src/components/blog/TableOfContents.astro` : le sommaire numéroté avec section active.
- Nouveau `src/components/blog/BlogCover.astro` : les couvertures dessinées en SVG.
- `src/styles/tokens.css` : ajout d'un bloc de variables `--blog-*` (section 3), sans toucher aux variables existantes.

Hors périmètre en phase 1 : le header et le footer globaux restent ceux du site. La maquette montre un pied de page avec la baseline en très grand et le mot HÉRONE en filigrane, c'est une proposition pour une phase 2, à ne pas construire maintenant. Les blocs éditoriaux riches de la page type longue (chiffres, étapes, repères, liste de contrôle, comparaison) sont aussi en phase 2, voir section 8.

## 2. Ce qui change par rapport au blog actuel

- Le blog passe entièrement sur fond sombre (aujourd'hui seul le hero l'est), avec le header en thème sombre sur les deux pages (`headerTheme="dark"`, déjà en place sur l'index, à ajouter sur `[slug].astro`).
- Chaque article a une couverture dessinée, générée en SVG à partir d'un motif, sans image à produire.
- Un article à la une (le plus récent) occupe une grande carte horizontale au-dessus de la grille.
- Les titres de section de l'article sont numérotés (01, 02, 03) par CSS, le sommaire reprend la numérotation et suit le défilement.
- L'encart rendez-vous n'est plus écrit en HTML dans le markdown, il est inséré par le gabarit après la deuxième section (règle en 6.4). Les articles existants qui contiennent encore un `<div class="hrn-article-cta">` doivent en être nettoyés dans la même PR pour ne pas afficher deux encarts.
- Le champ de recherche du hero actuel est retiré (six articles, les filtres suffisent). Le script de filtrage par catégorie est conservé.

## 3. Jetons de couleur à ajouter dans `tokens.css`

Ajouter en fin de `:root`, sous un commentaire « Blog, palette propre à la section ». Les valeurs sont celles de la maquette, contrastes vérifiés (WCAG AA) :

| Variable | Valeur | Usage | Contraste |
|---|---|---|---|
| `--blog-bg` | `#1C1321` | fond de page | |
| `--blog-surface` | `#2A212E` | cartes, encarts, sommaire mobile | |
| `--blog-surface-2` | `#352D39` | fond des couvertures neutres, barre de progression, filigrane | |
| `--blog-line` | `#433B47` | bordures, séparateurs | |
| `--blog-text` | `#F8EEE4` | texte courant, titres | 15,7:1 sur bg |
| `--blog-text-2` | `#B6ACAA` | texte secondaire, dates, chapeaux | 8,1:1 sur bg, 7:1 sur surface |
| `--blog-accent` | `#FF6B2C` | orange soleil : boutons, titres en couleur, citations, bandeaux | 6,4:1 sur bg |
| `--blog-accent-soft` | `#FFAE8B` | abricot : petits libellés mono (catégorie, temps de lecture), pastilles | 8,6:1 sur surface |
| `--blog-accent-deep` | `#823B26` | braise : soleil dessiné sur les bandeaux orange | décoratif |
| `--blog-on-accent` | `#1C1321` | texte et icônes posés sur l'orange | 6,4:1 sur accent |

Règle : l'orange `--blog-accent` ne sert jamais pour du texte de moins de 24 px. Les petits libellés en orange utilisent `--blog-accent-soft`.

Pourquoi des jetons séparés : le reste du site est sur la palette jade et crème de `tokens.css`. Le blog assume une identité propre décidée par Nolan. Si plus tard l'orange soleil remplace l'accent du site, il suffira de faire pointer `--accent` dessus.

## 4. Typographie

Les trois polices sont déjà auto-hébergées dans `src/styles/fonts.css`. Aucune police à ajouter.

| Rôle | Police | Graisse | Taille desktop / mobile | Interligne | Interlettrage |
|---|---|---|---|---|---|
| Titre du hero de la liste | Bricolage Grotesque | 800 | `clamp(50px, 11vw, 144px)` | 0,9 | -0,05em |
| Titre de section de page (« Tous les articles », « À lire ensuite ») | Bricolage Grotesque | 800 | 64 / 40 px | 0,95 | -0,045em |
| Titre d'article (h1) | Bricolage Grotesque | 800 | `clamp(38px, 7.5vw, 96px)` | 0,94 | -0,05em |
| Titre de la une | Bricolage Grotesque | 800 | 46 / 32 px | 1 | -0,04em |
| Titre de carte | Bricolage Grotesque | 700 | 27 / 20 px | 1,08 | -0,025em |
| Intertitre h2 dans l'article | Bricolage Grotesque | 800 | 46 / 34 px | 1 | -0,04em |
| Intertitre h3 | Bricolage Grotesque | 700 | 30 / 24 px | 1,1 | -0,03em |
| Chapeau d'article | Bricolage Grotesque | 400 | 24 / 18 px | 1,45 | 0 |
| Premier paragraphe (accroche) | Bricolage Grotesque | 500 | 25 / 21 px | 1,4 | -0,01em |
| Corps de l'article | Bricolage Grotesque | 400 | 19 / 17 px | 1,7 | 0 |
| Texte des cartes | Bricolage Grotesque | 400 | 16 px | 1,55 | 0 |
| Libellés (catégorie, temps de lecture, date, fil d'Ariane, numéros de section) | IBM Plex Mono | 500 | 13 / 11 à 12 px | 1,4 | 0,06 à 0,08em, capitales |
| Boutons | Bricolage Grotesque | 700 | 16 px (15 px dans le header) | 1 | 0 |

Décision à confirmer par Nolan : la maquette met tout le corps de texte en Bricolage Grotesque. Le site utilise Hanken Grotesk pour le texte courant. Si à l'usage le corps en Bricolage paraît lourd sur 1 900 mots, basculer le corps de l'article seul (`.hrn-prose p, li`) sur `var(--font-sans)` à 18 px, sans toucher aux titres.

## 5. Page liste, `src/pages/blog/index.astro`

Maquette : `B-Liste-Desktop.html`, `B-Liste-Mobile.html`.

### 5.1 Structure, de haut en bas

1. Header global en thème sombre.
2. Hero : hauteur 560 px desktop, 450 px mobile, bordure basse `--blog-line`. Contenu aligné en haut à gauche dans `.hrn-section-inner` : libellé mono en orange « Le blog Hérone · N articles » (N calculé), h1 « Automatiser, » puis « concrètement. » en `--blog-accent` sur la ligne suivante, paragraphe en `--blog-text-2` limité à 540 px. Un demi-soleil rayé (SVG, section 7.1) est posé en bas à droite, débordant du bloc (`overflow: hidden` sur le hero). Pas de champ de recherche.
3. Barre de filtres : une rangée de pastilles (section 7.3) à gauche, un bouton « Tri : du plus récent » à droite (desktop seulement, purement indicatif, pas de menu). Sur mobile, les pastilles défilent horizontalement (`overflow-x: auto`, sans barre de défilement visible), le bouton de tri disparaît. La barre reste collante sous le header (`position: sticky; top: 68px`) avec le fond `--blog-bg`.
4. À la une : l'article le plus récent. Carte de 520 px de haut sur desktop, deux colonnes 7/12 et 5/12 : couverture à gauche avec une pastille « À la une » en haut à gauche (fond `--blog-bg`, texte `--blog-text`, mono), texte à droite (libellé, titre, chapeau, lien « Lire l'article » avec rond orange fléché). Sur mobile, la carte passe en colonne, couverture de 220 px en haut.
5. « Tous les articles » : titre de section à gauche, libellé mono « Du plus récent au plus ancien » à droite. Grille de 3 colonnes (gap 24 px) sur desktop, contenant les cartes des autres articles puis, en dernière cellule, la carte d'appel à l'action orange (section 7.4). Sur mobile, les cartes deviennent des lignes (vignette carrée 96 px à gauche, texte à droite, séparateur `--blog-line`), la carte orange vient après la liste.
6. Footer global.

### 5.2 Comportement du filtre

Le script actuel de filtrage par catégorie est gardé. Deux adaptations : la carte « à la une » suit aussi le filtre (elle disparaît si sa catégorie n'est pas celle sélectionnée, et le premier article visible ne prend pas sa place, la grille suffit), et la carte orange d'appel à l'action reste toujours visible, même quand aucun article ne correspond. L'état vide « Aucun article pour cette recherche » est conservé, restylé avec `--blog-surface` et une bordure pointillée `--blog-line`.

### 5.3 Réactivité

| Largeur | Comportement |
|---|---|
| ≥ 1100 px | Grille 3 colonnes, une en 7/5, hero 144 px |
| 760 à 1099 px | Grille 2 colonnes, une en colonne (couverture au-dessus), hero `11vw` |
| < 760 px | Liste en lignes avec vignette 96 px, filtres défilants, hero 50 px |

## 6. Page article, `src/pages/blog/[slug].astro`

Maquettes : `B-Article-Desktop.html`, `B-Article-Mobile.html` pour un article court, `B-ArticleLong-*` pour un article de 1 900 mots (coupé en plusieurs fichiers pour le canvas, c'est une seule page sur le site).

### 6.1 Structure, de haut en bas

1. Header global en thème sombre.
2. Sur mobile seulement, une barre de progression de lecture de 4 px sous le header, piste `--blog-surface-2`, remplissage `--blog-accent`, largeur = position de défilement dans l'article (0 % en haut de l'article, 100 % à la fin de la prose). Pas de barre sur desktop.
3. En-tête : fil d'Ariane (« Blog » en `--blog-accent-soft`, séparateur « / », catégorie) à gauche et libellé « N min de lecture · date » à droite sur la même ligne (empilés sur mobile), h1 limité à 11 colonnes sur 12, chapeau (`description` du frontmatter) en `--blog-text-2` limité à 8 colonnes.
4. Bandeau de couverture pleine largeur, 360 px desktop, 200 px mobile, même motif que la carte de l'article (section 7.2), variante large.
5. Sur mobile, un `<details>` « Sommaire · N parties » (fond `--blog-surface`, angles 18 px) contenant le sommaire.
6. Corps en deux colonnes sur desktop (`grid-template-columns: repeat(12, 1fr)`, gap 24 px) : colonne de gauche sur 3 colonnes avec le sommaire puis la petite carte « Trente minutes pour repérer ce qu'on peut automatiser chez vous » et son bouton, le tout `position: sticky; top: 96px; align-self: start`. Article sur les colonnes 5 à 11 (7 colonnes, soit environ 670 px de mesure, 70 caractères par ligne à 19 px).
7. Dans la prose, dans l'ordre : encart « En bref » si le frontmatter en fournit un (6.3), premier paragraphe en accroche (6.2), sections numérotées, encart rendez-vous orange inséré automatiquement (6.4).
8. Sous la prose, le bloc auteur (6.5).
9. Bandeau final pleine largeur orange, 440 px desktop : « Ce sujet vous concerne ? » en 88 px, phrase d'accompagnement, bouton sombre « Réserver 30 minutes en visio » et le lien téléphone, demi-soleil braise en bas à droite. Sur mobile, le soleil passe en bas au centre et le bouton prend toute la largeur.
10. « À lire ensuite » : 3 cartes (même composant que la liste) choisies comme aujourd'hui (même catégorie d'abord, puis les plus récents). La carte « Le système » qui renvoie vers `/systemes` est supprimée tant que cette page n'existe pas dans le repo.
11. Footer global.

### 6.2 Prose (`.hrn-prose`)

- Premier paragraphe : 25 px, graisse 500, interligne 1,4 (`.hrn-prose > p:first-of-type`).
- Paragraphes : 19 px, interligne 1,7, marge haute 22 px.
- h2 : numéroté par un compteur CSS. Le numéro s'affiche au-dessus du titre, en mono 13 px, `--blog-accent`, sur sa propre ligne (`display: block` sur `::before`, `content: counter(section, decimal-leading-zero)`). Marge haute 36 px, `scroll-margin-top: 96px`.
- h3 : 30 px, graisse 700, marge haute 16 px.
- Liens dans le texte : couleur `--blog-text`, soulignement 2 px `--blog-accent`, décalage 4 px. Au survol, texte `--blog-accent-soft`.
- Gras : graisse 700, même couleur que le texte.
- Citation en exergue (`blockquote`) : bordures haute et basse `--blog-line`, padding 30 px 0, texte en Bricolage 700, 36 px desktop, 27 px mobile, `--blog-accent`, guillemets français ajoutés par CSS en `--blog-accent-soft`. Pas de bordure gauche.
- Listes (si un ancien article en contient) : sans puce, chaque item précédé de son numéro en mono `--blog-accent`, comme la maquette.

### 6.3 Encart « En bref » (optionnel)

Ajouter au schéma de `src/content.config.ts` un champ optionnel `summary: z.array(z.string()).max(4).optional()`. Quand il est présent, le gabarit affiche avant le premier paragraphe un `<aside>` sur fond `--blog-surface`, bordure `--blog-line`, filet gauche de 4 px `--blog-accent`, libellé mono « En bref » en `--blog-accent-soft`, puis les phrases numérotées 01, 02, 03. Rien n'est affiché si le champ est absent. Aucun article existant n'a à être modifié.

### 6.4 Encart rendez-vous inséré automatiquement

Règle : l'encart s'insère après la fin de la deuxième section h2 (juste avant le troisième h2). Si l'article a moins de quatre h2, il s'insère avant le dernier h2. Une seule occurrence par article.

Implémentation recommandée : un plugin rehype dans `astro.config.mjs` (`markdown.rehypePlugins`) qui parcourt les enfants de la racine, repère les h2, et insère un nœud HTML brut à l'endroit voulu. Le markup inséré est celui de la maquette : `<aside class="hrn-article-cta">` sur fond `--blog-accent`, texte `--blog-on-accent`, titre 22 px graisse 800 « On regarde votre cas en trente minutes. », phrase « Sans jargon, sans engagement. On repère ce qui peut être automatisé chez vous. », bouton sombre « Réserver 30 minutes » vers `/#reserver`. Le texte de l'encart vit dans le plugin, pas dans les articles.

Nettoyage : retirer les blocs `<div class="hrn-article-cta">…</div>` des six articles existants dans `src/content/blog`, sans rien changer d'autre à leur contenu.

### 6.5 Bloc auteur

Sous la prose, un `<aside>` fond `--blog-surface` : rond de 72 px pour la photo à gauche, nom en 18 px graisse 700, rôle en mono `--blog-accent-soft`, phrase de contexte en `--blog-text-2`. Les données viennent d'un fichier `src/data/authors.ts` (nom, rôle, photo, une phrase) et du champ `author` du frontmatter, qui existe déjà avec la valeur par défaut « Hérone ». Tant que `author` vaut « Hérone », afficher le bloc avec le logo à la place de la photo et « L'équipe Hérone » comme nom. Nolan fournira les deux fiches fondateurs.

### 6.6 Sommaire et section active

`TableOfContents.astro` reçoit les `headings` de niveau 2 seulement. Chaque entrée : numéro mono à gauche (30 px de large), titre, séparateur haut `--blog-line`, padding 9 px 0. Entrée courante : texte `--blog-text` graisse 700, numéro `--blog-accent`. Les autres : texte et numéro `--blog-text-2`. La section courante est déterminée par un `IntersectionObserver` sur les h2 (marge `-40% 0px -55% 0px`), initialisé sur `astro:page-load` et coupé sur `astro:before-swap` comme le reste des scripts du site.

### 6.7 Réactivité

| Largeur | Comportement |
|---|---|
| ≥ 960 px | Deux colonnes, sommaire collant, bandeau 360 px, pas de barre de progression |
| < 960 px | Une colonne, sommaire dans le `<details>`, barre de progression, bandeau 200 px, h1 38 à 42 px, corps 17 px |

## 7. Composants

### 7.1 Demi-soleil rayé (motif de marque du blog)

Un SVG inline réutilisé partout : un demi-disque (`M0 200A200 200 0 0 1 400 200Z` dans un viewBox 400×200) rempli en `--blog-accent`, coupé par trois bandes horizontales de 8, 12 et 16 px aux hauteurs 112, 140 et 170, de la couleur du fond derrière lui (`--blog-bg` sur les pages, `--blog-accent` quand le soleil est en braise sur un bandeau orange). Le logo du header en reprend une version réduite (un disque coupé de deux bandes) uniquement en phase 2, le logo actuel reste en phase 1.

### 7.2 Couvertures, `BlogCover.astro`

Props : `motif` (chaîne) et `variant` (`card` 400×260, `wide` 1280×360). Chaque motif est un SVG de formes simples, sans image externe, dessiné avec les couleurs `--blog-accent`, `--blog-accent-soft`, `--blog-surface-2`, `--blog-line`, `--blog-bg`. Le SVG utilise `preserveAspectRatio="xMidYMid slice"` et remplit son conteneur.

Motifs livrés dans les maquettes (à recopier depuis `B-EnBref.html`, section « Couvertures générées ») : `agenda` (soleil et grille de créneaux), `compte-rendu` (soleil sombre sur orange et lignes de texte), `devis` (grille de tableur et disque orange), `formulaire` (point sombre relié à un disque orange sur fond abricot), `reporting` (barres qui montent, la dernière en orange), `relances` (ondes concentriques sur orange), `tri-mails` (enveloppes empilées, flèche, dossiers ; version large dans `B-ArticleLong-Desktop-1.html`).

Association slug → motif dans `src/data/blog-covers.ts` : `remplir-son-agenda: agenda`, `comptes-rendus: compte-rendu`, `devis-excel: devis`, `facebook-crm: formulaire`, `reporting-mensuel: reporting`, `relances-clients: relances`, `administratif-mi-temps: tri-mails`. Un slug sans entrée reçoit le motif par défaut `soleil` (le demi-soleil seul sur `--blog-surface-2`). Ajouter aussi un champ optionnel `cover: z.string().optional()` au schéma, qui l'emporte sur le fichier d'association quand il est renseigné.

### 7.3 Pastille de filtre

Bouton `<button aria-pressed>` : hauteur 44 px, padding 0 18 px, angles pleins, texte 15 px, suivi du nombre d'articles en mono 12 px (deux chiffres, « 02 »). Repos : fond transparent, bordure `--blog-line`, texte `--blog-text`, compteur `--blog-text-2`. Actif : fond `--blog-accent`, texte et compteur `--blog-on-accent`, graisse 700. Survol au repos : bordure `--blog-text-2`. Focus visible : anneau 3 px `--blog-accent-soft` à 50 %.

### 7.4 Boutons

- Principal (`hrn-btn--blog-accent`) : fond `--blog-accent`, texte `--blog-on-accent`, hauteur 48 px (52 px pour les grands, 44 px dans le header), padding 0 22 px, angles pleins, graisse 700, flèche 18 px à droite. Survol : fond `#FF8A55` (orange éclairci de 15 %), durée `var(--dur)`. Actif (clic) : même fond, translation de 1 px vers le bas.
- Inverse sur fond orange (`hrn-btn--blog-night`) : fond `--blog-bg`, texte `--blog-text`, mêmes dimensions. Survol : fond `--blog-surface-2`.
- Lien « Lire l'article » : texte 16 px graisse 700 suivi d'un rond de 40 px `--blog-accent` avec flèche sombre. Survol : le rond se décale de 4 px vers la droite (`transform`, `var(--dur)`, `var(--ease-out)`).
- Carte d'appel à l'action orange (dernière cellule de la grille) : fond `--blog-accent`, texte `--blog-on-accent`, angles 24 px, cercles concentriques sombres à 18 % en bas à droite, libellé mono « Réserver un appel », titre 42 px, phrase, bouton inverse, lien téléphone en mono.

### 7.5 Carte d'article

Fond `--blog-surface`, bordure `--blog-line`, angles 24 px, `overflow: hidden`. Couverture de 220 px (200 px dans « À lire ensuite »), puis padding 24 px 26 px 28 px : libellé mono « CATÉGORIE · N MIN » à gauche et date à droite, titre, description en `--blog-text-2`. Toute la carte est un lien (`<a>` englobant, comme aujourd'hui). Survol : bordure `--blog-text-2`, translation de 3 px vers le haut, `var(--dur)`. Focus visible : anneau `--blog-accent-soft`.

## 8. Phase 2, blocs éditoriaux pour les articles longs

La page type longue (`B-ArticleLong-*`) montre cinq blocs qui rythment un article de 1 500 à 2 000 mots. Ils ne sont pas nécessaires pour publier et le processus de rédaction produit du markdown pur, sans HTML. À traiter plus tard, une fois la phase 1 en ligne, par exemple avec `remark-directive` (`:::chiffres`, `:::etapes`, `:::reperes`, `:::controle`, `:::comparaison`) rendus par des composants Astro. Les styles sont lisibles dans `B-ArticleLong-Desktop-1.html` et `-2.html`.

## 9. Accessibilité

- Tous les contrôles sont de vrais `<button>` ou `<a href>`, taille minimale 44 px.
- Les icônes décoratives et les SVG de couverture portent `aria-hidden="true"`. Le bouton menu mobile a `aria-label="Ouvrir le menu"`.
- Ordre de tabulation : header, filtres, à la une, cartes, appel à l'action, footer. Sur la page article : header, fil d'Ariane, sommaire, liens de la prose, encart, bandeau, articles liés.
- Les h2 gardent un `id` (généré par Astro) pour les ancres du sommaire. La numérotation par CSS n'entre pas dans le nom accessible.
- `prefers-reduced-motion` : aucune translation au survol, la barre de progression reste.
- Contrastes : voir la table de la section 3. Ne jamais poser `--blog-accent` en texte sous 24 px.

## 10. Vérification avant la PR

1. `npm run build` passe sans erreur, les six articles existants et le nouveau se construisent.
2. `/blog` et `/blog/administratif-mi-temps` capturés en 1280 px et 390 px, comparés aux maquettes.
3. Aucun `<div class="hrn-article-cta">` ne subsiste dans `src/content/blog`, et chaque article affiche un seul encart orange.
4. Le filtre par catégorie fonctionne, y compris l'état vide.
5. Le sommaire suit le défilement, la barre de progression mobile avance.
6. Lighthouse accessibilité ≥ 95 sur les deux pages.

## Annexe, palette de la déclinaison claire (non retenue)

Pour mémoire, la version « Option B · Clair » du canvas : fond `#F8EEE4`, cartes `#FCF8F4`, surface 2 `#E6DCD4`, bordures `#D5CBC5`, texte `#1C1321`, texte secondaire `#5E555C`, orange `#E4572E` (réservé aux titres de 24 px et plus, contraste 3,2:1), orange texte `#92381D` pour les petits libellés (6,5:1), abricot `#F0A38C`, braise `#763227`. Maquettes : `BL-*.html`.
