import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { User } from '@wrx/shared';
import { api } from '@/lib/api';

export function useDemoLogin() {
  const qc = useQueryClient();
  const nav = useNavigate();
  return useMutation({
    mutationFn: () => api<User>('/auth/demo', { method: 'POST' }),
    onSuccess: (u) => {
      qc.clear();
      qc.setQueryData(['me'], u);
      nav('/app');
    },
  });
}
