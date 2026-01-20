import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { PropertyDTO } from '@/types';

export function usePropertiesMine(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.properties.mine,
    enabled,
    queryFn: () => apiClient.get<PropertyDTO[]>('/propriedades/minhas'),
    staleTime: 60 * 1000,
  });
}
