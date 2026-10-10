import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { FinalScene } from './FinalScene';
import { HeroScene } from './HeroScene';
import { ProductStage } from './ProductStage';
import './homepage.css';

const destinations = {
  menu: 'https://atelier-azur.example/menu',
  boutique: 'https://atelier-azur.example/boutique',
} as const;

export default function Homepage() {
  const [destination, setDestination] = useState<keyof typeof destinations>('menu');

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'WRX Generator — Créez. Faites circuler.';
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="wrx-home">
      <a className="wrx-home-skip" href="#wrx-home-main">Aller au contenu</a>
      <header className="wrx-home-header">
        <Link to="/" className="wrx-home-brand" aria-label="WRX Generator, accueil">
          <BrandLogo size="landing" />
          <span>WRX<span className="wrx-home-brand-sub">GENERATOR</span></span>
        </Link>
        <nav className="wrx-home-nav" aria-label="Navigation principale"><a href="#product-story">Liens &amp; QR</a></nav>
        <div className="wrx-home-account">
          <Link className="wrx-home-login" to="/login">Se connecter</Link>
          <Link className="wrx-home-header-cta" to="/register">Créer mon espace <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </header>

      <main id="wrx-home-main">
        <HeroScene />
        <ProductStage
          destination={destinations[destination]}
          selectedDestination={destination}
          onDestinationChange={setDestination}
        />
        <FinalScene />
      </main>
    </div>
  );
}
