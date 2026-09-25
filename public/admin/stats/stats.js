/* Page Statistiques de /admin.
 *
 * Lit /api/stats (fonction Netlify netlify/functions/stats.mjs) avec le jeton
 * GitHub de la session /admin, et /rss.xml pour la liste des articles en
 * ligne. Aucun jeton Google ne passe par le navigateur.
 */
(function () {
  'use strict';

  var etat = { jours: 28, perimetre: 'site', donnees: null, articles: [], tri: { cle: 'impressions', sens: -1 }, triPages: { cle: 'vues', sens: -1 }, filtreBoutons: 'tous', detail: null };
  var $ = function (s) { return document.querySelector(s); };

  /* ---------- Jeton GitHub de la session /admin ---------- */

  function jetonGitHub() {
    var cles = ['sveltia-cms.user', 'decap-cms-user', 'netlify-cms-user'];
    for (var i = 0; i < cles.length; i++) {
      try {
        var v = JSON.parse(localStorage.getItem(cles[i]) || 'null');
        if (v && v.token) return v.token;
      } catch (e) { /* suivant */ }
    }
    return null;
  }

  /* ---------- Formats ---------- */

  var nf = new Intl.NumberFormat('fr-FR');
  function nombre(n) { return n == null || isNaN(n) ? '–' : nf.format(Math.round(n)); }
  function pourcent(x, dec) { return x == null || isNaN(x) ? '–' : (x * 100).toFixed(dec == null ? 1 : dec).replace('.', ',') + ' %'; }
  function position(p) { return p == null || isNaN(p) ? '–' : p.toFixed(1).replace('.', ','); }
  function duree(s) {
    if (s == null || isNaN(s) || s <= 0) return '–';
    var m = Math.floor(s / 60), r = Math.round(s % 60);
    return m ? m + ' min ' + (r < 10 ? '0' : '') + r + ' s' : r + ' s';
  }
  function dateCourte(iso) {
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  function echapper(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function delta(actuel, precedent, inverse, format) {
    if (precedent == null || actuel == null || !precedent) return '<p class="tuile__delta">Pas de comparaison</p>';
    var ecart = (actuel - precedent) / precedent;
    var mieux = inverse ? ecart < 0 : ecart > 0;
    var classe = Math.abs(ecart) < 0.005 ? '' : (mieux ? 'hausse' : 'baisse');
    var signe = ecart > 0 ? '+' : '';
    return '<p class="tuile__delta ' + classe + '">' + signe + (ecart * 100).toFixed(0) + ' % vs période précédente (' + format(precedent) + ')</p>';
  }

  function tuile(libelle, valeur, deltaHtml, aide) {
    return '<div class="tuile"><p class="tuile__libelle">' + libelle + '</p><p class="tuile__valeur">' + valeur + '</p>' +
      (deltaHtml || '') + (aide ? '<p class="tuile__aide">' + aide + '</p>' : '') + '</div>';
  }

  /* ---------- Chargement ---------- */

  function chargerArticles() {
    return fetch('/rss.xml').then(function (r) { return r.text(); }).then(function (xml) {
      var doc = new DOMParser().parseFromString(xml, 'application/xml');
      return Array.prototype.map.call(doc.querySelectorAll('item'), function (it) {
        var lien = (it.querySelector('link') || {}).textContent || '';
        var chemin = lien;
        try { chemin = new URL(lien).pathname.replace(/\/+$/, ''); } catch (e) { /* tel quel */ }
        return {
          titre: (it.querySelector('title') || {}).textContent || chemin,
          chemin: chemin,
          date: (it.querySelector('pubDate') || {}).textContent || '',
        };
      });
    }).catch(function () { return []; });
  }

  function appeler(params) {
    var jeton = jetonGitHub();
    if (!jeton) {
      return Promise.reject(new Error('Connectez-vous d\'abord à l\'interface d\'édition (bouton « Se connecter avec GitHub » sur /admin), puis revenez sur cette page.'));
    }
    return fetch('/api/stats?' + new URLSearchParams(params).toString(), {
      headers: { authorization: 'Bearer ' + jeton },
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.erreur || ('Erreur ' + r.status + '. La fonction de statistiques est-elle déployée ?'));
        return d;
      });
    });
  }

  function charger(frais) {
    $('#etat').textContent = 'Chargement des statistiques…';
    var params = { jours: etat.jours };
    if (frais) params.frais = '1';
    return Promise.all([appeler(params), etat.articles.length ? etat.articles : chargerArticles()])
      .then(function (res) {
        etat.donnees = res[0];
        etat.articles = res[1];
        afficher();
        var ouvert = new URLSearchParams(location.search).get('article');
        if (ouvert && !etat.detail) ouvrirDetail('/blog/' + ouvert);
        else if (etat.detail) ouvrirDetail(etat.detail);
      })
      .catch(function (e) {
        $('#etat').textContent = '';
        $('#alertes').innerHTML = '<div class="alerte"><strong>Statistiques indisponibles</strong><p>' + echapper(e.message) + '</p></div>';
      });
  }

  /* ---------- Agrégats ---------- */

  function pagesFusionnees() {
    var d = etat.donnees, pages = {};
    var gsc = (d.searchConsole && d.searchConsole.pages) || {};
    var ga = (d.analytics && d.analytics.pages) || {};
    Object.keys(gsc).forEach(function (c) { pages[c] = { chemin: c, gsc: gsc[c], ga: null }; });
    Object.keys(ga).forEach(function (c) { pages[c] = pages[c] || { chemin: c, gsc: null }; pages[c].ga = ga[c]; });
    etat.articles.forEach(function (a) {
      pages[a.chemin] = pages[a.chemin] || { chemin: a.chemin, gsc: null, ga: null };
      pages[a.chemin].titre = a.titre;
      pages[a.chemin].article = true;
    });
    return Object.keys(pages).map(function (c) {
      var p = pages[c], g = p.gsc || {}, a = p.ga || {}, ev = a.evenements || {};
      return {
        chemin: c,
        titre: p.titre || NOMS_PAGES[c] || c,
        article: !!p.article || /^\/blog\/.+/.test(c),
        impressions: g.impressions || 0,
        clics: g.clics || 0,
        ctr: g.impressions ? g.clics / g.impressions : null,
        position: g.position == null ? null : g.position,
        visiteurs: a.visiteurs || 0,
        vues: a.vues || 0,
        entrees: a.entrees || 0,
        rebond: a.tauxRebond == null ? null : a.tauxRebond,
        reservesPage: ev.rdv_reserve || 0,
        appels: ev.clic_telephone || 0,
        emails: ev.clic_email || 0,
        temps: a.tempsMoyen || 0,
        engagement: a.tauxEngagement == null ? null : a.tauxEngagement,
        lectures: ev.lecture_article || 0,
        rdv: ev.clic_rdv || 0,
        reserves: ev.rdv_reserve || 0,
        internes: ev.clic_lien_interne || 0,
        sortants: ev.clic_sortant || 0,
        tel: (ev.clic_telephone || 0) + (ev.clic_email || 0),
        mi: ev.defilement || 0,
        evenements: ev,
      };
    });
  }

  function sommeBlog(lignes) {
    var s = { impressions: 0, clics: 0, sommePos: 0, visiteurs: 0, vues: 0, tempsTotal: 0, rdv: 0, reserves: 0, tel: 0, lectures: 0 };
    lignes.filter(function (l) { return l.article || l.chemin === '/blog'; }).forEach(function (l) {
      s.impressions += l.impressions; s.clics += l.clics; s.sommePos += (l.position || 0) * l.impressions;
      s.visiteurs += l.visiteurs; s.vues += l.vues; s.tempsTotal += l.temps * l.visiteurs;
      s.rdv += l.rdv; s.reserves += l.reserves; s.tel += l.tel; s.lectures += l.lectures;
    });
    return s;
  }

  /* ---------- Affichage ---------- */

  function afficher() {
    var d = etat.donnees;
    var p = d.periode;
    $('#etat').textContent = 'Du ' + new Date(p.debut + 'T12:00:00').toLocaleDateString('fr-FR') + ' au ' +
      new Date(p.fin + 'T12:00:00').toLocaleDateString('fr-FR') + ' · données du ' +
      new Date(d.genereLe).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) + (d.cache ? ' (mémoire de 10 min)' : '');

    $('#alertes').innerHTML = (d.erreurs || []).map(function (e) {
      return '<div class="alerte"><strong>Une source ne répond pas</strong><p>' + echapper(e) + '</p><p>Le reste de la page s\'affiche avec l\'autre source. Voir le tutoriel de mise en place, partie « Google ».</p></div>';
    }).join('');

    var lignes = pagesFusionnees();
    afficherTuiles(lignes);
    afficherCourbes();
    afficherTables(lignes);
    afficherConversions(lignes);
    afficherProvenance();
  }

  /* ---------- Libellés ---------- */

  var NOMS_PAGES = {
    '/': 'Accueil', '/formation': 'Formation IA', '/automatisation': 'Automatisation', '/blog': 'Blog (liste des articles)',
    '/mentions-legales': 'Mentions légales', '/confidentialite': 'Confidentialité', '/cookies': 'Cookies',
  };
  function nomPage(chemin) {
    if (NOMS_PAGES[chemin]) return NOMS_PAGES[chemin];
    var a = etat.articles.filter(function (x) { return x.chemin === chemin; })[0];
    return a ? a.titre : chemin;
  }

  var IA = { 'chatgpt.com': 'ChatGPT', 'chat.openai.com': 'ChatGPT', 'perplexity.ai': 'Perplexity', 'www.perplexity.ai': 'Perplexity',
    'gemini.google.com': 'Gemini', 'copilot.microsoft.com': 'Copilot', 'claude.ai': 'Claude', 'chat.mistral.ai': 'Le Chat (Mistral)' };
  var RESEAUX = { 'linkedin.com': 'LinkedIn', 'www.linkedin.com': 'LinkedIn', 'lnkd.in': 'LinkedIn', linkedin: 'LinkedIn',
    'facebook.com': 'Facebook', 'm.facebook.com': 'Facebook', 'l.facebook.com': 'Facebook', 'lm.facebook.com': 'Facebook', facebook: 'Facebook',
    'instagram.com': 'Instagram', 'l.instagram.com': 'Instagram', instagram: 'Instagram', 'youtube.com': 'YouTube', 'm.youtube.com': 'YouTube',
    't.co': 'X (Twitter)', 'x.com': 'X (Twitter)' };
  var SUPPORTS = { organic: 'recherche', referral: 'lien depuis un site', social: 'réseau social', email: 'e-mail', cpc: 'annonce payante', '(none)': '', '(not set)': '' };

  /* Nom lisible d'une source GA4 (sessionSource / sessionMedium). */
  function nomSource(source, support) {
    if (source === '(direct)') return 'Accès direct <span class="chemin">adresse tapée, favori, lien dans un document ou une messagerie</span>';
    if (IA[source]) return echapper(IA[source]) + ' <span class="etiquette">assistant IA</span>';
    if (RESEAUX[source]) return echapper(RESEAUX[source]) + (support === 'cpc' ? ' <span class="chemin">annonce</span>' : '');
    if (/^(google|bing|duckduckgo|qwant|yahoo|ecosia|yandex|baidu)$/.test(source)) {
      var moteur = source === 'google' ? 'Google' : source.charAt(0).toUpperCase() + source.slice(1);
      return moteur + ' <span class="chemin">' + (support === 'cpc' ? 'annonce payante' : 'recherche') + '</span>';
    }
    var s = SUPPORTS[support] != null ? SUPPORTS[support] : support;
    return echapper(source) + (s ? ' <span class="chemin">' + echapper(s) + '</span>' : '');
  }

  var NOMS_APPAREILS = { desktop: 'Ordinateur', mobile: 'Téléphone', tablet: 'Tablette', smarttv: 'Télévision' };
  var NOMS_FIDELITE = { new: 'Nouveaux visiteurs', returning: 'Visiteurs déjà venus', '(not set)': 'Non déterminé' };
  var JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var TYPES_BOUTONS = {
    clic_rdv: 'Prise de RDV', clic_telephone: 'Téléphone', clic_email: 'E-mail', clic_bouton: 'Autre bouton', file_download: 'Téléchargement',
  };

  /* ---------- Petits composants ---------- */

  function bloc(titre, sous, contenu, classe) {
    return '<div class="bloc' + (classe ? ' ' + classe : '') + '"><h3>' + titre + '</h3>' + (sous ? '<p class="sous">' + sous + '</p>' : '') + contenu + '</div>';
  }
  // Les colonnes de texte sont alignées à gauche, les colonnes de chiffres à droite.
  function estChiffre(html) { return /^[\d\s.,%–+-]*(min|s|ms)?[\d\s.,%s]*$/.test(String(html).replace(/<[^>]+>/g, '').replace(/\u00a0|\u202f/g, ' ').trim()); }
  function petitTableau(entetes, lignes, vide) {
    if (!lignes.length) return '<p class="note">' + (vide || 'Rien sur la période.') + '</p>';
    var texte = entetes.map(function (e, i) { return !lignes.every(function (l) { return estChiffre(l[i]); }); });
    return '<div class="defile"><table><thead><tr>' + entetes.map(function (e, i) { return '<th' + (texte[i] ? ' class="g"' : '') + '>' + e + '</th>'; }).join('') +
      '</tr></thead><tbody>' + lignes.map(function (l) { return '<tr class="fixe">' + l.map(function (c, i) { return '<td' + (texte[i] ? ' class="g"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function barres(liste, libelle, valeur, format) {
    if (!liste.length) return '<p class="note">Pas encore de données.</p>';
    var max = Math.max.apply(null, liste.map(valeur).concat([1]));
    var total = liste.reduce(function (s, x) { return s + valeur(x); }, 0) || 1;
    return '<ul class="barres">' + liste.map(function (x) {
      var v = valeur(x);
      return '<li><span>' + libelle(x) + '</span><span class="barre"><span style="width:' + (100 * v / max).toFixed(1) + '%"></span></span><span>' +
        (format ? format(v) : nombre(v)) + ' <small>' + pourcent(v / total, 0) + '</small></span></li>';
    }).join('') + '</ul>';
  }
  function pageLien(chemin) {
    return '<span class="titre-court">' + echapper(nomPage(chemin)) + '</span>' + (nomPage(chemin) !== chemin ? '<span class="chemin">' + echapper(chemin) + '</span>' : '');
  }
  function contacts(ev) {
    return (ev.clic_rdv || 0) + (ev.clic_telephone || 0) + (ev.clic_email || 0);
  }

  /* ---------- Conversions et boutons ---------- */

  function afficherConversions(lignes) {
    var a = etat.donnees.analytics;
    if (!a) { $('#conversions').innerHTML = '<p class="note">Google Analytics non connecté.</p>'; return; }
    var t = a.total, ev = t.evenements || {};
    var ht = '';

    // Tunnel de prise de rendez-vous et contacts directs
    var etapes = [
      ['Visiteurs du site', t.visiteurs],
      ['Clics vers la prise de RDV', ev.clic_rdv || 0],
      ['Agenda Calendly affiché', ev.rdv_agenda_affiche || 0],
      ['Créneau choisi', ev.rdv_creneau_choisi || 0],
      ['RDV réservé', ev.rdv_reserve || 0],
    ];
    var max = Math.max(1, t.visiteurs);
    var tunnel = '<ul class="entonnoir">' + etapes.map(function (e, i) {
      return '<li><span>' + e[0] + '</span><strong>' + nombre(e[1]) + (i && t.visiteurs ? ' <small>' + pourcent(e[1] / t.visiteurs, 1) + ' des visiteurs</small>' : '') + '</strong>' +
        '<span class="barre"><span style="width:' + Math.min(100, 100 * e[1] / max).toFixed(1) + '%"></span></span></li>';
    }).join('') + '</ul>';
    var directs = '<div class="mini-tuiles">' +
      '<div><span>Clics sur le téléphone</span><strong>' + nombre(ev.clic_telephone || 0) + '</strong></div>' +
      '<div><span>Clics sur l\'e-mail</span><strong>' + nombre(ev.clic_email || 0) + '</strong></div>' +
      '<div><span>Taux de contact</span><strong>' + pourcent(t.sessions ? ((ev.rdv_reserve || 0) + (ev.clic_telephone || 0) + (ev.clic_email || 0)) / t.sessions : null, 1) + '</strong><small>RDV réservés, appels et e-mails ÷ sessions</small></div>' +
      '</div>';
    ht += bloc('Tunnel de prise de rendez-vous', 'De la visite au rendez-vous réservé, et les contacts directs', '<div class="deux"><div>' + tunnel + '</div>' + directs + '</div>', 'large');

    // Boutons
    var b = a.boutons;
    var contenuBoutons;
    if (!b) contenuBoutons = '<p class="note">Pas de données.</p>';
    else if (b.erreur) contenuBoutons = '<p class="note">' + echapper(b.erreur) + '</p>';
    else {
      var vuesParPage = {};
      lignes.forEach(function (l) { vuesParPage[l.chemin] = l.vues; });
      var filtre = etat.filtreBoutons;
      var liste = b.filter(function (x) { return filtre === 'tous' || x.evenement === filtre || (filtre === 'autres' && ['clic_bouton', 'file_download'].indexOf(x.evenement) >= 0); });
      var totalClics = liste.reduce(function (s, x) { return s + x.nombre; }, 0);
      contenuBoutons = '<div class="filtres" role="group" aria-label="Type de bouton">' +
        [['tous', 'Tous'], ['clic_rdv', 'Prise de RDV'], ['clic_telephone', 'Téléphone'], ['clic_email', 'E-mail'], ['autres', 'Autres']].map(function (f) {
          return '<button type="button" data-filtre-boutons="' + f[0] + '" aria-pressed="' + (filtre === f[0]) + '">' + f[1] + '</button>';
        }).join('') + '</div>' +
        petitTableau(['Bouton ou lien', 'Type', 'Emplacement', 'Page', 'Clics', 'Part', 'Taux de clic'], liste.slice(0, 60).map(function (x) {
          var texte = x.texte && x.texte !== '(not set)' ? '« ' + echapper(x.texte) + ' »' : '<span class="chemin">sans texte</span>';
          var vues = vuesParPage[x.page] || 0;
          return [texte, echapper(TYPES_BOUTONS[x.evenement] || x.evenement), echapper(NOMS_ZONES[x.zone] || (x.zone === '(not set)' ? '–' : x.zone)),
            pageLien(x.page), nombre(x.nombre), pourcent(totalClics ? x.nombre / totalClics : null, 0), vues ? pourcent(x.nombre / vues, 1) : '–'];
        }), 'Aucun clic sur ce type de bouton pendant la période.') +
        '<p class="note">Taux de clic : clics sur le bouton ÷ pages vues de la page où il se trouve.</p>';
    }
    ht += bloc('Boutons et liens d\'action', 'Chaque bouton cliqué, où il se trouve, et combien de fois', contenuBoutons, 'large');

    // Pages qui génèrent des contacts
    var pagesContact = lignes.filter(function (l) { return l.vues || contacts(l.evenements); })
      .map(function (l) { return { l: l, n: contacts(l.evenements) + (l.evenements.rdv_reserve || 0) }; })
      .sort(function (x, y) { return y.n - x.n || y.l.vues - x.l.vues; }).slice(0, 25);
    ht += bloc('Pages qui amènent au contact', 'Clics vers le RDV, appels et e-mails, par page', petitTableau(
      ['Page', 'Vues', 'Clics RDV', 'Appels', 'E-mails', 'RDV réservés', 'Taux d\'action'],
      pagesContact.map(function (x) {
        var e = x.l.evenements;
        return [pageLien(x.l.chemin), nombre(x.l.vues), nombre(e.clic_rdv || 0), nombre(e.clic_telephone || 0), nombre(e.clic_email || 0), nombre(e.rdv_reserve || 0),
          x.l.vues ? pourcent(contacts(e) / x.l.vues, 1) : '–'];
      })) + '<p class="note">Taux d\'action : clics RDV, appels et e-mails ÷ pages vues.</p>', 'large');

    // Sources qui génèrent des contacts
    var src = (a.sources || []).map(function (s) { return { s: s, n: contacts(s.actions) + (s.actions.rdv_reserve || 0) }; })
      .sort(function (x, y) { return y.n - x.n || y.s.sessions - x.s.sessions; }).slice(0, 20);
    ht += bloc('Sources qui amènent au contact', 'D\'où venaient les visiteurs qui ont cliqué', petitTableau(
      ['Source', 'Sessions', 'Clics RDV', 'Appels et e-mails', 'RDV réservés', 'Taux'],
      src.map(function (x) {
        var e = x.s.actions;
        return [nomSource(x.s.source, x.s.support), nombre(x.s.sessions), nombre(e.clic_rdv || 0), nombre((e.clic_telephone || 0) + (e.clic_email || 0)),
          nombre(e.rdv_reserve || 0), x.s.sessions ? pourcent(contacts(e) / x.s.sessions, 1) : '–'];
      })) + '<p class="note">Taux : clics RDV, appels et e-mails ÷ sessions de la source.</p>', 'large');

    $('#conversions').innerHTML = ht;
  }

  /* ---------- Provenance ---------- */

  function afficherProvenance() {
    var d = etat.donnees, a = d.analytics, g = d.searchConsole;
    var ht = '';

    ht += bloc('Canaux', 'Les grandes familles de provenance, en sessions', a ? barres((a.canaux || []).slice().sort(function (x, y) { return y.sessions - x.sessions; }),
      function (c) { return echapper(NOMS_CANAUX[c.canal] || c.canal); }, function (c) { return c.sessions; }) : '<p class="note">Google Analytics non connecté.</p>');

    if (a) {
      ht += bloc('Appareils', 'Sessions par type d\'appareil', barres(a.appareils || [], function (x) { return echapper(NOMS_APPAREILS[x.appareil] || x.appareil); }, function (x) { return x.sessions; }));
      ht += bloc('Nouveaux ou déjà venus', 'Visiteurs', barres(a.fidelite || [], function (x) { return echapper(NOMS_FIDELITE[x.type] || x.type); }, function (x) { return x.visiteurs; }));
    }
    ht += bloc('Sources précises', 'Le site, le moteur, le réseau ou l\'assistant IA d\'où arrive chaque visite', a ? petitTableau(
      ['Source', 'Sessions', 'Visiteurs', 'Engagement', 'Temps moyen', 'Conversions'],
      (a.sources || []).slice(0, 30).map(function (s) {
        return [nomSource(s.source, s.support), nombre(s.sessions), nombre(s.visiteurs), pourcent(s.tauxEngagement, 0), duree(s.tempsMoyen), nombre(s.conversions)];
      })) : '', 'large');

    ht += bloc('Recherches Google', 'Ce que les gens ont tapé dans Google avant de voir le site', g ? petitTableau(
      ['Requête', 'Impressions', 'Clics', 'CTR', 'Position'],
      (g.requetes || []).slice(0, 30).map(function (r) { return [echapper(r.requete), nombre(r.impressions), nombre(r.clics), pourcent(r.ctr), position(r.position)]; }),
      'Aucune requête sur la période. Google masque aussi les requêtes trop rares.') : '<p class="note">Search Console non connectée.</p>', 'large');

    ht += bloc('Pages d\'entrée', 'La première page vue de chaque visite', a ? petitTableau(
      ['Page', 'Entrées', 'Engagement', 'Rebond', 'Conversions'],
      (a.pagesEntree || []).slice(0, 20).map(function (p) { return [pageLien(p.page), nombre(p.sessions), pourcent(p.tauxEngagement, 0), pourcent(p.tauxRebond, 0), nombre(p.conversions)]; }))
      + '<p class="note">Rebond : visite de moins de 10 secondes, sur une seule page, sans action.</p>' : '', 'large');

    if (a) {
      ht += bloc('Villes', 'Sessions par ville, déduite de l\'adresse IP (approximatif, souvent la ville de l\'opérateur)',
        barres((a.villes || []).slice(0, 12), function (x) { return echapper(x.ville === '(not set)' ? 'Non déterminée' : x.ville); }, function (x) { return x.sessions; }));
      ht += bloc('Jours de la semaine', 'Sessions', barres((a.joursSemaine || []).slice().sort(function (x, y) { return ((x.jour + 6) % 7) - ((y.jour + 6) % 7); }),
        function (x) { return JOURS[x.jour] || x.jour; }, function (x) { return x.sessions; }));
      ht += bloc('Heures de la journée', 'Sessions, selon le fuseau horaire de Google Analytics', histogramme(a.heures || []));
      var camp = a.campagnes || [];
      ht += bloc('Campagnes', 'Liens suivis avec des paramètres UTM', camp.length ? petitTableau(['Campagne', 'Source', 'Sessions', 'Conversions'],
        camp.map(function (c) { return [echapper(c.campagne), nomSource(c.source, c.support), nombre(c.sessions), nombre(c.conversions)]; }))
        : '<p class="note">Aucune campagne sur la période. Pour savoir exactement quel post LinkedIn, quel e-mail ou quelle signature amène des visites, ajoutez à vos liens : <code>?utm_source=linkedin&amp;utm_medium=social&amp;utm_campaign=nom-du-post</code>. Chaque campagne apparaîtra ici.</p>');
    }
    $('#provenance').innerHTML = ht;
  }

  function histogramme(heures) {
    if (!heures.length) return '<p class="note">Pas encore de données.</p>';
    var par = {}; heures.forEach(function (h) { par[h.heure] = h.sessions; });
    var max = Math.max.apply(null, heures.map(function (h) { return h.sessions; }).concat([1]));
    var cols = '';
    for (var h = 0; h < 24; h++) {
      var v = par[h] || 0;
      cols += '<span class="col" title="' + h + ' h : ' + nombre(v) + ' sessions"><span style="height:' + (100 * v / max).toFixed(1) + '%"></span></span>';
    }
    return '<div class="histo">' + cols + '</div><div class="histo-axe"><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>23 h</span></div>';
  }

  /* ---------- Configuration GA4 en un clic ---------- */

  function installer() {
    var bouton = $('#installer');
    bouton.disabled = true;
    bouton.textContent = 'Configuration en cours…';
    var jeton = jetonGitHub();
    fetch('/api/stats?action=installer', { method: 'POST', headers: { authorization: 'Bearer ' + jeton } })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error(d.erreur || 'Erreur ' + r.status); return d; }); })
      .then(function (d) {
        $('#alertes').insertAdjacentHTML('afterbegin', '<div class="installation"><strong>Configuration de Google Analytics</strong><ul>' +
          d.etapes.map(function (e) { return '<li class="' + (e.ok ? '' : 'ko') + '">' + (e.ok ? '✓ ' : '✗ ') + echapper(e.libelle) + ' : ' + echapper(e.detail) + '</li>'; }).join('') +
          '</ul><p class="note">Les nouvelles dimensions se remplissent à partir de maintenant, pas en arrière.</p></div>');
      })
      .catch(function (e) {
        $('#alertes').insertAdjacentHTML('afterbegin', '<div class="alerte"><strong>Configuration impossible</strong><p>' + echapper(e.message) + '</p></div>');
      })
      .then(function () { bouton.disabled = false; bouton.textContent = 'Configurer Google Analytics'; });
  }

  function afficherTuiles(lignes) {
    var d = etat.donnees, g = d.searchConsole, a = d.analytics;
    var blog = etat.perimetre === 'blog';
    var sb = sommeBlog(lignes);
    var ht = '';
    if (g) {
      if (blog) {
        ht += tuile('Impressions', nombre(sb.impressions), '', 'Pages du blog');
        ht += tuile('Clics depuis Google', nombre(sb.clics));
        ht += tuile('CTR', pourcent(sb.impressions ? sb.clics / sb.impressions : null), '', 'Clics ÷ impressions');
        ht += tuile('Position moyenne', position(sb.impressions ? sb.sommePos / sb.impressions : null), '', 'Pondérée par les impressions');
      } else {
        ht += tuile('Impressions', nombre(g.total.impressions), delta(g.total.impressions, g.precedent.impressions, false, nombre));
        ht += tuile('Clics depuis Google', nombre(g.total.clics), delta(g.total.clics, g.precedent.clics, false, nombre));
        ht += tuile('CTR', pourcent(g.total.ctr), delta(g.total.ctr, g.precedent.ctr, false, function (x) { return pourcent(x); }), 'Clics ÷ impressions');
        ht += tuile('Position moyenne', position(g.total.position), delta(g.total.position, g.precedent.position, true, position), 'Plus petit = mieux classé');
      }
    } else {
      ht = '<p class="note">Search Console non connectée.</p>';
    }
    $('#tuiles-google').innerHTML = ht;

    ht = '';
    if (a) {
      var t = a.total, pr = a.precedent, ev = t.evenements || {};
      if (blog) {
        ht += tuile('Visiteurs', nombre(sb.visiteurs), '', 'Somme par article');
        ht += tuile('Pages vues', nombre(sb.vues));
        ht += tuile('Temps d\'engagement moyen', duree(sb.visiteurs ? sb.tempsTotal / sb.visiteurs : 0), '', 'Temps actif par visiteur');
        ht += tuile('Lectures complètes', nombre(sb.lectures), '', '75 % lu et 30 s actives');
        ht += tuile('Clics vers la prise de RDV', nombre(sb.rdv));
        ht += tuile('RDV réservés', nombre(sb.reserves), '', 'Calendly, depuis ces pages');
        ht += tuile('Appels et e-mails', nombre(sb.tel));
      } else {
        ht += tuile('Visiteurs', nombre(t.visiteurs), delta(t.visiteurs, pr.visiteurs, false, nombre));
        ht += tuile('Sessions', nombre(t.sessions), delta(t.sessions, pr.sessions, false, nombre));
        ht += tuile('Pages vues', nombre(t.vues), delta(t.vues, pr.vues, false, nombre));
        ht += tuile('Temps d\'engagement moyen', duree(t.tempsMoyen), delta(t.tempsMoyen, pr.tempsMoyen, false, duree), 'Temps actif par visiteur');
        ht += tuile('Taux d\'engagement', pourcent(t.tauxEngagement, 0), delta(t.tauxEngagement, pr.tauxEngagement, false, function (x) { return pourcent(x, 0); }), 'Sessions de plus de 10 s ou 2 pages');
        ht += tuile('Clics vers la prise de RDV', nombre(ev.clic_rdv || 0));
        ht += tuile('RDV réservés', nombre(ev.rdv_reserve || 0), '', 'Conversion principale');
        ht += tuile('Appels et e-mails', nombre((ev.clic_telephone || 0) + (ev.clic_email || 0)), '', 'Clics sur le numéro ou l\'adresse');
      }
    } else {
      ht = '<p class="note">Google Analytics non connecté.</p>';
    }
    $('#tuiles-site').innerHTML = ht;
  }

  /* Courbe simple, une seule série, avec infobulle au survol et au toucher. */
  function courbe(conteneur, points, cle, libelle) {
    var fig = document.querySelector(conteneur);
    Array.prototype.slice.call(fig.querySelectorAll('svg, .infobulle, .note')).forEach(function (n) { n.remove(); });
    if (!points || !points.length) {
      fig.insertAdjacentHTML('beforeend', '<p class="note">Pas encore de données sur la période.</p>');
      return;
    }
    var L = 600, H = 180, g = 34, b = 22, h = 8;
    var max = Math.max.apply(null, points.map(function (p) { return p[cle]; }).concat([1]));
    var pas = Math.pow(10, Math.floor(Math.log10(max)));
    var haut = Math.ceil(max / pas) * pas;
    var x = function (i) { return g + (points.length === 1 ? (L - g) / 2 : i * (L - g - 4) / (points.length - 1)); };
    var y = function (v) { return h + (H - h - b) * (1 - v / haut); };
    var chemin = points.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[cle]).toFixed(1); }).join(' ');
    var aire = chemin + ' L' + x(points.length - 1).toFixed(1) + ' ' + y(0) + ' L' + x(0).toFixed(1) + ' ' + y(0) + ' Z';
    var grille = [0, haut / 2, haut].map(function (v) {
      return '<line class="grille" x1="' + g + '" x2="' + L + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="axe" x="' + (g - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + nombre(v) + '</text>';
    }).join('');
    var etiquettes = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter(function (v, i, t) { return t.indexOf(v) === i; })
      .map(function (i) {
        return '<text class="axe" x="' + x(i) + '" y="' + (H - 4) + '" text-anchor="' + (i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle') + '">' + dateCourte(points[i].date) + '</text>';
      }).join('');
    var svg = '<svg viewBox="0 0 ' + L + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + echapper(libelle) + ' par jour">' +
      grille + etiquettes + '<path class="aire" d="' + aire + '"/><path class="ligne" d="' + chemin + '" vector-effect="non-scaling-stroke"/>' +
      '<line class="curseur" y1="' + h + '" y2="' + (H - b) + '" visibility="hidden"/><circle class="point" r="4" visibility="hidden"/>' +
      '<rect x="' + g + '" y="0" width="' + (L - g) + '" height="' + H + '" fill="transparent"/></svg>';
    fig.insertAdjacentHTML('beforeend', svg + '<div class="infobulle" hidden></div>');
    var el = fig.querySelector('svg'), bulle = fig.querySelector('.infobulle');
    var curseur = el.querySelector('.curseur'), point = el.querySelector('.point');
    function montrer(ev) {
      var r = el.getBoundingClientRect();
      var cx = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (L / r.width);
      var i = Math.round((cx - g) / ((L - g - 4) / Math.max(1, points.length - 1)));
      i = Math.max(0, Math.min(points.length - 1, i));
      var px = x(i), py = y(points[i][cle]);
      curseur.setAttribute('x1', px); curseur.setAttribute('x2', px); curseur.setAttribute('visibility', 'visible');
      point.setAttribute('cx', px); point.setAttribute('cy', py); point.setAttribute('visibility', 'visible');
      bulle.hidden = false;
      bulle.textContent = dateCourte(points[i].date) + ' · ' + nombre(points[i][cle]) + ' ' + libelle.toLowerCase();
      var fr = fig.getBoundingClientRect();
      bulle.style.left = (r.left - fr.left + px * r.width / L) + 'px';
      bulle.style.top = (r.top - fr.top + py * r.height / H) + 'px';
    }
    function cacher() { bulle.hidden = true; curseur.setAttribute('visibility', 'hidden'); point.setAttribute('visibility', 'hidden'); }
    el.addEventListener('mousemove', montrer);
    el.addEventListener('touchstart', montrer, { passive: true });
    el.addEventListener('touchmove', montrer, { passive: true });
    el.addEventListener('mouseleave', cacher);
  }

  function afficherCourbes() {
    var d = etat.donnees;
    courbe('#g-impressions', d.searchConsole && d.searchConsole.parJour, 'impressions', 'Impressions');
    courbe('#g-visiteurs', d.analytics && d.analytics.parJour, 'visiteurs', 'Visiteurs');
  }

  var COLONNES = [
    { cle: 'titre', libelle: 'Page', texte: true },
    { cle: 'impressions', libelle: 'Impressions', f: nombre },
    { cle: 'clics', libelle: 'Clics Google', f: nombre },
    { cle: 'ctr', libelle: 'CTR', f: function (v) { return pourcent(v); } },
    { cle: 'position', libelle: 'Position', f: position, inverse: true },
    { cle: 'visiteurs', libelle: 'Visiteurs', f: nombre },
    { cle: 'entrees', libelle: 'Entrées', f: nombre },
    { cle: 'temps', libelle: 'Temps moyen', f: duree },
    { cle: 'lectures', libelle: 'Lectures', f: nombre },
    { cle: 'rdv', libelle: 'Clics RDV', f: nombre },
    { cle: 'internes', libelle: 'Liens internes', f: nombre },
    { cle: 'sortants', libelle: 'Liens sortants', f: nombre },
  ];
  var COLONNES_PAGES = [
    { cle: 'titre', libelle: 'Page', texte: true },
    { cle: 'visiteurs', libelle: 'Visiteurs', f: nombre },
    { cle: 'vues', libelle: 'Vues', f: nombre },
    { cle: 'entrees', libelle: 'Entrées', f: nombre },
    { cle: 'temps', libelle: 'Temps moyen', f: duree },
    { cle: 'engagement', libelle: 'Engagement', f: function (v) { return pourcent(v, 0); } },
    { cle: 'rebond', libelle: 'Rebond', f: function (v) { return pourcent(v, 0); }, inverse: true },
    { cle: 'rdv', libelle: 'Clics RDV', f: nombre },
    { cle: 'appels', libelle: 'Appels', f: nombre },
    { cle: 'emails', libelle: 'E-mails', f: nombre },
    { cle: 'reservesPage', libelle: 'RDV réservés', f: nombre },
    { cle: 'internes', libelle: 'Liens internes', f: nombre },
    { cle: 'impressions', libelle: 'Impressions', f: nombre },
    { cle: 'clics', libelle: 'Clics Google', f: nombre },
    { cle: 'position', libelle: 'Position', f: position, inverse: true },
  ];

  function trier(lignes, tri) {
    var c = tri.cle, s = tri.sens;
    return lignes.slice().sort(function (a, b) {
      var va = a[c], vb = b[c];
      if (c === 'titre') return s * String(va).localeCompare(String(vb), 'fr');
      if (va == null) return 1;
      if (vb == null) return -1;
      return s * (va - vb);
    });
  }

  function tableau(el, lignes, colonnes, tri, nomTri) {
    var maxImp = Math.max.apply(null, lignes.map(function (l) { return l.impressions; }).concat([1]));
    var tete = '<thead><tr>' + colonnes.map(function (c) {
      var actif = tri.cle === c.cle;
      return '<th scope="col"' + (actif ? ' aria-sort="' + (tri.sens > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" data-tri="' + c.cle + '" data-table="' + nomTri + '">' + c.libelle + '</button></th>';
    }).join('') + '</tr></thead>';
    var corps = '<tbody>' + (lignes.length ? trier(lignes, tri).map(function (l) {
      return '<tr tabindex="0" data-chemin="' + echapper(l.chemin) + '"' + (etat.detail === l.chemin ? ' class="actif"' : '') + '>' + colonnes.map(function (c) {
        if (c.texte) return '<td><span class="titre">' + echapper(l.titre) + '</span><span class="chemin">' + echapper(l.chemin) + '</span></td>';
        var v = l[c.cle];
        var vide = v == null || v === 0;
        var barre = c.cle === 'impressions' && l.impressions ? '<span class="barre-mini" style="width:' + Math.max(2, Math.round(40 * l.impressions / maxImp)) + 'px"></span>' : '';
        return '<td' + (vide ? ' class="vide"' : '') + '>' + c.f(v) + barre + '</td>';
      }).join('') + '</tr>';
    }).join('') : '<tr><td colspan="' + colonnes.length + '" class="vide">Aucune donnée sur la période.</td></tr>') + '</tbody>';
    el.innerHTML = tete + corps;
  }

  function afficherTables(lignes) {
    tableau($('#table-articles'), lignes.filter(function (l) { return l.article; }), COLONNES, etat.tri, 'articles');
    tableau($('#table-pages'), lignes.filter(function (l) { return !l.article && l.chemin.charAt(0) === '/'; }), COLONNES_PAGES, etat.triPages, 'pages');
  }

  var NOMS_CANAUX = { 'Organic Search': 'Recherche Google et autres', Direct: 'Accès direct', Referral: 'Autres sites', 'Organic Social': 'Réseaux sociaux', Email: 'E-mail', Unassigned: 'Non attribué', 'Paid Search': 'Annonces', 'Organic Video': 'Vidéo' };

  /* ---------- Détail d'une page ---------- */

  var NOMS_EVENEMENTS = {
    clic_rdv: 'Clic vers la prise de RDV', clic_telephone: 'Clic sur le téléphone', clic_email: 'Clic sur l\'e-mail',
    clic_bouton: 'Clic sur un bouton', clic_lien_interne: 'Lien vers une autre page', clic_sortant: 'Lien vers un autre site',
    clic_ancre: 'Clic dans le sommaire', lecture_article: 'Lecture complète', defilement: 'Paliers de défilement',
    rdv_creneau_choisi: 'Créneau choisi', rdv_reserve: 'RDV réservé', generate_lead: 'Prospect (RDV)',
    rdv_agenda_affiche: 'Agenda affiché', clic_repete: 'Clics répétés', file_download: 'Téléchargement', temps_actif: 'Paliers de temps actif',
    section_vue: 'Section vue', ouverture_faq: 'Question de FAQ ouverte', ouverture_depliant: 'Dépliant ouvert', copie_texte: 'Texte copié',
    impression_page: 'Page imprimée', video_start: 'Vidéo lancée', video_progress: 'Paliers de vidéo', video_complete: 'Vidéo finie',
    video_pause: 'Vidéo mise en pause', erreur_js: 'Erreur technique',
  };
  var NOMS_ZONES = {
    top: 'Haut de page', constat: 'Section Constat', presentation: 'Section Vidéo', offres: 'Section Offres', systemes: 'Section Systèmes',
    methode: 'Section Méthode', fondateurs: 'Section Fondateurs', temoignage: 'Section Témoignage', avis: 'Section Avis', logiciels: 'Section Logiciels',
    reserver: 'Section Réserver', faq: 'FAQ', page: 'Page (hors section)',
    entete: 'En-tête', menu_mobile: 'Menu mobile', pied_de_page: 'Pied de page', encart_rdv_article: 'Encart RDV dans l\'article',
    carte_rdv_article: 'Carte RDV à côté de l\'article', sommaire: 'Sommaire', corps_article: 'Texte de l\'article', bandeau_cookies: 'Bandeau cookies',
  };

  function ouvrirDetail(chemin) {
    etat.detail = chemin;
    var boite = $('#detail');
    var ligne = pagesFusionnees().filter(function (l) { return l.chemin === chemin; })[0];
    if (!ligne) { boite.hidden = true; return; }
    Array.prototype.forEach.call(document.querySelectorAll('tbody tr'), function (tr) { tr.classList.toggle('actif', tr.getAttribute('data-chemin') === chemin); });
    // Le panneau s'ouvre sous le tableau de la ligne cliquée (articles ou pages).
    var ligneTr = document.querySelector('tbody tr[data-chemin="' + chemin.replace(/"/g, '\\"') + '"]');
    var boiteTable = ligneTr && ligneTr.closest('.tableau-boite');
    if (boiteTable && boiteTable.nextElementSibling !== boite) boiteTable.after(boite);
    boite.hidden = false;
    boite.innerHTML = '<button type="button" class="fermer" id="fermer">Fermer</button><h3>' + echapper(ligne.titre) + '</h3>' +
      '<p class="note" style="margin:0"><a href="' + echapper(chemin) + '" target="_blank" rel="noopener">Voir la page ↗</a> · chargement du détail…</p>';
    boite.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    appeler({ jours: etat.jours, chemin: chemin }).then(function (d) {
      if (etat.detail !== chemin) return;
      var g = d.searchConsole || {}, a = d.analytics || {};
      var ev = ligne.evenements || {};
      var vues = ligne.vues || 0;
      var etapes = [
        ['Pages vues', vues],
        ['Lectures complètes', ligne.lectures],
        ['Clics vers la prise de RDV', ligne.rdv],
        ['RDV réservés', ligne.reserves],
      ];
      var maxE = Math.max(1, vues);
      var entonnoir = '<ul class="entonnoir">' + etapes.map(function (e) {
        return '<li><span>' + e[0] + '</span><strong>' + nombre(e[1]) + (vues && e !== etapes[0] ? ' <small style="font-weight:400;color:var(--encre-3)">(' + pourcent(e[1] / vues, 0) + ')</small>' : '') + '</strong>' +
          '<span class="barre"><span style="width:' + Math.min(100, 100 * e[1] / maxE).toFixed(1) + '%"></span></span></li>';
      }).join('') + '</ul>';

      var requetes = (g.requetes || []).length ? '<div class="tableau-boite"><table><thead><tr><th>Requête Google</th><th>Impr.</th><th>Clics</th><th>Pos.</th></tr></thead><tbody>' +
        g.requetes.map(function (r) { return '<tr><td>' + echapper(r.requete) + '</td><td>' + nombre(r.impressions) + '</td><td>' + nombre(r.clics) + '</td><td>' + position(r.position) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="note">Aucune requête sur la période (ou Search Console non connectée).</p>';

      var clics;
      if (a.clics && a.clics.length) {
        clics = '<div class="tableau-boite"><table><thead><tr><th>Action</th><th>Où</th><th>Nb</th></tr></thead><tbody>' +
          a.clics.filter(function (c) { return ['defilement', 'temps_actif', 'section_vue', 'video_progress'].indexOf(c.evenement) < 0; }).sort(function (x, y) { return y.nombre - x.nombre; }).map(function (c) {
            var texte = c.texte && c.texte !== '(not set)' ? ' <span class="chemin">« ' + echapper(c.texte) + ' »</span>' : '';
            return '<tr><td>' + echapper(NOMS_EVENEMENTS[c.evenement] || c.evenement) + texte + '</td><td>' + echapper(NOMS_ZONES[c.zone] || (c.zone === '(not set)' ? '–' : c.zone)) + '</td><td>' + nombre(c.nombre) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      } else {
        var noms = Object.keys(ev).filter(function (k) { return ['defilement', 'temps_actif', 'section_vue', 'video_progress'].indexOf(k) < 0; });
        clics = noms.length ? '<div class="tableau-boite"><table><thead><tr><th>Action</th><th>Nb</th></tr></thead><tbody>' +
          noms.map(function (k) { return '<tr><td>' + echapper(NOMS_EVENEMENTS[k] || k) + '</td><td>' + nombre(ev[k]) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' : '<p class="note">Aucun clic enregistré sur la période.</p>';
        if (a.clicsErreur) clics += '<p class="note">' + echapper(a.clicsErreur) + '</p>';
      }

      var sources = (a.sources || []).length ? petitTableau(['Source', 'Vues'], a.sources.map(function (s) {
        return [nomSource(s.source, s.support), nombre(s.vues)];
      })) : '<p class="note">Pas encore de visites.</p>';

      var precedentes = (a.precedentes || []).length ? petitTableau(['Venus de', 'Vues'], a.precedentes.map(function (r) {
        var lib;
        if (!r.referent || r.referent === '(not set)') lib = 'Accès direct ou inconnu';
        else {
          try {
            var u = new URL(r.referent);
            lib = /(^|\.)herone\.fr$/.test(u.hostname) ? pageLien(u.pathname.replace(/\/+$/, '') || '/') : echapper(u.hostname.replace(/^www\./, '')) + ' <span class="chemin">autre site</span>';
          } catch (e) { lib = echapper(r.referent); }
        }
        return [lib, nombre(r.vues)];
      })) : '<p class="note">Pas encore de données.</p>';

      var suivantes = a.suivantes == null ? '<p class="note">Cliquez sur « Configurer Google Analytics » pour voir les pages suivantes.</p>'
        : a.suivantes.length ? petitTableau(['Page ouverte ensuite', 'Clics'], a.suivantes.map(function (s) {
          var c = s.page; try { c = new URL(s.page, location.origin).pathname.replace(/\/+$/, '') || '/'; } catch (e) { /* tel quel */ }
          return [pageLien(c), nombre(s.nombre)];
        })) : '<p class="note">Aucun lien interne cliqué sur la période.</p>';

      var appareils = (a.appareils || []).length ? barres(a.appareils, function (x) { return echapper(NOMS_APPAREILS[x.appareil] || x.appareil); }, function (x) { return x.vues; })
        : '<p class="note">Pas encore de données.</p>';

      boite.innerHTML = '<button type="button" class="fermer" id="fermer">Fermer</button><h3>' + echapper(ligne.titre) + '</h3>' +
        '<p class="note" style="margin:0"><a href="' + echapper(chemin) + '" target="_blank" rel="noopener">Voir la page ↗</a> · ' +
        nombre(ligne.impressions) + ' impressions · ' + nombre(ligne.clics) + ' clics Google · CTR ' + pourcent(ligne.ctr) + ' · position ' + position(ligne.position) +
        ' · ' + nombre(ligne.visiteurs) + ' visiteurs · ' + nombre(ligne.entrees) + ' entrées · ' + duree(ligne.temps) + ' en moyenne · rebond ' + pourcent(ligne.rebond, 0) + '</p>' +
        '<div class="grille-detail">' +
        '<div><h4>Parcours sur la page</h4>' + entonnoir + '</div>' +
        '<div><h4>Clics et actions</h4>' + clics + '</div>' +
        '<div><h4>Requêtes qui l\'affichent dans Google</h4>' + requetes + '</div>' +
        '<div><h4>Sources des visites</h4>' + sources + '</div>' +
        '<div><h4>Page précédente</h4>' + precedentes + '</div>' +
        '<div><h4>Pages ouvertes ensuite</h4>' + suivantes + '</div>' +
        '<div><h4>Appareils</h4>' + appareils + '</div>' +
        '</div>';
    }).catch(function (e) {
      boite.insertAdjacentHTML('beforeend', '<p class="note">' + echapper(e.message) + '</p>');
    });
  }

  /* ---------- Interactions ---------- */

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var jours = t.closest('[data-jours]');
    if (jours) {
      etat.jours = Number(jours.getAttribute('data-jours'));
      Array.prototype.forEach.call(document.querySelectorAll('[data-jours]'), function (b) { b.setAttribute('aria-pressed', String(b === jours)); });
      charger();
      return;
    }
    var per = t.closest('[data-perimetre]');
    if (per) {
      etat.perimetre = per.getAttribute('data-perimetre');
      Array.prototype.forEach.call(document.querySelectorAll('[data-perimetre]'), function (b) { b.setAttribute('aria-pressed', String(b === per)); });
      if (etat.donnees) afficherTuiles(pagesFusionnees());
      return;
    }
    if (t.closest('#actualiser')) { charger(true); return; }
    if (t.closest('#installer')) { installer(); return; }
    if (t.closest('#fermer')) { etat.detail = null; $('#detail').hidden = true; afficherTables(pagesFusionnees()); return; }
    var tri = t.closest('[data-tri]');
    if (tri) {
      var cle = tri.getAttribute('data-tri');
      var nom = tri.getAttribute('data-table') === 'pages' ? 'triPages' : 'tri';
      etat[nom] = { cle: cle, sens: etat[nom].cle === cle ? -etat[nom].sens : (cle === 'titre' || cle === 'position' || cle === 'rebond' ? 1 : -1) };
      afficherTables(pagesFusionnees());
      return;
    }
    var fb = t.closest('[data-filtre-boutons]');
    if (fb) {
      etat.filtreBoutons = fb.getAttribute('data-filtre-boutons');
      afficherConversions(pagesFusionnees());
      return;
    }
    var tr = t.closest('tbody tr[data-chemin]');
    if (tr) ouvrirDetail(tr.getAttribute('data-chemin'));
  });
  document.addEventListener('keydown', function (ev) {
    var tr = ev.target.closest && ev.target.closest('tbody tr[data-chemin]');
    if (tr && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); ouvrirDetail(tr.getAttribute('data-chemin')); }
  });

  charger();
})();
