// Retire le point à l'intérieur du zéro d'IBM Plex Mono.
//
// Pourquoi : le zéro d'IBM Plex Mono est dessiné avec un point central. Les
// fichiers self-hostés du projet sont des sous-ensembles qui n'exposent aucune
// fonctionnalité OpenType permettant de le désactiver (pas de `zero`, pas de
// ss01/ss02) : il n'y a donc pas de réglage CSS possible, le point est dans le
// dessin du glyphe. On l'enlève à la source.
//
// Comment : le glyphe `zero` a trois contours (l'ovale extérieur, sa contreforme,
// et le point). On supprime le troisième. Le `O` majuscule, lui, en a deux : le
// résultat a exactement la même construction qu'une lettre ronde de la police.
//
// Licence : IBM Plex est sous SIL Open Font License, qui autorise la
// modification et la redistribution. Le projet modifiait déjà ces fichiers en
// les sous-ensemblant.
//
// Reproduire après un remplacement des polices : `node scripts/plain-zero.mjs`
// (nécessite Python et fonttools : pip install fonttools brotli).

import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const FONTS = [
  'public/fonts/ibm-plex-mono-400.woff2',
  'public/fonts/ibm-plex-mono-500.woff2',
  'public/fonts/ibm-plex-mono-600.woff2',
];

const PY = `
import sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates

path = sys.argv[1]
font = TTFont(path)
glyf = font['glyf']
changed = []

for name in ('zero', 'zero.numr', 'zero.dnom'):
    if name not in glyf:
        continue
    g = glyf[name]
    g.expand(glyf)
    if g.numberOfContours != 3:
        print(f'  {name}: {g.numberOfContours} contour(s), rien a faire')
        continue

    # Le dernier contour est le point central : on verifie sa taille et sa
    # position avant de le retirer, pour ne jamais amputer le mauvais trace.
    ends = list(g.endPtsOfContours)
    start = ends[-2] + 1
    pts = list(g.coordinates)[start:]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    outer = list(g.coordinates)[: ends[0] + 1]
    oxs = [p[0] for p in outer]; oys = [p[1] for p in outer]
    small = (max(xs) - min(xs)) < (max(oxs) - min(oxs)) * 0.5
    centered = min(oxs) < (min(xs) + max(xs)) / 2 < max(oxs) and min(oys) < (min(ys) + max(ys)) / 2 < max(oys)
    if not (small and centered):
        sys.exit(f'  {name}: le 3e contour ne ressemble pas au point central, abandon')

    g.coordinates = GlyphCoordinates(list(g.coordinates)[:start])
    g.flags = g.flags[:start]
    g.endPtsOfContours = ends[:-1]
    g.numberOfContours = 2
    g.recalcBounds(glyf)
    changed.append(name)

if not changed:
    print('  aucun glyphe modifie')
else:
    font.save(path)
    print('  point retire de : ' + ', '.join(changed))
`;

const tmp = resolve('scripts/.plain-zero.py');
writeFileSync(tmp, PY);
try {
  for (const font of FONTS) {
    console.log(font);
    console.log(execFileSync('python3', [tmp, resolve(font)], { encoding: 'utf8' }).trimEnd());
  }
} finally {
  unlinkSync(tmp);
}
