
const clicks = [12, 18, 15, 20, 19, 27, 31];
const scans = [3, 5, 4, 6, 5, 7, 8];

export function AnalyticsScene() {
  return (
    <section className="wrx-scene wrx-analytics" id="analytics" aria-labelledby="analytics-title" data-scene="analytics">
      <div className="wrx-analytics-heading">
        <div><p className="wrx-kicker">06 / MESURER</p><h2 id="analytics-title">Voir les passages.</h2></div>
        <p>Les clics sur vos liens.<br />Les scans de vos QR gérés.</p>
      </div>
      <div className="wrx-analytics-panel">
        <div className="wrx-analytics-top"><span className="wrx-analytics-label">ACTIVITÉ · 7 JOURS</span><span className="wrx-demo-stamp">DONNÉES DE DÉMONSTRATION</span></div>
        <div className="wrx-analytics-totals">
          <div><span className="wrx-blue-mark" /><span>CLICS SUR LES LIENS</span><strong>142</strong></div>
          <div><span className="wrx-amber-mark" /><span>SCANS DE QR GÉRÉS</span><strong>38</strong></div>
        </div>
        <div className="wrx-analytics-chart" role="img" aria-label="Graphique illustratif des clics sur les liens et scans de QR gérés sur sept jours">
          <div className="wrx-chart-grid"><i /><i /><i /><i /></div>
          <div className="wrx-chart-plot">{clicks.map((value, index) => <div className="wrx-chart-day" key={index}><span className="wrx-chart-click" style={{ height: `${(value / 31) * 100}%` }} /><span className="wrx-chart-scan" style={{ height: `${((scans[index] ?? 0) / 31) * 100}%` }} /></div>)}</div>
          <div className="wrx-chart-days"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
        </div>
        <div className="wrx-analytics-legend"><span><i className="wrx-blue-mark" /> Clics sur les liens</span><span><i className="wrx-amber-mark" /> Scans de QR gérés</span><span className="wrx-analytics-privacy">Événements agrégés · pas de personnes identifiées</span></div>
      </div>
      <p className="wrx-analytics-source"><span className="wrx-blue-mark" /> LIEN WRX <span className="wrx-analytics-source-line" /> <span className="wrx-amber-mark" /> QR GÉRÉ <span className="wrx-analytics-source-tail">L’activité revient au système.</span></p>
    </section>
  );
}
