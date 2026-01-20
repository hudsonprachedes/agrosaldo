import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query/queryKeys';
import type { PreferencesDTO } from '@/contexts/AuthContext';

export function useUpdatePreferences(propertyId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PreferencesDTO) => {
      return apiClient.put<PreferencesDTO>('/preferencias', payload);
    },
    onSuccess: async () => {
      if (propertyId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.auth.preferences(propertyId) });
      }
    },
  });
}
