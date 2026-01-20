import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminCreateCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: string;
      title: string;
      message: string;
      sentAt?: string;
      recipients: number;
      status: string;
      targetAudience: string;
      color?: string;
      startDate?: string;
      endDate?: string;
    }) => adminService.createCommunication(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.communications });
    },
  });
}

export function useAdminUpdateCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; data: any }) => adminService.updateCommunication(input.id, input.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.communications });
    },
  });
}

export function useAdminDeleteCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteCommunication(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.communications });
    },
  });
}
