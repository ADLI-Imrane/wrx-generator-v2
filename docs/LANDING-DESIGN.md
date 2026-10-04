# WRX homepage

## Direction

The homepage is organized around a destination workbench: an actual useful action comes before product storytelling. The previous agency-style hero, repeated campaign showcases and manifesto were replaced because they obscured the link/QR product and repeated the same idea. Paper/charcoal contrast, serif accents, the QR pass and horizontal narrative remain.

## Behavior and boundaries

- `DestinationWorkbench` accepts HTTP(S) URLs, rejects embedded credentials and bounds input size. `qrcode.react` encodes the normalized URL locally; no shortening, persistence or analytics request is made.
- The initial QR is explicitly an example pointing to `https://example.com`. Generate to update it; the reverse and clipboard use the same destination. Palette and invitation edits update the pass preview.
- SVG export contains the QR alone, including its colors and quiet zone. The invitation text is not part of that download. The direct QR has a fixed destination; account-based dynamic QR management is explained separately.
- Existing login/registration routes are preserved. Charts and campaign artwork are illustrations, not claims about real users or traffic.
- GSAP only animates the short entrance and the three-scene desktop journey. Pinning requires width ≥900px, height ≥650px and no reduced-motion preference. Other layouts use vertical flow. Contexts and media handlers clean up on route changes.

## Local verification

From `apps/web`, with the dev server running:

```sh
npx tsc --noEmit
npm run build
npx playwright test e2e/landing-motion.spec.ts --project=chromium --no-deps --reporter=line
```

Regression coverage: URL validation, QR changes, palette/label feedback, exact clipboard content, SVG download, horizontal progression/release, route cleanup, phone/tablet overflow and reduced motion. On this workstation, `tmp/landing-check.config.ts` can target the existing local Chromium installation. No CI trigger was added.
