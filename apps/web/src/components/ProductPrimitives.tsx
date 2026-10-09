import { ArrowUpRight } from 'lucide-react';
import { workspaceNavigationGroups } from '../lib/workspace-navigation';
import { Link } from 'react-router-dom';

export function ToolDirectory() {
  let toolNumber = 0;
  return <section className="tool-directory" aria-labelledby="tool-directory-title">
    <div className="tool-directory-heading">
      <div><span className="eyebrow">OUTILS DISPONIBLES</span><h2 id="tool-directory-title">Choisir un point de départ</h2></div>
      <span className="tool-directory-count">07 / ACTIFS</span>
    </div>
    <div className="tool-directory-groups">
      {workspaceNavigationGroups.map((group, groupIndex) => <section className="tool-directory-group" key={group.label} aria-label={group.label}>
        <div className="tool-group-label"><span className="eyebrow">0{groupIndex + 1}</span><h3>{group.label}</h3></div>
        <div className="tool-group-items">
          {group.items.map((tool) => {
            toolNumber += 1;
            const to = tool.to === '/links' ? '/links/new' : tool.to === '/qr-codes' ? '/qr-codes/new' : tool.to;
            return <Link key={tool.to} to={to} className={`tool-directory-item tone-${tool.tone || 'identity'}`}>
            <span className="tool-directory-id">{String(toolNumber).padStart(2, '0')}</span>
            <span className="tool-directory-icon" aria-hidden="true"><tool.icon size={18} strokeWidth={1.8} /></span>
            <span className="tool-directory-copy"><strong>{tool.label}</strong><small>{tool.detail}</small></span>
            <ArrowUpRight className="tool-directory-arrow" size={17} aria-hidden="true" />
          </Link>})}
        </div>
      </section>)}
    </div>
  </section>;
}
