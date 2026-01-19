/**
 * Schemas Zod para validação de contratos E2E entre frontend e backend
 * Garante compatibilidade de dados e detecta breaking changes
 */

import { z } from 'zod';

// =============================================================================
// SCALARS E ENUMS
// =============================================================================

const PapelUsuarioSchema = z.enum(['super_admin', 'proprietario', 'gerente', 'operador']);
const StatusUsuarioSchema = z.enum(['ativo', 'pendente_aprovacao', 'rejeitado', 'suspenso']);
const StatusFinanceiroSchema = z.enum(['ok', 'atrasado', 'inadimplente', 'pendente']);
const StatusPropriedadeSchema = z.enum(['ativa', 'pendente', 'suspensa']);
const TipoPlanoSchema = z.enum(['porteira', 'piquete', 'retiro', 'estancia', 'barao']);
const StatusAssinaturaSchema = z.enum(['ativa', 'cancelada', 'inadimplente']);
const TipoMovimentoSchema = z.enum(['nascimento', 'morte', 'venda', 'compra', 'vacina', 'ajuste']);
const TipoSexoSchema = z.enum(['macho', 'femea']);

// =============================================================================
// ENTIDADES PRINCIPAIS
// =============================================================================

const UsuarioSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  cpfCnpj: z.string(),
  telefone: z.string().nullable(),
  papel: PapelUsuarioSchema,
  status: StatusUsuarioSchema,
  ultimoLogin: z.string().datetime().nullable(),
  versaoApp: z.string().nullable(),
  statusFinanceiro: StatusFinanceiroSchema.nullable(),
  receitaMensal: z.number().nullable(),
  onboardingConcluidoEm: z.string().datetime().nullable(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

const PropriedadeSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  cidade: z.string(),
  estado: z.string(),
  cep: z.string().nullable(),
  logradouro: z.string().nullable(),
  numero: z.string().nullable(),
  complemento: z.string().nullable(),
  bairro: z.string().nullable(),
  viaAcesso: z.string().nullable(),
  comunidade: z.string().nullable(),
  areaTotal: z.number(),
  areaCultivada: z.number(),
  areaNatural: z.number(),
  quantidadeGado: z.number(),
  status: StatusPropriedadeSchema,
  plano: TipoPlanoSchema,
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

const RebanhoSchema = z.object({
  id: z.string().uuid(),
  propriedadeId: z.string().uuid(),
  especie: z.string(),
  faixaEtaria: z.string(),
  sexo: TipoSexoSchema,
  cabecas: z.number(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

const MovimentoSchema = z.object({
  id: z.string().uuid(),
  propriedadeId: z.string().uuid(),
  tipo: TipoMovimentoSchema,
  especie: z.string().default('bovino'),
  data: z.string().datetime(),
  quantidade: z.number(),
  sexo: TipoSexoSchema.nullable(),
  faixaEtaria: z.string().nullable(),
  descricao: z.string(),
  destino: z.string().nullable(),
  valor: z.number().nullable(),
  numeroGta: z.string().nullable(),
  fotoUrl: z.string().nullable(),
  fotoData: z.instanceof(Uint8Array).nullable(),
  fotoMimeType: z.string().nullable(),
  causa: z.string().nullable(),
  criadoEm: z.string().datetime(),
});

// =============================================================================
// REQUEST/RESPONSE DTOs
// =============================================================================

const LoginRequestSchema = z.object({
  cpfCnpj: z.string(),
  password: z.string(),
});

const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: UsuarioSchema,
});

const RegisterRequestSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  cpfCnpj: z.string(),
  password: z.string(),
  phone: z.string().optional(),
});

const CreateMovementRequestSchema = z.object({
  propertyId: z.string().uuid(),
  type: TipoMovimentoSchema,
  date: z.string().datetime(),
  quantity: z.number(),
  sex: TipoSexoSchema.optional(),
  ageGroup: z.string().optional(),
  description: z.string(),
  destination: z.string().optional(),
  value: z.number().optional(),
  gtaNumber: z.string().optional(),
  photoUrl: z.string().optional(),
  cause: z.string().optional(),
});

const CreatePropertyRequestSchema = z.object({
  nome: z.string(),
  cidade: z.string(),
  estado: z.string(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  viaAcesso: z.string().optional(),
  comunidade: z.string().optional(),
  areaTotal: z.number(),
  areaCultivada: z.number(),
  areaNatural: z.number(),
  quantidadeGado: z.number(),
});

// =============================================================================
// ADMIN SCHEMAS
// =============================================================================

const AdminDashboardStatsSchema = z.object({
  totalTenants: z.number(),
  activeTenants: z.number(),
  totalCattle: z.number(),
  mrr: z.number(),
  pendingRequests: z.number(),
  overdueCount: z.number(),
});

const AdminPlanSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  preco: z.number(),
  maxCabecas: z.number().nullable(),
  cobrancaAdicionalAtiva: z.boolean(),
  valorCobrancaAdicional: z.number(),
  recursos: z.array(z.string()),
  ativo: z.boolean(),
  criadoEm: z.string().datetime(),
  atualizadoEm: z.string().datetime(),
});

