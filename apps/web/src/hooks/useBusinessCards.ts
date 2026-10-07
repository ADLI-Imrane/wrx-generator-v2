import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  BusinessCardRecord,
  CreateBusinessCardDto,
  UpdateBusinessCardDto,
} from '@wrx/shared';

export const businessCardKeys = {
  all: ['business-cards'] as const,
  lists: () => [...businessCardKeys.all, 'list'] as const,
  detail: (id: string) => [...businessCardKeys.all, 'detail', id] as const,
};

export function useBusinessCards() {
  return useQuery({
    queryKey: businessCardKeys.lists(),
    queryFn: () => api.get<BusinessCardRecord[]>('/business-cards'),
  });
}

export function useBusinessCard(id: string) {
  return useQuery({
    queryKey: businessCardKeys.detail(id),
    queryFn: () => api.get<BusinessCardRecord>(`/business-cards/${id}`),
    enabled: !!id,
  });
}

export function useCreateBusinessCard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBusinessCardDto) => api.post<BusinessCardRecord>('/business-cards', input),
    onSuccess: () => client.invalidateQueries({ queryKey: businessCardKeys.lists() }),
  });
}

export function useUpdateBusinessCard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBusinessCardDto }) =>
      api.put<BusinessCardRecord>(`/business-cards/${id}`, input),
    onSuccess: (record) => {
      client.setQueryData(businessCardKeys.detail(record.id), record);
      client.invalidateQueries({ queryKey: businessCardKeys.lists() });
    },
  });
}

export function useDeleteBusinessCard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: true }>(`/business-cards/${id}`),
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: businessCardKeys.detail(id) });
      client.invalidateQueries({ queryKey: businessCardKeys.lists() });
    },
  });
}
