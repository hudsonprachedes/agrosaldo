import { z } from 'zod';

/**
 * Schemas de validação de contrato para testes e2e
 * Garante que as respostas da API estão em conformidade com o esperado
 */

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================
export const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    nome: z.string().optional(),
    email: z.string().email(),
    cpfCnpj: z.string(),
    telefone: z.string().nullable().optional(),
    papel: z.enum(['super_admin', 'proprietario', 'gerente', 'operador']).optional(),
    status: z.enum(['ativo', 'pendente_aprovacao', 'suspenso']).optional(),
    criadoEm: z.string().optional(),
    atualizadoEm: z.string().optional(),
  }),
  token: z.string(),
});

export const UserResponseSchema = z.object({
  id: z.string(),
  nome: z.string().optional(),
  email: z.string().email(),
  cpfCnpj: z.string(),
  telefone: z.string().nullable().optional(),
  papel: z.enum(['super_admin', 'proprietario', 'gerente', 'operador']).optional(),
  status: z.enum(['ativo', 'pendente_aprovacao', 'suspenso']).optional(),
  criadoEm: z.string().optional(),
  atualizadoEm: z.string().optional(),
});

// ============================================================================
// PROPRIEDADES
// ============================================================================
export const PropertyResponseSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cidade: z.string(),
  estado: z.string(),
  areaTotal: z.number().optional(),
  areaCultivada: z.number().optional(),
  areaNatural: z.number().optional(),
  quantidadeGado: z.number().optional(),
  status: z.enum(['ativa', 'pendente', 'suspensa']).optional(),
  plano: z.enum(['porteira', 'piquete', 'retiro', 'estancia', 'barao']).optional(),
  criadoEm: z.string().optional(),
  atualizadoEm: z.string().optional(),
});

// ============================================================================
// MOVIMENTOS
// ============================================================================
export const MovementResponseSchema = z.object({
  id: z.string(),
  propriedadeId: z.string(),
  tipo: z.enum(['nascimento', 'morte', 'venda', 'compra', 'vacina', 'ajuste']),
  data: z.string(),
  quantidade: z.number(),
  sexo: z.enum(['macho', 'femea']).nullable().optional(),
  faixaEtaria: z.string().nullable().optional(),
  descricao: z.string().optional(),
  destino: z.string().nullable().optional(),
  valor: z.number().nullable().optional(),
  numeroGta: z.string().nullable().optional(),
  fotoUrl: z.string().nullable().optional(),
  causa: z.string().nullable().optional(),
  criadoEm: z.string().optional(),
});

// ============================================================================
// REBANHO
// ============================================================================
export const LivestockResponseSchema = z.object({
  id: z.string(),
  propriedadeId: z.string(),
  especie: z.string(),
  faixaEtaria: z.string(),
  sexo: z.enum(['macho', 'femea']),
  cabecas: z.number(),
  criadoEm: z.string().optional(),
  atualizadoEm: z.string().optional(),
});

// ============================================================================
// ARRAYS
// ============================================================================
export const UsersArraySchema = z.array(UserResponseSchema);
export const PropertiesArraySchema = z.array(PropertyResponseSchema);
export const MovementsArraySchema = z.array(MovementResponseSchema);
export const LivestockArraySchema = z.array(LivestockResponseSchema);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export function validateLoginResponse(data: unknown) {
  return LoginResponseSchema.parse(data);
}

export function validateUserResponse(data: unknown) {
  return UserResponseSchema.parse(data);
}

export function validatePropertyResponse(data: unknown) {
  return PropertyResponseSchema.parse(data);
}

export function validateMovementResponse(data: unknown) {
  return MovementResponseSchema.parse(data);
}

export function validateLivestockResponse(data: unknown) {
  return LivestockResponseSchema.parse(data);
}

export function validateUsersArray(data: unknown) {
  return UsersArraySchema.parse(data);
}

export function validatePropertiesArray(data: unknown) {
  return PropertiesArraySchema.parse(data);
}

export function validateMovementsArray(data: unknown) {
  return MovementsArraySchema.parse(data);
}

export function validateLivestockArray(data: unknown) {
  return LivestockArraySchema.parse(data);
}