const AuditLogSchema = z.object({
  id: z.string().uuid(),
  usuarioId: z.string().uuid(),
  usuarioNome: z.string(),
  acao: z.string(),
  detalhes: z.string(),
  ip: z.string(),
  dataHora: z.string().datetime(),
});

// =============================================================================
// ANALYTICS SCHEMAS
// =============================================================================

const CattleReportSchema = z.object({
  propertyId: z.string().uuid(),
  livestock: z.array(RebanhoSchema),
  total: z.number(),
  byAgeGroup: z.record(z.string(), z.number()),
  bySex: z.record(z.string(), z.number()),
});

const LivestockSummarySchema = z.object({
  total: z.number(),
  byAgeGroup: z.record(z.string(), z.number()),
  bySex: z.record(z.string(), z.number()),
});

// =============================================================================
// API RESPONSE WRAPPER
// =============================================================================

const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string().optional(),
});

const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Valida resposta da API contra schema esperado
 */
export function validateApiResponse<T>(
  response: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(response);
  } catch (error) {
    console.error('Erro de validação de contrato:', error);
    throw new Error(`Resposta da API inválida: ${error instanceof z.ZodError ? error.issues.map(i => i.message).join(', ') : 'Unknown error'}`);
  }
}

/**
 * Valida se dados do frontend são compatíveis com backend
 */
export function validateFrontendData<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('Erro de validação de dados frontend:', error);
    throw new Error(`Dados inválidos: ${error instanceof z.ZodError ? error.issues.map(i => i.message).join(', ') : 'Unknown error'}`);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const ContractSchemas = {
  // Entidades
  Usuario: UsuarioSchema,
  Propriedade: PropriedadeSchema,
  Rebanho: RebanhoSchema,
  Movimento: MovimentoSchema,
  
  // Requests/Responses
  LoginRequest: LoginRequestSchema,
  LoginResponse: LoginResponseSchema,
  RegisterRequest: RegisterRequestSchema,
  CreateMovementRequest: CreateMovementRequestSchema,
  CreatePropertyRequest: CreatePropertyRequestSchema,
  
  // Admin
  AdminDashboardStats: AdminDashboardStatsSchema,
  AdminPlan: AdminPlanSchema,
  AuditLog: AuditLogSchema,
  
  // Analytics
  CattleReport: CattleReportSchema,
  LivestockSummary: LivestockSummarySchema,
  
  // Wrappers
  ApiResponse: ApiResponseSchema,
  PaginatedResponse: PaginatedResponseSchema,
  
  // Enums
  PapelUsuario: PapelUsuarioSchema,
  StatusUsuario: StatusUsuarioSchema,
  TipoPlano: TipoPlanoSchema,
  TipoMovimento: TipoMovimentoSchema,
  TipoSexo: TipoSexoSchema,
};

export type ContractTypes = {
  Usuario: z.infer<typeof UsuarioSchema>;
  Propriedade: z.infer<typeof PropriedadeSchema>;
  Rebanho: z.infer<typeof RebanhoSchema>;
  Movimento: z.infer<typeof MovimentoSchema>;
  LoginRequest: z.infer<typeof LoginRequestSchema>;
  LoginResponse: z.infer<typeof LoginResponseSchema>;
  RegisterRequest: z.infer<typeof RegisterRequestSchema>;
  CreateMovementRequest: z.infer<typeof CreateMovementRequestSchema>;
  CreatePropertyRequest: z.infer<typeof CreatePropertyRequestSchema>;
  AdminDashboardStats: z.infer<typeof AdminDashboardStatsSchema>;
  AdminPlan: z.infer<typeof AdminPlanSchema>;
  AuditLog: z.infer<typeof AuditLogSchema>;
  CattleReport: z.infer<typeof CattleReportSchema>;
  LivestockSummary: z.infer<typeof LivestockSummarySchema>;
};

// =============================================================================
// TEST UTILS
// =============================================================================

/**
 * Gera dados mock válidos para testes
 */
export function generateMockData<T>(schema: z.ZodSchema<T>): T {
  // Implementação básica - pode ser expandida com bibliotecas como faker
  // Para evitar comparações de tipos incompatíveis, usamos uma abordagem baseada em tipos
  // Esta implementação é um placeholder - em produção, considere usar uma lib como faker

  // Por enquanto, retornamos dados mock para Usuario como exemplo
  // Usamos uma verificação mais segura baseada no tipo retornado
  try {
    // Tentativa de validar um objeto Usuario para identificar o schema
    const testUsuario = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      nome: 'Usuário Teste',
      email: 'teste@example.com',
      cpfCnpj: '12345678900',
      telefone: null,
      papel: 'proprietario' as const,
      status: 'ativo' as const,
      ultimoLogin: null,
      versaoApp: null,
      statusFinanceiro: null,
      receitaMensal: null,
      onboardingConcluidoEm: null,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    // Se conseguir fazer parse, é compatível com UsuarioSchema
    schema.parse(testUsuario);
    return testUsuario as T;
  } catch {
    // Não é compatível, lançar erro
    throw new Error(`Mock data não implementado para este schema. Considere usar uma biblioteca como faker para geração automática.`);
  }
}
