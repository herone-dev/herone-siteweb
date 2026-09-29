/* Import direct d'un fichier .md depuis /admin.
 *
 * Contexte : les articles arrivent normalement d'une tâche programmée qui
 * écrit un fichier .md dans src/content/blog, mais un article peut aussi être
 * rédigé ailleurs (une autre tâche, un brouillon fait à la main) et avoir
 * besoin d'entrer dans le circuit habituel de relecture. Ce script ajoute un
 * champ personnalisé Sveltia CMS, `import_markdown_file`, qui laisse déposer
 * un fichier .md complet (frontmatter + corps) : les champs de l'éditeur se
 * remplissent tout seuls, et l'article importé est TOUJOURS déposé en
 * brouillon, quoi que dise le fichier, en attendant une relecture humaine.
 *
 * Fonctionnement en deux temps :
 * 1. Le champ (widget `import_markdown_file`, voir config.yml) affiche un
 *    simple sélecteur de fichier. Au choix d'un fichier, son contenu texte
 *    brut est lu côté navigateur et stocké tel quel comme valeur de CE champ
 *    (un widget personnalisé ne peut modifier que sa propre valeur, jamais
 *    directement celle d'un autre champ de la fiche). Le composant analyse
 *    aussi ce contenu, juste pour afficher un retour immédiat (titre trouvé,
 *    nombre de mots, clés ignorées) : cette analyse n'écrit rien.
 * 2. À l'enregistrement, l'évènement `preSave` relit la valeur de ce champ.
 *    Si elle contient du texte, il l'analyse une seconde fois avec le même
 *    analyseur, répartit les champs reconnus dans la fiche, force
 *    `draft: true` sans condition (un import ne doit jamais publier tout
 *    seul), et supprime la clé `import_markdown_file` de la fiche : elle ne
 *    doit jamais atterrir dans le fichier .md final, un champ inconnu du
 *    schéma Astro (src/content.config.ts) casse le build de tout le site.
 *
 * Dépendances : Sveltia CMS, qui fournit CMS, createClass, h et rf (voir
 * index.html, ce script doit charger après lui).
 *
 * Analyseur de frontmatter : volontairement pas une bibliothèque YAML
 * complète (ce fichier reste statique, servi depuis /public, sans étape de
 * build, donc sans nouvelle dépendance npm). Il ne comprend que le
 * sous-ensemble que ce projet écrit réellement : délimiteurs `---` en tête de
 * fichier, paires `clé: valeur`, chaînes entre guillemets simples ou doubles,
 * tableaux en ligne (`["a", "b"]` ou `[a, b]`), séquences YAML en bloc
 * (`clé:` seule puis des lignes `  - "élément"`, la forme que le widget liste
 * utilise pour `summary` et `tags`), booléens et entiers.
 */
