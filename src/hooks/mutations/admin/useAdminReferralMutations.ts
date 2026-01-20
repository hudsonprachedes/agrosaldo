import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      code: string;
      type: string;
      value: number;
      maxUsage?: number | null;
      commission?: number;
      createdBy?: string;
      status?: string;
      referrerName?: string;
      referrerCpfCnpj?: string;
      referrerPhone?: string;
    }) => adminService.createCoupon(data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.referrers }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'coupon-usages'] }),
      ]);
    },
  });
}

export function useAdminUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; data: any }) => adminService.updateCoupon(input.id, input.data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.coupons }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.referrers }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'coupon-usages'] }),
      ]);
    },
  });
}
