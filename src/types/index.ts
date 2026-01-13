/**
 * Tipos e DTOs para integração com backend NestJS
 * Usados em formulários, validações e requisições API
 */

// ============================================================================
// AUTENTICAÇÃO
// ============================================================================

export interface LoginRequest {
  cpfCnpj: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: UserDTO;
    token: string;
    refreshToken: string;
  };
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
  };
}

// ============================================================================
// USUÁRIOS
// ============================================================================

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  role: 'super_admin' | 'owner' | 'manager' | 'operator';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  password: string;
  role: 'owner' | 'manager' | 'operator';
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================================================
// PROPRIEDADES
// ============================================================================

export interface PropertyDTO {
  id: string;
  userId: string;
  name: string;
  city: string;
  state: string;
  totalArea: number;
  cultivatedArea: number;
  naturalArea: number;
  cattleCount: number;
  status: 'active' | 'pending' | 'suspended';
  plan: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyRequest {
  name: string;
  city: string;
  state: string;
  totalArea: number;
  cultivatedArea: number;
  naturalArea: number;
  cattleCount: number;
  plan: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';
}

export interface UpdatePropertyRequest {
  name?: string;
  city?: string;
  state?: string;
  totalArea?: number;
  cultivatedArea?: number;
  naturalArea?: number;
  cattleCount?: number;
  plan?: 'porteira' | 'piquete' | 'retiro' | 'estancia' | 'barao';
}

// ============================================================================
// MOVIMENTOS / LANÇAMENTOS
// ============================================================================

export type MovementType = 'birth' | 'death' | 'sale' | 'purchase' | 'vaccine' | 'adjustment';

export interface CreateMovementRequest {
  type: MovementType;
  date: string; // ISO date
  quantity: number;
  sex?: 'male' | 'female';
  ageGroupId?: string;
  description: string;
  destination?: string;
  value?: number;
  gtaNumber?: string;
  photoUrl?: string;
  cause?: string;
}

export interface MovementDTO extends CreateMovementRequest {
  id: string;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export interface BirthMovementRequest extends CreateMovementRequest {
  type: 'birth';
  sex: 'male' | 'female';
  quantity: number;
  date: string;
}

export interface DeathMovementRequest extends CreateMovementRequest {
  type: 'death';
  ageGroupId: string;
  cause: string;
  photoUrl: string; // obrigatório para morte natural
}

export interface SaleMovementRequest extends CreateMovementRequest {
  type: 'sale';
  ageGroupId: string;
  destination: string;
  value: number;
  gtaNumber?: string;
}

export interface VaccineMovementRequest extends CreateMovementRequest {
  type: 'vaccine';
  description: string; // nome da vacina
  ageGroupId?: string; // se aplicável
}

// ============================================================================
// REBANHO / ESTOQUE
// ============================================================================

export interface AgeGroup {
  id: string;
  label: string;
  minMonths: number;
  maxMonths: number;
}

export interface CattleBalance {
  ageGroupId: string;
  male: {
    previousBalance: number;
    entries: number;
    exits: number;
    currentBalance: number;
  };
  female: {
    previousBalance: number;
    entries: number;
    exits: number;
    currentBalance: number;
  };
}

export interface CattleReportDTO {
  propertyId: string;
  totalCattle: number;
  balances: CattleBalance[];
  generatedAt: string;
}

// ============================================================================
// FOTOS / EVIDÊNCIAS
// ============================================================================

export interface PhotoUploadRequest {
  movementId: string;
  file: File;
  description?: string;
}

export interface PhotoDTO {
  id: string;
  movementId: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

// ============================================================================
// PLANOS
// ============================================================================

export interface PlanDTO {
  id: string;
  name: string;
  price: number;
  maxCattle: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  maxCattle: number;
  features: string[];
}

export interface UpdatePlanRequest {
  name?: string;
  price?: number;
  maxCattle?: number;
  features?: string[];
}

// ============================================================================
// ADMIN
// ============================================================================

export interface TenantDTO {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: 'active' | 'pending' | 'suspended';
  financialStatus: 'paid' | 'overdue' | 'pending';
  createdAt: string;
  totalCattle: number;
}

export interface ApprovalRequestDTO {
  id: string;
  tenantId: string;
  type: 'plan_upgrade' | 'cattle_increase' | 'feature_request';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  reason?: string;
}

export interface ApproveSolicitationRequest {
  solicitationId: string;
  reason?: string;
}

export interface RejectSolicitationRequest {
  solicitationId: string;
  reason: string;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface AnalyticsDTO {
  propertyId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  births: number;
  deaths: number;
  sales: number;
  purchases: number;
  mortality_rate: number;
  average_sale_price: number;
  revenue: number;
}

// ============================================================================
// ERROS E RESPOSTAS GENÉRICAS
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// FILTROS E QUERIES
// ============================================================================

export interface MovementFilterParams {
  propertyId: string;
  startDate?: string;
  endDate?: string;
  type?: MovementType;
  ageGroupId?: string;
  status?: 'pending' | 'synced' | 'failed';
  limit?: number;
  offset?: number;
}

export interface PropertyFilterParams {
  userId?: string;
  status?: 'active' | 'pending' | 'suspended';
  plan?: string;
  limit?: number;
  offset?: number;
}
