import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';

export function useAdminArchiveActivityLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => adminService.archiveActivityLogs(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'activity-logs'] });
    },
  });
}

export function useAdminUnarchiveActivityLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => adminService.unarchiveActivityLogs(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'activity-logs'] });
    },
  });
}

export function useAdminDeleteActivityLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => adminService.deleteActivityLogs(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'activity-logs'] });
    },
  });
}
