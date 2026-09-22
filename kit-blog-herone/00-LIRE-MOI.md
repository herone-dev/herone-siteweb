# Kit pour Claude Code, refonte du blog herone.fr

Ce dossier contient tout ce qu'il faut pour intégrer la nouvelle direction artistique du blog dans le site et publier l'article sur la menuiserie.

```
kit-blog-herone/
  00-LIRE-MOI.md               ce fichier, avec le prompt à coller dans Claude Code
  01-HANDOFF-DA-blog.md        le cahier des charges (jetons, typo, pages, composants, comportements)
  02-article/
    administratif-mi-temps.md  l'article prêt à déposer dans src/content/blog/
  03-maquettes/                les maquettes en HTML, à ouvrir dans un navigateur
    B-Liste-Desktop.html       liste des articles, 1280 px
    B-Liste-Mobile.html        liste des articles, 390 px
    B-Article-Desktop.html     page article courte, 1280 px
    B-Article-Mobile.html      page article courte, 390 px
    B-ArticleLong-*.html       page article longue (1 900 mots), en plusieurs morceaux
    B-EnBref.html              palette, typographie, couvertures, composants
    BL-*.html                  la déclinaison claire, pour mémoire
```

## Marche à suivre

1. Sur ton Mac, ouvre un terminal dans le dossier du site (le clone de `herone-dev/herone-siteweb`). Si tu ne l'as pas en local : `git clone git@github.com:herone-dev/herone-siteweb.git` puis `cd herone-siteweb` et `npm install`.
2. Copie ce dossier `kit-blog-herone` à la racine du repo (il sera supprimé avant la fusion, Claude Code s'en occupe).
3. Lance `claude` dans le dossier du site.
4. Colle le prompt ci-dessous, tel quel.
5. Claude Code travaille sur une branche `refonte-blog`, fait tourner `npm run build`, puis ouvre une pull request. Tu relis l'aperçu, tu demandes les ajustements, et tu fusionnes quand c'est bon. La publication de l'article fait partie de la même PR.

Deux décisions que Claude Code te posera si tu ne les tranches pas avant (elles sont dans le cahier des charges, sections 4 et 6.5) : garder Bricolage Grotesque pour le corps de texte comme sur la maquette, ou passer le corps en Hanken Grotesk comme le reste du site ; et les fiches auteurs (nom, rôle, photo, une phrase) pour le bloc en bas de chaque article.

## Prompt à coller dans Claude Code

```
Tu travailles dans le repo herone-dev/herone-siteweb (site Astro 5, contenu markdown dans src/content/blog, CSS natif avec des variables dans src/styles/tokens.css). Le dossier kit-blog-herone/ à la racine contient le cahier des charges de la refonte du blog et les maquettes.

Objectif : intégrer la nouvelle direction artistique du blog et publier un nouvel article, dans une seule pull request.

Commence par lire, dans cet ordre :
1. kit-blog-herone/01-HANDOFF-DA-blog.md en entier. C'est la référence pour le comportement.
2. kit-blog-herone/03-maquettes/B-Liste-Desktop.html, B-Article-Desktop.html, B-ArticleLong-Desktop-1.html et B-EnBref.html. Ce sont des pages HTML statiques avec tous les styles en ligne : reprends les valeurs exactes (tailles, espacements, rayons, couleurs) plutôt que de les arrondir. Les versions Mobile donnent le comportement sous 760 px.
3. Le code actuel : src/pages/blog/index.astro, src/pages/blog/[slug].astro, src/components/blog/*, src/styles/tokens.css, src/styles/global.css, src/content.config.ts, src/layouts/Layout.astro, src/components/Header.astro et Footer.astro.

Puis :
- Crée une branche refonte-blog.
- Fais la phase 1 décrite dans le cahier des charges, sections 1 à 7 et 9. Le header et le footer globaux ne changent pas. La phase 2 (section 8) n'est pas à faire.
- Ajoute les jetons --blog-* dans tokens.css sans modifier les jetons existants.
- Ajoute au schéma de src/content.config.ts les champs optionnels summary et cover décrits en 6.3 et 7.2. Ne change rien d'autre au schéma.
- Retire les blocs <div class="hrn-article-cta">…</div> des six articles existants, sans toucher au reste de leur contenu, puisque l'encart est maintenant inséré par le gabarit.
- Copie kit-blog-herone/02-article/administratif-mi-temps.md vers src/content/blog/administratif-mi-temps.md sans modifier son contenu. Vérifie que le slug n'existe pas déjà et que la catégorie BTP est bien dans l'enum du schéma.
- Ajoute administratif-mi-temps: tri-mails dans src/data/blog-covers.ts.
- Lance npm run build et corrige jusqu'à ce que le build passe.
- Capture /blog et /blog/administratif-mi-temps en 1280 px et 390 px (npm run preview puis Playwright, Chromium est disponible) et compare aux maquettes. Signale les écarts que tu n'as pas pu résoudre.
- Supprime le dossier kit-blog-herone/ du repo avant de committer (il ne doit pas être déployé).
- Committe en plusieurs commits lisibles (jetons, composants, pages, nettoyage des articles, nouvel article), le dernier avec le message "blog: Passer l'administratif d'une entreprise artisanale d'un temps plein à un mi-temps".
- Ouvre une pull request vers main qui résume ce qui change, liste les décisions prises et les points à valider, et joint les captures.

Règles de forme : aucun tiret cadratin ni demi-cadratin dans le code, les commentaires, les commits ou la PR. Commentaires et messages en français. Ne modifie aucune page hors du blog.

Si un point du cahier des charges est ambigu, choisis l'option la plus simple qui respecte la maquette et note-la dans la PR, ne t'arrête pas pour demander, sauf pour les deux décisions signalées dans 00-LIRE-MOI.md (police du corps de texte, fiches auteurs).
```

## Ce qui reste à valider de ton côté

- `systemTitle` de l'article est réglé sur « Connexion de vos outils », la valeur la plus proche parmi celles déjà utilisées. À changer si un autre système correspond mieux.
- Les liens de sources ont été ajoutés dans l'article à partir des pages officielles. Quatre ont été vérifiés (service-public, CCI Ouest Normandie, economie.gouv facturation électronique, economie.gouv MaPrimeRénov'). Deux n'ont pas pu l'être depuis ici et sont à ouvrir avant publication : la FAQ PDF d'impots.gouv.fr et la page France Rénov' « Guide dossier, rénovation par geste ».
- Après la fusion, mettre à jour le Sheet de suivi des articles (statut publié, URL https://herone.fr/blog/administratif-mi-temps) et copier l'article dans Articles de référence, comme le prévoit la compétence article-blog-herone.
