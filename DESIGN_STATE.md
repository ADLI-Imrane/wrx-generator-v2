# WRX Generator — Durable Design State

Evidence: `apps/web/src/pages/LandingPage.tsx`, `components/landing/DestinationWorkbench.tsx`, and `styles/landing.css`. Public homepage decisions do not automatically apply to every authenticated screen.

## Identity and composition

WRX turns destinations into shareable links and scannable entry points. Its public experience is a practical publishing workbench with editorial character: let visitors make something before asking them to explore marketing content.

- Lead with a clear invitation and a working QR atelier. The input, preview and output form one continuous framed surface, like a printed production sheet.
- Use warm paper, charcoal ink and fine rules; coral gives the default QR pass emphasis. Muted green and acid accents support previews and routing explanations.
- Large, tightly tracked Arial/Helvetica display type establishes hierarchy. Georgia italics provide selective emphasis; monospace is reserved for process labels and metadata.
- Signature: the QR destination pass, its meaningful reverse side, and a horizontal physical-support → destination → response story. Keep real QR readability and generous quiet zones.
- Login and registration remain clear. Distinguish the free direct QR from account-based short links and dynamic QR management.

## Behavior

- The atelier validates HTTP(S) destinations locally, generates a real QR, changes its colors, reveals/copies the exact encoded destination and downloads the QR as SVG. Invitation text belongs to the on-page pass; the download is the QR itself.
- A short entrance and the QR flip provide continuity. The QR stays still for scanning; no perpetual pointer tilt, orbit or marquee is needed.
- Desktop story uses GSAP pin/scrub at ≥900px width and ≥650px height. Smaller/shorter screens and reduced-motion users get all scenes in normal vertical flow. Revert pinning on navigation.
- Recompose the atelier vertically on phones. Preserve visible keyboard focus, labeled controls, feedback and adequate contrast.

## Preserve / avoid

Preserve functional QR interaction, paper/ink contrast, deliberate type hierarchy, meaningful campaign artifacts and the responsive horizontal story. Clearly label example destinations and illustrative charts.

Avoid agency/studio positioning that obscures WRX's purpose, duplicate campaign galleries, slogan-only sections, fake metrics, mismatched copy destinations, and decoration that makes a QR harder to scan. Design memory is a compass, not a requirement to preserve a weak composition.
