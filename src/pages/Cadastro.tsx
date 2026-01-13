import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCEP } from '@/lib/cep';

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

  // Busca automática de CEP
  React.useEffect(() => {
    const fetchAddress = async () => {
      if (cepValue && cepValue.replace(/\D/g, '').length === 8) {
        setFetchingCEP(true);
        try {
          const data = await fetchCEP(cepValue);
          if (data) {
            setValue('municipio', data.localidade);
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Enviado!</h2>
            <p className="text-gray-600 mb-4">
              Sua solicitação foi recebida e será analisada pelo nosso time.
            </p>
            <p className="text-sm text-gray-500">
              Você receberá um email com as instruções de acesso assim que seu cadastro for aprovado.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Redirecionando para login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Criar Conta no AgroSaldo
          </h1>
          <p className="text-gray-600">
            Preencha seus dados para se cadastrar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Dados Cadastrais
            </CardTitle>
            <CardDescription>
              Após o cadastro, sua solicitação será analisada e você receberá um período de teste gratuito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nome Completo */}
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="João Silva"
                  className={cn(errors.nome && 'border-red-500')}
                />
                {errors.nome && (
                  <p className="text-sm text-red-500 mt-1">{errors.nome.message}</p>
                )}
              </div>

              {/* CPF ou CNPJ */}
              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  {...register('cpfCnpj')}
                  placeholder="000.000.000-00"
                  onChange={(e) => {
                    const formatted = formatCPFCNPJ(e.target.value);
                    setValue('cpfCnpj', formatted);
                  }}
                  className={cn(errors.cpfCnpj && 'border-red-500')}
                />
                {errors.cpfCnpj && (
                  <p className="text-sm text-red-500 mt-1">{errors.cpfCnpj.message}</p>
                )}
              </div>

              {/* Email e Celular */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="joao@fazenda.com"
                    className={cn(errors.email && 'border-red-500')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="celular">Celular (WhatsApp)</Label>
                  <Input
                    id="celular"
                    {...register('celular')}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => {
                      const formatted = formatCelular(e.target.value);
                      setValue('celular', formatted);
                    }}
                    className={cn(errors.celular && 'border-red-500')}
                  />
                  {errors.celular && (
                    <p className="text-sm text-red-500 mt-1">{errors.celular.message}</p>
                  )}
                </div>
              </div>

              {/* Número de Cabeças e Cupom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroCabecas">Número de Cabeças de Gado</Label>
                  <Input
                    id="numeroCabecas"
                    type="number"
                    {...register('numeroCabecas', { valueAsNumber: true })}
                    placeholder="100"
                    className={cn(errors.numeroCabecas && 'border-red-500')}
                  />
                  {errors.numeroCabecas && (
                    <p className="text-sm text-red-500 mt-1">{errors.numeroCabecas.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cupomIndicacao">Cupom de Indicação (opcional)</Label>
                  <Input
                    id="cupomIndicacao"
                    {...register('cupomIndicacao')}
                    placeholder="FAZENDA2024"
                  />
                </div>
              </div>

              {/* CEP */}
              <div>
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
                    className={cn(errors.cep && 'border-red-500')}
                  />
                  {fetchingCEP && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {errors.cep && (
                  <p className="text-sm text-red-500 mt-1">{errors.cep.message}</p>
                )}
              </div>

              {/* Município e UF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="municipio">Município</Label>
                  <Input
                    id="municipio"
                    {...register('municipio')}
                    placeholder="Cuiabá"
                    className={cn(errors.municipio && 'border-red-500')}
                  />
                  {errors.municipio && (
                    <p className="text-sm text-red-500 mt-1">{errors.municipio.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Select
                    onValueChange={(value) => setValue('uf', value)}
                  >
                    <SelectTrigger className={cn(errors.uf && 'border-red-500')}>
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
                  {errors.uf && (
                    <p className="text-sm text-red-500 mt-1">{errors.uf.message}</p>
                  )}
                </div>
              </div>

              {/* Senha e Confirmar Senha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    {...register('senha')}
                    placeholder="Mínimo 6 caracteres"
                    className={cn(errors.senha && 'border-red-500')}
                  />
                  {errors.senha && (
                    <p className="text-sm text-red-500 mt-1">{errors.senha.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    {...register('confirmarSenha')}
                    placeholder="Repita a senha"
                    className={cn(errors.confirmarSenha && 'border-red-500')}
                  />
                  {errors.confirmarSenha && (
                    <p className="text-sm text-red-500 mt-1">{errors.confirmarSenha.message}</p>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/login')}
                  disabled={isLoading}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Cadastrar'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
