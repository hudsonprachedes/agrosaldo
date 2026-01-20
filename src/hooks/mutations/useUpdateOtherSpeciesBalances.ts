import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useUpdateOtherSpeciesBalances(propertyId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      date: string;
      notes: string;
      balances: Array<{ speciesId: string; count: number }>;
    }) => {
      await apiClient.post('/lancamentos/outras-especies', payload);
    },
    onSuccess: async () => {
      if (propertyId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.livestock.otherSpecies(propertyId, 1) });
      }
    },
  });
}
