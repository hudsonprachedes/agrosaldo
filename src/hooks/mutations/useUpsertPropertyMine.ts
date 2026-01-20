import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { PropertyDTO } from '@/types';

export type UpsertPropertyPayload = {
  name: string;
  city: string;
  state: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  accessRoute?: string;
  community?: string;
  totalArea: number;
  cultivatedArea: number;
  naturalArea: number;
};

export function useUpsertPropertyMine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id?: string; payload: UpsertPropertyPayload }) => {
      if (input.id) {
        await apiClient.patch(`/propriedades/minhas/${input.id}`, input.payload);
        return;
      }

      await apiClient.post('/propriedades/minhas', input.payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.mine }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
      ]);
    },
  });
}
