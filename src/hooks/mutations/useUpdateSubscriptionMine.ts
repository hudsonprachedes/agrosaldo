import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';

export type PlanId = 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';

export function useUpdateSubscriptionMine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: PlanId) => {
      return apiClient.post('/assinaturas/minha', { planId });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription.mine }),
        queryClient.invalidateQueries({ queryKey: queryKeys.subscription.paymentsMine }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
      ]);
    },
  });
}
