import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';

export type PlanId = 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';

export type SubscriptionDTO = {
  id: string;
  usuarioId: string;
  plano: PlanId;
  status: 'ativa' | 'cancelada' | 'inadimplente' | string;
  valorMensal?: number | null;
  inicioEm: string;
  fimEm?: string | null;
  criadoEm: string;
  atualizadoEm: string;
} | null;

export function useSubscriptionMine(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.subscription.mine,
    enabled,
    queryFn: () => apiClient.get<SubscriptionDTO>('/assinaturas/minha'),
    staleTime: 60 * 1000,
  });
}
