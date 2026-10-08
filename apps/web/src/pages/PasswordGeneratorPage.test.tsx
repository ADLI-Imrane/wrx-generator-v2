import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuthStore } from '../stores/auth.store';
import { PasswordGeneratorPage } from './PasswordGeneratorPage';
import { MemoryRouter } from 'react-router-dom';

describe('PasswordGeneratorPage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: { id: 'user-a' } as never });
  });

  it('generates a password with the selected default character sets and saves local history', () => {
    render(<PasswordGeneratorPage />, { wrapper: MemoryRouter });
    fireEvent.click(screen.getByRole('button', { name: 'Générer un mot de passe' }));

    const password = screen.getByRole('status');
    // The generated output is an accessible live region, not form input sent to the API.
    const value = password.textContent || '';
    expect(value).toHaveLength(20);
    expect(value).toMatch(/[A-Z]/);
    expect(value).toMatch(/[a-z]/);
    expect(value).toMatch(/[0-9]/);
    expect(value).not.toMatch(/[!@#$%^&*()[\]{}:,.?+=_-]/);

    const stored = JSON.parse(localStorage.getItem('wrx:password-history:v1:user-a') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].value).toBe(value);
  });

  it('does not allow turning off the only selected character set', () => {
    render(<PasswordGeneratorPage />, { wrapper: MemoryRouter });
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]!);
    fireEvent.click(checkboxes[2]!);
    expect(checkboxes[0]).toBeDisabled();
  });

  it('scopes password history to the signed-in account and supports deletion', async () => {
    localStorage.setItem(
      'wrx:password-history:v1:user-a',
      JSON.stringify([{ id: 'p1', value: 'Example123', createdAt: new Date().toISOString(), options: { uppercase: true, lowercase: true, numbers: true, symbols: false } }])
    );
    useAuthStore.setState({ user: { id: 'user-b' } as never });
    const { rerender } = render(<PasswordGeneratorPage />, { wrapper: MemoryRouter });
    expect(screen.getByText('Vos mots de passe générés apparaîtront ici. Ils restent sur cet appareil.')).toBeInTheDocument();

    act(() => useAuthStore.setState({ user: { id: 'user-a' } as never }));
    rerender(<PasswordGeneratorPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Afficher' }));
    expect(screen.getByText('Example123')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer ce mot de passe' }));
    await waitFor(() => {
      expect(localStorage.getItem('wrx:password-history:v1:user-a')).toBe('[]');
    });
  });
});
