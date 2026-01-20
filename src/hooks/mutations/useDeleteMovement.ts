import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useDeleteMovement(propertyId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movementId: string) => {
      await apiClient.delete(`/lancamentos/${movementId}`);
    },
    onSuccess: async () => {
      if (propertyId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.movements.launchSummary(propertyId) }),
          queryClient.invalidateQueries({ queryKey: ['movements'] }),
          queryClient.invalidateQueries({ queryKey: ['livestock'] }),
        ]);
      }
    },
  });
}
