/* Aperçu fidèle des articles dans /admin.
 *
 * Par défaut, Sveltia CMS montre à droite de l'éditeur un aperçu générique,
 * blanc, qui ne ressemble pas au blog. Ce script le remplace par le vrai
 * gabarit du site.
 *
 * Principe : plutôt que de recopier ici le HTML et le CSS de la page article
 * (qui divergeraient au premier changement de design), le script va chercher
 * une vraie page article déjà en ligne sur herone.fr, en garde la structure et
 * les feuilles de style, et remplace son contenu par celui de l'article en
 * cours d'édition. Toute évolution du gabarit dans src/pages/blog/[slug].astro
 * se retrouve donc dans l'aperçu dès le déploiement suivant, sans toucher à ce
 * fichier.
 *
 * Ce que l'aperçu reproduit : l'en-tête du site avec son menu, l'en-tête de l'article (fil d'Ariane, catégorie, temps de
 * lecture, date, titre, chapô), le sommaire numéroté, l'encart « En bref »,
 * le corps de l'article avec ses titres numérotés, l'encart rendez-vous posé
 * au même endroit que sur le site, le bloc auteur et le bandeau final. Les
 * articles liés en bas de page sont ceux de la page servant de gabarit, ils
 * ne correspondent pas à l'article édité.
 *
 * Dépendances : Sveltia CMS (qui fournit CMS, createClass et h) et marked
 * (conversion du Markdown en HTML), tous deux chargés par index.html avant ce
 * fichier.
 */
