import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminRegulations() {
  return useQuery({
    queryKey: queryKeys.admin.regulations,
    queryFn: () => adminService.getRegulations(),
    staleTime: 10 * 60 * 1000,
  });
}
