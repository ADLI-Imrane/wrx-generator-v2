import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { QRCode, CreateQRCodeDto, UpdateQRCodeDto, PaginatedResponse } from '@wrx/shared';

// Helper to get auth token
async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || '';
}

interface QRFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'url' | 'vcard' | 'wifi' | 'text' | 'email' | 'phone' | 'sms';
  sortBy?: 'createdAt' | 'scans' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Query keys
export const qrKeys = {
  all: ['qr-codes'] as const,
  lists: () => [...qrKeys.all, 'list'] as const,
  list: (filters: QRFilters) => [...qrKeys.lists(), filters] as const,
  details: () => [...qrKeys.all, 'detail'] as const,
  detail: (id: string) => [...qrKeys.details(), id] as const,
  image: (id: string) => [...qrKeys.all, 'image', id] as const,
  stats: (id: string) => [...qrKeys.all, 'stats', id] as const,
};

// Hook pour récupérer la liste des QR codes avec pagination
export function useQRCodes(filters: QRFilters = {}) {
  const { page = 1, limit = 10, search, type, sortBy, sortOrder } = filters;

  return useQuery({
    queryKey: qrKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<QRCode>> => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);

      return api.get<PaginatedResponse<QRCode>>(`/qr?${params.toString()}`);
    },
  });
}

// Hook pour récupérer un QR code par ID
export function useQRCode(id: string) {
  return useQuery({
    queryKey: qrKeys.detail(id),
    queryFn: async (): Promise<QRCode> => {
      return api.get<QRCode>(`/qr/${id}`);
    },
    enabled: !!id,
  });
}

// Hook pour récupérer les statistiques d'un QR code
export function useQRCodeStats(id: string, timeRange: '7d' | '30d' | '90d' | 'all' = '30d') {
  return useQuery({
    queryKey: [...qrKeys.stats(id), timeRange],
    queryFn: async () => {
      return api.get<{
        total_scans: number;
        unique_scanners: number;
        scans_by_day: { date: string; scans: number }[];
        scans_by_country: { country: string; code: string; scans: number }[];
        scans_by_device: { device: string; scans: number }[];
        scans_by_os: { os: string; scans: number }[];
      }>(`/qr/${id}/stats?timeRange=${timeRange}`);
    },
    enabled: !!id,
  });
}

// Hook pour récupérer l'image d'un QR code
export function useQRImage(id: string, format: 'png' | 'svg' = 'png') {
  return useQuery({
    queryKey: [...qrKeys.image(id), format],
    queryFn: async (): Promise<string> => {
      const token = await getAuthToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/qr/${id}/image?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch QR image');
      }

      if (format === 'svg') {
        return response.text();
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled: !!id,
  });
}

// Hook pour créer un QR code
export function useCreateQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQRCodeDto): Promise<QRCode> => {
      return api.post<QRCode>('/qr', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.lists() });
    },
  });
}

// Hook pour mettre à jour un QR code
export function useUpdateQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQRCodeDto }): Promise<QRCode> => {
      return api.put<QRCode>(`/qr/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qrKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: qrKeys.lists() });
    },
  });
}

// Hook pour supprimer un QR code
export function useDeleteQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return api.delete(`/qr/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.lists() });
    },
  });
}

// Alias for backward compatibility
export const useDeleteQRCode = useDeleteQR;
export const useUpdateQRCode = useUpdateQR;

// Hook pour dupliquer un QR code
export function useDuplicateQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<QRCode> => {
      return api.post<QRCode>(`/qr/${id}/duplicate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrKeys.lists() });
    },
  });
}

// Hook pour télécharger un QR code
export function useDownloadQR() {
  return useMutation({
    mutationFn: async ({
      id,
      format,
      size,
    }: {
      id: string;
      format: 'png' | 'svg' | 'pdf';
      size?: number;
    }) => {
      const params = new URLSearchParams();
      params.set('format', format);
      if (size) params.set('size', String(size));

      const token = await getAuthToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/qr/${id}/download?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download QR code');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Créer un lien temporaire pour télécharger
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}

// Hook pour générer un QR code preview (sans sauvegarder)
export function useGenerateQRPreview() {
  return useMutation({
    mutationFn: async (data: CreateQRCodeDto): Promise<string> => {
      const response = await api.post<{ preview: string }>('/qr/preview', data);
      return response.preview;
    },
  });
}
