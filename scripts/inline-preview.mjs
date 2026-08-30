// Build a single self-contained HTML file from dist/ for an Artifact preview.
// Inlines CSS (with woff2 fonts), JS bundles, and images/posters as data URIs.
// Videos are left unresolved on purpose (too heavy) -> their posters show.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('dist');
const p = (rel) => resolve(DIST, '.' + rel); // rel starts with '/'

const mime = (path) =>
  path.endsWith('.woff2') ? 'font/woff2'
  : path.endsWith('.webp') ? 'image/webp'
  : path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg'
  : path.endsWith('.png') ? 'image/png'
  : path.endsWith('.svg') ? 'image/svg+xml'
  : 'application/octet-stream';

const dataUri = (rel) => {
  const buf = readFileSync(p(rel));
  return `data:${mime(rel)};base64,${buf.toString('base64')}`;
};

let html = readFileSync(p('/index.html'), 'utf8');

// 0) Preview tweaks: drop now-redundant font preloads; make /#section anchors scroll in-page.
html = html.replace(/<link rel="preload" href="\/fonts\/[^"]+\.woff2"[^>]*>/g, '');
html = html.replace(/href="\/#/g, 'href="#');

// 1) Inline stylesheets (and embed woff2 fonts referenced via url(/fonts/*.woff2))
html = html.replace(
  /<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)">/g,
  (_m, href) => {
    let css = readFileSync(p(href), 'utf8');
    css = css.replace(/url\((\/fonts\/[^)"']+\.woff2)\)/g, (_mm, f) => `url(${dataUri(f)})`);
    return `<style>${css}</style>`;
  }
);

// 2) Inline module scripts
html = html.replace(
  /<script type="module" src="(\/_astro\/[^"]+\.js)"><\/script>/g,
  (_m, src) => {
    let js = readFileSync(p(src), 'utf8');
    js = js.replace(/<\/script/gi, '<\\/script'); // guard against premature close
    return `<script type="module">${js}</script>`;
  }
);

// 2 bis) Drop the <source> variants of every <picture>. Astro emits one AVIF and
// one WebP source per width, and inlining them all made the preview balloon from
// 1.8 MB to 11.4 MB for the same pixels. The <img> fallback inside the <picture>
// carries the very same photo, so the rendering is unchanged.
// srcset is dropped on the remaining <img> too: only its src is inlined.
html = html.replace(/<source\b[^>]*>/gi, '');
html = html.replace(/\ssrcset="[^"]*"/gi, '');

// 3) Inline images + posters (webp, jpg). Replace every occurrence of each path.
const assetPaths = new Set();
for (const m of html.matchAll(/\/(?:_astro|images\/posters)\/[A-Za-z0-9._-]+\.(?:webp|jpe?g|png)/g)) {
  assetPaths.add(m[0]);
}
for (const path of assetPaths) {
  const uri = dataUri(path);
  html = html.split(path).join(uri);
}

// 4) favicon svg -> data URI (optional, harmless if missing)
html = html.replace(/href="(\/favicon\.svg)"/g, (_m, f) => {
  try { return `href="${dataUri(f)}"`; } catch { return _m; }
});

writeFileSync(resolve('scripts/preview.html'), html);
console.log('Wrote scripts/preview.html', (Buffer.byteLength(html) / 1024 / 1024).toFixed(2), 'MB');
console.log('Remaining external refs (should be only /videos/*, mailto, https, #):');
for (const m of new Set([...html.matchAll(/(?:src|href|data-src|poster)="([^"]+)"/g)].map(x => x[1]))) {
  if (!/^(data:|#|https?:|mailto:|tel:)/.test(m)) console.log('  ', m);
}

// 5) Emit a fragment (no <!DOCTYPE>/<html>/<head>/<body>) for the Artifact wrapper.
let frag = html
  .replace(/<!DOCTYPE html>/i, '')
  .replace(/<html[^>]*>/i, '')
  .replace(/<\/html>/i, '')
  .replace(/<head>/i, '')
  .replace(/<\/head>/i, '')
  .replace(/<body[^>]*>/i, '')
  .replace(/<\/body>/i, '')
  .replace(/<title>[\s\S]*?<\/title>/i, '') // title provided via Artifact param
  .trim();
writeFileSync(resolve('scripts/preview.html'), frag);
console.log('Wrote fragment scripts/preview.html', (Buffer.byteLength(frag)/1024/1024).toFixed(2), 'MB');
