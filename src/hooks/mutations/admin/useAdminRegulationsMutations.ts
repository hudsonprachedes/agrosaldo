import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminCreateRegulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => adminService.createRegulation(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.regulations });
    },
  });
}

export function useAdminUpdateRegulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; data: any }) => adminService.updateRegulation(input.id, input.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.regulations });
    },
  });
}

export function useAdminDeleteRegulation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteRegulation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.regulations });
    },
  });
}