(function () {
  'use strict';

  // Clés du frontmatter que cet import a le droit de reporter dans la fiche.
  // Reprend exactement les champs facultatifs et obligatoires de
  // src/content.config.ts, à l'exception de `draft` (toujours forcé à true,
  // jamais repris du fichier importé) et de `cover` (toléré par le schéma
  // mais plus lu, on ne le fait pas revivre). Toute autre clé du fichier
  // importé est ignorée : elle est seulement signalée dans le retour visuel,
  // jamais écrite, un champ hors schéma cassant le build de tout le site.
  var CLES_AUTORISEES = [
    'title', 'description', 'pubDate', 'updatedDate', 'author', 'image',
    'tags', 'category', 'readingTime', 'systemTitle', 'summary',
  ];

  /* Analyse une valeur scalaire ou un tableau en ligne ("[a, b]"). */
  function analyserValeur(chaineBrute) {
    var s = String(chaineBrute == null ? '' : chaineBrute).trim();
    if (s === '') return '';

    if (s.charAt(0) === '[' && s.charAt(s.length - 1) === ']') {
      var interieur = s.slice(1, -1).trim();
      if (interieur === '') return [];
      return decouperListeEnLigne(interieur).map(analyserValeur);
    }

    var doubles = s.match(/^"((?:[^"\\]|\\.)*)"$/);
    if (doubles) return doubles[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

    var simples = s.match(/^'(.*)'$/);
    if (simples) return simples[1].replace(/''/g, "'");

    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);

    return s;
  }

  /* Découpe l'intérieur d'un tableau en ligne par les virgules, sans casser
     une virgule à l'intérieur d'une chaîne entre guillemets. */
  function decouperListeEnLigne(interieur) {
    var items = [];
    var actuel = '';
    var dansGuillemets = null;
    for (var i = 0; i < interieur.length; i++) {
      var c = interieur.charAt(i);
      if (dansGuillemets) {
        actuel += c;
        if (c === dansGuillemets) dansGuillemets = null;
      } else if (c === '"' || c === "'") {
        dansGuillemets = c;
        actuel += c;
      } else if (c === ',') {
        items.push(actuel);
        actuel = '';
      } else {
        actuel += c;
      }
    }
    if (actuel.trim() !== '') items.push(actuel);
    return items;
  }

  /* Analyse brute : sépare le frontmatter (entre les deux lignes `---`) du
     corps, et renvoie les clés telles qu'écrites dans le fichier, sans
     filtrage. Lève une erreur si le fichier commence par un frontmatter
     jamais refermé. Un fichier sans frontmatter du tout n'est pas une
     erreur : tout son contenu devient le corps. */
  function analyserBrut(texteBrut) {
    var texte = String(texteBrut == null ? '' : texteBrut)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    var lignes = texte.split('\n');

    var i = 0;
    while (i < lignes.length && lignes[i].trim() === '') i++;

    if (i >= lignes.length || lignes[i].trim() !== '---') {
      return { donnees: {}, corps: texte.trim() };
    }

    var debut = i + 1;
    var fin = -1;
    for (var j = debut; j < lignes.length; j++) {
      if (lignes[j].trim() === '---') { fin = j; break; }
    }
    if (fin === -1) {
      throw new Error('frontmatter non refermé (second « --- » introuvable)');
    }

    var lignesFrontmatter = lignes.slice(debut, fin);
    var corps = lignes.slice(fin + 1).join('\n').trim();
    var donnees = {};

    var k = 0;
    while (k < lignesFrontmatter.length) {
      var ligne = lignesFrontmatter[k];
      if (ligne.trim() === '') { k++; continue; }

      var correspondance = ligne.match(/^([A-Za-z_][A-Za-z0-9_]*):[ \t]?(.*)$/);
      if (!correspondance) { k++; continue; }

      var cle = correspondance[1];
      var reste = correspondance[2];

      if (reste.trim() === '') {
        // Une valeur vide juste après « clé: » peut annoncer une séquence
        // YAML en bloc (les lignes indentées « - élément » qui suivent).
        var items = [];
        var m = k + 1;
        while (m < lignesFrontmatter.length && /^\s+-[ \t]?/.test(lignesFrontmatter[m])) {
          items.push(analyserValeur(lignesFrontmatter[m].replace(/^\s+-[ \t]?/, '')));
          m++;
        }
        donnees[cle] = items.length > 0 ? items : '';
        k = m > k + 1 ? m : k + 1;
        continue;
      }

      donnees[cle] = analyserValeur(reste);
      k++;
    }

    return { donnees: donnees, corps: corps };
  }

  /* Point d'entrée public : analyse un fichier .md complet et ne renvoie que
     les clés que le schéma Astro connaît. `ignorees` liste les clés du
     fichier qui ne sont pas reportées (dont `draft`, toujours forcé côté
     preSave, jamais repris du fichier). */
  function analyser(texteBrut) {
    var brut = analyserBrut(texteBrut);
    var frontmatter = {};
    var ignorees = [];

    Object.keys(brut.donnees).forEach(function (cle) {
      if (CLES_AUTORISEES.indexOf(cle) !== -1) {
        frontmatter[cle] = brut.donnees[cle];
      } else {
        ignorees.push(cle);
      }
    });

    return { frontmatter: frontmatter, body: brut.corps, ignorees: ignorees };
  }

  function compterMots(texte) {
    var t = (texte || '').trim();
    return t === '' ? 0 : t.split(/\s+/).length;
  }

  // Exposé pour un débogage éventuel depuis la console, sur le même principe
  // que window.HeroneApercu dans apercu.js.
  window.HeroneImportMd = { analyser: analyser };

  if (!window.CMS || !window.createClass || !window.h) return;

  var Champ = window.createClass({
    getInitialState: function () {
      return { nomFichier: null, erreur: null, apercu: null, ignorees: [] };
    },

    gererFichier: function (evenement) {
      var fichier = evenement.target.files && evenement.target.files[0];
      if (!fichier) return;

      var self = this;
      var lecteur = new FileReader();

      lecteur.onload = function () {
        var texte = String(lecteur.result || '');
        try {
          var resultat = analyser(texte);
          self.setState({
            nomFichier: fichier.name,
            erreur: null,
            apercu: {
              titre: resultat.frontmatter.title || '(titre introuvable dans le fichier)',
              mots: compterMots(resultat.body),
            },
            ignorees: resultat.ignorees,
          });
          self.props.onChange(texte);
        } catch (e) {
          self.setState({
            nomFichier: fichier.name,
            erreur: e && e.message ? e.message : String(e),
            apercu: null,
            ignorees: [],
          });
        }
      };

      lecteur.onerror = function () {
        self.setState({
          nomFichier: fichier.name,
          erreur: 'La lecture du fichier a échoué.',
          apercu: null,
          ignorees: [],
        });
      };

      lecteur.readAsText(fichier);
    },

    annulerImport: function () {
      this.setState({ nomFichier: null, erreur: null, apercu: null, ignorees: [] });
      this.props.onChange('');
    },

    render: function () {
      var h = window.h;
      var enfants = [];

      enfants.push(h('input', {
        key: 'entree',
        type: 'file',
        accept: '.md,.markdown,text/markdown,text/plain',
        id: this.props.forID,
        className: this.props.classNameWrapper,
        onChange: this.gererFichier,
      }));

      if (this.props.value) {
        enfants.push(h('button', {
          key: 'annuler',
          type: 'button',
          onClick: this.annulerImport,
          style: { marginLeft: '10px' },
        }, "Annuler l'import"));
      }

      var style = { marginTop: '8px', fontSize: '13px', lineHeight: 1.4 };

      if (this.state.erreur) {
        enfants.push(h('p', { key: 'erreur', style: Object.assign({ color: '#b3261e' }, style) },
          'Fichier non reconnu (' + this.state.erreur + '). Les champs ci-dessous restent inchangés.'));
      } else if (this.state.apercu) {
        var lignes = [
          'Fichier lu : ' + this.state.nomFichier + '.',
          'Titre trouvé : ' + this.state.apercu.titre + '.',
          this.state.apercu.mots + ' mot(s) dans le corps.',
        ];
        if (this.state.ignorees.length > 0) {
          lignes.push('Clés ignorées (non reprises) : ' + this.state.ignorees.join(', ') + '.');
        }
        lignes.push('Les champs ci-dessous seront remplis automatiquement à l\'enregistrement, en brouillon.');
        enfants.push(h('p', { key: 'apercu', style: style }, lignes.join(' ')));
      }

      return h('div', {}, enfants);
    },
  });

  window.CMS.registerFieldType('import_markdown_file', Champ);

  window.CMS.registerEventListener({
    name: 'preSave',
    handler: function (args) {
      var entry = args.entry;
      var donnees = entry.get('data') || {};
      var brutImporte = donnees.import_markdown_file;

      if (typeof brutImporte !== 'string' || brutImporte.trim() === '') {
        return undefined;
      }

      var resultat;
      try {
        resultat = analyser(brutImporte);
      } catch (e) {
        // Analyse impossible : on n'écrase rien, l'utilisateur reste libre
        // de corriger le fichier ou de renseigner les champs à la main.
        return undefined;
      }

      var nouvellesDonnees = {};
      Object.keys(donnees).forEach(function (cle) { nouvellesDonnees[cle] = donnees[cle]; });
      Object.keys(resultat.frontmatter).forEach(function (cle) {
        nouvellesDonnees[cle] = resultat.frontmatter[cle];
      });
      if (resultat.body) {
        nouvellesDonnees.body = resultat.body;
      }

      // Un import n'est jamais publié tout seul, quoi que dise le fichier.
      nouvellesDonnees.draft = true;

      // Ce champ ne fait pas partie du schéma Astro : il ne doit jamais être
      // écrit dans le fichier .md, sous peine de casser le build du site.
      delete nouvellesDonnees.import_markdown_file;

      return entry.set('data', nouvellesDonnees);
    },
  });
})();
