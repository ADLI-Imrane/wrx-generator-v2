// Prerenders the public homepage (FR at /, EN at /en/) into the built HTML so the
// headline is in the first response. Runs after `vite build` and the SSR build.
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');
const site = (process.env.SITE_URL ?? '').replace(/\/$/, '');

const manifest = JSON.parse(await readFile(path.join(dist, '.vite', 'manifest.json'), 'utf8'));

/** Collects the CSS and JS a manifest entry needs, following static imports. */
function collect(key, seen = new Set(), css = new Set(), js = new Set()) {
  if (seen.has(key)) return { css, js };
  seen.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Missing manifest entry: ${key}`);
  js.add(chunk.file);
  (chunk.css ?? []).forEach((file) => css.add(file));
  (chunk.imports ?? []).forEach((child) => collect(child, seen, css, js));
  return { css, js };
}

const mountKey = Object.keys(manifest).find(
  (key) => manifest[key].name === 'mount' && manifest[key].file.endsWith('.js')
);
if (!mountKey) throw new Error('Homepage chunk (mount) not found in the manifest');
const home = collect(mountKey);
const assets = await readdir(path.join(dist, 'assets'));
const font = (prefix) => assets.find((file) => file.startsWith(prefix) && file.endsWith('.woff2'));
const fonts = [font('schibsted-grotesk-latin-wght-normal'), font('inter-latin-wght-normal')].filter(
  Boolean
);

const heroPreloads = [
  `<link rel="preload" as="image" type="image/avif" media="(min-width: 768px)" imagesrcset="/media/home/hero-glass-1280.avif 1280w, /media/home/hero-glass-2048.avif 2048w" imagesizes="72vw" fetchpriority="high">`,
  `<link rel="preload" as="image" type="image/avif" media="(max-width: 767px)" imagesrcset="/media/home/hero-glass-square-720.avif 720w, /media/home/hero-glass-square-1080.avif 1080w" imagesizes="100vw" fetchpriority="high">`,
];

const { renderHome } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

const pages = [
  { lang: 'fr', file: path.join(dist, 'index.html'), href: '/' },
  { lang: 'en', file: path.join(dist, 'en', 'index.html'), href: '/en/' },
];

for (const page of pages) {
  const { html } = renderHome(page.lang);
  const alternates = site
    ? [
        `<link rel="canonical" href="${site}${page.href}">`,
        `<link rel="alternate" hreflang="fr" href="${site}/">`,
        `<link rel="alternate" hreflang="en" href="${site}/en/">`,
        `<link rel="alternate" hreflang="x-default" href="${site}/">`,
      ]
    : [];
  const head = [
    ...alternates,
    ...fonts.map(
      (file) =>
        `<link rel="preload" as="font" type="font/woff2" href="/assets/${file}" crossorigin>`
    ),
    ...heroPreloads,
    ...[...home.css].map((file) => `<link rel="stylesheet" href="/${file}">`),
    ...[...home.js].map((file) => `<link rel="modulepreload" href="/${file}">`),
  ].join('\n    ');

  const template = await readFile(page.file, 'utf8');
  if (!template.includes('<!--home-ssr-->') || !template.includes('<!--home-head-->')) {
    throw new Error(`Placeholders missing in ${page.file}`);
  }
  await writeFile(
    page.file,
    template.replace('<!--home-head-->', head).replace('<!--home-ssr-->', html)
  );
}

await rm(ssrDir, { recursive: true, force: true });
process.stdout.write(
  `Prerendered homepage (fr, en): ${home.css.size} stylesheet(s), ${fonts.length} font preload(s).\n`
);
