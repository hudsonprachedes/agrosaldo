import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, CheckCircle, ArrowLeft, Sparkles, ShieldCheck, Globe2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateCPF, validateCNPJ, validateCpfCnpj } from '@/lib/document-validation';
import heroBackground from '@/assets/hero-background.jpg';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { notifyFirstFormError } from '@/lib/form-errors';

// Validação de CPF
const isValidCPF = (cpf: string) => {
  return validateCPF(cpf);
};

// Validação de CNPJ
const isValidCNPJ = (cnpj: string) => {
  return validateCNPJ(cnpj);
};

const cadastroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpfCnpj: z.string()
    .min(11, 'CPF ou CNPJ inválido')
    .refine((val) => {
      return validateCpfCnpj(val);
    }, 'CPF ou CNPJ inválido'),
  celular: z.string()
    .min(10, 'Celular inválido')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (00) 00000-0000'),
  email: z.string().email('Email inválido'),
  numeroCabecas: z.number().min(1, 'Informe o número de cabeças'),
  cupomIndicacao: z.string().optional(),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string()
}).refine((data) => data.senha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type CadastroFormData = z.infer<typeof cadastroSchema>;

const UFs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Cadastro() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setFocus,
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
  });

  const ufValue = watch('uf');

  const onSubmit = async (data: CadastroFormData) => {
    setIsLoading(true);
    setFormErrorMessage(null);

    try {
      await apiClient.post('/auth/register', {
        name: data.nome,
        cpfCnpj: data.cpfCnpj,
        email: data.email,
        phone: data.celular,
        password: data.senha,
        uf: data.uf,
        cattleCount: data.numeroCabecas,
        referralCoupon: data.cupomIndicacao,
      });

      setIsLoading(false);
      setSuccess(true);
    } catch (error) {
      console.error('Erro ao enviar cadastro:', error);
      setFormErrorMessage('Não foi possível enviar seu cadastro agora. Tente novamente em instantes.');
      toast.error('Não foi possível enviar seu cadastro. Tente novamente.');
      setIsLoading(false);
    }
  };

  const onInvalid = () => {
    const { toastMessage } = notifyFirstFormError(errors as any, {
      setFocus,
      title: 'Ops! Tem um detalhe para ajustar:',
    });
    setFormErrorMessage(toastMessage);
    toast.error(toastMessage);
  };

  // Máscaras de formatação
  const formatCPFCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCelular = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#020d06] text-white">
        <div className="absolute inset-0">
          <img
            src={heroBackground}
            alt="Produtor no campo"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#03150b] via-[#0f3f24] to-[#125835] opacity-95" />
          <div className="absolute top-0 right-0 h-[28rem] w-[28rem] bg-emerald-400/20 blur-[160px]" />
          <div className="absolute bottom-0 left-0 h-[30rem] w-[30rem] bg-lime-400/10 blur-[200px]" />
        </div>

        <div className="relative z-10 px-4 py-10 lg:px-10">
          <div className="mx-auto w-full max-w-xl">
            <Card className="rounded-[28px] border border-white/25 bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="mt-4 text-2xl font-display text-foreground">Cadastro enviado</CardTitle>
                <CardDescription>
                  Seu cadastro foi recebido com sucesso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Sua conta foi criada com sucesso.
                </div>
                <div className="rounded-xl border border-muted bg-white px-4 py-3 text-sm text-muted-foreground">
                  Agora você já pode entrar com seu CPF/CNPJ e senha.
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    className="h-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-base font-semibold hover:shadow-lg"
                    onClick={() => navigate('/login')}
                  >
                    Ir para o login
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12"
                    onClick={() => {
                      setSuccess(false);
                    }}
                  >
                    Enviar outro cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020d06] text-white">
      <div className="absolute inset-0">
        <img
          src={heroBackground}
          alt="Produtor no campo"
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#03150b] via-[#0f3f24] to-[#125835] opacity-95" />
        <div className="absolute top-0 right-0 h-[28rem] w-[28rem] bg-emerald-400/20 blur-[160px]" />
        <div className="absolute bottom-0 left-0 h-[30rem] w-[30rem] bg-lime-400/10 blur-[200px]" />
      </div>

      <div className="relative z-10 px-4 py-8 lg:px-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/agrosaldo-logo.png"
              alt="AgroSaldo"
              className="h-12 w-12 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">AgroSaldo</p>
              <p className="text-lg font-semibold">Crie sua conta</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 border border-white/10"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao site
            </Button>
            <Button
              className="bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur"
              onClick={() => navigate('/login')}
            >
              Já tenho conta
            </Button>
          </div>
        </header>

        <main className="mt-12 grid max-w-6xl mx-auto items-start gap-10 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="order-2 space-y-8 animate-slide-in-left lg:order-1">
            <Badge className="bg-white/10 border border-white/20 text-white uppercase tracking-widest w-fit">
              Processo guiado
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-display leading-tight">
                Crie sua conta e organize o saldo do rebanho antes da correria da declaração.
              </h1>
              <p className="text-lg text-white/70 max-w-2xl">
                O AgroSaldo foi feito para você registrar a rotina (nascimentos, mortes, vendas e vacinas) e ter o histórico pronto
                quando precisar informar saldo e sanidade para a Defesa Agropecuária — evitando divergências que travam a GTA.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Sparkles,
                  title: 'Onboarding inspirado',
                  description: 'Tour guiado e checklist para os primeiros 30 dias.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Segurança auditada',
                  description: 'Seus dados ficam protegidos e sua rotina fica registrada.',
                },
                {
                  icon: Globe2,
                  title: 'Time especialista',
                  description: 'Ajuda humana quando você precisar começar ou ajustar o processo.',
                },
                {
                  icon: UserPlus,
                  title: 'Convites exclusivos',
                  description: 'Traga sua equipe para registrar com você, sem virar bagunça.',
                },
              ].map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/10 p-3">
                      <Icon className="h-5 w-5 text-emerald-100" />
                    </div>
                    <p className="font-semibold">{title}</p>
                  </div>
                  <p className="mt-3 text-sm text-white/70">{description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur space-y-4">
              <p className="text-sm uppercase tracking-[0.4em] text-white/50">Etapas</p>
              <ol className="space-y-3">
                {[
                  'Preencha seus dados com o máximo de detalhes.',
                  'Acesse o sistema e cadastre/importe seu rebanho e propriedades.',
                  'Registre a rotina e consulte o histórico na hora de declarar.',
                ].map((item, index) => (
                  <li key={item} className="flex items-start gap-3 text-white/80">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="order-1 animate-slide-in-right w-full lg:order-2">
            <div className="rounded-[32px] border border-white/25 bg-white/90 p-1 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="rounded-[28px] bg-white p-6 md:p-8 text-foreground space-y-6">
                <div className="flex flex-col gap-2 text-center">
                  <Badge variant="secondary" className="mx-auto rounded-full px-4 py-1 uppercase tracking-widest">
                    Formulário oficial
                  </Badge>
                  <div>
                    <h2 className="text-2xl font-display">Dados cadastrais</h2>
                    <p className="text-sm text-muted-foreground">
                      Usamos essas informações para liberar o ambiente e customizar indicadores iniciais.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit, onInvalid)}
                  className="space-y-5"
                >
                  {formErrorMessage && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {formErrorMessage}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      {...register('nome')}
                      placeholder="João Silva"
                      className={cn('h-11', errors.nome && 'border-red-500')}
                    />
                    {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                      <Input
                        id="cpfCnpj"
                        {...register('cpfCnpj')}
                        placeholder="000.000.000-00"
                        onChange={(e) => {
                          const formatted = formatCPFCNPJ(e.target.value);
                          setValue('cpfCnpj', formatted);
                        }}
                        className={cn('h-11', errors.cpfCnpj && 'border-red-500')}
                      />
                      {errors.cpfCnpj && <p className="text-sm text-red-500">{errors.cpfCnpj.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="celular">Celular (WhatsApp)</Label>
                      <Input
                        id="celular"
                        {...register('celular')}
                        placeholder="(11) 99999-0000"
                        onChange={(e) => {
                          const formatted = formatCelular(e.target.value);
                          setValue('celular', formatted);
                        }}
                        className={cn('h-11', errors.celular && 'border-red-500')}
                      />
                      {errors.celular && <p className="text-sm text-red-500">{errors.celular.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email profissional</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="joao@fazenda.com"
                        className={cn('h-11', errors.email && 'border-red-500')}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cupomIndicacao">Cupom de indicação (opcional)</Label>
                      <Input
                        id="cupomIndicacao"
                        {...register('cupomIndicacao')}
                        placeholder="FAZENDA2025"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="numeroCabecas">Número de cabeças</Label>
                      <Input
                        id="numeroCabecas"
                        type="number"
                        {...register('numeroCabecas', { valueAsNumber: true })}
                        placeholder="120"
                        className={cn('h-11', errors.numeroCabecas && 'border-red-500')}
                      />
                      {errors.numeroCabecas && (
                        <p className="text-sm text-red-500">{errors.numeroCabecas.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>UF</Label>
                      <Select
                        value={ufValue ?? ''}
                        onValueChange={(value) => setValue('uf', value)}
                      >
                        <SelectTrigger className={cn('h-11', errors.uf && 'border-red-500')}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {UFs.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.uf && <p className="text-sm text-red-500">{errors.uf.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="senha">Senha</Label>
                      <div className="relative">
                        <Input
                          id="senha"
                          type={showPassword ? 'text' : 'password'}
                          {...register('senha')}
                          placeholder="Crie uma senha"
                          className={cn('h-11 pr-10', errors.senha && 'border-red-500')}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.senha && <p className="text-sm text-red-500">{errors.senha.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmarSenha"
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmarSenha')}
                          placeholder="Repita a senha"
                          className={cn('h-11 pr-10', errors.confirmarSenha && 'border-red-500')}
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmarSenha && (
                        <p className="text-sm text-red-500">{errors.confirmarSenha.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      type="submit"
                      className="h-12 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-base font-semibold hover:shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando dados...
                        </>
                      ) : (
                        <>
                          Enviar para análise
                          <Sparkles className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => navigate('/login')}
                      disabled={isLoading}
                    >
                      Prefere voltar ao login? Clique aqui.
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
