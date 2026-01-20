import { useQueries, useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 30 * 1000,
  });
}

export function useAdminMrrSeries(months: number = 12) {
  return useQuery({
    queryKey: ['admin', 'mrr-series', months] as const,
    queryFn: () => adminService.getMrrSeries(months),
    staleTime: 30 * 1000,
  });
}

export function useAdminDashboardActivity(limit: number = 8) {
  return useQuery({
    queryKey: ['admin', 'dashboard-activity', limit] as const,
    queryFn: () => adminService.getDashboardActivity(limit),
    staleTime: 15 * 1000,
  });
}

export function useAdminDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.admin.dashboard,
        queryFn: () => adminService.getDashboardStats(),
        staleTime: 30 * 1000,
      },
      {
        queryKey: ['admin', 'mrr-series', 12] as const,
        queryFn: () => adminService.getMrrSeries(12),
        staleTime: 30 * 1000,
      },
      {
        queryKey: ['admin', 'dashboard-activity', 8] as const,
        queryFn: () => adminService.getDashboardActivity(8),
        staleTime: 15 * 1000,
      },
    ],
  });

  const [kpis, mrrSeries, activity] = results;

  return {
    kpis,
    mrrSeries,
    activity,
    isPending: results.some((r) => r.isPending),
    isError: results.some((r) => r.isError),
  };
}
