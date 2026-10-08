import type { Link } from '@wrx/shared';

export type ManagedLinkStatus = 'active' | 'inactive' | 'expired' | 'limit-reached';

export function getManagedLinkStatus(link: Pick<Link, 'isActive' | 'expiresAt' | 'maxClicks' | 'clicks'>): ManagedLinkStatus {
  if (!link.isActive) return 'inactive';
  if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) return 'expired';
  if (link.maxClicks != null && link.clicks >= link.maxClicks) return 'limit-reached';
  return 'active';
}

export function isLinkEligibleForManagedQr(link: Pick<Link, 'isActive' | 'expiresAt' | 'maxClicks' | 'clicks'>): boolean {
  return getManagedLinkStatus(link) === 'active';
}

export function managedLinkStatusLabel(status: ManagedLinkStatus): string {
  switch (status) {
    case 'inactive': return 'Inactif';
    case 'expired': return 'Expiré';
    case 'limit-reached': return 'Limite atteinte';
    default: return 'Actif';
  }
}
