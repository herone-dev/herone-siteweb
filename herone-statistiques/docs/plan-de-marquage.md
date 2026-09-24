# Plan de marquage herone.fr (GA4)

Propriété Google Analytics 4 : flux web `G-GT6JCYY2SF`.
Code : `src/scripts/suivi.ts` (événements), `src/layouts/Layout.astro` (chargement et consentement), `src/components/CookieBanner.astro` (choix du visiteur).
Lecture des chiffres : page `/admin/stats/`, alimentée par `netlify/functions/stats.mjs`.

Toute modification d'un nom d'événement ou de paramètre se fait aux trois endroits : ce document, `suivi.ts` et la liste `EVENEMENTS` de `stats.mjs`.

## 1. Consentement

Le site utilise le mode de consentement Google v2, en mode avancé.

| Situation | analytics_storage | ad_storage, ad_user_data, ad_personalization | Ce que GA4 reçoit |
|---|---|---|---|
| Aucun choix encore fait | denied | denied | Signaux sans cookie ni identifiant, modélisés par Google |
| Clic sur « Refuser » | denied | denied | Idem |
| Clic sur « Accepter » | granted | denied | Mesure complète avec cookie `_ga` |

Le choix est gardé dans `localStorage` (`hrn-cookie`). Il se modifie depuis la page `/cookies`, lien « modifier mon choix ». Les signaux publicitaires sont toujours refusés, le site ne fait pas de publicité.

## 2. Pages vues

`send_page_view` est coupé dans la configuration de gtag. Le site utilise les transitions de page d'Astro (`ClientRouter`) : une navigation ne recharge pas la page, et GA4 ne voyait donc que la première page de chaque visite. `suivi.ts` envoie un `page_view` à chaque `astro:page-load`.

Dans GA4, la mesure améliorée doit avoir « Changements de page basés sur l'historique du navigateur » **désactivé**, sinon chaque page est comptée deux fois.

## 3. Paramètres envoyés avec chaque événement

| Paramètre | Valeurs | Rôle |
|---|---|---|
| `content_group` | `accueil`, `blog_liste`, `article`, `offre_formation`, `offre_automatisation`, `autre` | Regroupe les pages dans les rapports (dimension native « Groupe de contenu ») |
| `article_slug` | slug de l'article, ou `hors_article` | Relie chaque action à l'article où elle a lieu |
| `article_categorie` | catégorie du frontmatter, ou `hors_article` | Comparer les catégories entre elles |

Les deux derniers sont lus sur `data-article-slug` et `data-article-categorie`, posés par `src/pages/blog/[slug].astro`.

## 4. Événements

