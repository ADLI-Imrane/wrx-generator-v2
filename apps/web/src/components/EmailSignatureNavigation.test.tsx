import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Sidebar } from './Sidebar';
import { ToolDirectory } from './ProductPrimitives';

vi.mock('../hooks/useBilling', () => ({ useSubscription: () => ({ data: { tier: 'free' } }), useUsage: () => ({ data: { links: { used: 0, limit: 5 } } }) }));
vi.mock('../stores/ui.store', () => ({ useUIStore: () => ({ sidebarOpen: true, closeSidebar: vi.fn() }) }));
vi.mock('../lib/supabase', () => ({ supabase: { auth: {}, storage: {} } }));

describe('Email Signature navigation integration', () => {
  it('declares library/new/edit routes inside protected children and keeps public card route separate', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/router.tsx'), 'utf8');
    expect(source).toContain("path: '/c/:slug'");
    expect(source).toContain("path: 'email-signatures'");
    expect(source).toContain("path: 'new', element: <EmailSignatureEditorPage />");
    expect(source).toContain("path: ':id/edit', element: <EmailSignatureEditorPage />");
    expect(source.indexOf("path: '/c/:slug'")).toBeLessThan(source.indexOf('// Routes protégées'));
  });

  it('shows exactly one Email Signatures destination in Sidebar and Dashboard tool directory', () => {
    const { container: side } = render(<MemoryRouter><Sidebar/></MemoryRouter>);
    expect(within(side).getAllByRole('link', { name: 'Signatures email' })).toHaveLength(1);
    const { container: directory } = render(<MemoryRouter><ToolDirectory/></MemoryRouter>);
    expect(within(directory).getAllByRole('link', { name: /Signatures email/ })).toHaveLength(1);
    expect(screen.getByText('07 / ACTIFS')).toBeInTheDocument();
  });

  it('provides a Studio chapter label for the Email Signatures route', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/Layout.tsx'), 'utf8');
    expect(source).toContain("'email-signatures': '10 / Correspondance professionnelle'");
  });
});
