import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminPayments() {
  return useQuery({
    queryKey: queryKeys.admin.payments,
    queryFn: () => adminService.getPayments(),
    staleTime: 30 * 1000,
  });
}

export function useAdminPixConfig() {
  return useQuery({
    queryKey: queryKeys.admin.pixConfig,
    queryFn: () => adminService.getPixConfig(),
    staleTime: 30 * 1000,
  });
}
