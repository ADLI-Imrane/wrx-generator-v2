import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Analytics,
  ApiKey,
  BioPage,
  ContactRequest,
  Link,
  LinkInput,
  LinkUpdate,
  Opportunity,
  OpportunityInput,
  PublicProfile,
  QrCode,
  QrInput,
  Range,
  User,
  BioInput,
} from '@wrx/shared';
import { api } from '@/lib/api';

export const keys = {
  me: ['me'] as const,
  links: (p: object) => ['links', p] as const,
  link: (id: string) => ['link', id] as const,
  analytics: (range: Range, linkId?: string) => ['analytics', range, linkId ?? 'all'] as const,
  qr: ['qr'] as const,
  bio: ['bio'] as const,
  keys: ['keys'] as const,
  opps: ['opps'] as const,
  inbox: (status?: string) => ['inbox', status ?? 'all'] as const,
};

export const useMe = () =>
  useQuery({ queryKey: keys.me, queryFn: () => api<User>('/auth/me').catch(() => null), staleTime: 60_000 });

export interface LinkList {
  items: Link[];
  total: number;
  tags: string[];
}
export const useLinks = (p: { q?: string; tag?: string; status?: string; sort?: string; limit?: number }) =>
  useQuery({
    queryKey: keys.links(p),
    queryFn: () =>
      api<LinkList>(
        `/links?${new URLSearchParams(
          Object.entries(p)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)]),
        )}`,
      ),
    placeholderData: (prev) => prev,
  });
export const useLink = (id: string) =>
  useQuery({ queryKey: keys.link(id), queryFn: () => api<Link>(`/links/${id}`) });
export const useAnalytics = (range: Range, linkId?: string) =>
  useQuery({
    queryKey: keys.analytics(range, linkId),
    queryFn: () => api<Analytics>(`/analytics?range=${range}${linkId ? `&linkId=${linkId}` : ''}`),
    placeholderData: (p) => p,
  });

function useInvalidate() {
  const qc = useQueryClient();
  return (...prefixes: string[]) => Promise.all(prefixes.map((p) => qc.invalidateQueries({ queryKey: [p] })));
}

export function useLinkMutations() {
  const inv = useInvalidate();
  return {
    create: useMutation({
      mutationFn: (b: Partial<LinkInput>) => api<Link>('/links', { method: 'POST', body: b }),
      onSuccess: () => inv('links', 'analytics'),
    }),
    update: useMutation({
      mutationFn: ({ id, ...b }: LinkUpdate & { id: string }) =>
        api<Link>(`/links/${id}`, { method: 'PATCH', body: b }),
      onSuccess: () => inv('links', 'link'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/links/${id}`, { method: 'DELETE' }),
      onSuccess: () => inv('links', 'analytics', 'qr'),
    }),
    bulk: useMutation({
      mutationFn: (rows: Record<string, string>[]) =>
        api<{ created: number; failed: { row: number; reason: string }[] }>('/links/bulk', {
          method: 'POST',
          body: { rows },
        }),
      onSuccess: () => inv('links'),
    }),
  };
}

export const useQrCodes = () =>
  useQuery({ queryKey: keys.qr, queryFn: () => api<{ items: QrCode[] }>('/qr') });
export function useQrMutations() {
  const inv = useInvalidate();
  return {
    create: useMutation({
      mutationFn: (b: Partial<QrInput>) => api<QrCode>('/qr', { method: 'POST', body: b }),
      onSuccess: () => inv('qr', 'links'),
    }),
    update: useMutation({
      mutationFn: ({ id, ...b }: { id: string; name?: string; design?: QrInput['design'] }) =>
        api<QrCode>(`/qr/${id}`, { method: 'PATCH', body: b }),
      onSuccess: () => inv('qr'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/qr/${id}`, { method: 'DELETE' }),
      onSuccess: () => inv('qr'),
    }),
  };
}

export const useBioPages = () =>
  useQuery({ queryKey: keys.bio, queryFn: () => api<{ items: BioPage[] }>('/bio') });
export function useBioMutations() {
  const inv = useInvalidate();
  return {
    create: useMutation({
      mutationFn: (b: BioInput) => api<BioPage>('/bio', { method: 'POST', body: b }),
      onSuccess: () => inv('bio'),
    }),
    update: useMutation({
      mutationFn: ({ id, ...b }: BioInput & { id: string }) =>
        api<BioPage>(`/bio/${id}`, { method: 'PUT', body: b }),
      onSuccess: () => inv('bio'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/bio/${id}`, { method: 'DELETE' }),
      onSuccess: () => inv('bio', 'opps'),
    }),
  };
}

export const useOpportunities = () =>
  useQuery({ queryKey: keys.opps, queryFn: () => api<{ items: Opportunity[] }>('/connect/opportunities') });
export function useOpportunityMutations() {
  const inv = useInvalidate();
  return {
    save: useMutation({
      mutationFn: ({ id, ...b }: OpportunityInput & { id?: string }) =>
        api<Opportunity>(id ? `/connect/opportunities/${id}` : '/connect/opportunities', {
          method: id ? 'PUT' : 'POST',
          body: b,
        }),
      onSuccess: () => inv('opps'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/connect/opportunities/${id}`, { method: 'DELETE' }),
      onSuccess: () => inv('opps'),
    }),
  };
}

export const useInbox = (status?: string) =>
  useQuery({
    queryKey: keys.inbox(status),
    queryFn: () =>
      api<{ items: ContactRequest[]; counts: Record<string, number> }>(
        `/connect/inbox${status ? `?status=${status}` : ''}`,
      ),
  });
export function useInboxMutations() {
  const inv = useInvalidate();
  return {
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: ContactRequest['status'] }) =>
        api<void>(`/connect/inbox/${id}`, { method: 'PATCH', body: { status } }),
      onSuccess: () => inv('inbox'),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<void>(`/connect/inbox/${id}`, { method: 'DELETE' }),
      onSuccess: () => inv('inbox'),
    }),
  };
}

export const useApiKeys = () =>
  useQuery({ queryKey: keys.keys, queryFn: () => api<{ items: ApiKey[] }>('/keys') });

export type DirectoryProfile = Omit<PublicProfile, 'card'>;
export const useDiscover = (p: { kind?: string; q?: string; location?: string; openTo?: string }) =>
  useQuery({
    queryKey: ['discover', p],
    queryFn: () =>
      api<{ items: DirectoryProfile[] }>(
        `/public/discover?${new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][])}`,
      ),
    placeholderData: (prev) => prev,
  });
export const usePublicOpportunities = (p: { type?: string; q?: string; remote?: string }) =>
  useQuery({
    queryKey: ['public-opps', p],
    queryFn: () =>
      api<{ items: Opportunity[] }>(
        `/public/opportunities?${new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][])}`,
      ),
    placeholderData: (prev) => prev,
  });
