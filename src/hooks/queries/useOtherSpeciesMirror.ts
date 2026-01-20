import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';
import { OtherSpeciesMirrorDTO } from '@/types';

export function useOtherSpeciesMirror(propertyId?: string, months: number = 1) {
  return useQuery({
    queryKey: propertyId
      ? queryKeys.livestock.otherSpecies(propertyId, months)
      : ['livestock', 'other-species', 'no-property'],
    enabled: Boolean(propertyId),
    queryFn: () =>
      apiClient.get<OtherSpeciesMirrorDTO>(`/rebanho/${propertyId}/outras-especies?months=${months}`),
    staleTime: 30 * 1000,
  });
}
