import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/api.service';
import { queryKeys } from '@/lib/react-query/queryKeys';

export function useAdminUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      nome: string;
      cnpj: string;
      telefone?: string;
      email?: string;
      endereco?: string;
      site?: string;
    }) => adminService.updateCompanySettings(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.companySettings });
    },
  });
}
