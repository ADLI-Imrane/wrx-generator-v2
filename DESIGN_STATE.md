# WRX Generator — Durable Design State

Evidence: `apps/web/src/home/` (homepage), `apps/web/scripts/prerender.mjs`. Public homepage decisions do not automatically apply to every authenticated screen.

## Identity and composition

WRX turns destinations into short links, QR codes, cards and signatures, and lets owners change where they lead. The public homepage tells that as a story around one rule: **print once, redirect later**.

- Metaphor: _la boucle_ — the logo's single ribbon folding into a W. On the page it is a continuous thread (left edge) and a glass W object (hero, dark chapter, final call to action).
- Mood: luminous, tactile (print-shop precise), candid. Light editorial body with one dark chapter for the managed-QR rule.
- Palette: Paper `#F6F4EF`, Ink `#0E1726`, Graphite `#5B6472`, Rule `#E3DFD6`, Night `#020A1E`; one accent, Ribbon blue `#1E63D6`, lifted to `#3BA9E0` only in the dark chapter.
- Type: Schibsted Grotesk (display, tight tracking), Inter (reading), JetBrains Mono (small uppercase labels and figure captions). Self-hosted.
- Motion: "thread & settle" — reveals arrive along the thread with a short blur-to-sharp, play once; scrubbed scenes are linear and reversible.
- Proof is the product: interface pieces are rebuilt as components with labelled sample data. Client logos and testimonials have an empty slot (`src/home/proof.ts`).

## Behavior

- French at `/`, English at `/en/`, both prerendered at build time; the app stays French and loads separately.
- Pinned scenes (old way, dark rule, horizontal mechanism) run only at ≥900px wide, ≥600px tall and without reduced motion. Otherwise every scene is in normal vertical flow.
- Same scroll position, same state. Text is never animated through partial opacity (WCAG AA holds at every scroll position).
- The try-it QR is generated locally and encodes the address directly; the page says it cannot be edited or tracked, unlike a managed QR.

## Preserve / avoid

Preserve claims that match shipped behavior, one primary call to action (final beat + nav), labelled sample data, and the light/dark balance.

Avoid glowing objects in dark space, purple-blue tech gradients and glass-card soup, invented metrics, logos or customers, and claims for unbuilt features (geolocation, QR logos or styles, custom domains, API keys, data export, wallet passes, mobile app or extension).
