import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';

export interface LaunchSummaryDTO {
  propertyId: string;
  today: number;
  week: number;
  month: number;
  lastUpdatedAt: string | null;
  serverTime: string;
}

export function useLaunchSummary(propertyId?: string) {
  return useQuery({
    queryKey: propertyId ? queryKeys.movements.launchSummary(propertyId) : ['movements', 'launch-summary', 'no-property'],
    enabled: Boolean(propertyId),
    queryFn: () => apiClient.get<LaunchSummaryDTO>('/lancamentos/resumo'),
    staleTime: 30 * 1000,
  });
}