(function () {
  'use strict';

  var gabaritPromis = null;

  /* Une adresse relative de la page gabarit devient absolue, pour rester
     valable dans le cadre de l'aperçu, qui n'a pas la même adresse de base. */
  function absolue(url) {
    try {
      return new URL(url, window.location.origin).href;
    } catch (e) {
      return url;
    }
  }

  /* Trouve un article en ligne depuis la liste du blog, puis le télécharge.
     Le résultat est gardé en mémoire : une seule requête par session. */
  function chargerGabarit() {
    if (gabaritPromis) return gabaritPromis;

    gabaritPromis = fetch('/blog', { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var liste = new DOMParser().parseFromString(html, 'text/html');
        var liens = Array.prototype.map.call(
          liste.querySelectorAll('a[href^="/blog/"]'),
          function (a) { return a.getAttribute('href'); }
        );
        var adresse = liens.find(function (h) { return /^\/blog\/[a-z0-9-]+\/?$/.test(h); });
        return fetch(adresse || '/blog/devis-excel', { credentials: 'same-origin' });
      })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var bloc = doc.querySelector('.hrn-blog');
        if (!bloc) throw new Error('gabarit introuvable');

        var styles = [];
        doc.querySelectorAll('link[rel="stylesheet"], style').forEach(function (n) {
          if (n.tagName === 'LINK') {
            styles.push({ type: 'lien', valeur: absolue(n.getAttribute('href')) });
          } else {
            styles.push({ type: 'bloc', valeur: n.textContent });
          }
        });

        // L'encart rendez-vous est inséré dans la prose par le site au build.
        // On le garde de côté avant de vider la prose.
        var encart = bloc.querySelector('.hrn-prose .hrn-article-cta');
        // L'en-tête du site (logo et menu), pour un rendu identique au site.
        var entete = doc.getElementById('hrn-header');

        return {
          styles: styles,
          bloc: bloc.outerHTML,
          encart: encart ? encart.outerHTML : '',
          entete: entete ? entete.outerHTML : '',
          classeHtml: doc.documentElement.className,
          classeBody: doc.body.className,
        };
      });

    // En cas d'échec, on autorise un nouvel essai au prochain affichage.
    gabaritPromis.catch(function () { gabaritPromis = null; });
    return gabaritPromis;
  }

  /* Pose les feuilles de style du site dans le document de l'aperçu, une
     seule fois par document. */
  function injecterStyles(doc, gabarit) {
    if (!doc || doc.getElementById('herone-styles-site')) return;
    var repere = doc.createElement('meta');
    repere.id = 'herone-styles-site';
    doc.head.appendChild(repere);

    gabarit.styles.forEach(function (s) {
      var n;
      if (s.type === 'lien') {
        n = doc.createElement('link');
        n.rel = 'stylesheet';
        n.href = s.valeur;
      } else {
        n = doc.createElement('style');
        n.textContent = s.valeur;
      }
      doc.head.appendChild(n);
    });

    // Neutralise les marges et le fond par défaut du cadre de l'aperçu.
    var reset = doc.createElement('style');
    reset.textContent =
      'html,body{margin:0;padding:0}' +
      '.hrn-progression{display:none}' +
      // Les liens ne naviguent pas : un clic ne doit pas faire quitter l'aperçu.
      'a{pointer-events:none}' +
      '.herone-apercu-bandeau{position:fixed;left:16px;bottom:16px;z-index:9999;margin:0;padding:8px 14px;' +
      'border-radius:999px;font:600 12px/1.4 system-ui,sans-serif;background:#F5C451;color:#1a1a1a;' +
      'box-shadow:0 2px 8px rgba(0,0,0,.25)}';
    doc.head.appendChild(reset);

    if (gabarit.classeHtml) doc.documentElement.className = gabarit.classeHtml;
    if (gabarit.classeBody) doc.body.className = gabarit.classeBody;
  }

  /* Identifiant d'ancre proche de celui produit par Astro. */
  function ancre(texte) {
    return String(texte)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  function dateLisible(valeur) {
    if (!valeur) return { lisible: '', machine: '' };
    var d = valeur instanceof Date ? valeur : new Date(String(valeur).slice(0, 10) + 'T12:00:00');
    if (isNaN(d.getTime())) return { lisible: String(valeur), machine: '' };
    return {
      lisible: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d),
      machine: d.toISOString().slice(0, 10),
    };
  }

  /* Copie les attributs data-astro-cid-* d'un élément du gabarit sur un
     élément créé ici, pour que les styles propres au composant s'appliquent. */
  function copierCid(source, cible) {
    if (!source) return;
    Array.prototype.forEach.call(source.attributes, function (a) {
      if (a.name.indexOf('data-astro-cid') === 0) cible.setAttribute(a.name, a.value);
    });
  }

  /* Construit le HTML de l'aperçu à partir du gabarit et des champs de
     l'article. Exposée pour pouvoir être testée hors de Sveltia. */
  function construire(gabarit, donnees) {
    var doc = new DOMParser().parseFromString(gabarit.bloc, 'text/html');
    var bloc = doc.querySelector('.hrn-blog');
    var d = donnees || {};

    // En-tête
    var fil = bloc.querySelectorAll('.hrn-fil li');
    if (fil.length) fil[fil.length - 1].textContent = d.category || 'Catégorie';

    var meta = bloc.querySelector('.hrn-article-tete__meta');
    if (meta) {
      var date = dateLisible(d.pubDate);
      var time = meta.querySelector('time') || doc.createElement('time');
      time.textContent = date.lisible;
      if (date.machine) time.setAttribute('datetime', date.machine);
      meta.textContent = (d.readingTime || '?') + ' min de lecture · ';
      meta.appendChild(time);
    }

    var h1 = bloc.querySelector('.hrn-article-tete h1');
    if (h1) h1.textContent = d.title || 'Titre de l’article';
    var chapeau = bloc.querySelector('.hrn-article-tete__chapeau');
    if (chapeau) chapeau.textContent = d.description || '';

    // Corps
    var prose = bloc.querySelector('.hrn-prose');
    var corps = doc.createElement('div');
    var markdown = String(d.body || '');
    corps.innerHTML = window.marked ? window.marked.parse(markdown) : '<p>' + markdown + '</p>';

    var enfants = Array.prototype.slice.call(corps.childNodes);
    var titres = [];
    enfants.forEach(function (n, i) {
      if (n.tagName === 'H2') {
        n.id = ancre(n.textContent);
        titres.push(i);
      }
    });

    // Encart rendez-vous, même règle de placement que src/plugins/rehype-encart-rdv.mjs.
    if (gabarit.encart) {
      var position;
      if (titres.length >= 4) position = titres[2];
      else if (titres.length >= 2) position = titres[titres.length - 1];
      else position = enfants.length;
      var tmp = doc.createElement('div');
      tmp.innerHTML = gabarit.encart;
      corps.insertBefore(tmp.firstChild, enfants[position] || null);
    }

    if (prose) {
      var enbrefModele = prose.querySelector('.hrn-enbref');
      prose.innerHTML = '';

      var resume = (d.summary || []).filter(function (p) { return p && String(p).trim(); });
      if (resume.length) {
        var enbref = doc.createElement('aside');
        enbref.className = 'hrn-enbref hrn-zone-creme';
        enbref.setAttribute('aria-label', 'En bref');
        copierCid(enbrefModele || prose, enbref);
        var libelle = doc.createElement('p');
        libelle.className = 'hrn-enbref__libelle';
        libelle.textContent = 'En bref';
        copierCid(prose, libelle);
        var ol = doc.createElement('ol');
        ol.className = 'hrn-enbref__liste';
        copierCid(prose, ol);
        resume.forEach(function (phrase) {
          var li = doc.createElement('li');
          copierCid(prose, li);
          li.textContent = String(phrase);
          ol.appendChild(li);
        });
        enbref.appendChild(libelle);
        enbref.appendChild(ol);
        prose.appendChild(enbref);
      }

      while (corps.firstChild) prose.appendChild(corps.firstChild);
    }

    // Sommaires (colonne de gauche et dépliant mobile)
    var parties = Array.prototype.filter.call(prose ? prose.children : [], function (n) {
      return n.tagName === 'H2';
    });
    var libelleSommaire = 'Sommaire · ' + parties.length + ' partie' + (parties.length > 1 ? 's' : '');

    bloc.querySelectorAll('.hrn-toc__liste').forEach(function (liste) {
      var modele = liste.querySelector('li');
      if (!modele) return;
      liste.innerHTML = '';
      parties.forEach(function (h2, i) {
        var li = modele.cloneNode(true);
        var lien = li.querySelector('a');
        if (lien) {
          lien.setAttribute('href', '#' + h2.id);
          lien.setAttribute('data-toc', h2.id);
        }
        var spans = li.querySelectorAll('span');
        if (spans[0]) spans[0].textContent = String(i + 1).padStart(2, '0');
        if (spans[1]) spans[1].textContent = h2.textContent;
        liste.appendChild(li);
      });
    });
    bloc.querySelectorAll('.hrn-toc__titre').forEach(function (t) { t.textContent = libelleSommaire; });
    var resumeMobile = bloc.querySelector('.hrn-article-sommaire-mobile summary');
    if (resumeMobile && resumeMobile.firstChild && resumeMobile.firstChild.nodeType === 3) {
      resumeMobile.firstChild.textContent = libelleSommaire;
    }

    // Bandeau d'état, pour ne jamais confondre l'aperçu avec la page en ligne.
    var bandeau = d.draft
      ? 'Aperçu · brouillon, invisible sur le site'
      : 'Aperçu · en ligne, visible sur le site après enregistrement';

    return (gabarit.entete || '') + bloc.outerHTML + '<p class="herone-apercu-bandeau">' + bandeau + '</p>';
  }

  function versObjet(valeur) {
    if (valeur && typeof valeur.toJS === 'function') return valeur.toJS();
    return valeur;
  }

  window.HeroneApercu = { construire: construire, chargerGabarit: chargerGabarit };

  if (!window.CMS || !window.createClass || !window.h) return;

  var Apercu = window.createClass({
    getInitialState: function () {
      return { gabarit: null, erreur: null };
    },

    componentDidMount: function () {
      var self = this;
      chargerGabarit()
        .then(function (g) {
          // Les styles vont dans le document du cadre d'aperçu, jamais dans
          // celui de l'interface : les styles du site casseraient l'éditeur.
          if (self.props.document && self.props.document !== document) {
            injecterStyles(self.props.document, g);
          }
          self.setState({ gabarit: g });
        })
        .catch(function (e) {
          self.setState({ erreur: String(e && e.message ? e.message : e) });
        });
    },

    render: function () {
      var h = window.h;
      if (this.state.erreur) {
        return h('p', { style: { padding: '24px', fontFamily: 'system-ui' } },
          'Rendu du site indisponible (' + this.state.erreur + '). L’article reste modifiable.');
      }
      if (!this.state.gabarit) {
        return h('p', { style: { padding: '24px', fontFamily: 'system-ui' } }, 'Chargement du rendu du site…');
      }
      var donnees = versObjet(this.props.entry.get('data')) || {};
      return h('div', { dangerouslySetInnerHTML: { __html: construire(this.state.gabarit, donnees) } });
    },
  });

  window.CMS.registerPreviewTemplate('blog', Apercu);
})();
