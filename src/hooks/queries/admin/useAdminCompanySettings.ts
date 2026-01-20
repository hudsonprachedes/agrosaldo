import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminCompanySettings() {
  return useQuery({
    queryKey: queryKeys.admin.companySettings,
    queryFn: () => adminService.getCompanySettings(),
    staleTime: 60 * 1000,
  });
}
