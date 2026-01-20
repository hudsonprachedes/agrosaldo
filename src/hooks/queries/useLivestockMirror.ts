import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';
import { LivestockMirrorDTO } from '@/types';

export function useLivestockMirror(propertyId?: string, months: number = 1) {
  return useQuery({
    queryKey: propertyId ? queryKeys.livestock.mirror(propertyId, months) : ['livestock', 'mirror', 'no-property'],
    enabled: Boolean(propertyId),
    queryFn: () => apiClient.get<LivestockMirrorDTO>(`/rebanho/${propertyId}/espelho?months=${months}`),
    staleTime: 30 * 1000,
  });
}
