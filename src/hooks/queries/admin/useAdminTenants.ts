import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminTenants() {
  return useQuery({
    queryKey: queryKeys.admin.tenants,
    queryFn: () => adminService.getTenants(),
    staleTime: 30 * 1000,
  });
}
