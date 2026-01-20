import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminCommunications() {
  return useQuery({
    queryKey: queryKeys.admin.communications,
    queryFn: () => adminService.listCommunications(),
    staleTime: 15 * 1000,
  });
}
