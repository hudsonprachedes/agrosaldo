import React, { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Building2, Save, KeyRound } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notifyFirstFormError } from '@/lib/form-errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageSkeleton from '@/components/PageSkeleton';
import { useAdminCompanySettings } from '@/hooks/queries/admin/useAdminCompanySettings';
import { useAdminUpdateCompanySettings } from '@/hooks/mutations/admin/useAdminCompanySettingsMutations';
import { useChangePassword } from '@/hooks/mutations/auth/useChangePassword';

const companySchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  cnpj: z.string().min(11, 'CNPJ obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  site: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(4, 'Senha atual obrigatória'),
    newPassword: z.string().min(4, 'Nova senha deve ter ao menos 4 caracteres'),
    confirmPassword: z.string().min(4, 'Confirmação obrigatória'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AdminConfiguracoes() {
  const settingsQuery = useAdminCompanySettings();
  const updateSettings = useAdminUpdateCompanySettings();
  const changePassword = useChangePassword();

  const defaultCompanyValues: CompanyFormData = useMemo(
    () => ({
      nome: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      site: '',
    }),
    [],
  );

  const {
    register: registerCompany,
    handleSubmit: handleSubmitCompany,
    reset: resetCompany,
    setFocus: setCompanyFocus,
    formState: { errors: companyErrors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: defaultCompanyValues,
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    setFocus: setPasswordFocus,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    resetCompany({
      nome: settingsQuery.data.nome ?? '',
      cnpj: settingsQuery.data.cnpj ?? '',
      telefone: settingsQuery.data.telefone ?? '',
      email: settingsQuery.data.email ?? '',
      endereco: settingsQuery.data.endereco ?? '',
      site: settingsQuery.data.site ?? '',
    });
  }, [resetCompany, settingsQuery.data]);

  const onInvalidCompany = () => {
    const { toastMessage } = notifyFirstFormError(companyErrors as any, {
      setFocus: setCompanyFocus,
      title: 'Ops! Tem um detalhe para ajustar:',
    });
    toast.error(toastMessage);
  };

  const onInvalidPassword = () => {
    const { toastMessage } = notifyFirstFormError(passwordErrors as any, {
      setFocus: setPasswordFocus,
      title: 'Ops! Tem um detalhe para ajustar:',
    });
    toast.error(toastMessage);
  };

  const onSubmitCompany = async (data: CompanyFormData) => {
    try {
      await updateSettings.mutateAsync({
        nome: data.nome,
        cnpj: data.cnpj,
        ...(data.telefone ? { telefone: data.telefone } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.endereco ? { endereco: data.endereco } : {}),
        ...(data.site ? { site: data.site } : {}),
      });
      toast.success('Configurações atualizadas com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações');
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      const resp = await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if ((resp as any)?.success === false) {
        toast.error('Não foi possível alterar a senha');
        return;
      }

      toast.success('Senha alterada com sucesso');
      resetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    }
  };

  if (settingsQuery.isPending) {
    return <PageSkeleton cards={2} lines={10} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Dados gerais da empresa e segurança do super admin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmitCompany(onSubmitCompany, onInvalidCompany)}>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" {...registerCompany('nome')} />
                {companyErrors.nome && (
                  <p className="text-sm text-destructive">{companyErrors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input id="cnpj" {...registerCompany('cnpj')} />
                {companyErrors.cnpj && (
                  <p className="text-sm text-destructive">{companyErrors.cnpj.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" {...registerCompany('telefone')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...registerCompany('email')} />
                  {companyErrors.email && (
                    <p className="text-sm text-destructive">{companyErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" {...registerCompany('endereco')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input id="site" {...registerCompany('site')} />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-earth/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-earth" />
              </div>
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmitPassword(onSubmitPassword, onInvalidPassword)}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual *</Label>
                <Input id="currentPassword" type="password" {...registerPassword('currentPassword')} />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha *</Label>
                <Input id="newPassword" type="password" {...registerPassword('newPassword')} />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha *</Label>
                <Input id="confirmPassword" type="password" {...registerPassword('confirmPassword')} />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Alterar senha
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
