import { useQuery } from '@tanstack/react-query';
import { adminService, type AuditLog, type PaginatedResult } from '@/services/api.service';

export type AdminAuditLogParams = {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
};

export function useAdminAuditLogs(params: AdminAuditLogParams) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: ['admin', 'audit-logs', queryParams] as const,
    queryFn: () => adminService.getAuditLogs(queryParams) as Promise<PaginatedResult<AuditLog>>,
    enabled,
    staleTime: 15 * 1000,
  });
}
