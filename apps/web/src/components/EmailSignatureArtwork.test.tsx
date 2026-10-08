import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { blankEmailSignatureDocument } from '../lib/email-signature-mapping';
import { EmailSignatureArtwork } from './EmailSignatureArtwork';

describe('EmailSignatureArtwork', () => {
  it('reflects selected template, field visibility, and published assets', () => {
    const signature = blankEmailSignatureDocument();
    signature.identity.fullName = 'Ada Lovelace';
    signature.identity.company = 'Engines';
    signature.contact.email = 'ada@example.com';
    signature.socialLinks.linkedin = 'https://linkedin.com/in/ada';
    signature.visibility.email = true;
    signature.visibility.linkedin = true;
    signature.visibility.company = false;
    signature.images.avatar = { assetId: 'asset-1', altText: 'Ada portrait' };
    signature.visibility.avatar = true;
    signature.templateId = 'compact';
    const { container } = render(<EmailSignatureArtwork document={signature} assets={[{ id: 'asset-1', kind: 'avatar', contentType: 'image/png', byteSize: 123, publicUrl: 'https://assets.example/ada.png', createdAt: '' }]} />);
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('https://linkedin.com/in/ada')).toBeInTheDocument();
    expect(screen.queryByText('Engines')).not.toBeInTheDocument();
    expect(screen.getByAltText('Ada portrait')).toHaveAttribute('src', 'https://assets.example/ada.png');
    expect(container.querySelector('.es-template-compact')).toBeInTheDocument();
  });
});
