# Hérone, Design System

Le système de design de **HÉRONE**, entreprise d'**automatisation par l'IA** et d'**implémentation de systèmes IA / automatisés** implantée dans le Grand Ouest (Vendée). Cible actuelle : **TPE et PME**. Langue des supports : **français uniquement**.

Périmètre actuel : **fondations de marque + composants** (brand book + primitives UI). La prévisualisation du site et les autres kits ont été retirés pour se concentrer sur l'essentiel ; ils seront reconstruits ultérieurement à partir de ces fondations.

---

## Positionnement et récit de marque

Hérone se veut **sobre, minimaliste, épurée**, **sérieuse et professionnelle**, tout en restant **humaine, proche, accessible**. Registre inspiré de la retenue de marques deep-tech (Anduril, SpaceX, Y Combinator) : beaucoup d'espace, hiérarchie typographique nette, palette resserrée, zéro esbroufe.

**À proscrire** (le « IA à deux balles ») : cerveaux, circuits imprimés, robots, réseaux de neurones illustrés, dégradés violet/bleu criards, emojis, images de synthèse « futuristes ».

### Héron d'Alexandrie, le fil conducteur

Le nom ne vient **pas de l'oiseau**. Il rend hommage à **Héron d'Alexandrie**, ingénieur et mathématicien grec du 1er siècle, l'un des tout premiers inventeurs de l'histoire : l'**éolipile** (première machine à vapeur), le premier **distributeur automatique**, les premières **portes automatiques**, de nombreux **automates**. Autrement dit : l'automatisation ingénieuse, il y a 2000 ans. Hérone en est l'héritière. Récit exprimé par l'**ingéniosité, le mécanisme, la précision**, jamais par du kitsch antique.

### Palette « paysage »

La palette est **échantillonnée au pixel dans une peinture de paysage** fournie par le client (`assets/paysage-herone.webp`) : montagnes de **jade**, brume **crème**, et un **soleil rouge-orangé**. Elle donne une identité chaude, naturelle et premium :

- **Jade / vert forêt** : couleur de marque (les reliefs).
- **Crème** : surfaces et fonds (la brume).
- **Soleil rouge-orangé** : accent **unique et rare** (un seul CTA, un chiffre clé). Jamais en grande surface.

---

## Sources fournies

- **Peinture de paysage** (`assets/paysage-herone.webp`) : source de la palette, échantillonnée directement.
- **Logo** : inexistant. **Aucun faux logo n'a été dessiné** ; le nom **HÉRONE** est posé en typographie (composant `Wordmark`).
- **Polices** : aucune police propriétaire fournie. Choix de marque (ci-dessous), chargés via **Google Fonts** ; auto-hébergeables ensuite.

---

## Content Fundamentals, comment Hérone écrit

**Registre** : vouvoiement systématique. Expert et rassurant, jamais condescendant. Clair, concret, orienté résultat.

**Ton** : sobre, factuel, sûr de lui sans esbroufe. Exemples concrets. Pas de superlatifs vides, pas de hype IA.

**Casse** : titres et intertitres en **casse phrase** ; nom de marque en **HÉRONE** (capitales, accent) en contexte fort ; eyebrows / labels courts en capitales espacées, en police mono (`AUTOMATISATION`, `MISE EN ŒUVRE`).

**Ponctuation** : **jamais de tiret cadratin** (« tiret long » : proscrit par le client). Virgule, deux-points, parenthèses ou point médian « · ». Le trait d'union « - » reste autorisé dans les mots composés. Typographie française (espaces avant `; : ! ?`, guillemets « français »).

**Personne** : « nous » pour Hérone, « vous » pour le client. **Emoji : jamais.**

### Exemples
- Hero : « **L'automatisation qui vise juste.** Nous concevons et déployons des systèmes IA sur mesure pour les TPE et PME du Grand Ouest. »
- CTA : « Parler de votre projet », « Demander un diagnostic ».
- Preuve : « 12 h récupérées par semaine sur la saisie administrative. »
- À éviter : « 🚀 Révolutionnez votre entreprise grâce à l'IA ! ».

---

## Visual Foundations

### Couleurs

Système **chaud et naturel**, échantillonné dans la peinture. Fond de page crème, marque jade, accent soleil unique.

**6 couleurs sources (échantillons pixel) :**

| Hex | Nom | Rôle |
| --- | --- | --- |
| `#EF3002` | Soleil | accent unique (CTA, chiffre clé) |
| `#99AA8E` | Sauge | neutres clairs, sauge muté |
| `#518770` | Jade | marque (montagnes) |
| `#1B3633` | Teal profond | marque foncée, sections |
| `#162A1E` | Vert forêt | texte, fonds inversés |
| `#E6CFB2` | Crème | brume, surfaces chaudes |

