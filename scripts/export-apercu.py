"""Construit un aperçu navigable du site à partir de dist/.

Trois transformations, toutes imposées par l'hébergement de l'aperçu :
  1. les vidéos sont retirées (19,8 Mo pour trois fichiers), leurs posters
     s'affichent à la place ;
  2. le dossier `_astro` est renommé `astro` : l'outil de publication refuse
     tout fichier dont le nom commence par un souligné ;
  3. chaque URL absolue est relativisée selon la profondeur de la page, et les
     liens de page pointent vers leur index.html, puisqu'aucun serveur ne
     réécrit les adresses ici.
"""
import os, re, shutil, sys

# Usage : python3 scripts/export-apercu.py [dossier de sortie]
# Par defaut, l'apercu est ecrit dans apercu/ a la racine du depot. Le dossier
# de sortie est efface puis reconstruit a chaque execution.
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, 'dist')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RACINE, 'apercu')

if not os.path.isdir(SRC):
    sys.exit('dist/ est absent : lancer npm run build avant.')

if os.path.exists(OUT):
    shutil.rmtree(OUT)
shutil.copytree(SRC, OUT)

# 1. Les vidéos, trop lourdes pour l'aperçu.
videos = os.path.join(OUT, 'videos')
poids = 0
if os.path.isdir(videos):
    for r, _, fs in os.walk(videos):
        for f in fs:
            poids += os.path.getsize(os.path.join(r, f))
    shutil.rmtree(videos)
print(f'vidéos retirées : {poids / 1048576:.1f} Mo')

# 2. Le dossier réservé.
if os.path.isdir(os.path.join(OUT, '_astro')):
    shutil.move(os.path.join(OUT, '_astro'), os.path.join(OUT, 'astro'))

# 2 bis. Tout fichier dont le NOM commence par un souligné est refusé lui
#        aussi, pas seulement les dossiers : la feuille de la page article du
#        blog s'appelle `_slug_.…css`. Les références suivent.
renommes = {}
for r, _, fs in os.walk(OUT):
    for f in fs:
        if f.startswith('_'):
            os.rename(os.path.join(r, f), os.path.join(r, f[1:]))
            renommes[f] = f[1:]
if renommes:
    for r, _, fs in os.walk(OUT):
        for f in fs:
            if not f.endswith(('.html', '.css', '.js')):
                continue
            q = os.path.join(r, f)
            t = open(q, encoding='utf-8').read()
            t2 = t
            for avant_nom, apres_nom in renommes.items():
                t2 = t2.replace(avant_nom, apres_nom)
            if t2 != t:
                open(q, 'w', encoding='utf-8').write(t2)
print(f'fichiers renommés : {list(renommes)}')

# 2 ter. Astro recopie des images de src/assets qu'aucune page n'utilise ;
#        l'une pèse 1,5 Mo et porte un accent en forme décomposée, que le
#        transfert normaliserait autrement. Les fichiers d'image que rien ne
#        référence sont retirés.
refs = []
for r, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith(('.html', '.css', '.js')):
            refs.append(open(os.path.join(r, f), encoding='utf-8').read())
refs = '\n'.join(refs)
morts = 0
for r, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith(('.webp', '.avif', '.jpg', '.png')) and f not in refs:
            os.remove(os.path.join(r, f))
            morts += 1
print(f'images non référencées retirées : {morts}')

# Les pages réellement présentes, pour savoir quel lien mène à un index.html.
pages = set()
for r, _, fs in os.walk(OUT):
    if 'index.html' in fs:
        rel = os.path.relpath(r, OUT).replace('\\', '/')
        pages.add('/' if rel == '.' else '/' + rel)

def relatif(chemin_absolu, profondeur):
    """Transforme une URL absolue du site en URL relative à la page courante."""
    cible = chemin_absolu.split('#')[0].split('?')[0]
    fragment = chemin_absolu[len(cible):]
    cible = cible.replace('/_astro/', '/astro/')
    if cible in pages:
        cible = ('/index.html' if cible == '/' else cible + '/index.html')
    prefixe = '../' * profondeur if profondeur else './'
    return prefixe + cible.lstrip('/') + fragment

