import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, BarChart3, Contact, ContactRound, KeyRound, Link2, QrCode } from 'lucide-react';

const toolGroups = [
  {
    label: 'Créer & partager',
    tools: [
      { id: '01', name: 'Liens courts', detail: 'Raccourcir et organiser des destinations.', to: '/links/new', icon: Link2, tone: 'link' },
      { id: '02', name: 'QR Codes', detail: 'Encoder un lien ou un contenu.', to: '/qr-codes/new', icon: QrCode, tone: 'qr' },
      { id: '03', name: 'Cartes de visite', detail: 'Composer, enregistrer et imprimer.', to: '/business-cards', icon: ContactRound, tone: 'identity' },
      { id: '04', name: 'Cartes numériques', detail: 'Créer une identité numérique partageable.', to: '/digital-cards', icon: Contact, tone: 'identity' },
    ],
  },
  {
    label: 'Mesurer',
    tools: [
      { id: '05', name: 'Analytics', detail: 'Consulter les clics et scans enregistrés.', to: '/analytics', icon: BarChart3, tone: 'measure' },
    ],
  },
  {
    label: 'Utilitaires locaux',
    tools: [
      { id: '06', name: 'Mots de passe', detail: 'Générer localement sur cet appareil.', to: '/passwords', icon: KeyRound, tone: 'security' },
    ],
  },
] as const;

export function ResourceTabs() {
  return <nav className="resource-tabs" aria-label="Outils de création">
    <NavLink end to="/links"><Link2 size={16} />Liens</NavLink>
    <NavLink end to="/qr-codes"><QrCode size={16} />QR codes</NavLink>
    <NavLink to="/business-cards"><ContactRound size={16} />Cartes</NavLink>
  </nav>;
}

export function ToolDirectory() {
  return <section className="tool-directory" aria-labelledby="tool-directory-title">
    <div className="tool-directory-heading">
      <div><span className="eyebrow">OUTILS DISPONIBLES</span><h2 id="tool-directory-title">Choisir un point de départ</h2></div>
        <span className="tool-directory-count">06 / ACTIFS</span>
    </div>
    <div className="tool-directory-groups">
      {toolGroups.map((group, groupIndex) => <section className="tool-directory-group" key={group.label} aria-label={group.label}>
        <div className="tool-group-label"><span className="eyebrow">0{groupIndex + 1}</span><h3>{group.label}</h3></div>
        <div className="tool-group-items">
          {group.tools.map(tool => <Link key={tool.id} to={tool.to} className={`tool-directory-item tone-${tool.tone}`}>
            <span className="tool-directory-id">{tool.id}</span>
            <span className="tool-directory-icon" aria-hidden="true"><tool.icon size={18} strokeWidth={1.8} /></span>
            <span className="tool-directory-copy"><strong>{tool.name}</strong><small>{tool.detail}</small></span>
            <ArrowUpRight className="tool-directory-arrow" size={17} aria-hidden="true" />
          </Link>)}
        </div>
      </section>)}
    </div>
  </section>;
}
