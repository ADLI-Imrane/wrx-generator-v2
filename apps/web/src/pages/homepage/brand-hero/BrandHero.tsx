import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "../../../components/BrandLogo";
import {
  createBrandConstruction,
  type BrandConstruction,
} from "./createBrandConstruction";
import { createHeroBoundary } from "./createHeroBoundary";
import "./brand-hero.css";
import {
  RoutingComposition,
  IdentityComposition,
  ActivityWorkspace,
  FinalInvitation,
} from "./ProductCompositions";
import "./product-compositions.css";

export default function BrandHero() {
  const objectRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const oldTitle = document.title;
    document.title = "WRX — Créez. Faites circuler.";
    let construction: BrandConstruction | undefined;
    const host = objectRef.current;
    if (host) {
      try {
        construction = createBrandConstruction(host);
      } catch {
        host.dataset["fallback"] = "true";
      }
    }
    const disposeBoundary =
      host && rootRef.current
        ? createHeroBoundary(rootRef.current, host, construction)
        : undefined;
    return () => {
      disposeBoundary?.();
      construction?.dispose();
      document.title = oldTitle;
    };
  }, []);

  return (
    <main className="bh-page" id="bh-main" ref={rootRef}>
      <section className="bh-hero" aria-labelledby="bh-title">
        <a className="bh-skip" href="#bh-copy">
          Aller au contenu
        </a>
        <header className="bh-header">
          <Link className="bh-brand" to="/" aria-label="WRX, accueil">
            <BrandLogo />
            <span>WRX</span>
          </Link>
          <nav aria-label="Compte WRX">
            <Link to="/login">
              Se connecter <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </nav>
        </header>
        <div
          className="bh-object"
          ref={objectRef}
          role="img"
          aria-label="Construction WRX en trois plans de graphite, dont les découpes et les parois bleues forment les lettres"
        >
          <span className="bh-object-fallback" aria-hidden="true">
            WRX
          </span>
        </div>
        <div className="bh-copy" id="bh-copy">
          <h1 id="bh-title">
            Créez.
            <br />
            Faites circuler.
          </h1>
          <p>
            Liens, QR, cartes et signatures.
            <br />
            Des outils pour mettre vos créations en usage.
          </p>
          <Link className="bh-cta" to="/register">
            Créer mon espace WRX <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <svg className="bh-route" aria-hidden="true">
        <path className="bh-route-path" />
      </svg>
      <RoutingComposition />
      <IdentityComposition />
      <ActivityWorkspace />
      <FinalInvitation />
    </main>
  );
}
