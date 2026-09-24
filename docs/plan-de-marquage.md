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

`content_group` prend aussi la valeur `legal` pour les mentions légales, la confidentialité et les cookies.

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
| `rdv_agenda_affiche` | L'agenda Calendly intégré a fini de s'afficher | | |
| `file_download` | Clic sur un lien avec l'attribut `download` ou vers un fichier (pdf, docx, xlsx, pptx, csv, zip, odt, ods, txt, ics, vcf, mp4, mp3). Nom recommandé par Google | `file_name`, `file_extension`, `link_url`, `cta_zone` | |
| `clic_repete` | Trois clics ou plus en moins d'une seconde sur le même élément : bouton qui ne réagit pas, élément qui ressemble à un lien, visiteur agacé | `cta_zone`, `cta_texte` | |
| `section_vue` | Une section de la page est affichée à moitié (ou occupe la moitié de l'écran si elle est très haute). Une fois par section et par page. Toutes les `section` de `main` sont suivies, nommées par leur `id`, sinon leur première classe | `section` | |
| `ouverture_faq` | Ouverture d'une question de la FAQ (l'état ouvert au chargement n'est pas compté) | `question`, `cta_zone` | |
| `ouverture_depliant` | Ouverture d'un autre dépliant, par exemple le sommaire mobile d'un article | `cta_texte`, `cta_zone` | |
| `temps_actif` | Paliers de 30 s, 1 min, 2 min et 5 min passés sur la page, onglet visible | `secondes_actives` | |
| `copie_texte` | Le visiteur copie du texte (numéro, adresse, passage d'article) | `cta_texte` (80 premiers caractères), `longueur`, `cta_zone` | |
| `impression_page` | Le visiteur imprime la page | | |
| `video_start` | Lecture lancée : vidéo de présentation, ou clic sur la vidéo YouTube de témoignage. Nom recommandé par Google | `video_title`, `video_provider` (`herone` ou `youtube`), `video_duration`, `video_current_time`, `cta_zone` | |
| `video_progress` | Paliers de 10, 25, 50, 75 et 90 % d'une vidéo hébergée sur le site | idem + `video_percent` | |
| `video_pause` | Pause d'une vidéo hébergée sur le site | idem + `video_percent` | |
| `video_reprise` | Reprise après une pause | idem | |
| `video_complete` | Vidéo hébergée vue jusqu'au bout | idem + `video_percent` = 100 | |
| `web_vitals` | Performance réelle de la première page de la visite, envoyée quand le visiteur quitte ou masque l'onglet : LCP (affichage du contenu principal, en ms), CLS (stabilité, ×1000), INP (réactivité, en ms) | `metric_name`, `metric_value`, `metric_rating` (`bon`, `a_ameliorer`, `mauvais`) | |
| `erreur_js` | Erreur JavaScript rencontrée par un visiteur, 5 au plus par page. Les erreurs des scripts tiers, sans détail, sont ignorées | `message_erreur`, `cta_texte` (fichier et ligne) | |

Les vidéos d'ambiance (muettes, en boucle, lancées seules, comme celle du haut de l'accueil) ne sont pas suivies : personne ne les lance. La vidéo YouTube de témoignage n'est suivie qu'au lancement, le lecteur de YouTube ne renvoie rien au site ensuite.

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

## 6. Réglages GA4

Ils sont posés automatiquement par le bouton **Configurer Google Analytics** de la page `/admin/stats/`, qui appelle la fonction `stats.mjs` avec `action=installer`. Le bouton peut être relancé sans risque : ce qui existe déjà n'est pas recréé. Le compte de service doit avoir le rôle **Éditeur** dans GA4.

- **Dimensions personnalisées** (portée Événement) : `cta_zone`, `cta_texte`, `lien_cible`, `lien_domaine`, `article_slug`, `article_categorie`, `pourcentage`, `secondes_actives`, `section`, `question`, `methode`, `choix`, `video_title`, `video_provider`, `video_percent`, `file_name`, `metric_name`, `metric_rating`, `message_erreur`.
- **Métriques personnalisées** : `metric_value` (moyenne de performance), `longueur` (texte copié).
- **Événements clés** : `rdv_reserve`, `clic_telephone`, `clic_email`.
- **Conservation des données** : 14 mois.
- **Mesure améliorée** : « Changements de page basés sur l'historique du navigateur » et « Téléchargements de fichiers » sont désactivés, le site les envoie lui-même. Le reste de la mesure améliorée est conservé.
- **Search Console** : le plan du site `sitemap-index.xml` est envoyé. Il faut pour cela l'autorisation « Complet ». Sans elle, seule cette ligne échoue.

Une dimension ne se remplit qu'à partir de sa création, jamais en arrière.

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
| Sections vues, FAQ, vidéos, téléchargements, clics répétés, erreurs, performance | GA4 | Bloc « Ce que font les visiteurs », une requête par sujet sur les dimensions ci-dessus |

## 8. Limites connues

- La Search Console a deux à trois jours de retard. La période de la page s'arrête la veille.
- Sans consentement, GA4 ne reçoit que des signaux anonymes. Les totaux du site incluent l'estimation de Google, les chiffres par page et par événement la reflètent moins bien. Les tendances restent justes.
- Un rendez-vous pris depuis la page Calendly ouverte dans un nouvel onglet (lien de secours quand l'agenda intégré ne charge pas) n'est pas vu par le site. Il reste visible dans Calendly.
