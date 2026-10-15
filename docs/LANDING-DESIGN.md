# WRX homepage

## Story

Nine beats, one claim each: hook ("Imprimez une fois. Redirigez après.") → the printed-QR problem → the WRX rule (managed QR, dark chapter) → how it works (create, share, secure, track) → try it (local QR) → one profile, three formats → what comes back (analytics) → one workspace → create your first link.

Copy lives in `apps/web/src/home/content.ts` (FR and EN). Every claim must match shipped behavior; sample data is labelled.

## Architecture

- `src/main.tsx` routes `/` and `/en/` to the homepage (`src/home/mount.tsx`) and everything else to the app (`src/app-entry.tsx`). The homepage never loads the router, React Query or Supabase.
- `pnpm --filter @wrx/web build` runs the client build, an SSR build of `src/home/entry-server.tsx`, then `scripts/prerender.mjs`, which writes the homepage markup into `dist/index.html` and `dist/en/index.html` with the CSS, font, hero-image and module preloads. Set `SITE_URL` to add canonical and hreflang links.
- `dist/index.html` is still the SPA fallback: an inline head script marks app routes so the prerendered homepage is hidden before the app mounts.
- Motion: `src/home/motion/scroll.ts` (Lenis on the GSAP ticker, ScrollTrigger pins and SplitText reveals inside `gsap.matchMedia`) loads after hydration; `motion/react` handles counters, the chart wipe, the period pill and the magnetic CTA. Pinned scenes need ≥900×600 and no reduced-motion preference.
- Media in `public/media/home/`: glass W stills (AVIF/WebP) and the dark-chapter loop (MP4/WebM, 8 s, silent, loads and plays only while visible).

## Local verification

From `apps/web`:

```sh
npx tsc --noEmit
npx vitest run src/home
pnpm build && npx vite preview
npx playwright test e2e/homepage.spec.ts --project=chromium --no-deps --reporter=line
```

The e2e spec covers overflow at 390/768/1024/1440, 44px touch targets, reduced motion, the horizontal chapter tabs, the try-it QR, `/en/` and app routes.
