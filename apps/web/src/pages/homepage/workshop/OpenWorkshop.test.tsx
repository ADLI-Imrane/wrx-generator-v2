import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import OpenWorkshop from './OpenWorkshop';

describe('Open Workshop visual prototype', () => {
  const renderWorkshop = () => render(<MemoryRouter><OpenWorkshop /></MemoryRouter>);

  it('provides an immediate account CTA and the four labeled, synthetic artifacts', () => {
    renderWorkshop();
    expect(screen.getByRole('heading', { level: 1, name: /Faites-en quelque chose\s*\./ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Créer mon espace WRX' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('article', { name: 'Carte de visite de démonstration de Nora Kane' })).toBeInTheDocument();
    expect(screen.getByLabelText('Exemple de carte numérique publiée')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /QR statique de la carte/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /QR direct de démonstration/ })).toBeInTheDocument();
    expect(screen.queryByText('DONNÉES DE DÉMONSTRATION')).not.toBeInTheDocument();
    expect(document.querySelectorAll('.pin-spacer')).toHaveLength(0);
  });

  it('changes only the illustrative destination while preserving the stable link node and identity', () => {
    renderWorkshop();
    const stableNode = document.querySelector('.ow-fixed-link');
    const identity = stableNode?.textContent;
    expect(screen.getByText('atelier-azur.example/portfolio')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'B Destination B' }));
    expect(screen.getByText('atelier-azur.example/contact')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B Destination B' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.ow-fixed-link')).toBe(stableNode);
    expect(stableNode?.textContent).toBe(identity);
    expect(screen.getByText('Exemple interactif · aucune donnée de compte modifiée.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'A Destination A' }));
    expect(screen.getByText('atelier-azur.example/portfolio')).toBeInTheDocument();
    expect(document.querySelector('.ow-fixed-link')).toBe(stableNode);
  });
});
