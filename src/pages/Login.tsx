import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Beef, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchViaCepWithCache } from '@/lib/cep';
import { MaskedInput } from '@/components/ui/masked-input';

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

const loginSchema = z.object({
  cpfCnpj: z
    .string()
    .min(1, 'CPF/CNPJ é obrigatório')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length === 11 || digits.length === 14;
    }, 'CPF/CNPJ inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpfCnpj: z
    .string()
    .min(1, 'CPF/CNPJ é obrigatório')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length === 11 || digits.length === 14;
    }, 'CPF/CNPJ inválido'),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .refine((value) => value.replace(/\D/g, '').length >= 10, 'Telefone inválido'),
  nickname: z.string().optional(),
  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .refine((value) => value.replace(/\D/g, '').length === 8, 'CEP deve ter 8 dígitos'),
  address: z.string().min(5, 'Endereço inválido'),
  city: z.string().min(2, 'Cidade inválida'),
  uf: z.string().length(2, 'UF inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  passwordConfirm: z.string().min(6),
}).refine(data => data.password === data.passwordConfirm, {
  message: 'Senhas não conferem',
  path: ['passwordConfirm'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================================
// PÁGINA LOGIN
// ============================================================================

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { cpfCnpj: '', password: '' },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      cpfCnpj: '',
      email: '',
      phone: '',
      nickname: '',
      cep: '',
      address: '',
      city: '',
      uf: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const isCnpjLogin = loginForm.watch('cpfCnpj').replace(/\D/g, '').length > 11;
  const loginMask = isCnpjLogin ? '99.999.999/9999-99' : '999.999.999-99';

  const isCnpjRegister = registerForm.watch('cpfCnpj').replace(/\D/g, '').length > 11;
  const registerMask = isCnpjRegister ? '99.999.999/9999-99' : '999.999.999-99';

  // Handle login
  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const { user: loggedUser, success } = await login(data.cpfCnpj, data.password);

      if (success && loggedUser) {
        toast.success('Login realizado com sucesso!');
        // Super admin vai direto para /admin sem precisar selecionar propriedade
        if (loggedUser.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/selecionar-propriedade');
        }
      } else {
        toast.error('CPF/CNPJ ou senha inválidos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Chamar register no contexto
      const success = await register({
        name: data.name,
        cpfCnpj: data.cpfCnpj,
        email: data.email,
        phone: data.phone,
        nickname: data.nickname,
        cep: data.cep,
        address: data.address,
        city: data.city,
        uf: data.uf,
        password: data.password,
      });

      if (success) {
        toast.success('Cadastro realizado! Aguardando aprovação do SuperAdmin.');
        setMode('login');
        registerForm.reset();
        loginForm.setValue('cpfCnpj', data.cpfCnpj);
      } else {
        toast.error('Erro ao realizar cadastro');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CEP lookup
  const handleCepChange = async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setCepLoading(true);
    try {
      const result = await fetchViaCepWithCache(cep);
      if (result.found) {
        registerForm.setValue('address', result.address);
        registerForm.setValue('city', result.city);
        registerForm.setValue('uf', result.uf);
      } else {
        toast.warning('CEP não encontrado. Preencha manualmente.');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Beef className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">AgroSaldo</h1>
          <p className="text-muted-foreground mt-1">Controle oficial do seu rebanho, sem planilha.</p>
        </div>

        {/* Login Card */}
        {mode === 'login' && (
          <Card className="animate-scale-in shadow-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-display text-xl">Entrar</CardTitle>
              <CardDescription>
                Acesse sua conta para gerenciar seu rebanho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF ou CNPJ</FormLabel>
                        <FormControl>
                          <MaskedInput
                            mask={loginMask}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder={isCnpjLogin ? '00.000.000/0000-00' : '000.000.000-00'}
                            className="h-12"
                            autoComplete="username"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••"
                              className="h-12 pr-12"
                              autoComplete="current-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 font-semibold text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <a href="#" className="text-sm text-primary hover:underline">
                  Esqueci minha senha
                </a>
              </div>

              {/* Demo credentials */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Credenciais de demonstração:
                </p>
                <div className="text-xs text-center space-y-1">
                  <p><strong>Produtor:</strong> 123.456.789-00 / 123456</p>
                  <p><strong>Admin:</strong> 00.000.000/0001-00 / admin123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Register Dialog */}
        <Dialog open={mode === 'register'} onOpenChange={(open) => !open && setMode('login')}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Criar Conta</DialogTitle>
              <DialogDescription>
                Preencha seus dados para se cadastrar no AgroSaldo
              </DialogDescription>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setMode('login')}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                {/* Nome */}
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CPF/CNPJ */}
                <FormField
                  control={registerForm.control}
                  name="cpfCnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF ou CNPJ</FormLabel>
                      <FormControl>
                        <MaskedInput
                          mask={registerMask}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder={isCnpjRegister ? '00.000.000/0000-00' : '000.000.000-00'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Telefone */}
                <FormField
                  control={registerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <MaskedInput
                          mask="(99) 99999-9999"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="(11) 99999-9999"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Apelido */}
                <FormField
                  control={registerForm.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apelido (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="João" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CEP */}
                <FormField
                  control={registerForm.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <MaskedInput
                          mask="99999-999"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="12345-678"
                          disabled={cepLoading}
                          onBlur={() => {
                            field.onBlur();
                            handleCepChange(field.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Endereço */}
                <FormField
                  control={registerForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cidade */}
                <FormField
                  control={registerForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* UF */}
                <FormField
                  control={registerForm.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Senha */}
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirmar Senha */}
                <FormField
                  control={registerForm.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMode('login')}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Cadastrar'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Não tem conta?{' '}
          <button
            onClick={() => navigate('/cadastro')}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            Criar conta agora
          </button>
        </p>
      </div>
    </div>
  );
}
