import {
  BarChart3,
  Contact,
  ContactRound,
  CreditCard,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Link as LinkIcon,
  Mail,
  QrCode,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface WorkspaceNavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
  detail?: string;
  tone?: string;
}

export interface WorkspaceNavigationGroup {
  label: string;
  items: WorkspaceNavigationItem[];
}

export const workspaceOverview: WorkspaceNavigationItem = {
  to: '/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard,
};

export const workspaceNavigationGroups: WorkspaceNavigationGroup[] = [
  { label: 'Créer & partager', items: [
    { to: '/links', label: 'Liens courts', icon: LinkIcon, detail: 'Raccourcir et organiser des destinations.', tone: 'link' },
    { to: '/qr-codes', label: 'QR Codes', icon: QrCode, detail: 'Encoder un lien ou un contenu.', tone: 'qr' },
    { to: '/business-cards', label: 'Cartes de visite', icon: ContactRound, detail: 'Composer, enregistrer et imprimer.', tone: 'identity' },
    { to: '/digital-cards', label: 'Cartes numériques', icon: Contact, detail: 'Créer une identité numérique partageable.', tone: 'identity' },
    { to: '/email-signatures', label: 'Signatures email', icon: Mail, detail: 'Décliner votre identité dans vos messages.', tone: 'identity' },
  ] },
  { label: 'Mesurer', items: [
    { to: '/analytics', label: 'Analytics', icon: BarChart3, detail: 'Consulter les clics et scans enregistrés.', tone: 'measure' },
  ] },
  { label: 'Utilitaires locaux', items: [
    { to: '/passwords', label: 'Mots de passe', icon: KeyRound, detail: 'Générer localement sur cet appareil.', tone: 'security' },
  ] },
];

export const workspaceUtilityItems: WorkspaceNavigationItem[] = [
  { to: '/billing', label: 'Facturation', icon: CreditCard },
  { to: '/settings', label: 'Paramètres', icon: Settings },
  { to: '/help', label: 'Aide', icon: HelpCircle },
];

const primaryDockPaths = new Set(['/links', '/qr-codes', '/business-cards']);
export const workspacePrimaryDockItems: WorkspaceNavigationItem[] = [
  workspaceOverview,
  ...workspaceNavigationGroups.flatMap((group) => group.items).filter((item) => primaryDockPaths.has(item.to)),
];

export const allWorkspaceNavigationGroups: WorkspaceNavigationGroup[] = [
  { label: 'Espace', items: [workspaceOverview] },
  ...workspaceNavigationGroups,
  { label: 'Compte', items: workspaceUtilityItems },
];

export function isWorkspaceItemActive(pathname: string, to: string): boolean {
  if (to === '/dashboard') return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}
