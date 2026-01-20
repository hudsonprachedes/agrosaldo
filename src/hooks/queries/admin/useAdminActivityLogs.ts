import { useQuery } from '@tanstack/react-query';
import { adminService, type ActivityLog, type PaginatedResult } from '@/services/api.service';

export type AdminActivityLogParams = {
  tenantId?: string;
  event?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
};

export function useAdminActivityLogs(params: AdminActivityLogParams) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: ['admin', 'activity-logs', queryParams] as const,
    queryFn: () => adminService.getActivityLogs(queryParams) as Promise<PaginatedResult<ActivityLog>>,
    enabled,
    staleTime: 15 * 1000,
  });
}