| Événement | Déclencheur | Paramètres propres | Conversion |
|---|---|---|---|
| `page_view` | Chaque page affichée, y compris après une transition Astro | `page_location`, `page_title` | |
| `clic_rdv` | Clic sur un lien vers `/#reserver` ou vers calendly.com (boutons « Réserver 30 minutes », encart RDV des articles, carte RDV à côté de l'article) | `cta_zone`, `cta_texte`, `lien_cible` | Micro-conversion |
| `rdv_creneau_choisi` | Un créneau est choisi dans l'agenda Calendly intégré | | |
| `rdv_reserve` | Un rendez-vous est confirmé dans Calendly (message `calendly.event_scheduled`) | `methode` = `calendly` | **Oui, conversion principale** |
| `generate_lead` | En même temps que `rdv_reserve`, événement recommandé par Google | `methode` | Non (doublon utile pour Google Ads) |
| `clic_telephone` | Clic sur un lien `tel:` | `cta_zone`, `cta_texte` | **Oui** |
| `clic_email` | Clic sur un lien `mailto:` | `cta_zone`, `cta_texte` | **Oui** |
| `clic_bouton` | Clic sur un bouton qui ne mène ni au RDV, ni au téléphone, ni à l'e-mail | `cta_zone`, `cta_texte`, `lien_cible` | |
| `clic_lien_interne` | Clic sur un lien vers une autre page du site | `cta_zone`, `cta_texte`, `lien_cible` | |
| `clic_ancre` | Clic sur un lien vers une section de la même page (sommaire) | `cta_zone`, `cta_texte`, `lien_cible` | |
| `clic_sortant` | Clic sur un lien vers un autre site (sources des articles) | `cta_zone`, `cta_texte`, `lien_domaine`, `lien_cible` | |
| `defilement` | Paliers de 25, 50, 75 et 100 %, une fois chacun par page. Sur un article, mesuré sur le texte de l'article, pas sur toute la page | `pourcentage` | |
| `lecture_article` | Article lu à 75 % au moins **et** 30 secondes actives (onglet visible) | `secondes_actives` | |
| `choix_cookies` | Clic sur « Accepter » ou « Refuser » | `choix` = `accepte` ou `refuse` | |

## 5. Zones (`cta_zone`)

Détection automatique à partir de la position du lien dans la page. Un attribut `data-suivi="nom_de_zone"` posé sur un élément force la zone de tout ce qu'il contient.

| Valeur | Où |
|---|---|
| `entete` | En-tête du site (logo, menu, téléphone, bouton Réserver) |
| `menu_mobile` | Menu ouvert sur téléphone |
| `pied_de_page` | Pied de page |
| `corps_article` | Texte d'un article |
| `encart_rdv_article` | Encart « Prendre rendez-vous » inséré dans l'article |
| `carte_rdv_article` | Carte « Récupérez des heures » à côté de l'article |
| `sommaire` | Sommaire de l'article |
| `bandeau_cookies` | Bandeau cookies |
| identifiant de section | Toute autre section qui porte un `id` (par exemple `reserver`) |
| `page` | Rien de plus précis trouvé |

## 6. Réglages GA4 à faire une fois

**Dimensions personnalisées**, portée « Événement » (Administration, Définitions personnalisées) :
`cta_zone`, `cta_texte`, `lien_cible`, `lien_domaine`, `article_slug`, `article_categorie`, `pourcentage`, `methode`, `choix`.

**Événements clés** (Administration, Événements clés) : `rdv_reserve`, `clic_telephone`, `clic_email`. Ils apparaissent dans GA4 après leur premier déclenchement ; ils peuvent aussi être créés à l'avance par leur nom.

**Mesure améliorée** (Flux de données, herone.fr) : décocher « Changements de page basés sur l'historique du navigateur ». Laisser le reste.

**Conservation des données** : 14 mois.

## 7. Ce que lit la page Statistiques

| Chiffre | Source | Détail |
|---|---|---|
| Impressions, clics Google, CTR, position | Search Console | Par page et par jour, période choisie, comparaison avec la période précédente |
| Requêtes d'un article | Search Console | 25 premières requêtes de la page |
| Visiteurs, sessions, pages vues | GA4 | `activeUsers`, `sessions`, `screenPageViews` |
| Temps moyen | GA4 | `userEngagementDuration` ÷ `activeUsers` : temps actif par visiteur, onglet visible |
| Taux d'engagement | GA4 | Part des sessions de plus de 10 s, ou avec 2 pages vues, ou une conversion |
| Lectures, clics RDV, liens internes et sortants, RDV réservés, appels | GA4 | `eventCount` des événements ci-dessus, par page |
| Détail des clics par zone et par bouton | GA4 | Demande les dimensions `cta_zone` et `cta_texte` |
| Provenance | GA4 | `sessionDefaultChannelGroup` |

## 8. Limites connues

- La Search Console a deux à trois jours de retard. La période de la page s'arrête la veille.
- Sans consentement, GA4 ne reçoit que des signaux anonymes. Les totaux du site incluent l'estimation de Google, les chiffres par page et par événement la reflètent moins bien. Les tendances restent justes.
- Un rendez-vous pris depuis la page Calendly ouverte dans un nouvel onglet (lien de secours quand l'agenda intégré ne charge pas) n'est pas vu par le site. Il reste visible dans Calendly.
