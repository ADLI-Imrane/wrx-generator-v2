import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateDigitalCardDto, DigitalCardRecord, UpdateDigitalCardDto } from '@wrx/shared';

export const digitalCardKeys = {
  all: ['digital-cards'] as const,
  list: () => [...digitalCardKeys.all, 'list'] as const,
  detail: (id: string) => [...digitalCardKeys.all, 'detail', id] as const,
};

export function useDigitalCards(options?: { staleTime?: number; refetchOnWindowFocus?: boolean }) {
  return useQuery({
    queryKey: digitalCardKeys.list(),
    queryFn: () => api.get<DigitalCardRecord[]>('/digital-cards'),
    ...options,
  });
}

export function useDigitalCard(
  id: string,
  options?: {
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean | 'always';
  }
) {
  return useQuery({
    queryKey: digitalCardKeys.detail(id),
    queryFn: () => api.get<DigitalCardRecord>(`/digital-cards/${id}`),
    enabled: !!id,
    ...options,
  });
}

function useDigitalCardMutation<TVariables>(
  mutationFn: (input: TVariables) => Promise<DigitalCardRecord>
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (record) => {
      client.setQueryData(digitalCardKeys.detail(record.id), record);
      void client.invalidateQueries({ queryKey: digitalCardKeys.list() });
    },
  });
}

export function useCreateDigitalCard() {
  return useDigitalCardMutation((input: CreateDigitalCardDto) =>
    api.post<DigitalCardRecord>('/digital-cards', input)
  );
}

export function useUpdateDigitalCard() {
  return useDigitalCardMutation(({ id, input }: { id: string; input: UpdateDigitalCardDto }) =>
    api.put<DigitalCardRecord>(`/digital-cards/${id}`, input)
  );
}

export function usePublishDigitalCard() {
  return useDigitalCardMutation(({ id }: { id: string }) =>
    api.post<DigitalCardRecord>(`/digital-cards/${id}/publish`, {})
  );
}

export function useUnpublishDigitalCard() {
  return useDigitalCardMutation(({ id }: { id: string }) =>
    api.post<DigitalCardRecord>(`/digital-cards/${id}/unpublish`, {})
  );
}

export function useDeleteDigitalCard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: true }>(`/digital-cards/${id}`),
    onSuccess: (_, id) => {
      client.removeQueries({ queryKey: digitalCardKeys.detail(id) });
      void client.invalidateQueries({ queryKey: digitalCardKeys.list() });
    },
  });
}
