import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminSolicitations() {
  return useQuery({
    queryKey: queryKeys.admin.solicitations,
    queryFn: () => adminService.getRequests(),
    staleTime: 15 * 1000,
  });
}
