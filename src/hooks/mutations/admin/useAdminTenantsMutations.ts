import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminResetUserPassword() {
  return useMutation({
    mutationFn: (userId: string) => adminService.resetUserPassword(userId),
  });
}

export function useAdminUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: string; status: string; reason?: string }) =>
      adminService.updateUserStatus(input.userId, input.status, input.reason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.tenants }),
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingUsers }),
      ]);
    },
  });
}

export function useAdminUpdateUserPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: string; plan: string }) => adminService.updateUserPlan(input.userId, input.plan),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.tenants });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { userId: string; cpfCnpj?: string; phone?: string | null; email?: string }) =>
      adminService.updateUser(input.userId, {
        ...(input.cpfCnpj !== undefined ? { cpfCnpj: input.cpfCnpj } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.tenants });
    },
  });
}

export function useAdminReleaseAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminService.releaseAccess(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.tenants });
    },
  });
}

export function useAdminImpersonateUser() {
  return useMutation({
    mutationFn: (userId: string) => adminService.impersonateUser(userId),
  });
}

export function useAdminResetOnboarding() {
  return useMutation({
    mutationFn: (input: { userId: string; propertyId: string }) => adminService.resetOnboarding(input.userId, input.propertyId),
  });
}
