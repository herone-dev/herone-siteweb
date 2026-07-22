# CLAUDE.md — [Nom du site]

> Contexte permanent lu par Claude Code à chaque session.
> Remplace les [crochets], garde ce fichier concis (< 200 lignes) : ici on met
> les décisions, les conventions et les PIÈGES — pas ce qui se déduit du code.

## Vue d'ensemble

Site **vitrine + blog**, à forte ambition visuelle (vidéos, animations GSAP),
mais qui doit rester **très rapide**. Le design d'origine vient de **Claude Design**
(handoff). Les articles de blog sont publiés **automatiquement par Hermes Agent**.

Principe directeur : **découpler la vitesse ressentie du poids réel** — la page
paraît instantanée, les médias lourds arrivent progressivement.

## Stack & pourquoi

- **Astro** — contenu Markdown natif (blog) + zéro JS par défaut (îlots) = vitesse.
- **GSAP** (+ ScrollTrigger, SplitText) — animations avancées. 100% gratuit, plugins inclus.
- **GitHub → Netlify** — auto-deploy à chaque push sur `main`. Pas de deploy manuel.
- Design system hérité de **Claude Design**.

## Workflow du projet

- Origine du code : **handoff Claude Design** (bundle = fichiers de design + README).
- **Déploiement** : `git push` sur `main` → Vercel build & déploie tout seul.
- **Blog** : Hermes rédige 1 article/jour → écrit le `.md` → commit + push (voir Blog).

## Commandes

- `npm run dev` — serveur local + aperçu en direct
- `npm run build` / `npm run preview`

## Conventions d'ANIMATION (spécifiques — à respecter)

- **N'animer QUE `transform` et `opacity`.** Jamais width/height/top/left/margin (reflow → saccades).
- **GSAP uniquement en îlot** (`client:visible` / `client:idle`), **seulement sur les pages qui l'utilisent**. Jamais chargé site-wide.
- **Cycle de vie `<ClientRouter />`** : ré-initialiser les animations sur `astro:page-load`, et nettoyer (`gsap.context()` / `ScrollTrigger.kill()`) avant le swap. Sinon : flashs et doubles déclenchements.
- **Reveals simples** (fondu / translate, survols) : CSS + IntersectionObserver, PAS GSAP. Réserver GSAP au spectaculaire : timelines orchestrées, scroll `scrub`, SplitText, morphing.
- **Toujours** respecter `prefers-reduced-motion`.
- **Système de motion** : durées ≈150 ms (micro-interactions), ≈300–400 ms (entrées) ; easing signature `power3.out`. Sobriété > quantité.
- Piège View Transitions : un élément animé dans un ancêtre `overflow: hidden` voit son instantané rogné → l'animation ne se déclenche pas (attention aux cartes arrondies).

## Conventions VIDÉO

- **Hero** : une image **poster** s'affiche immédiatement et sert de **LCP** — jamais la vidéo. La vidéo apparaît en fondu une fois prête.
- Attributs : `autoplay muted loop playsinline`, `preload="none"` (ou `metadata`).
- **Lazy-load** toutes les vidéos (IntersectionObserver). Embeds YouTube/Vimeo via **façade** (aperçu image, vrai lecteur au clic).
- **Toujours réserver l'espace** (`aspect-ratio`) pour éviter le CLS.
- **Mobile** : servir le poster seul (pas d'autoplay vidéo).
- Plusieurs vidéos → **streaming adaptatif** (Mux / Cloudflare Stream / Bunny), pas des `.mp4` auto-hébergés lourds.

## Budget PERFORMANCE (garde-fous)

- **LCP** = poster hero optimisé & préchargé. **CLS** = dimensions réservées partout. **INP** = pas de JS lourd bloquant.
- Images via le composant `<Image />` d'Astro, AVIF/WebP, lazy sous la ligne de flottaison.
- Polices auto-hébergées, en subset, `font-display: swap`, préchargées.

## Conventions BLOG

- 1 article = 1 fichier `.md` dans `src/content/blog/`, nommé en `kebab-case`.
- Frontmatter requis :
  ```
  title, description, pubDate, author, image (optionnel), tags[]
  ```
- Ton d'écriture : [À REMPLIR]. Longueur cible : [À REMPLIR].
- Après ajout : vérifier que l'article apparaît dans la liste du blog, puis `commit` + `push`.

## Git & déploiement

- Branche de production : `main`. Un push = un déploiement.
- Messages de commit courts : `blog: ...`, `feat: ...`, `fix: ...`.
- **Interdit** : `git push --force` et `git reset --hard` sur `main`.

## Cross-tool (Hermes Agent)

- Hermes lit `AGENTS.md` ; Claude Code lit `CLAUDE.md`.
- Source unique de vérité : garder les conventions partagées dans un fichier et
  l'importer dans l'autre. Ex. mettre en 1ʳᵉ ligne de ce fichier : `@AGENTS.md`.