MOTIF_ATTR = re.compile(r'((?:href|src|content|poster)=")(/[^"]*)(")')
MOTIF_SRCSET = re.compile(r'(srcset=")([^"]+)(")')
MOTIF_CSS = re.compile(r'url\((["\']?)(/[^"\')]+)\1\)')

touches = 0
for r, _, fs in os.walk(OUT):
    for f in fs:
        if not f.endswith(('.html', '.css', '.js')):
            continue
        p = os.path.join(r, f)
        profondeur = len(os.path.relpath(r, OUT).split(os.sep)) if os.path.relpath(r, OUT) != '.' else 0
        t = open(p, encoding='utf-8').read()
        avant = t

        if f.endswith('.html'):
            t = MOTIF_ATTR.sub(lambda m: m.group(1) + relatif(m.group(2), profondeur) + m.group(3), t)
            def srcset(m):
                parts = []
                for bout in m.group(2).split(','):
                    bout = bout.strip()
                    if not bout:
                        continue
                    morceaux = bout.split()
                    if morceaux[0].startswith('/'):
                        morceaux[0] = relatif(morceaux[0], profondeur)
                    parts.append(' '.join(morceaux))
                return m.group(1) + ', '.join(parts) + m.group(3)
            t = MOTIF_SRCSET.sub(srcset, t)

        # Les feuilles et scripts vivent dans astro/, soit un niveau sous la racine.
        t = MOTIF_CSS.sub(lambda m: f'url({m.group(1)}{relatif(m.group(2), 1)}{m.group(1)})', t)

        if t != avant:
            open(p, 'w', encoding='utf-8').write(t)
            touches += 1

print(f'{touches} fichier(s) réécrit(s)')

# 4. Le routeur client d'Astro est neutralisé dans l'aperçu, et seulement là.
#    Servi depuis un sous-dossier, il résout les feuilles de la page suivante
#    par rapport à l'adresse de la page courante : mesuré, la page d'arrivée
#    perdait ses trois feuilles et retombait en Times New Roman. Sans lui,
#    chaque clic recharge la page entièrement, ce qui rend exactement le même
#    site. Le vrai site, lui, garde son routeur.
MOTIF_ROUTEUR = re.compile(r'<script type="module" src="[^"]*ClientRouter[^"]*"></script>')
retires = 0
for r, _, fs in os.walk(OUT):
    for f in fs:
        if not f.endswith('.html'):
            continue
        p = os.path.join(r, f)
        t = open(p, encoding='utf-8').read()
        t2 = MOTIF_ROUTEUR.sub('', t)
        if t2 != t:
            open(p, 'w', encoding='utf-8').write(t2)
            retires += 1
print(f'routeur client retiré de {retires} page(s)')

# 5. Tous les scripts du site s'initialisent sur `astro:page-load`, un
#    événement qu'émet le routeur qu'on vient de retirer. Sans lui, le filtre
#    du blog, le carrousel et le sommaire restent inertes. Un module inline,
#    posé en dernier pour s'exécuter après les autres, rend cet événement.
#    Astro pose les scripts de page APRÈS </body> : le déclencheur va donc en
#    toute fin de fichier, sans quoi il partirait avant que ces scripts aient
#    posé leurs écouteurs. Mesuré : le filtre du blog restait inerte.
DECLENCHEUR = ('\n<script type="module">/* Aperçu : le routeur client est absent, '
               'cet événement rend leur initialisation aux scripts de la page. */'
               'document.dispatchEvent(new Event("astro:page-load"));</script>\n')
poses = 0
for r, _, fs in os.walk(OUT):
    for f in fs:
        if not f.endswith('.html'):
            continue
        p = os.path.join(r, f)
        t = open(p, encoding='utf-8').read()
        open(p, 'w', encoding='utf-8').write(t + DECLENCHEUR)
        poses += 1
print(f'déclencheur posé sur {poses} page(s)')
restes = 0
for r, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith('.html'):
            t = open(os.path.join(r, f), encoding='utf-8').read()
            restes += len(re.findall(r'(?:href|src)="/[^"]', t))
print(f'URL absolues restantes dans le HTML : {restes}')
total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
nb = sum(len(fs) for _, _, fs in os.walk(OUT))
print(f'aperçu : {nb} fichiers, {total / 1048576:.1f} Mo')
