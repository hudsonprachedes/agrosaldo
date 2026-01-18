import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, ArrowRight, Beef, Eye, EyeOff, Leaf, LineChart, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MaskedInput } from '@/components/ui/masked-input';
import { validateCpfCnpj } from '@/lib/document-validation';
import heroBackground from '@/assets/hero-background.jpg';
import { notifyFirstFormError } from '@/lib/form-errors';
import { getAppVersionLabel } from '@/version';

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

const loginSchema = z.object({
  cpfCnpj: z
    .string()
    .min(1, 'CPF/CNPJ é obrigatório')
    .refine((value) => {
      return validateCpfCnpj(value);
    }, 'CPF/CNPJ inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const supportWhatsAppNumber = '5544991147084';

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: { cpfCnpj: '', password: '' },
  });

  const isCnpjLogin = loginForm.watch('cpfCnpj').replace(/\D/g, '').length > 11;
  const loginMask = isCnpjLogin ? '99.999.999/9999-99' : '999.999.999-99';

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const { user: loggedUser, success } = await login(data.cpfCnpj, data.password);

      if (success && loggedUser) {
        toast.success('Login realizado com sucesso!');
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

  const onInvalid = () => {
    const { toastMessage } = notifyFirstFormError(loginForm.formState.errors as any, {
      setFocus: loginForm.setFocus,
      title: 'Ops! Falta ajustar um detalhe:',
    });
    toast.error(toastMessage);
  };

  const handleForgotPassword = () => {
    const message = encodeURIComponent('Olá! Esqueci minha senha e preciso de ajuda para acessar o AgroSaldo.');
    window.open(`https://wa.me/${supportWhatsAppNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04130b] text-white">
      {/* Immersive background */}
      <div className="absolute inset-0">
        <img
          src={heroBackground}
          alt="Produtor cuidando do rebanho"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04130c] via-[#0b3a20] to-[#0f5f2e] opacity-95" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-400/30 blur-[140px]" />
        <div className="absolute -bottom-32 -left-16 w-[28rem] h-[28rem] bg-lime-500/20 blur-[160px]" />
      </div>

      <div className="relative z-10 px-4 py-4 lg:px-10 lg:py-8">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/agrosaldo-logo.png"
              alt="AgroSaldo"
              className="h-10 w-10 rounded-full border border-white/20 object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">AgroSaldo</p>
              <p className="text-base font-semibold leading-tight">Controle oficial do seu rebanho</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs text-white hover:bg-white/10 border border-white/10"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              size="sm"
              className="h-9 px-3 text-xs bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur"
              onClick={() => navigate('/contato')}
            >
              Ajuda
            </Button>
          </div>
        </header>

        <main className="mt-10 grid max-w-6xl mx-auto items-start gap-12 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="order-2 space-y-8 animate-slide-in-left lg:order-1">
            <Badge className="bg-white/10 border border-white/20 text-white w-fit uppercase tracking-widest">
              Nova experiência 2025
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-display leading-tight">
                Entre no AgroSaldo e deixe a rotina do rebanho organizada o ano todo.
              </h1>
              <p className="text-lg text-white/70 max-w-2xl">
                Registre nascimentos, mortes, vendas e vacinas na rotina. Na hora de informar saldo e sanidade para a
                Defesa Agropecuária, você consulta e declara com mais segurança — evitando divergências que podem travar a GTA.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Beef,
                  title: 'Rebanho no comando',
                  description: 'Acompanhe saldo e histórico com clareza.',
                },
                {
                  icon: LineChart,
                  title: 'Indicadores vivos',
                  description: 'Evolução por faixa etária e alertas práticos.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Dados blindados',
                  description: 'Segurança nivel banco e auditoria completa.',
                },
                {
                  icon: Leaf,
                  title: 'Operação sustentável',
                  description: 'Rotina simples no campo e confiança na declaração.',
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-400/15 p-2">
                      <Icon className="h-5 w-5 text-emerald-200" />
                    </div>
                    <p className="font-semibold">{title}</p>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{description}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="rounded-full bg-white/10 p-3 animate-bounce-gentle">
                <Sparkles className="h-5 w-5 text-amber-200" />
              </div>
              <div>
                <p className="text-lg font-semibold">Chega de correr atrás de números na hora de declarar</p>
                <p className="text-sm text-white/70">
                  Registre na rotina e tenha o histórico para consultar quando precisar.
                </p>
              </div>
            </div>
          </section>

          <section className="order-1 animate-slide-in-right w-full lg:order-2">
            <div className="rounded-[32px] border border-white/25 bg-white/95 p-1 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="rounded-[28px] bg-white p-6 md:p-8 space-y-6 text-foreground">
                <div className="text-center space-y-1">
                  <CardTitle className="text-2xl font-display">Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Entre para acompanhar indicadores, lotes e alertas do AgroSaldo.
                  </CardDescription>
                </div>

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit, onInvalid)} className="space-y-4">
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
                                placeholder="••••••••"
                                className="h-12 pr-12"
                                autoComplete="current-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          Entrar no painel
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-center text-sm text-muted-foreground">
                  <button className="text-primary font-medium hover:underline" onClick={handleForgotPassword}>
                    Esqueci minha senha
                  </button>
                </div>

                <div className="rounded-2xl border border-muted bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
                  <p className="font-medium text-foreground">Ainda não tem acesso?</p>
                  
                  <Button
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => navigate('/cadastro')}
                  >
                    Solicitar minha conta
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">{getAppVersionLabel()}</p>
              </div>
            </div>
          </section>
        </main>

        
      </div>
    </div>
  );
}
