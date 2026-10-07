import type { BusinessCardDocument } from '@wrx/shared';

// Illustrative content only. This document never touches the user's saved assets.
export const conceptCard: BusinessCardDocument = {
  schemaVersion: 1,
  templateKey: 'minimal',
  identity: {
    fullName: 'Sami Benali',
    jobTitle: 'Design & stratégie',
    company: 'STUDIO S/B',
    email: 'bonjour@example.com',
    phone: '+212 600 000 000',
    website: 'https://example.com',
    address: 'Casablanca · Maroc',
    socialLinks: {},
    avatarPath: null,
    companyLogoPath: null,
  },
  visibility: {
    fullName: true,
    jobTitle: true,
    company: true,
    email: true,
    phone: false,
    website: true,
    address: true,
    linkedin: false,
    github: false,
    instagram: false,
    x: false,
    avatar: false,
    companyLogo: false,
    qr: true,
  },
  brand: { primaryColor: '#2864FF', secondaryColor: '#F1F3F7' },
  sides: {
    front: { composition: 'identity' },
    back: { enabled: true, composition: 'contact-qr' },
  },
  qr: { mode: 'static', type: 'url', content: 'https://example.com' },
};

export const conceptTools = [
  {
    name: 'Cartes de visite',
    verb: 'Créer',
    detail: 'Votre identité, mise en forme. Recto, verso, PNG et impression.',
    path: '/business-cards',
    code: 'IDENTITY',
    accent: 'blue',
  },
  {
    name: 'Liens courts',
    verb: 'Partager',
    detail: 'Une adresse concise. Une destination facile à partager.',
    path: '/links',
    code: 'ROUTING',
    accent: 'blue',
  },
  {
    name: 'QR Codes',
    verb: 'Partager',
    detail: 'Du support physique au contenu numérique, en un scan.',
    path: '/qr-codes',
    code: 'ENCODING',
    accent: 'amber',
  },
  {
    name: 'Mots de passe',
    verb: 'Sécuriser',
    detail: 'Des mots de passe générés localement, selon vos critères.',
    path: '/passwords',
    code: 'ENTROPY',
    accent: 'green',
  },
  {
    name: 'Analytics',
    verb: 'Mesurer',
    detail: 'Lisez les clics de vos liens et les scans suivis de vos QR.',
    path: '/analytics',
    code: 'SIGNALS',
    accent: 'blue',
  },
] as const;
