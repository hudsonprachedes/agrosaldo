import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { MovementDTO, PaginatedResponse } from '@/types';

export type ExtractParams = {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
};

export function useMovementsExtract(propertyId?: string, params?: ExtractParams) {
  return useQuery({
    queryKey:
      propertyId && params
        ? queryKeys.movements.extract(propertyId, params)
        : ['movements', 'extract', 'no-property'],
    enabled: Boolean(propertyId && params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<MovementDTO>>('/lancamentos/extrato', {
        params,
      }),
    staleTime: 15 * 1000,
    placeholderData: keepPreviousData,
  });
}