Échelles dérivées dans `tokens/colors.css` :
- **Jade / marque** (`--slate-50` à `--slate-900`) : `--slate-500 #3E6B5A` en primaire ; `--slate-400 #518770` et `--slate-800 #1B3633` sont des ancres directes de la photo.
- **Encre / neutres** (`--ink-50` à `--ink-950`) : sauge-crème (clair) vers vert forêt `#162A1E` (texte) puis `#0F1D14` (titres).
- **Accent soleil** (`--amber-*`, nom hérité) : `--amber-500 #EC3A08`. **Un seul accent**, dosé avec parcimonie.
- **Surfaces** : page `--paper #EFEADB`, cartes `--surface #F8F4E8` (plus claires que la page), creux `--surface-2`, inset `--surface-3`.
- **Sémantiques** sourdes et chaudes (succès vert feuille, warning ocre, danger brique, info jade), pour le statut uniquement.

> Contraste : viser AA. Texte clair sur jade foncé et sur soleil `#EC3A08` OK ; texte foncé sur crème OK.

### Typographie
- **Bricolage Grotesque** (display / titres), grotesque contemporaine et chaleureuse, graisses 600 à 800, interlettrage serré.
- **Hanken Grotesk** (corps / UI), grotesque humaniste chaleureuse.
- **IBM Plex Mono** (labels, métriques, données), capitales espacées pour les eyebrows.

### Espacement & mise en page
Base **4px**, rythme vertical généreux (`--section-y`). Conteneurs `--container-max 1200px`, prose 68ch. Grilles CSS, `gap` partout.

### Fonds, textures, imagerie
- Dominante : aplats crème. Texture discrète : grille de points / filet hairline (`--ink-200/300`).
- Sections **inversées** : fond vert forêt `--slate-900 #132A24` avec texte crème, accent soleil.
- **Imagerie** : la peinture de paysage est l'image de marque de référence. Photographies réelles (ateliers, équipe, terrain du Grand Ouest), registre chaud et net. Pas d'illustration IA générée.

### Bordures, coins, ombres, motion
- Rayons discrets : champs 4px, cartes 8px, panneaux 12px.
- Bordures : filet 1px `--border #D8D2BC` très présent ; nous délimitons souvent par un filet plutôt qu'une ombre.
- Ombres douces teintées vert forêt (`--shadow-*`), réservées au flottant et au survol.
- Motion calme et précise, fondus + petits déplacements, **aucun rebond**. Respecter `prefers-reduced-motion`.

### États
- Hover : assombrissement d'un cran (jade 500 vers 600 ; soleil 500 vers 600).
- Press : cran plus sombre + `translateY(1px)` (jamais de `scale`).
- Focus : anneau `--focus-ring` (halo jade), jamais supprimé. Disabled : opacité ~0.5.

---

## Iconography

- **Lucide** (linéaire, trait fin ~1.75px), monochrome, `currentColor`, 20 à 24px. Chargé via CDN (`https://unpkg.com/lucide@latest`), *choix par défaut signalé*.
- **Jamais** : emoji, unicode en guise d'icônes, pictos « IA » clichés, SVG dessinés à la main.
- **Marque** : nom **HÉRONE** en typographie (composant `Wordmark`).

---

## Polices, note de substitution

Familles via **Google Fonts** (choix de marque, à valider) : **Bricolage Grotesque** (titres), **Hanken Grotesk** (corps), **IBM Plex Mono** (données). Auto-hébergeables en production.

---

## Index / manifeste

Racine : `styles.css` (point d'entrée global, à lier), `readme.md`, `SKILL.md`, `thumbnail.html`.

Dossiers :
- `tokens/` : `colors.css`, `semantic.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `fonts.css`.
- `guidelines/` : cartes-specimen des fondations, structurées comme un brand book, en sections (onglet Design System) :
  - **Brand** : logo & protection, palette source, paysage, Héron d'Alexandrie, wordmark, texture, élévation, section inversée, motion.
  - **Color** : jade (marque), neutres (encre), soleil (accent), surfaces, rôles, sémantiques.
  - **Typography** : display, titres, corps, mono, échelle, graisses.
  - **Layout** : grille 12 colonnes, conteneurs & rythme, échelle d'espacement, rayons.
  - **Iconography** : jeu Lucide, tailles & usage.
  - **Motion** : durées, easing, aucun rebond.
  - **Voice & Tone** : principes de voix, à faire / à éviter, casse & ponctuation.
  - **Accessibility** : contraste WCAG des paires, focus & cibles tactiles.
- `components/` : 18 primitives UI (`actions/` Button, IconButton ; `brand/` Wordmark, Eyebrow ; `forms/` Input, Textarea, Select, Checkbox, Radio, Switch, Field ; `display/` Card, Badge, Tag, Stat, Avatar, Divider ; `feedback/` Callout). Namespace runtime `window.HRoneDesignSystem_c54fc9` (via `_ds_bundle.js`).
- `assets/` : `paysage-herone.webp` (peinture source de la palette).

> Périmètre actuel : **fondations de marque + composants**. La prévisualisation du site (UI kit) a été retirée ; elle sera reconstruite ultérieurement à partir de ces fondations.
