import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Link, CreateLinkDto, UpdateLinkDto, PaginatedResponse } from '@wrx/shared';

interface LinkFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'createdAt' | 'clicks' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Query keys
export const linkKeys = {
  all: ['links'] as const,
  lists: () => [...linkKeys.all, 'list'] as const,
  list: (filters: LinkFilters) => [...linkKeys.lists(), filters] as const,
  details: () => [...linkKeys.all, 'detail'] as const,
  detail: (id: string) => [...linkKeys.details(), id] as const,
  stats: (id: string) => [...linkKeys.all, 'stats', id] as const,
};

// Hook pour récupérer la liste des liens avec pagination
export function useLinks(filters: LinkFilters = {}) {
  const { page = 1, limit = 10, search, isActive, sortBy, sortOrder } = filters;

  return useQuery({
    queryKey: linkKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Link>> => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (isActive !== undefined) params.set('isActive', String(isActive));
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);

      return api.get<PaginatedResponse<Link>>(`/links?${params.toString()}`);
    },
  });
}

// Hook pour récupérer les liens avec infinite scroll
export function useInfiniteLinks(filters: Omit<LinkFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: [...linkKeys.lists(), 'infinite', filters] as const,
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedResponse<Link>> => {
      const params = new URLSearchParams();
      params.set('page', String(pageParam));
      params.set('limit', String(filters.limit || 10));
      if (filters.search) params.set('search', filters.search);
      if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

      return api.get<PaginatedResponse<Link>>(`/links?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

// Hook pour récupérer un lien par ID
export function useLink(id: string) {
  return useQuery({
    queryKey: linkKeys.detail(id),
    queryFn: async (): Promise<Link> => {
      return api.get<Link>(`/links/${id}`);
    },
    enabled: !!id,
  });
}

// Hook pour récupérer les statistiques d'un lien
export function useLinkStats(id: string) {
  return useQuery({
    queryKey: linkKeys.stats(id),
    queryFn: async () => {
      return api.get<{
        totalClicks: number;
        clicksByDate: { date: string; count: number }[];
        clicksByCountry: { country: string; count: number }[];
        clicksByDevice: { device: string; count: number }[];
        clicksByBrowser: { browser: string; count: number }[];
      }>(`/links/${id}/stats`);
    },
    enabled: !!id,
  });
}

// Hook pour créer un lien
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkDto): Promise<Link> => {
      return api.post<Link>('/links', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}

// Hook pour mettre à jour un lien
export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLinkDto }): Promise<Link> => {
      return api.put<Link>(`/links/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}

// Hook pour supprimer un lien
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return api.delete(`/links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}

// Hook pour dupliquer un lien
export function useDuplicateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Link> => {
      return api.post<Link>(`/links/${id}/duplicate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}

// Hook pour activer/désactiver un lien
export function useToggleLinkStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }): Promise<Link> => {
      return api.put<Link>(`/links/${id}`, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
  });
}
