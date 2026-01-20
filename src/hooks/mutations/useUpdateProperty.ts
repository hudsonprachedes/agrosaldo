import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      propertyService.update(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.mine }),
      ]);
    },
  });
}
