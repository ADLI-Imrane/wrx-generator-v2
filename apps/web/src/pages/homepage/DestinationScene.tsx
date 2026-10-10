export function DestinationScene() {
  return (
    <section className="wrx-scene wrx-destination-scene" aria-labelledby="destination-title" data-scene="destination">
      <div className="wrx-destination-copy">
        <p className="wrx-kicker">01 / CRÉER</p>
        <h2 id="destination-title">Une destination.<br /><em>Un point de départ.</em></h2>
        <p>Une adresse devient le premier objet d’un parcours que WRX aide à mettre en circulation.</p>
      </div>
      <div className="wrx-destination-object" aria-label="Adresse de démonstration encadrée par des repères de registration">
        <span className="wrx-frame-corner wrx-frame-tl" /><span className="wrx-frame-corner wrx-frame-tr" />
        <span className="wrx-frame-corner wrx-frame-bl" /><span className="wrx-frame-corner wrx-frame-br" />
        <span className="wrx-destination-origin" aria-hidden="true" />
        <span className="wrx-destination-label">DESTINATION · EXEMPLE</span>
        <strong>atelier-azur.example/menu</strong>
        <span className="wrx-destination-protocol">HTTPS / PUBLIC</span>
      </div>
    </section>
  );
}
