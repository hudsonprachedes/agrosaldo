import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminCoupons() {
  return useQuery({
    queryKey: queryKeys.admin.coupons,
    queryFn: () => adminService.listCoupons(),
    staleTime: 30 * 1000,
  });
}

export function useAdminReferrers() {
  return useQuery({
    queryKey: queryKeys.admin.referrers,
    queryFn: () => adminService.listReferrers(),
    staleTime: 30 * 1000,
  });
}

export function useAdminCouponUsages() {
  return useQuery({
    queryKey: ['admin', 'coupon-usages'] as const,
    queryFn: () => adminService.listCouponUsages(),
    staleTime: 30 * 1000,
  });
}
