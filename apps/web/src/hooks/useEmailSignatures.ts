import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEmailSignatureDto,
  EmailSignatureAssetRecord,
  EmailSignatureImageKind,
  EmailSignatureRecord,
  UpdateEmailSignatureDto,
} from '@wrx/shared';
import { api } from '../lib/api';

export const emailSignatureKeys = {
  all: ['email-signatures'] as const,
  list: () => [...emailSignatureKeys.all, 'list'] as const,
  detail: (id: string) => [...emailSignatureKeys.all, 'detail', id] as const,
  assets: () => [...emailSignatureKeys.all, 'assets'] as const,
};

export function useEmailSignatures() {
  return useQuery({ queryKey: emailSignatureKeys.list(), queryFn: () => api.get<EmailSignatureRecord[]>('/email-signatures') });
}

export function useEmailSignature(id: string) {
  return useQuery({ queryKey: emailSignatureKeys.detail(id), queryFn: () => api.get<EmailSignatureRecord>(`/email-signatures/${id}`), enabled: Boolean(id) });
}

export function useEmailSignatureAssets() {
  return useQuery({ queryKey: emailSignatureKeys.assets(), queryFn: () => api.get<EmailSignatureAssetRecord[]>('/email-signatures/assets') });
}

function useRecordMutation<T>(mutationFn: (input: T) => Promise<EmailSignatureRecord>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: (record) => {
    client.setQueryData(emailSignatureKeys.detail(record.id), record);
    void client.invalidateQueries({ queryKey: emailSignatureKeys.list() });
  } });
}

export function useCreateEmailSignature() {
  return useRecordMutation((input: CreateEmailSignatureDto) => api.post<EmailSignatureRecord>('/email-signatures', input));
}

export function useUpdateEmailSignature() {
  return useRecordMutation(({ id, input }: { id: string; input: UpdateEmailSignatureDto }) => api.put<EmailSignatureRecord>(`/email-signatures/${id}`, input));
}

export function useDeleteEmailSignature() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete<{ id: string; deleted: true }>(`/email-signatures/${id}`), onSuccess: (_, id) => {
    client.removeQueries({ queryKey: emailSignatureKeys.detail(id) });
    void client.invalidateQueries({ queryKey: emailSignatureKeys.list() });
  } });
}

export function usePublishProfileSignatureImage() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (kind: EmailSignatureImageKind) => api.post<EmailSignatureAssetRecord>(`/email-signatures/assets/profile/${kind}`, {}), onSuccess: () => { void client.invalidateQueries({ queryKey: emailSignatureKeys.assets() }); } });
}

export function useUploadEmailSignatureImage() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ file, kind }: { file: File; kind: EmailSignatureImageKind }) => {
    const form = new FormData();
    form.set('image', file);
    form.set('kind', kind);
    return api.postForm<EmailSignatureAssetRecord>('/email-signatures/assets', form);
  }, onSuccess: () => { void client.invalidateQueries({ queryKey: emailSignatureKeys.assets() }); } });
}

export function useDeleteEmailSignatureAsset() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete<{ id: string; deleted: true }>(`/email-signatures/assets/${id}`), onSuccess: () => { void client.invalidateQueries({ queryKey: emailSignatureKeys.assets() }); } });
}
