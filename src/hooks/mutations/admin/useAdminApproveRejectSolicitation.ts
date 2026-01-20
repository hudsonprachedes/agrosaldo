import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminApproveSolicitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      data?: {
        trialDays?: number;
        trialPlan?: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';
      };
    }) => adminService.approveRequest(input.id, input.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.solicitations });
    },
  });
}

export function useAdminRejectSolicitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; reason: string }) =>
      adminService.rejectRequest(input.id, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.solicitations });
    },
  });
}

export function useAdminDeleteSolicitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => adminService.deleteRequest(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.solicitations });
    },
  });
}
