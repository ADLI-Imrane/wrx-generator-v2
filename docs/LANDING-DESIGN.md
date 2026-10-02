# WRX landing page

The landing page uses an editorial paper/ink/acid palette, oversized sans-serif typography with serif accents, and QR tickets as the central product motif. Inspiration: [Framer Subflow](https://www.framer.com/marketplace/templates/subflow/). The implementation and product illustrations are original.

## Motion

- GSAP animates the hero entrance and floating ticket.
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

The browser regression covers all three horizontal positions, palette changes, release back into vertical scrolling, route cleanup, mobile overflow, and reduced motion. It runs locally; no CI trigger was added.
