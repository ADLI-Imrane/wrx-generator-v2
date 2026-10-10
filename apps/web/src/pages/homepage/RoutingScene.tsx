
const demoDestinations = {
  menu: 'https://atelier-azur.example/menu',
  boutique: 'https://atelier-azur.example/boutique',
} as const;

type RoutingSceneProps = {
  destination: string;
  selectedDestination: keyof typeof demoDestinations;
  onDestinationChange: (destination: keyof typeof demoDestinations) => void;
};

export function RoutingScene({ destination, selectedDestination, onDestinationChange }: RoutingSceneProps) {
  return (
    <section className="wrx-scene wrx-routing" id="smart-links" aria-labelledby="routing-title" data-scene="routing">
      <div className="wrx-scene-heading wrx-routing-heading">
        <p className="wrx-kicker">02 / ROUTER</p>
        <h2 id="routing-title">Une adresse.<br /><em>Un point de contrôle.</em></h2>
        <p>Le Lien WRX garde une adresse stable pendant que sa destination peut évoluer.</p>
      </div>

      <div className="wrx-route-instrument" aria-label="Source vers Lien WRX puis destination actuelle">
        <div className="wrx-route-track" aria-hidden="true"><span /><span /><span /><i className="wrx-route-signal" /></div>
        <div className="wrx-route-node wrx-route-source"><span className="wrx-node-index">A</span><span className="wrx-node-label">SOURCE</span><strong>Votre adresse</strong><small>une intention</small></div>
        <div className="wrx-route-node wrx-route-link"><span className="wrx-node-index">WRX</span><span className="wrx-node-label">LIEN STABLE</span><strong>wrx.li/<br />atelier-azur</strong><small>même adresse</small></div>
        <div className="wrx-route-node wrx-route-destination"><span className="wrx-node-index">↗</span><span className="wrx-node-label">DESTINATION ACTUELLE</span><strong>{selectedDestination === 'menu' ? 'Menu du studio' : 'Boutique en ligne'}</strong><small className="wrx-route-url">{destination.replace('https://', '')}</small></div>
      </div>

      <div className="wrx-route-controls" aria-label="Démo de changement de destination">
        <span>ESSAYER LA DÉMO</span>
        <button type="button" aria-pressed={selectedDestination === 'menu'} onClick={() => onDestinationChange('menu')}>Menu</button>
        <button type="button" aria-pressed={selectedDestination === 'boutique'} onClick={() => onDestinationChange('boutique')}>Boutique</button>
        <span className="wrx-route-demo-note">Exemple local — aucun compte modifié</span>
      </div>
    </section>
  );
}
