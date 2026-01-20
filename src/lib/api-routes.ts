/**
 * Documentação de Rotas REST para API backend NestJS
 * Usado como referência para implementação do backend
 */

export const API_ROUTES = {
  // =========================================================================
  // AUTENTICAÇÃO
  // =========================================================================
  AUTH: {
    LOGIN: '/auth/login',
    // POST /auth/login
    // Request: { cpfCnpj: string, password: string }
    // Response: { user: UserDTO, token: string, refreshToken: string }

    LOGOUT: '/auth/logout',
    // POST /auth/logout
    // Headers: { Authorization: Bearer token }
    // Response: { success: true }

    REFRESH_TOKEN: '/auth/refresh',
    // POST /auth/refresh
    // Request: { refreshToken: string }
    // Response: { token: string, refreshToken: string }

    ME: '/auth/me',
    // GET /auth/me
    // Headers: { Authorization: Bearer token }
    // Response: UserDTO

    CHANGE_PASSWORD: '/auth/change-password',
    // POST /auth/change-password
    // Headers: { Authorization: Bearer token }
    // Request: { currentPassword: string, newPassword: string }
    // Response: { success: true }
  },

  // =========================================================================
  // USUÁRIOS
  // =========================================================================
  USERS: {
    CREATE: '/usuarios',
    // POST /usuarios
    // Headers: { Authorization: Bearer token (super_admin ou owner) }
    // Request: CreateUserRequest
    // Response: UserDTO

    GET_ALL: '/usuarios',
    // GET /usuarios
    // Headers: { Authorization: Bearer token }
    // Query: { role?: string, status?: string, limit?: number, offset?: number }
    // Response: PaginatedResponse<UserDTO>

    GET_ONE: '/usuarios/:id',
    // GET /usuarios/:id
    // Headers: { Authorization: Bearer token }
    // Response: UserDTO

    UPDATE: '/usuarios/:id',
    // PATCH /usuarios/:id
    // Headers: { Authorization: Bearer token }
    // Request: UpdateUserRequest
    // Response: UserDTO

    DELETE: '/usuarios/:id',
    // DELETE /usuarios/:id
    // Headers: { Authorization: Bearer token (super_admin ou owner) }
    // Response: { success: true }

    RESET_PASSWORD: '/usuarios/:id/reset-password',
    // POST /usuarios/:id/reset-password
    // Headers: { Authorization: Bearer token (super_admin) }
    // Request: { newPassword?: string }
    // Response: { temporaryPassword?: string }

    IMPERSONATE: '/usuarios/:id/impersonate',
    // POST /usuarios/:id/impersonate
    // Headers: { Authorization: Bearer token (super_admin) }
    // Response: { token: string, refreshToken: string }
  },

  // =========================================================================
  // PROPRIEDADES
  // =========================================================================
  PROPERTIES: {
    CREATE: '/propriedades',
    // POST /propriedades
    // Headers: { Authorization: Bearer token }
    // Request: CreatePropertyRequest
    // Response: PropertyDTO

    GET_ALL: '/propriedades',
    // GET /propriedades
    // Headers: { Authorization: Bearer token }
    // Query: { status?: string, plan?: string, limit?: number, offset?: number }
    // Response: PaginatedResponse<PropertyDTO>

    GET_ONE: '/propriedades/:id',
    // GET /propriedades/:id
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Response: PropertyDTO

    UPDATE: '/propriedades/:id',
    // PATCH /propriedades/:id
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: UpdatePropertyRequest
    // Response: PropertyDTO

    DELETE: '/propriedades/:id',
    // DELETE /propriedades/:id
    // Headers: { Authorization: Bearer token }
    // Response: { success: true }
  },

  // =========================================================================
  // MOVIMENTOS / LANÇAMENTOS
  // =========================================================================
  MOVEMENTS: {
    CREATE_BIRTH: '/lancamentos/nascimento',
    // POST /lancamentos/nascimento
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: BirthMovementRequest
    // Response: MovementDTO

    CREATE_DEATH: '/lancamentos/mortalidade',
    // POST /lancamentos/mortalidade
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: DeathMovementRequest
    // Response: MovementDTO

    CREATE_SALE: '/lancamentos/venda',
    // POST /lancamentos/venda
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: SaleMovementRequest
    // Response: MovementDTO

    CREATE_VACCINE: '/lancamentos/vacina',
    // POST /lancamentos/vacina
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: VaccineMovementRequest
    // Response: MovementDTO

    CREATE_PURCHASE: '/lancamentos/compra',
    // POST /lancamentos/compra
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: CreateMovementRequest (type: purchase)
    // Response: MovementDTO

    GET_ALL: '/lancamentos',
    // GET /lancamentos
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Query: { type?: string, startDate?: string, endDate?: string, limit?: number, offset?: number }
    // Response: PaginatedResponse<MovementDTO>

    GET_ONE: '/lancamentos/:id',
    // GET /lancamentos/:id
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Response: MovementDTO

    UPDATE: '/lancamentos/:id',
    // PATCH /lancamentos/:id
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: Partial<CreateMovementRequest>
    // Response: MovementDTO

    DELETE: '/lancamentos/:id',
    // DELETE /lancamentos/:id
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Response: { success: true }

    GET_HISTORY: '/lancamentos/historico',
    // GET /lancamentos/historico
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Query: { months?: number, limit?: number }
    // Response: MovementDTO[]

    BULK_CREATE: '/lancamentos/bulk',
    // POST /lancamentos/bulk
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: MovementDTO[]
    // Response: { created: number, failed: number, errors: any[] }
  },

  // =========================================================================
  // REBANHO / ESTOQUE
  // =========================================================================
  CATTLE: {
    GET_BALANCE: '/rebanho/:propertyId',
    // GET /rebanho/:propertyId
    // Headers: { Authorization: Bearer token }
    // Response: CattleReportDTO

    GET_HISTORY: '/rebanho/:propertyId/historico',
    // GET /rebanho/:propertyId/historico
    // Headers: { Authorization: Bearer token }
    // Query: { months?: number, limit?: number }
    // Response: { date: string, balance: CattleBalance[] }[]

    GET_SUMMARY: '/rebanho/:propertyId/resumo',
    // GET /rebanho/:propertyId/resumo
    // Headers: { Authorization: Bearer token }
    // Response: { totalCattle: number, adults: number, youngStock: number, mortailityRate: number }

    RECALCULATE_AGE_GROUPS: '/rebanho/:propertyId/recalcular-faixas',
    // POST /rebanho/:propertyId/recalcular-faixas
    // Headers: { Authorization: Bearer token (super_admin ou owner) }
    // Response: { updated: number, changes: any[] }
  },

  // =========================================================================
  // FOTOS
  // =========================================================================
  PHOTOS: {
    UPLOAD: '/fotos/upload',
    // POST /fotos/upload
    // Headers: { Authorization: Bearer token, Content-Type: multipart/form-data, X-Property-ID: id }
    // Body: { file: File, movementId?: string, description?: string }
    // Response: PhotoDTO

    GET_FOR_MOVEMENT: '/fotos/movimento/:movementId',
    // GET /fotos/movimento/:movementId
    // Headers: { Authorization: Bearer token }
    // Response: PhotoDTO[]

    DELETE: '/fotos/:id',
    // DELETE /fotos/:id
    // Headers: { Authorization: Bearer token }
    // Response: { success: true }
  },

  // =========================================================================
  // PLANOS (ADMIN)
  // =========================================================================
  PLANS: {
    GET_ALL: '/planos',
    // GET /planos
    // Response: PlanDTO[]

    GET_ONE: '/planos/:id',
    // GET /planos/:id
    // Response: PlanDTO

    CREATE: '/planos',
    // POST /planos
    // Headers: { Authorization: Bearer token (super_admin) }
    // Request: CreatePlanRequest
    // Response: PlanDTO

    UPDATE: '/planos/:id',
    // PATCH /planos/:id
    // Headers: { Authorization: Bearer token (super_admin) }
    // Request: UpdatePlanRequest
    // Response: PlanDTO

    DELETE: '/planos/:id',
    // DELETE /planos/:id
    // Headers: { Authorization: Bearer token (super_admin) }
    // Response: { success: true }
  },

  // =========================================================================
  // ADMIN - TENANTS E SOLICITAÇÕES
  // =========================================================================
  ADMIN: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    // GET /admin/dashboard/stats

    DASHBOARD_MRR_SERIES: '/admin/dashboard/mrr-series',
    // GET /admin/dashboard/mrr-series?months=12

    DASHBOARD_ACTIVITY: '/admin/dashboard/activity',
    // GET /admin/dashboard/activity?limit=10

    ANALYTICS: '/admin/analises',
    // GET /admin/analises?period=30d

    PLANS: '/admin/planos',
    // GET|POST /admin/planos

    PLANS_ID: '/admin/planos/:id',
    // PATCH|DELETE /admin/planos/:id

    COUPONS: '/admin/indicacao/cupons',
    // GET|POST /admin/indicacao/cupons

    COUPONS_ID: '/admin/indicacao/cupons/:id',
    // PATCH /admin/indicacao/cupons/:id

    REFERRERS: '/admin/indicacao/indicadores',
    // GET /admin/indicacao/indicadores

    COUPON_USAGES: '/admin/indicacao/usos',
    // GET /admin/indicacao/usos

    COMMUNICATION: '/admin/comunicacao',
    // GET|POST /admin/comunicacao

    COMMUNICATION_ID: '/admin/comunicacao/:id',
    // PATCH|DELETE /admin/comunicacao/:id

    PENDING_USERS: '/admin/pendencias',
    // GET /admin/pendencias

    TENANTS: '/admin/tenants',
    // GET /admin/tenants

    APPROVE_USER: '/admin/usuarios/:id/aprovar',
    // PATCH /admin/usuarios/:id/aprovar

    REJECT_USER: '/admin/usuarios/:id/rejeitar',
    // PATCH /admin/usuarios/:id/rejeitar

    UPDATE_USER_STATUS: '/admin/usuarios/:id/status',
    // PATCH /admin/usuarios/:id/status

    RESET_USER_PASSWORD: '/admin/usuarios/:id/reset-senha',
    // POST /admin/usuarios/:id/reset-senha

    UPDATE_USER: '/admin/usuarios/:id',
    // PATCH /admin/usuarios/:id

    UPDATE_USER_PLAN: '/admin/usuarios/:id/plano',
    // PATCH /admin/usuarios/:id/plano

    RESET_ONBOARDING: '/admin/usuarios/:id/reset-onboarding',
    // POST /admin/usuarios/:id/reset-onboarding

    IMPERSONATE_USER: '/admin/usuarios/:id/impersonate',
    // POST /admin/usuarios/:id/impersonate

    RELEASE_ACCESS: '/admin/usuarios/:id/liberar-acesso',
    // POST /admin/usuarios/:id/liberar-acesso

    REGULATIONS: '/admin/regulamentacoes',
    // GET|POST /admin/regulamentacoes

    REGULATIONS_ID: '/admin/regulamentacoes/:id',
    // PATCH|DELETE /admin/regulamentacoes/:id

    PAYMENTS: '/admin/financeiro/pagamentos',
    // GET|POST /admin/financeiro/pagamentos

    PAYMENTS_ID: '/admin/financeiro/pagamentos/:id',
    // PATCH /admin/financeiro/pagamentos/:id

    PIX_CONFIG: '/admin/financeiro/pix-config',
    // GET|POST /admin/financeiro/pix-config

    COMPANY_SETTINGS: '/admin/configuracoes-gerais',
    // GET|PUT /admin/configuracoes-gerais

    AUDIT_LOGS: '/admin/auditoria',
    // GET /admin/auditoria

    ACTIVITY_LOGS: '/admin/atividade',

    ACTIVITY_LOGS_ARCHIVE: '/admin/atividade/arquivar',

    ACTIVITY_LOGS_UNARCHIVE: '/admin/atividade/desarquivar',

    ACTIVITY_LOGS_DELETE: '/admin/atividade/deletar',

    GET_TENANTS: '/admin/tenants',
    // GET /admin/tenants
    // Headers: { Authorization: Bearer token (super_admin) }
    // Query: { status?: string, plan?: string, limit?: number, offset?: number }
    // Response: PaginatedResponse<TenantDTO>

    GET_SOLICITATIONS: '/admin/solicitacoes',
    // GET /admin/solicitacoes
    // Headers: { Authorization: Bearer token (super_admin) }
    // Query: { status?: string, type?: string, limit?: number, offset?: number }
    // Response: PaginatedResponse<ApprovalRequestDTO>

    APPROVE_SOLICITATION: '/admin/solicitacoes/:id/aprovar',
    // PATCH /admin/solicitacoes/:id/aprovar
    // Headers: { Authorization: Bearer token (super_admin) }
    // Request: { reason?: string }
    // Response: ApprovalRequestDTO

    REJECT_SOLICITATION: '/admin/solicitacoes/:id/rejeitar',
    // PATCH /admin/solicitacoes/:id/rejeitar
    // Headers: { Authorization: Bearer token (super_admin) }
    // Request: { reason: string }
    // Response: ApprovalRequestDTO

    DELETE_SOLICITATION: '/admin/solicitacoes/:id',
    // DELETE /admin/solicitacoes/:id
    // Headers: { Authorization: Bearer token (super_admin) }
    // Response: { success: true }

    GET_AUDIT_LOG: '/admin/auditoria',
    // GET /admin/auditoria
    // Headers: { Authorization: Bearer token (super_admin) }
    // Query: { userId?: string, action?: string, limit?: number, offset?: number }
    // Response: PaginatedResponse<AuditLogDTO>

    GET_FINANCIAL_REPORT: '/admin/financeiro',
    // GET /admin/financeiro
    // Headers: { Authorization: Bearer token (super_admin) }
    // Query: { month?: string, year?: number }
    // Response: FinancialReportDTO

    GET_RULES: '/admin/regras/:estado',
    // GET /admin/regras/:estado
    // Headers: { Authorization: Bearer token (super_admin) }
    // Response: RulesDTO

    UPDATE_RULES: '/admin/regras/:estado',
    // PATCH /admin/regras/:estado
    // Headers: { Authorization: Bearer token (super_admin) }
    // Request: Partial<RulesDTO>
    // Response: RulesDTO
  },

  // =========================================================================
  // ANALYTICS
  // =========================================================================
  ANALYTICS: {
    GET_DASHBOARD: '/analytics/dashboard/:propertyId',
    // GET /analytics/dashboard/:propertyId
    // Headers: { Authorization: Bearer token }
    // Response: DashboardAnalyticsDTO

    GET_PERIOD: '/analytics/periodo/:propertyId',
    // GET /analytics/periodo/:propertyId
    // Headers: { Authorization: Bearer token }
    // Query: { startDate: string, endDate: string }
    // Response: AnalyticsDTO

    GET_MORTALITY_RATE: '/analytics/mortalidade/:propertyId',
    // GET /analytics/mortalidade/:propertyId
    // Headers: { Authorization: Bearer token }
    // Response: { rate: number, deaths: number, total: number }

    GET_REVENUE: '/analytics/receita/:propertyId',
    // GET /analytics/receita/:propertyId
    // Headers: { Authorization: Bearer token }
    // Query: { months?: number }
    // Response: { month: string, revenue: number }[]
  },

  // =========================================================================
  // SYNC E OFFLINE
  // =========================================================================
  SYNC: {
    GET_PENDING: '/sync/pendentes/:propertyId',
    // GET /sync/pendentes/:propertyId
    // Headers: { Authorization: Bearer token }
    // Response: StoredMovement[]

    SYNC_MOVEMENTS: '/sync/movimentos',
    // POST /sync/movimentos
    // Headers: { Authorization: Bearer token, X-Property-ID: id }
    // Request: StoredMovement[]
    // Response: { synced: number, failed: number, errors: any[] }

    SYNC_PHOTOS: '/sync/fotos',
    // POST /sync/fotos
    // Headers: { Authorization: Bearer token, Content-Type: multipart/form-data }
    // Body: FormData com múltiplas fotos
    // Response: { uploaded: number, failed: number, errors: any[] }

    GET_SYNC_STATUS: '/sync/status/:propertyId',
    // GET /sync/status/:propertyId
    // Headers: { Authorization: Bearer token }
    // Response: { pending: number, syncing: number, synced: number }
  },

  // =========================================================================
  // SWAGGER E DOCS
  // =========================================================================
  DOCS: {
    SWAGGER: '/swagger',
    // GET /swagger
    // Response: Documentação Swagger HTML

    SWAGGER_JSON: '/swagger-json',
    // GET /swagger-json
    // Response: JSON da API OpenAPI

    HEALTH: '/health',
    // GET /health
    // Response: { status: 'ok', timestamp: string, version: string }
  },
};

