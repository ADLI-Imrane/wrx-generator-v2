import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { isWorkspaceItemActive, workspaceNavigationGroups, workspaceOverview, workspacePrimaryDockItems, workspaceUtilityItems } from '../lib/workspace-navigation';

export function WorkspaceDock() {
  const location = useLocation();
  return <nav className="workspace-dock" aria-label="Navigation rapide">
    {workspacePrimaryDockItems.map((item) => {
      const active = isWorkspaceItemActive(location.pathname, item.to);
      const label = item.to === '/dashboard' ? 'Accueil' : item.label.replace(' courts', '').replace(' de visite', '');
      return <NavLink key={item.to} to={item.to} aria-label={item.label} aria-current={active ? 'page' : undefined} data-active={active} data-label={label} title={item.label}>
        <item.icon size={20} aria-hidden="true" /><span className="workspace-dock-label" aria-hidden="true">{label}</span>
      </NavLink>;
    })}
  </nav>;
}

export function WorkspaceLauncher({ onClose }: { onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLElement>(null);
  const constellationRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef<number | null>(null);
  const magnetFrame = useRef<number | null>(null);
  const pointerPosition = useRef<{ x: number; y: number } | null>(null);
  const primaryNodes = [workspaceOverview, ...workspaceNavigationGroups.flatMap((group) => group.items)];
  const utilityNodes = workspaceUtilityItems;

  const close = useCallback((afterClose?: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      afterClose?.();
      onClose();
    }, 190);
  }, [onClose]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    pointerPosition.current = { x: event.clientX, y: event.clientY };
    if (magnetFrame.current !== null) return;
    magnetFrame.current = window.requestAnimationFrame(() => {
      magnetFrame.current = null;
      const field = constellationRef.current;
      const pointer = pointerPosition.current;
      if (!field || !pointer) return;
      field.querySelectorAll<HTMLElement>('[data-node-index]').forEach((node) => {
        const bounds = node.getBoundingClientRect();
        const dx = pointer.x - (bounds.left + bounds.width / 2);
        const dy = pointer.y - (bounds.top + bounds.height / 2);
        const distance = Math.hypot(dx, dy);
        const pull = Math.max(0, 1 - distance / 178) * 9;
        node.style.setProperty('--magnet-x', `${distance ? (dx / distance) * pull : 0}px`);
        node.style.setProperty('--magnet-y', `${distance ? (dy / distance) * pull : 0}px`);
      });
    });
  }, []);

  const resetMagnet = useCallback(() => {
    pointerPosition.current = null;
    constellationRef.current?.querySelectorAll<HTMLElement>('[data-node-index]').forEach((node) => {
      node.style.setProperty('--magnet-x', '0px');
      node.style.setProperty('--magnet-y', '0px');
    });
  }, []);

  const handleDestinationClick = (event: ReactMouseEvent<HTMLAnchorElement>, to: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      close();
      return;
    }
    event.preventDefault();
    close(() => navigate(to));
  };

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('a[href],button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      if (magnetFrame.current !== null) window.cancelAnimationFrame(magnetFrame.current);
      previousFocus.current?.focus();
    };
  }, [close]);

  return <div className={`workspace-launcher-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialogRef} id="workspace-launcher" className={`workspace-launcher${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-labelledby="workspace-launcher-title" aria-describedby="workspace-launcher-description" onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)'));
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <header className="workspace-launcher-heading">
        <div><span className="eyebrow">WRX / ESPACE</span><h2 id="workspace-launcher-title">Vos outils, à portée</h2><p id="workspace-launcher-description">Choisissez une destination.</p></div>
        <button type="button" onClick={() => close()} aria-label="Fermer le lanceur" className="workspace-launcher-close">×</button>
      </header>
      <div ref={constellationRef} className="workspace-constellation" role="group" aria-label="Outils principaux" onPointerMove={handlePointerMove} onPointerLeave={resetMagnet}>
        {primaryNodes.map((item, index) => {
          const active = isWorkspaceItemActive(location.pathname, item.to);
          return <Link key={item.to} to={item.to} onClick={(event) => handleDestinationClick(event, item.to)} aria-label={`${item.label}${active ? ', page actuelle' : ''}`} aria-current={active ? 'page' : undefined} className={`${index === 0 ? 'is-overview' : ''}${active ? ' is-active' : ''}`} data-node-index={index} style={{ '--node-index': index } as CSSProperties}>
            <span className="workspace-constellation-node"><item.icon size={21} aria-hidden="true" /></span><span className="workspace-constellation-label">{item.label}</span>
            {active && <small>ACTIF</small>}
          </Link>;
        })}
      </div>
      <nav className="workspace-utility-orbit" aria-label="Compte et assistance">
        {utilityNodes.map((item, index) => {
          const active = isWorkspaceItemActive(location.pathname, item.to);
          return <Link key={item.to} to={item.to} onClick={(event) => handleDestinationClick(event, item.to)} aria-label={`${item.label}${active ? ', page actuelle' : ''}`} aria-current={active ? 'page' : undefined} className={`workspace-utility-node${active ? ' is-active' : ''}`} data-utility-index={index}>
          <item.icon size={16} aria-hidden="true" /><span>{item.label}</span>
          </Link>;
        })}
      </nav>
    </section>
  </div>;
}
