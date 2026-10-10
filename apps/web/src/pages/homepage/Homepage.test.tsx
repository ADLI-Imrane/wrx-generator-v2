import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Homepage from './Homepage';

function renderHomepage() {
  return render(<MemoryRouter><Homepage /></MemoryRouter>);
}

describe('Homepage V3 public story', () => {
  it('locks the approved physical-artifact hero and keeps account actions immediately available', () => {
    renderHomepage();
    expect(document.title).toBe('WRX Generator — Créez. Faites circuler.');
    expect(screen.getByRole('heading', { name: /Créez\. Faites circuler\./ })).toBeInTheDocument();
    expect(screen.getByText('Ce qui compte')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Créer mon espace/ })[0]).toHaveAttribute('href', '/register');
    expect(screen.getAllByRole('link', { name: /Se connecter/ })[0]).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('group', { name: /visuel du héros/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /A Adresse|B Artefact|C Encodage/ })).not.toBeInTheDocument();
    expect([...document.querySelectorAll<HTMLElement>('[data-scene]')].map((scene) => scene.dataset['scene'])).toEqual([
      'hero', 'destination', 'routing', 'qr', 'identity', 'signature', 'analytics', 'workspace', 'final',
    ]);
    expect(document.querySelectorAll('[data-product-beat]')).toHaveLength(7);
    expect(document.querySelector('#product-story')).toContainElement(document.querySelector('[data-scene="destination"]'));
    expect(screen.getByRole('link', { name: 'UNE INTENTION, PLUSIEURS SUPPORTS' })).toHaveAttribute('href', '#product-story');
  });

  it('keeps the route identity stable while the local illustrative destination changes', () => {
    renderHomepage();
    expect(screen.getAllByText('wrx.li/atelier-azur')).toHaveLength(3);
    expect(screen.getByText('Menu du studio')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Boutique' }));
    expect(screen.getByText('Boutique en ligne')).toBeInTheDocument();
    expect(screen.getAllByText('wrx.li/atelier-azur')).toHaveLength(3);
    expect(screen.getByText('Exemple local — aucun compte modifié')).toBeInTheDocument();
  });

  it('keeps every product beat available in normal flow when cinematic mode is unavailable', () => {
    renderHomepage();
    const stage = document.querySelector<HTMLElement>('.wrx-product-stage');
    const beats = [...document.querySelectorAll<HTMLElement>('[data-product-beat]')];

    expect(stage).not.toHaveAttribute('data-cinematic');
    expect(beats).toHaveLength(7);
    expect(beats.every((beat) => !beat.inert)).toBe(true);
    expect(document.querySelectorAll('.pin-spacer')).toHaveLength(0);
  });

  it('distinguishes a direct QR from a managed QR and labels the managed payload', () => {
    renderHomepage();
    expect(screen.getByRole('heading', { name: 'QR direct' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'QR géré' })).toBeInTheDocument();
    expect(screen.getByText(/il faut créer un nouveau QR/i)).toBeInTheDocument();
    expect(screen.getByText(/Le QR reste le même/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /QR direct de démonstration encodant https:\/\/atelier-azur\.example\/menu/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /QR géré de démonstration encodant une adresse WRX stable/ })).toBeInTheDocument();
  });

  it('shows a synthetic printed card with a static published-card QR handoff', () => {
    renderHomepage();
    expect(screen.getByRole('heading', { name: /Du papier à la personne\./ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /QR statique de démonstration encodant https:\/\/wrx\.example\/c\/nora-kane/ })).toBeInTheDocument();
    expect(screen.getByText('Ce QR statique ouvre la carte publiée.')).toBeInTheDocument();
    expect(screen.getByText(/PAS DE SUIVI DE VUES/)).toBeInTheDocument();
    expect(screen.getByText('Enregistrer le contact')).toBeInTheDocument();
  });

  it('keeps the email signature independent and provides a copy action with manual install guidance', () => {
    renderHomepage();
    expect(screen.getByRole('heading', { name: /La même identité\. Un autre support\./ })).toBeInTheDocument();
    expect(screen.getByText('Une copie de votre identité, modifiable indépendamment.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copier la signature' })).toBeInTheDocument();
    expect(screen.getByText(/installer manuellement dans les réglages de votre messagerie/i)).toBeInTheDocument();
    expect(screen.getByText(/Le rendu dépend du client email/)).toBeInTheDocument();
  });

  it('limits the analytics story to clearly labeled Link clicks and Managed QR scans', () => {
    renderHomepage();
    expect(screen.getByRole('heading', { name: 'Voir les passages.' })).toBeInTheDocument();
    expect(screen.getByText('DONNÉES DE DÉMONSTRATION')).toBeInTheDocument();
    expect(screen.getByText('CLICS SUR LES LIENS')).toBeInTheDocument();
    expect(screen.getByText('SCANS DE QR GÉRÉS')).toBeInTheDocument();
    expect(screen.getByText(/pas de personnes identifiées/i)).toBeInTheDocument();
    expect(screen.queryByText(/visites de cartes|signature.*suivi|temps réel/i)).not.toBeInTheDocument();
  });

  it('resolves into the WRX toolbox and ends with the requested account actions', () => {
    renderHomepage();
    expect(screen.getByRole('heading', { name: /Votre espace\. Vos outils\./ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Outils WRX illustrés' })).toBeInTheDocument();
    expect(screen.getByText('Un outil indépendant')).toBeInTheDocument();
    expect(screen.getByText(/Navigation · Latérale/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Créez quelque chose qui circule\./ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Créer mon espace WRX/ })).toHaveAttribute('href', '/register');
    expect(screen.getAllByRole('link', { name: 'Se connecter' })).toHaveLength(3);
  });
});
