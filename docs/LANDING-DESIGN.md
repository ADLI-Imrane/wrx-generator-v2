# WRX landing page

The landing page uses an immersive charcoal/coral connection studio, followed by an editorial campaign gallery and product journey. References supplied by the owner: [Spector](https://spector.framer.website/) (dominant typography, immersive composition) and [Fabrica](https://fabrica.framer.media/) (large project surfaces, generous spacing, reveal rhythm). The implementation, QR artwork and campaign concepts are original; no template media was copied.

## Motion

- GSAP animates the hero entrance, orbit and pointer-following card tilt/light with `quickTo`, without React state updates on pointer movement. The card flips on click or keyboard activation and reveals its actual QR destination.
- A native horizontally scrollable campaign gallery supports mouse dragging, touch scrolling, arrow keys and previous/next buttons. Campaign artwork responds to hover. Controls remain usable with reduced motion.
- A scroll-linked text reveal connects the gallery to the product story. Reduced-motion users see all text immediately.
- ScrollTrigger pins the product journey on desktop (at least 900px wide and 600px high). Its horizontal travel is calculated from the actual track width minus the viewport width, refreshed on resize.
- Mobile, short screens, and reduced-motion users get all three scenes in normal vertical flow.
- `gsap.context` and `matchMedia` revert animations and pin spacers on route changes.
- Keep ancestors free of `overflow: hidden` scroll containers or transforms that interfere with pinning. The page uses `overflow: clip`.

## Demo content

Hero and branding QR codes encode the project's GitHub URL, using `qrcode.react`; they are not decorative fake matrices. The copy button copies that same demo destination. Short URLs, analytics and campaign mockups are illustrative, not live account data. The three color buttons update the branding ticket. Registration and login use the existing app routes.

## Local verification

From `apps/web`, with the web server running:

```sh
npx tsc --noEmit
npm run build
npx playwright install chromium
npx playwright test e2e/landing-motion.spec.ts --project=chromium --no-deps --reporter=line
```

The browser regression covers pointer response, keyboard card flipping, gallery dragging and navigation, all three horizontal product positions, palette changes, release back into vertical scrolling, route cleanup, mobile overflow, and reduced motion. It runs locally; no CI trigger was added. On this workstation, an ignored temporary config can use the already installed Chromium executable if Playwright's own matching browser is unavailable.
