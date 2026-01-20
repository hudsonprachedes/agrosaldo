import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      price: number;
      maxCattle?: number | null;
      additionalChargeEnabled?: boolean;
      additionalChargePerHead?: number;
      features?: string[];
      active?: boolean;
    }) => adminService.createAdminPlan(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.plans });
    },
  });
}

export function useAdminUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      data: Partial<{
        name: string;
        price: number;
        maxCattle?: number | null;
        additionalChargeEnabled?: boolean;
        additionalChargePerHead?: number;
        features?: string[];
        active?: boolean;
      }>;
    }) => adminService.updateAdminPlan(input.id, input.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.plans });
    },
  });
}

export function useAdminDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteAdminPlan(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.plans });
    },
  });
}
