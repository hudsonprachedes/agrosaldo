import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';

export function useAdminAnalytics(period: '7d' | '30d' | '90d' | '1y') {
  return useQuery({
    queryKey: ['admin', 'analytics', period] as const,
    queryFn: () => adminService.getAnalytics(period),
    staleTime: 30 * 1000,
  });
}
