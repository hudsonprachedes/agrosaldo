import { z } from 'zod';

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================
export const LoginSchema = z.object({
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const RegisterSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// ============================================================================
// PROPRIEDADES
// ============================================================================
export const PropertySchema = z.object({
  id: z.string(),
  nome: z.string(),
  cidade: z.string(),
  estado: z.string(),
  areaTotal: z.number(),
  areaCultivada: z.number(),
  areaNatural: z.number(),
  quantidadeGado: z.number(),
  status: z.enum(['ativa', 'pendente', 'suspensa']),
  plano: z.enum(['porteira', 'piquete', 'retiro', 'estancia', 'barao']),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});

export const CreatePropertySchema = z.object({
  nome: z.string().min(3, 'Nome da propriedade é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  areaTotal: z.number().positive('Área total deve ser positiva'),
  areaCultivada: z.number().positive('Área cultivada deve ser positiva'),
  areaNatural: z.number().positive('Área natural deve ser positiva'),
  quantidadeGado: z.number().nonnegative('Quantidade de gado não pode ser negativa'),
  plano: z.enum(['porteira', 'piquete', 'retiro', 'estancia', 'barao']).optional(),
});

// ============================================================================
// MOVIMENTOS
// ============================================================================
export const MovementSchema = z.object({
  id: z.string(),
  propriedadeId: z.string(),
  tipo: z.enum(['nascimento', 'morte', 'venda', 'compra', 'vacina', 'ajuste']),
  data: z.string(),
  quantidade: z.number(),
  sexo: z.enum(['macho', 'femea']).nullable(),
  faixaEtaria: z.string().nullable(),
  descricao: z.string(),
  destino: z.string().nullable(),
  valor: z.number().nullable(),
  numeroGta: z.string().nullable(),
  fotoUrl: z.string().nullable(),
  causa: z.string().nullable(),
  criadoEm: z.string(),
});

export const CreateMovementSchema = z.object({
  propriedadeId: z.string(),
  tipo: z.enum(['nascimento', 'morte', 'venda', 'compra', 'vacina', 'ajuste']),
  data: z.string(),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  sexo: z.enum(['macho', 'femea']).optional(),
  faixaEtaria: z.string().optional(),
  descricao: z.string().min(3, 'Descrição é obrigatória'),
  destino: z.string().optional(),
  valor: z.number().optional(),
  numeroGta: z.string().optional(),
  fotoUrl: z.string().optional(),
  causa: z.string().optional(),
});

// ============================================================================
// REBANHO
// ============================================================================
export const LivestockSchema = z.object({
  id: z.string(),
  propriedadeId: z.string(),
  especie: z.string(),
  faixaEtaria: z.string(),
  sexo: z.enum(['macho', 'femea']),
  cabecas: z.number(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});

export const CreateLivestockSchema = z.object({
  propriedadeId: z.string(),
  especie: z.string().min(2, 'Espécie é obrigatória'),
  faixaEtaria: z.string().min(2, 'Faixa etária é obrigatória'),
  sexo: z.enum(['macho', 'femea']),
  cabecas: z.number().positive('Número de cabeças deve ser positivo'),
});

// ============================================================================
// USUÁRIOS
// ============================================================================
export const UserSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string().email(),
  cpfCnpj: z.string(),
  telefone: z.string().nullable(),
  papel: z.enum(['super_admin', 'proprietario', 'gerente', 'operador']),
  status: z.enum(['ativo', 'pendente_aprovacao', 'suspenso']),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PropertyInput = z.infer<typeof CreatePropertySchema>;
export type MovementInput = z.infer<typeof CreateMovementSchema>;
export type LivestockInput = z.infer<typeof CreateLivestockSchema>;