/**
 * Construir URL completa
 */
export function buildUrl(path: string, params?: Record<string, unknown>): string {
  let url = path;

  // Substituir parâmetros dinâmicos
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }

  return url;
}

/**
 * Tipos de erro esperados
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
  INVALID_MOVEMENT: 'INVALID_MOVEMENT',
  INSUFFICIENT_CATTLE: 'INSUFFICIENT_CATTLE',
  INVALID_BIRTH_COUNT: 'INVALID_BIRTH_COUNT',
  OFFLINE_OPERATION: 'OFFLINE_OPERATION',
};

/**
 * Mensagens de erro em português
 */
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.UNAUTHORIZED]: 'Não autorizado',
  [ERROR_CODES.FORBIDDEN]: 'Acesso negado',
  [ERROR_CODES.NOT_FOUND]: 'Recurso não encontrado',
  [ERROR_CODES.VALIDATION_ERROR]: 'Erro de validação',
  [ERROR_CODES.CONFLICT]: 'Recurso já existe',
  [ERROR_CODES.RATE_LIMIT]: 'Limite de requisições atingido',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Serviço indisponível',
  [ERROR_CODES.INVALID_TOKEN]: 'Token inválido',
  [ERROR_CODES.EXPIRED_TOKEN]: 'Token expirado',
  [ERROR_CODES.PROPERTY_NOT_FOUND]: 'Propriedade não encontrada',
  [ERROR_CODES.PLAN_LIMIT_EXCEEDED]: 'Limite do plano excedido',
  [ERROR_CODES.INVALID_MOVEMENT]: 'Movimento inválido',
  [ERROR_CODES.INSUFFICIENT_CATTLE]: 'Quantidade insuficiente de gado',
  [ERROR_CODES.INVALID_BIRTH_COUNT]: 'Nascimentos não podem exceder matrizes',
  [ERROR_CODES.OFFLINE_OPERATION]: 'Operação offline - será sincronizada',
};
