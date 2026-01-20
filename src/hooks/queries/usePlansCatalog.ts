import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';

export interface PlanCatalogItem {
  id: string;
  name: string;
  price: number;
  maxCattle: number;
  description?: string;
  features?: string[];
}

export function usePlansCatalog(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.plans.catalog,
    enabled,
    queryFn: () => apiClient.get<PlanCatalogItem[]>('/planos'),
    staleTime: 10 * 60 * 1000,
  });
}
