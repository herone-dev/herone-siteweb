// Les pages villes de /ia-entreprise/<slug>, une entrée par ville.
//
// Une seule source pour les 15 pages (gabarit src/pages/ia-entreprise/[slug].astro)
// et pour le menu « Nos zones d'intervention » du pied de page.
//
// Données de départ fournies par l'utilisateur le 25 septembre 2026 : temps et
// distances relevés sur Mappy et L'Itinéraire, populations municipales Insee
// 2023 (en vigueur au 1er janvier 2026, confirmées par Banatic), communes à
// citer et villes voisines. Les faits des paragraphes locaux sont sourcés
// dans docs/sources-pages-villes.md : aucun n'y figure sans deux sources.
//
// Règles de rédaction : voix « nous », jamais « on » ; aucun prix ; aucun
// client laissé entendre dans une ville ; aucun tiret long. Les espaces
// insécables (durées, milliers, guillemets) sont posées au rendu par
// `typo()` dans le gabarit : les textes ci-dessous n'utilisent que des espaces
// ordinaires, que le shell et les éditeurs ne peuvent pas abîmer.
//
// `lat` et `lon` placent la ville sur la carte schématique des 45 minutes :
// coordonnées approchées du bourg principal, suffisantes pour un schéma.

export interface Ville {
  slug: string;
  nom: string;
  /** « à Cholet », « aux Herbiers » */
  a: string;
  /** « de Cholet », « des Herbiers », « d'Essarts-en-Bocage » */
  de: string;
  departement: 'Vendée' | 'Maine-et-Loire' | 'Deux-Sèvres' | 'Loire-Atlantique';
  /** Temps de trajet en minutes depuis nos bureaux ; null pour Les Herbiers. */
  minutes: number | null;
  /** Distance par la route, seulement quand elle a été relevée. */
  km: number | null;
  /** Surtitre de la section locale. */
  surtitreLocal: string;
  /** Ligne sous « Chez vous, à … » dans la carte trajet. Aucun autre nom de
      commune dans le haut de page (demande de l'utilisateur, 25 septembre 2026). */
  voisinage: string;
  chapeau: string;
  local: [string, string];
  /** Question 1 de la FAQ ; la question par défaut est « Vous déplacez-vous à … ? ». */
  faqQuestion?: string;
  faqReponse: string;
  /** Six slugs, dans l'ordre des pastilles « Nous intervenons aussi à ». */
  voisines: string[];
  lat: number;
  lon: number;
}

