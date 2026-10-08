import { describe, expect, it } from 'vitest';
import type { BusinessCardDocument, UserProfile } from '@wrx/shared';
import { digitalCardFromBusinessCard, digitalCardFromProfile } from './digital-card-mapping';

const profile: UserProfile = {
  id: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501',
  email: 'person@example.com',
  fullName: 'Nora Benali',
  jobTitle: 'Designer',
  company: 'Studio Nord',
  avatarUrl:
    'https://project.supabase.co/storage/v1/object/sign/avatars/2c783f2e-3d72-41b9-83d6-a6adbe6e8501/avatar?token=temporary',
  companyLogoUrl:
    'https://project.supabase.co/storage/v1/object/sign/avatars/foreign-owner%2Fcompany-logo?token=temporary',
  phone: '+212600000000',
  website: 'example.com',
  address: 'Casablanca',
  linkedinUrl: 'https://linkedin.com/in/nora',
  tier: 'free',
  createdAt: '',
  updatedAt: '',
};

describe('Digital Card source snapshots', () => {
  it('copies Profile once, keeps only canonical owner asset paths, and never persists signed URLs', () => {
    const snapshot = digitalCardFromProfile(profile, '2c783f2e-3d72-41b9-83d6-a6adbe6e8501');
    expect(snapshot.identity).toMatchObject({
      fullName: 'Nora Benali',
      avatarPath: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501/avatar',
      companyLogoPath: null,
    });
    expect(snapshot.contact).toMatchObject({
      email: 'person@example.com',
      website: 'https://example.com',
    });
    expect(snapshot.brand.primaryColor).toBe('#235EE7');
    expect(JSON.stringify(snapshot)).not.toContain('token=');
    expect(JSON.stringify(snapshot)).not.toContain('https://project.supabase.co');
  });

  it('copies meaningful physical identity data while excluding physical composition and QR', () => {
    const source: BusinessCardDocument = {
      schemaVersion: 1,
      templateKey: 'editorial',
      identity: {
        fullName: 'Nora Benali',
        company: 'Studio Nord',
        email: 'person@example.com',
        phone: '+212600000000',
        website: 'https://example.com',
        socialLinks: { github: 'https://github.com/nora' },
        avatarPath: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501/avatar',
        companyLogoPath: '2c783f2e-3d72-41b9-83d6-a6adbe6e8501/company-logo',
      },
      visibility: {
        fullName: true,
        jobTitle: true,
        company: true,
        email: true,
        phone: true,
        website: true,
        address: false,
        linkedin: true,
        github: true,
        instagram: true,
        x: true,
        avatar: true,
        companyLogo: true,
        qr: true,
      },
      brand: { primaryColor: '#123456', secondaryColor: '#ABCDEF' },
      sides: {
        front: { composition: 'brand' },
        back: { enabled: true, composition: 'contact-qr' },
      },
      qr: { mode: 'static', type: 'url', content: 'https://example.com' },
    };
    const snapshot = digitalCardFromBusinessCard(source);
    expect(snapshot.identity.fullName).toBe('Nora Benali');
    expect(snapshot.socialLinks.github).toBe('https://github.com/nora');
    expect(snapshot.brand).toEqual({
      primaryColor: '#123456',
      secondaryColor: '#ABCDEF',
    });
    expect(snapshot).not.toHaveProperty('sides');
    expect(snapshot).not.toHaveProperty('qr');
    expect(snapshot).not.toHaveProperty('templateKey');
    expect(snapshot.presentation.style).toBe('light');
  });
});
