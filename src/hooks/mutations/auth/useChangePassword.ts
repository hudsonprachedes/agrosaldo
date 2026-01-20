import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/api.service';

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
  });
}
