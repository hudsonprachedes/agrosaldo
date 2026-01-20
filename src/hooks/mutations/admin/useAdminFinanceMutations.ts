import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type FinancialPayment, type PixConfig } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; data: Partial<FinancialPayment> }) => adminService.updatePayment(input.id, input.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.payments });
    },
  });
}

export function useAdminUpdatePixConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<PixConfig>) => adminService.updatePixConfig(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.pixConfig });
    },
  });
}