export const VILLES: Ville[] = [
  {
    slug: 'les-herbiers',
    nom: 'Les Herbiers',
    a: 'aux Herbiers',
    de: 'des Herbiers',
    departement: 'Vendée',
    minutes: null,
    km: null,
    surtitreLocal: 'Les Herbiers et le Pays des Herbiers',
    voisinage: 'Et chez vous, dans vos locaux',
    chapeau:
      "Nous formons les équipes des TPE et PME des Herbiers à l'intelligence artificielle, et nous relions leurs logiciels pour supprimer les ressaisies. Nos bureaux sont rue Édouard Branly : nous vous y recevons, ou nous venons chez vous.",
    local: [
      "Les Herbiers comptent 16 521 habitants au dernier recensement de l'Insee. La ville fait partie de la Communauté de communes du Pays des Herbiers, qui réunit huit communes. C'est ici que nous avons installé nos bureaux, et c'est d'ici que nous partons vers les entreprises de 5 à 30 personnes de la région : celles où le dirigeant décide, et où chacun porte plusieurs casquettes.",
      "Être voisins change la façon de travailler ensemble. Vous pouvez passer nous voir rue Édouard Branly pour parler de votre projet, et nous venons chez vous pour la formation comme pour l'installation d'un système, aux Herbiers comme à Saint-Fulgent et dans les communes proches. Une question sur un système déjà en service se règle en quelques minutes de route.",
    ],
    faqQuestion: 'Pouvons-nous vous rencontrer à vos bureaux ?',
    faqReponse:
      "Oui. Nos bureaux sont au 37 rue Édouard Branly, aux Herbiers : appelez-nous au 06 63 71 05 98 ou réservez un créneau pour convenir d'un rendez-vous. Nous venons aussi chez vous, puisque la formation comme l'installation d'un système se font dans vos locaux.",
    voisines: ['chanverrie', 'sevremont', 'mortagne-sur-sevre', 'pouzauges', 'essarts-en-bocage', 'chantonnay'],
    lat: 46.87,
    lon: -1.013,
  },
  {
    slug: 'cholet',
    nom: 'Cholet',
    a: 'à Cholet',
    de: 'de Cholet',
    departement: 'Maine-et-Loire',
    minutes: 25,
    km: 26,
    surtitreLocal: 'Cholet et son agglomération',
    voisinage: "Et dans les communes de l'agglomération",
    chapeau:
      "Nous formons les équipes des TPE et PME choletaises à l'intelligence artificielle, et nous relions leurs logiciels pour que l'information circule seule. Depuis nos bureaux des Herbiers, nous venons chez vous.",
    local: [
      "Cholet Agglomération réunit 26 communes et plus de 100 000 habitants, dont 54 404 pour la ville elle-même au dernier recensement de l'Insee. L'économie locale repose sur les services, le commerce, le bâtiment et l'industrie. C'est pour ces entreprises que nous travaillons : des équipes de 5 à 30 personnes, où le dirigeant décide et où chacun porte plusieurs casquettes.",
      "Nous venons à Cholet comme à Maulévrier et dans les communes voisines, systématiquement : c'est le principe. La formation se déroule dans vos locaux, et un système s'installe sur vos postes, avec vos équipes. Le premier échange de 30 minutes peut lui aussi se tenir chez vous, si vous préférez nous montrer votre quotidien sur place. Vos équipes restent à leur poste, sans déplacement ni journée perdue sur la route.",
    ],
    faqReponse:
      "Oui, systématiquement. Cholet est à environ 25 minutes de nos bureaux des Herbiers, et nous intervenons aussi dans les communes de l'agglomération. La formation comme l'installation d'un système se font chez vous.",
    voisines: ['les-herbiers', 'mortagne-sur-sevre', 'sevremoine', 'chanverrie', 'beaupreau-en-mauges', 'mauleon'],
    lat: 47.06,
    lon: -0.879,
  },
  {
    slug: 'la-roche-sur-yon',
    nom: 'La Roche-sur-Yon',
    a: 'à La Roche-sur-Yon',
    de: 'de La Roche-sur-Yon',
    departement: 'Vendée',
    minutes: 35,
    km: 50,
    surtitreLocal: 'La Roche-sur-Yon et son agglomération',
    voisinage: "Et dans les communes de l'agglomération",
    chapeau:
      "Nous formons les équipes des TPE et PME de La Roche-sur-Yon à l'intelligence artificielle, et nous automatisons les tâches qui reviennent chaque jour. Nous venons des Herbiers, à environ 35 minutes, pour travailler dans vos locaux.",
    local: [
      "Préfecture de la Vendée, La Roche-sur-Yon compte 54 849 habitants au dernier recensement de l'Insee. Elle est le siège de La Roche-sur-Yon Agglomération, qui regroupe 13 communes. Nous nous adressons aux entreprises de 5 à 30 personnes, où les mêmes personnes vendent, produisent et tiennent l'administratif, et où chaque heure passée à ressaisir manque ailleurs. C'est sur ces tâches répétitives que l'intelligence artificielle rend du temps, à condition de partir du travail réel de chacun.",
      "Depuis nos bureaux des Herbiers, nous rejoignons La Roche-sur-Yon en 35 minutes environ, et nous intervenons aussi à Mouilleron-le-Captif, sa voisine. Nous nous déplaçons pour la formation, qui se déroule chez vous sur vos propres dossiers, puis pour l'installation d'un système, que nous branchons sur vos postes avec les personnes qui s'en serviront.",
    ],
    faqReponse:
      "Oui, systématiquement. La Roche-sur-Yon est à environ 35 minutes de nos bureaux des Herbiers, et nous intervenons aussi à Mouilleron-le-Captif et dans les communes de l'agglomération. Formation et installation se passent dans vos locaux.",
    voisines: ['les-herbiers', 'bellevigny', 'essarts-en-bocage', 'chantonnay', 'montaigu-vendee', 'pouzauges'],
    lat: 46.67,
    lon: -1.427,
  },
  {
    slug: 'sevremoine',
    nom: 'Sèvremoine',
    a: 'à Sèvremoine',
    de: 'de Sèvremoine',
    departement: 'Maine-et-Loire',
    minutes: 35,
    km: null,
    surtitreLocal: 'Sèvremoine et ses dix communes déléguées',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous aidons les TPE et PME de Sèvremoine à tirer parti de l'intelligence artificielle, et nous relions les logiciels qu'elles utilisent déjà. Depuis nos bureaux des Herbiers, nous venons travailler dans vos locaux.",
    local: [
      "Sèvremoine est une commune nouvelle créée en décembre 2015 : elle réunit dix anciennes communes, devenues communes déléguées, et compte 25 797 habitants au dernier recensement de l'Insee. Son siège est à Saint-Macaire-en-Mauges, et elle fait partie de Mauges Communauté. Nous y travaillons pour des entreprises de 5 à 30 personnes, où le dirigeant tranche vite. Leurs journées mêlent production, relation client et gestion, et c'est souvent la gestion qui déborde sur le reste.",
      "Nous intervenons dans toutes les communes déléguées : Saint-Macaire-en-Mauges, Le Longeron, Montfaucon-Montigné, La Renaudière, Roussay, Saint-André-de-la-Marche, Saint-Crespin-sur-Moine, Saint-Germain-sur-Moine, Tillières et Torfou. Comptez environ 35 minutes depuis nos bureaux des Herbiers. La formation se déroule chez vous, sur les dossiers de votre équipe, et un système s'installe sur vos postes.",
    ],
    faqReponse:
      "Oui. Sèvremoine est à environ 35 minutes de nos bureaux des Herbiers, et nous nous déplaçons dans chacune des communes déléguées, de Saint-Macaire-en-Mauges à Torfou en passant par Saint-Germain-sur-Moine ou Montfaucon-Montigné. La formation et l'installation d'un système ont lieu chez vous.",
    voisines: ['les-herbiers', 'beaupreau-en-mauges', 'cholet', 'mortagne-sur-sevre', 'chanverrie', 'clisson'],
    lat: 47.124,
    lon: -0.991,
  },
  {
    slug: 'beaupreau-en-mauges',
    nom: 'Beaupréau-en-Mauges',
    a: 'à Beaupréau-en-Mauges',
    de: 'de Beaupréau-en-Mauges',
    departement: 'Maine-et-Loire',
    minutes: 40,
    km: null,
    surtitreLocal: 'Beaupréau-en-Mauges et ses communes déléguées',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous formons les équipes des TPE et PME de Beaupréau-en-Mauges à l'IA, et nous automatisons ce qui se ressaisit encore à la main. Depuis nos bureaux des Herbiers, nous venons chez vous, à environ 40 minutes de route.",
    local: [
      "Née le 15 décembre 2015, la commune nouvelle de Beaupréau-en-Mauges regroupe dix anciennes communes : Andrezé, Beaupréau, La Chapelle-du-Genêt, Gesté, Jallais, La Jubaudière, Le Pin-en-Mauges, La Poitevinière, Saint-Philbert-en-Mauges et Villedieu-la-Blouère. Elle compte 23 989 habitants au dernier recensement de l'Insee, et son siège est à Beaupréau. Nous nous adressons ici aux entreprises de 5 à 30 personnes, celles où les ressaisies entre logiciels prennent une place qu'elles ne méritent pas.",
      "Nous venons dans chacune de ces communes déléguées, à environ 40 minutes de nos bureaux des Herbiers. Pour une équipe de 5 à 30 personnes, la journée de formation se passe dans vos locaux, sur les tâches que chacun fait vraiment. Si un système est mis en place ensuite, nous l'installons sur vos postes et nous formons ceux qui s'en serviront.",
    ],
    faqReponse:
      "Oui, et c'est même le principe. Comptez environ 40 minutes depuis nos bureaux des Herbiers. Nous intervenons à Beaupréau comme dans les autres communes déléguées, de Gesté à La Poitevinière, et la formation comme l'installation se font dans vos locaux.",
    voisines: ['les-herbiers', 'sevremoine', 'cholet', 'mortagne-sur-sevre', 'clisson', 'chanverrie'],
    lat: 47.203,
    lon: -0.993,
  },
  {
    slug: 'montaigu-vendee',
    nom: 'Montaigu-Vendée',
    a: 'à Montaigu-Vendée',
    de: 'de Montaigu-Vendée',
    departement: 'Vendée',
    minutes: 30,
    km: 29,
    surtitreLocal: 'Montaigu-Vendée et ses environs',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Une journée de formation à l'IA dans vos locaux, et des logiciels qui se passent les informations sans ressaisie : voilà ce que nous proposons aux entreprises de Montaigu-Vendée. Nos bureaux sont aux Herbiers, à une demi-heure de route.",
    local: [
      "Montaigu-Vendée est née le 1er janvier 2019 de la réunion de cinq communes : Montaigu, Boufféré, La Guyonnière, Saint-Georges-de-Montaigu et Saint-Hilaire-de-Loulay. Elle compte 21 134 habitants au dernier recensement de l'Insee. Nous y travaillons pour des entreprises de 5 à 30 personnes, où le dirigeant décide seul et où l'administratif empiète sur le métier.",
      "Nous sommes à 29 km de Montaigu-Vendée, environ 30 minutes de route, et nous intervenons aussi à La Bruffière, Treize-Septiers ou Chavagnes-en-Paillers. La formation a lieu dans vos locaux, avec votre équipe et ses dossiers. Pour une automatisation, nous installons le système chez vous, puis un suivi mensuel prend le relais une fois qu'il tourne. Le premier échange de 30 minutes, gratuit, peut se faire par téléphone ou directement dans vos locaux.",
    ],
    faqReponse:
      "Oui, à chaque fois. Montaigu-Vendée est à environ 30 minutes de nos bureaux des Herbiers, soit 29 km. Nous venons aussi à La Bruffière, Treize-Septiers et Chavagnes-en-Paillers. Formation comme installation, tout se passe chez vous.",
    voisines: ['les-herbiers', 'clisson', 'bellevigny', 'essarts-en-bocage', 'chanverrie', 'mortagne-sur-sevre'],
    lat: 46.974,
    lon: -1.309,
  },
  {
    slug: 'chantonnay',
    nom: 'Chantonnay',
    a: 'à Chantonnay',
    de: 'de Chantonnay',
    departement: 'Vendée',
    minutes: 30,
    km: null,
    surtitreLocal: 'Chantonnay et le Pays de Chantonnay',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous aidons les TPE et PME de Chantonnay à se servir de l'IA au quotidien, et nous supprimons les ressaisies entre leurs logiciels. Nos bureaux des Herbiers sont à une demi-heure : nous venons chez vous.",
    local: [
      "Chantonnay compte 8 557 habitants au dernier recensement de l'Insee. La ville appartient à la Communauté de communes du Pays de Chantonnay, qui regroupe dix communes, de Bournezeau à Sigournais. Nous travaillons pour les entreprises de 5 à 30 personnes qui font tout avec une petite équipe : le métier, les clients, et la gestion qui s'accumule le soir. Pour elles, une journée de formation bien préparée change déjà la semaine suivante.",
      "Comptez environ 30 minutes entre nos bureaux et Chantonnay. Nous intervenons aussi à Bournezeau et à Saint-Jean-d'Hermine, née en 2025 de Sainte-Hermine et de Saint-Jean-de-Beugné. La journée de formation se passe chez vous, sur vos dossiers, et un système d'automatisation s'installe sur vos postes, avec les personnes qui l'utiliseront au quotidien.",
    ],
    faqReponse:
      "Oui. Nous rejoignons Chantonnay en 30 minutes environ depuis nos bureaux des Herbiers, et nous nous déplaçons aussi à Bournezeau et à Saint-Jean-d'Hermine. La formation et la mise en place d'un système se déroulent dans vos locaux.",
    voisines: ['les-herbiers', 'essarts-en-bocage', 'pouzauges', 'sevremont', 'la-roche-sur-yon', 'bellevigny'],
    lat: 46.687,
    lon: -1.05,
  },
  {
    slug: 'mortagne-sur-sevre',
    nom: 'Mortagne-sur-Sèvre',
    a: 'à Mortagne-sur-Sèvre',
    de: 'de Mortagne-sur-Sèvre',
    departement: 'Vendée',
    minutes: 20,
    km: null,
    surtitreLocal: 'Mortagne-sur-Sèvre et le Pays de Mortagne',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Former votre équipe à l'IA sur ses vrais dossiers, et faire circuler l'information entre vos logiciels : c'est ce que nous faisons pour les TPE et PME de Mortagne-sur-Sèvre. Nos bureaux des Herbiers sont à 20 minutes.",
    local: [
      "Mortagne-sur-Sèvre compte 6 057 habitants au dernier recensement de l'Insee. Elle fait partie de la Communauté de communes du Pays de Mortagne, qui réunit onze communes, dont Saint-Laurent-sur-Sèvre, Tiffauges et Chanverrie. C'est pour les entreprises de 5 à 30 personnes que nous travaillons, celles où une petite équipe tient à la fois la production, les clients et la gestion.",
      "Mortagne-sur-Sèvre est tout près de nos bureaux : environ 20 minutes de route. Nous venons aussi à Saint-Laurent-sur-Sèvre et à Tiffauges. La formation se tient dans vos locaux, sur une journée, et un système se branche sur les logiciels que vous utilisez déjà, sans vous obliger à en changer. Le premier échange de 30 minutes sert à voir ensemble ce qui mérite d'être formé, et ce qui mérite d'être automatisé.",
    ],
    faqReponse:
      "Oui, et Mortagne-sur-Sèvre est tout près : environ 20 minutes depuis nos bureaux des Herbiers. Nous nous déplaçons aussi à Saint-Laurent-sur-Sèvre et à Tiffauges. La formation comme l'installation d'un système ont lieu chez vous.",
    voisines: ['les-herbiers', 'chanverrie', 'cholet', 'sevremoine', 'mauleon', 'sevremont'],
    lat: 46.991,
    lon: -0.948,
  },
  {
    slug: 'pouzauges',
    nom: 'Pouzauges',
    a: 'à Pouzauges',
    de: 'de Pouzauges',
    departement: 'Vendée',
    minutes: 20,
    km: null,
    surtitreLocal: 'Pouzauges et le Pays de Pouzauges',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous apprenons aux équipes des TPE et PME de Pouzauges à confier à l'IA ce qui peut l'être, et nous relions leurs logiciels entre eux. Depuis nos bureaux des Herbiers, il nous faut environ 20 minutes pour venir chez vous.",
    local: [
      "Pouzauges compte 5 668 habitants au dernier recensement de l'Insee. La ville appartient à la Communauté de communes du Pays de Pouzauges, qui compte dix communes depuis la création de Sèvremont en 2016. Nous nous adressons aux entreprises de 5 à 30 personnes, où une petite équipe porte à la fois le métier et la gestion, et où les ressaisies grignotent les journées. Nous commençons toujours par regarder comment votre équipe travaille, avant de proposer quoi que ce soit.",
      "Nous venons à Pouzauges en 20 minutes environ, et nous allons aussi à La Châtaigneraie et jusqu'à Cerizay, dans les Deux-Sèvres. La formation dure une journée, dans vos locaux, et chaque participant repart avec ses livrables écrits. Un système d'automatisation, lui, s'installe sur vos postes, avec votre équipe.",
    ],
    faqReponse:
      "Oui, systématiquement : Pouzauges est à environ 20 minutes de nos bureaux des Herbiers. Nous intervenons aussi à La Châtaigneraie et à Cerizay. Formation et installation se font dans vos locaux, avec votre équipe.",
    voisines: ['les-herbiers', 'sevremont', 'mauleon', 'chantonnay', 'chanverrie', 'mortagne-sur-sevre'],
    lat: 46.781,
    lon: -0.838,
  },
  {
    slug: 'mauleon',
    nom: 'Mauléon',
    a: 'à Mauléon',
    de: 'de Mauléon',
    departement: 'Deux-Sèvres',
    minutes: 30,
    km: null,
    surtitreLocal: 'Mauléon et ses communes associées',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous formons les équipes des TPE et PME de Mauléon à l'IA, sur leurs propres dossiers, et nous automatisons les tâches qui se répètent. Nos bureaux des Herbiers sont à une demi-heure : nous passons en Deux-Sèvres pour venir chez vous.",
    local: [
      "Dans les Deux-Sèvres, Mauléon compte 8 573 habitants au dernier recensement de l'Insee. Depuis 1973, la ville associe six anciennes communes : La Chapelle-Largeau, Loublande, Moulins, Rorthais, Saint-Aubin-de-Baubigné et Le Temple. Elle fait partie de l'Agglomération du Bocage Bressuirais. Nous nous adressons aux entreprises de 5 à 30 personnes du territoire, où quelques personnes portent à la fois la production, la vente et la gestion.",
      "Nous intervenons dans chacune de ces communes associées, à environ 30 minutes de nos bureaux des Herbiers. Tout se passe sur place : la journée de formation dans vos locaux, sur vos dossiers, puis, si vous le souhaitez, un système qui relie vos logiciels, installé sur vos postes avec votre équipe et suivi chaque mois une fois en service.",
    ],
    faqReponse:
      "Oui. Mauléon est à environ 30 minutes de nos bureaux des Herbiers, de l'autre côté de la limite entre la Vendée et les Deux-Sèvres. Nous venons aussi à La Chapelle-Largeau, Loublande, Moulins, Rorthais, Saint-Aubin-de-Baubigné et Le Temple. Tout se passe chez vous.",
    voisines: ['les-herbiers', 'sevremont', 'mortagne-sur-sevre', 'pouzauges', 'chanverrie', 'cholet'],
    lat: 46.923,
    lon: -0.749,
  },
  {
    slug: 'clisson',
    nom: 'Clisson',
    a: 'à Clisson',
    de: 'de Clisson',
    departement: 'Loire-Atlantique',
    minutes: 40,
    km: 36,
    surtitreLocal: 'Clisson et son agglomération',
    voisinage: "Et dans les communes de l'agglomération",
    chapeau:
      "Nous formons les équipes des TPE et PME de Clisson à l'intelligence artificielle, et nous faisons en sorte que leurs logiciels se parlent. De nos bureaux des Herbiers, nous venons en Loire-Atlantique pour travailler chez vous.",
    local: [
      "En Loire-Atlantique, Clisson compte 7 452 habitants au dernier recensement de l'Insee. La ville fait partie de Clisson Sèvre et Maine Agglo, qui réunit 16 communes. Nous travaillons pour des entreprises de 5 à 30 personnes, où chacun cumule plusieurs rôles et où le temps passé à recopier des informations d'un outil à l'autre finit par peser.",
      "Clisson est à 36 km de nos bureaux, environ 40 minutes de route : nous nous y déplaçons comme ailleurs. La formation se tient dans vos locaux, sur une journée, avec vos dossiers. Un système d'automatisation se conçoit avec vous, s'installe sur vos postes, puis un suivi mensuel prend le relais. Vos logiciels restent les vôtres : nous les relions entre eux plutôt que de vous en imposer de nouveaux.",
    ],
    faqReponse:
      "Oui. Clisson est à 36 km de nos bureaux des Herbiers, soit environ 40 minutes. Nous intervenons dans la ville et dans les communes de Clisson Sèvre et Maine Agglo. La formation et l'installation d'un système se font chez vous.",
    voisines: ['les-herbiers', 'montaigu-vendee', 'sevremoine', 'beaupreau-en-mauges', 'chanverrie', 'mortagne-sur-sevre'],
    lat: 47.087,
    lon: -1.282,
  },
  {
    slug: 'essarts-en-bocage',
    nom: 'Essarts-en-Bocage',
    a: 'à Essarts-en-Bocage',
    de: "d'Essarts-en-Bocage",
    departement: 'Vendée',
    minutes: 20,
    km: null,
    surtitreLocal: 'Essarts-en-Bocage, Les Essarts et Boulogne',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous formons les équipes des TPE et PME d'Essarts-en-Bocage à l'IA, et nous automatisons les tâches qu'elles refont chaque semaine. Nos bureaux des Herbiers sont à environ 20 minutes : nous venons chez vous.",
    local: [
      "Essarts-en-Bocage est une commune nouvelle créée le 1er janvier 2016. Depuis le 1er janvier 2024, L'Oie et Sainte-Florence ont retrouvé leur autonomie : la commune réunit aujourd'hui Les Essarts et Boulogne, pour 6 851 habitants au dernier recensement de l'Insee. Nous y travaillons pour des équipes de 5 à 30 personnes, qui veulent gagner du temps sans changer de logiciels ni bouleverser leurs habitudes.",
      "Depuis nos bureaux des Herbiers, nous rejoignons Les Essarts et Boulogne en 20 minutes environ. Pour votre équipe, la journée de formation se tient dans vos locaux, sur vos dossiers, et un système d'automatisation se branche sur les logiciels que vous avez déjà. Rien ne se fait à distance sans que vous l'ayez vu fonctionner chez vous.",
    ],
    faqReponse:
      "Oui. Nous venons aux Essarts comme à Boulogne, à environ 20 minutes de nos bureaux des Herbiers. La formation se déroule dans vos locaux, et l'installation d'un système aussi.",
    voisines: ['les-herbiers', 'bellevigny', 'chantonnay', 'la-roche-sur-yon', 'montaigu-vendee', 'chanverrie'],
    lat: 46.774,
    lon: -1.229,
  },
  {
    slug: 'sevremont',
    nom: 'Sèvremont',
    a: 'à Sèvremont',
    de: 'de Sèvremont',
    departement: 'Vendée',
    minutes: 20,
    km: null,
    surtitreLocal: 'Sèvremont et ses quatre communes déléguées',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous formons les équipes des TPE et PME de Sèvremont à l'intelligence artificielle, et nous relions les logiciels qu'elles ont déjà. Depuis nos bureaux des Herbiers, nous venons chez vous en une vingtaine de minutes.",
    local: [
      "Sèvremont est née le 1er janvier 2016 de la réunion de quatre communes : La Flocellière, Les Châtelliers-Châteaumur, La Pommeraie-sur-Sèvre et Saint-Michel-Mont-Mercure. Son siège est à La Flocellière, et elle compte 6 385 habitants au dernier recensement de l'Insee. Elle appartient à la Communauté de communes du Pays de Pouzauges. Nous nous adressons aux entreprises de 5 à 30 personnes, où une équipe réduite fait tourner à la fois le métier, les clients et les papiers.",
      "Nous nous déplaçons dans les quatre communes déléguées, à environ 20 minutes de nos bureaux des Herbiers. Pour votre équipe, la formation dure une journée, chez vous, et un système d'automatisation se met en place sur vos postes, avec les personnes qui l'utiliseront. Le premier échange de 30 minutes permet de voir par où commencer.",
    ],
    faqReponse:
      "Oui, systématiquement. Sèvremont est à environ 20 minutes de nos bureaux des Herbiers, et nous venons à La Flocellière, aux Châtelliers-Châteaumur, à La Pommeraie-sur-Sèvre comme à Saint-Michel-Mont-Mercure. Tout se passe dans vos locaux.",
    voisines: ['les-herbiers', 'pouzauges', 'mauleon', 'chanverrie', 'mortagne-sur-sevre', 'chantonnay'],
    lat: 46.833,
    lon: -0.863,
  },
  {
    slug: 'bellevigny',
    nom: 'Bellevigny',
    a: 'à Bellevigny',
    de: 'de Bellevigny',
    departement: 'Vendée',
    minutes: 40,
    km: 38,
    surtitreLocal: 'Bellevigny, Belleville-sur-Vie et Saligny',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous formons les équipes des TPE et PME de Bellevigny à l'IA, et nous automatisons les ressaisies entre leurs logiciels. Nos bureaux des Herbiers sont à environ 40 minutes : nous nous déplaçons jusque dans vos locaux.",
    local: [
      "Bellevigny est une commune nouvelle créée le 1er janvier 2016 : Belleville-sur-Vie et Saligny en sont devenues les communes déléguées. Elle compte 6 240 habitants au dernier recensement de l'Insee, et fait partie de la Communauté de communes Vie-et-Boulogne, qui réunit 15 communes. Avant toute proposition, nous regardons avec vous où part le temps de votre équipe.",
      "Bellevigny est à 38 km de nos bureaux, environ 40 minutes de route. Nous y venons pour des entreprises de 5 à 30 personnes : une journée de formation dans vos locaux, sur les tâches de chacun, puis, si le besoin se confirme, un système qui fait circuler l'information entre vos outils, installé chez vous avec votre équipe. Et vous gardez vos outils : nous partons de ceux que votre équipe connaît déjà.",
    ],
    faqReponse:
      "Oui. Nous rejoignons Bellevigny en 40 minutes environ depuis nos bureaux des Herbiers, pour 38 km. Nous intervenons à Belleville-sur-Vie comme à Saligny, et toujours dans vos locaux.",
    voisines: ['les-herbiers', 'la-roche-sur-yon', 'essarts-en-bocage', 'montaigu-vendee', 'chantonnay', 'clisson'],
    lat: 46.784,
    lon: -1.428,
  },
  {
    slug: 'chanverrie',
    nom: 'Chanverrie',
    a: 'à Chanverrie',
    de: 'de Chanverrie',
    departement: 'Vendée',
    minutes: 12,
    km: 12,
    surtitreLocal: 'Chanverrie, La Verrie et Chambretaud',
    voisinage: 'Là où travaille votre équipe',
    chapeau:
      "Nous formons les équipes des TPE et PME de Chanverrie à l'intelligence artificielle, et nous relions leurs logiciels pour en finir avec les ressaisies. Nos bureaux des Herbiers sont à 12 minutes : nous venons chez vous.",
    local: [
      "Chanverrie est une commune nouvelle créée le 1er janvier 2019 par la réunion de La Verrie et de Chambretaud, qui en sont devenues les communes déléguées. Elle compte 5 653 habitants au dernier recensement de l'Insee, et appartient à la Communauté de communes du Pays de Mortagne. Nous y travaillons pour des entreprises de 5 à 30 personnes, où le dirigeant veut des résultats concrets plutôt que des promesses technologiques.",
      "À 12 km de nos bureaux, Chanverrie est presque notre voisine. Nous intervenons à La Verrie comme à Chambretaud. La formation se tient dans vos locaux, sur une journée, et un système d'automatisation s'installe sur vos postes, avec votre équipe. Une question une fois le système en service se règle vite.",
    ],
    faqReponse:
      "Oui, et c'est tout près : Chanverrie est à environ 12 minutes de nos bureaux des Herbiers, soit 12 km. Nous venons à La Verrie comme à Chambretaud, et la formation comme l'installation d'un système se font chez vous.",
    voisines: ['les-herbiers', 'mortagne-sur-sevre', 'cholet', 'sevremont', 'sevremoine', 'mauleon'],
    lat: 46.958,
    lon: -0.968,
  },
];

export const VILLE_PAR_SLUG = new Map(VILLES.map((v) => [v.slug, v]));

/** Ordre du menu du pied de page : par département, puis alphabétique. */
export const DEPARTEMENTS: Ville['departement'][] = ['Vendée', 'Maine-et-Loire', 'Deux-Sèvres', 'Loire-Atlantique'];

export const villesDuDepartement = (d: Ville['departement']) =>
  VILLES.filter((v) => v.departement === d).sort((x, y) => x.nom.localeCompare(y.nom, 'fr'));
