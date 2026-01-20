import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';

export type PaymentHistoryApiItem = {
  id: string;
  paidAt: string;
  amount: number;
  method: string;
  planId: string;
  cattleCountAtPayment: number;
};

export function useSubscriptionPaymentsMine(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.subscription.paymentsMine,
    enabled,
    queryFn: () => apiClient.get<PaymentHistoryApiItem[]>('/assinaturas/pagamentos/minha'),
    staleTime: 5 * 60 * 1000,
  });
}
