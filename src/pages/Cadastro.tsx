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
import { Loader2, UserPlus, CheckCircle, ArrowLeft, Sparkles, ShieldCheck, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchViaCep } from '@/lib/cep';
import heroBackground from '@/assets/hero-background.jpg';

// Validação de CPF
const isValidCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === parseInt(cleanCPF.charAt(10));
};

// Validação de CNPJ
const isValidCNPJ = (cnpj: string) => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14 || /^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

const cadastroSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpfCnpj: z.string()
    .min(11, 'CPF ou CNPJ inválido')
    .refine((val) => {
      const clean = val.replace(/\D/g, '');
      return clean.length === 11 ? isValidCPF(val) : clean.length === 14 ? isValidCNPJ(val) : false;
    }, 'CPF ou CNPJ inválido'),
  celular: z.string()
    .min(10, 'Celular inválido')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (00) 00000-0000'),
  email: z.string().email('Email inválido'),
  numeroCabecas: z.number().min(1, 'Informe o número de cabeças'),
  cupomIndicacao: z.string().optional(),
  cep: z.string()
    .min(8, 'CEP inválido')
    .regex(/^\d{5}-\d{3}$/, 'Formato: 00000-000'),
  municipio: z.string().min(2, 'Município é obrigatório'),
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
  const [fetchingCEP, setFetchingCEP] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
  });

  const cepValue = watch('cep');
  const ufValue = watch('uf');

  // Busca automática de CEP
  React.useEffect(() => {
    const fetchAddress = async () => {
      if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
        setFetchingCEP(true);
        try {
          const data = await fetchViaCep(cepValue);
          if (data.found) {
            setValue('municipio', data.city);
            setValue('uf', data.uf);
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error);
        } finally {
          setFetchingCEP(false);
        }
      }
    };
    fetchAddress();
  }, [cepValue, setValue]);

  const onSubmit = async (data: CadastroFormData) => {
    setIsLoading(true);
    
    // Simula envio para backend
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Salva no localStorage (mock)
    const cadastrosPendentes = JSON.parse(localStorage.getItem('agrosaldo_pending_signups') || '[]');
    cadastrosPendentes.push({
      id: `signup-${Date.now()}`,
      ...data,
      status: 'pending',
      requestDate: new Date().toISOString(),
      confirmarSenha: undefined, // Remove confirmação
    });
    localStorage.setItem('agrosaldo_pending_signups', JSON.stringify(cadastrosPendentes));
    
    setIsLoading(false);
    setSuccess(true);
    
    setTimeout(() => {
      navigate('/login');
    }, 3000);
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

  const formatCEP = (value: string) => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#04130b] text-white flex items-center justify-center p-6">
        <div className="absolute inset-0">
          <img
            src={heroBackground}
            alt="Paisagem produtiva"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#02170b] via-[#0a3a21] to-[#0c522b] opacity-95" />
          <div className="absolute -bottom-32 -left-10 w-[26rem] h-[26rem] bg-emerald-400/20 blur-[150px]" />
        </div>
        <Card className="relative z-10 w-full max-w-lg border-white/20 bg-white/5 text-white backdrop-blur-2xl">
          <CardContent className="pt-12 pb-8 text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/20 border border-emerald-200/30">
              <CheckCircle className="h-12 w-12 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-3xl font-display">Cadastro enviado!</h2>
              <p className="text-white/70">
                Nossa curadoria está analisando seus dados. Você receberá um email com as próximas etapas em até 24h úteis.
              </p>
            </div>
            <p className="text-sm text-white/50">
              Redirecionando automaticamente para o login. Se preferir, clique abaixo.
            </p>
            <Button
              className="bg-white/90 text-emerald-900 hover:bg-white"
              onClick={() => navigate('/login')}
            >
              Ir para o login agora
            </Button>
          </CardContent>
        </Card>
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
              <p className="text-lg font-semibold">Curadoria oficial de acesso</p>
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
                Abra sua conta AgroSaldo e tenha uma rotina digital que dá orgulho todos os dias.
              </h1>
              <p className="text-lg text-white/70 max-w-2xl">
                Selecionamos cuidadosamente cada produtor para manter a comunidade protegida e colaborativa.
                Conte com um visual aconchegante, animações suaves e suporte humano para começar da forma certa.
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
                  description: 'Criptografia ponta a ponta e revisão manual do time.',
                },
                {
                  icon: Globe2,
                  title: 'Time especialista',
                  description: 'Atendimento com veterinários e consultores do campo.',
                },
                {
                  icon: UserPlus,
                  title: 'Convites exclusivos',
                  description: 'Traga equipes e consultorias parceiras com 1 clique.',
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
                  'Nossa curadoria valida CEP, CPF/CNPJ e contexto do rebanho.',
                  'Você recebe o acesso e um especialista acompanha suas primeiras semanas.',
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      <Label htmlFor="nickname">Nome da propriedade (apelido)</Label>
                      <Input
                        id="nickname"
                        {...register('cupomIndicacao')}
                        placeholder="Faz. Primavera"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          {...register('cep')}
                          placeholder="00000-000"
                          onChange={(e) => {
                            const formatted = formatCEP(e.target.value);
                            setValue('cep', formatted);
                          }}
                          className={cn('h-11 pr-10', errors.cep && 'border-red-500')}
                        />
                        {fetchingCEP && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-500" />
                        )}
                      </div>
                      {errors.cep && <p className="text-sm text-red-500">{errors.cep.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>UF</Label>
                      <Select
                        value={ufValue ?? undefined}
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
                      <Label htmlFor="municipio">Município</Label>
                      <Input
                        id="municipio"
                        {...register('municipio')}
                        placeholder="Cuiabá"
                        className={cn('h-11', errors.municipio && 'border-red-500')}
                      />
                      {errors.municipio && <p className="text-sm text-red-500">{errors.municipio.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="senha">Senha</Label>
                      <Input
                        id="senha"
                        type="password"
                        {...register('senha')}
                        placeholder="Mínimo 6 caracteres"
                        className={cn('h-11', errors.senha && 'border-red-500')}
                      />
                      {errors.senha && <p className="text-sm text-red-500">{errors.senha.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      {...register('confirmarSenha')}
                      placeholder="Repita a senha"
                      className={cn('h-11', errors.confirmarSenha && 'border-red-500')}
                    />
                    {errors.confirmarSenha && <p className="text-sm text-red-500">{errors.confirmarSenha.message}</p>}
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
