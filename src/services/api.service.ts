import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/api-routes';

export interface LoginRequest {
  cpfCnpj: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  cpfCnpj: string;
  password: string;
  phone?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface Property {
  id: string;
  name: string;
  city: string;
  state: string;
  totalArea: number;
  cultivatedArea: number;
  naturalArea: number;
  cattleCount: number;
  status: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  propertyId: string;
  type: string;
  date: string;
  quantity: number;
  sex: string | null;
  ageGroup: string | null;
  description: string;
  destination: string | null;
  value: number | null;
  gtaNumber: string | null;
  photoUrl: string | null;
  cause: string | null;
  createdAt: string;
}

export interface CreateMovementRequest {
  propertyId: string;
  type: string;
  date: string;
  quantity: number;
  sex?: string;
  ageGroup?: string;
  description: string;
  destination?: string;
  value?: number;
  gtaNumber?: string;
  photoUrl?: string;
  cause?: string;
}

export interface Livestock {
  id: string;
  propertyId: string;
  species: string;
  ageGroup: string;
  sex: string;
  headcount: number;
  createdAt: string;
  updatedAt: string;
  // Aliases para compatibilidade com Prisma PT-BR
  especie?: string;
  faixaEtaria?: string;
  sexo?: string;
  cabecas?: number;
}

export interface CattleReport {
  propertyId: string;
  livestock: Livestock[];
  total: number;
  byAgeGroup: Record<string, number>;
  bySex: Record<string, number>;
}

export interface LivestockHistoryEntry {
  date: string;
  headcount: number;
  ageGroup?: string;
  sex?: string;
  species?: string;
}

export interface LivestockSummary {
  total: number;
  byAgeGroup: Record<string, number>;
  bySex: Record<string, number>;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, data);
  },

  async register(data: RegisterRequest): Promise<User> {
    return apiClient.post<User>(API_ROUTES.AUTH.LOGIN.replace('/login', '/register'), data);
  },

  async me(): Promise<User> {
    return apiClient.get<User>(API_ROUTES.AUTH.ME);
  },

  async logout(): Promise<void> {
    await apiClient.post(API_ROUTES.AUTH.LOGOUT);
    apiClient.clearAuth();
  },
};

export const propertyService = {
  async getAll(): Promise<Property[]> {
    return apiClient.get<Property[]>(API_ROUTES.PROPERTIES.GET_ALL);
  },

  async getOne(id: string): Promise<Property> {
    return apiClient.get<Property>(API_ROUTES.PROPERTIES.GET_ONE.replace(':id', id));
  },

  async create(data: Partial<Property>): Promise<Property> {
    return apiClient.post<Property>(API_ROUTES.PROPERTIES.CREATE, data);
  },

  async update(id: string, data: Partial<Property>): Promise<Property> {
    return apiClient.patch<Property>(API_ROUTES.PROPERTIES.UPDATE.replace(':id', id), data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ROUTES.PROPERTIES.DELETE.replace(':id', id));
  },
};

export const movementService = {
  async create(data: CreateMovementRequest): Promise<Movement> {
    const { propertyId, ...payload } = data;
    const endpoint = data.type === 'birth' 
      ? API_ROUTES.MOVEMENTS.CREATE_BIRTH
      : data.type === 'death'
      ? API_ROUTES.MOVEMENTS.CREATE_DEATH
      : data.type === 'sale'
      ? API_ROUTES.MOVEMENTS.CREATE_SALE
      : data.type === 'purchase'
      ? API_ROUTES.MOVEMENTS.CREATE_PURCHASE
      : data.type === 'vaccine'
      ? API_ROUTES.MOVEMENTS.CREATE_VACCINE
      : '/lancamentos';
    
    return apiClient.post<Movement>(endpoint, payload, {
      headers: {
        'X-Property-ID': propertyId,
      },
    });
  },

  async getAll(propertyId: string, filters?: Record<string, unknown>): Promise<Movement[]> {
    const params = new URLSearchParams({ propertyId, ...filters } as Record<string, string>);
    return apiClient.get<Movement[]>(`${API_ROUTES.MOVEMENTS.GET_ALL}?${params}`);
  },

  async getOne(id: string): Promise<Movement> {
    return apiClient.get<Movement>(API_ROUTES.MOVEMENTS.GET_ONE.replace(':id', id));
  },

  async update(id: string, data: Partial<CreateMovementRequest>): Promise<Movement> {
    return apiClient.patch<Movement>(API_ROUTES.MOVEMENTS.UPDATE.replace(':id', id), data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ROUTES.MOVEMENTS.DELETE.replace(':id', id));
  },

  async getHistory(propertyId: string, months?: number): Promise<Movement[]> {
    const params = months ? `?months=${months}` : '';
    return apiClient.get<Movement[]>(`${API_ROUTES.MOVEMENTS.GET_HISTORY}${params}`);
  },
};

export const livestockService = {
  async getBalance(propertyId: string): Promise<CattleReport> {
    return apiClient.get<CattleReport>(API_ROUTES.CATTLE.GET_BALANCE.replace(':propertyId', propertyId));
  },

  async getHistory(propertyId: string, months?: number): Promise<LivestockHistoryEntry[]> {
    const params = months ? `?months=${months}` : '';
    return apiClient.get<LivestockHistoryEntry[]>(`${API_ROUTES.CATTLE.GET_HISTORY.replace(':propertyId', propertyId)}${params}`);
  },

  async getSummary(propertyId: string): Promise<LivestockSummary> {
    return apiClient.get<LivestockSummary>(API_ROUTES.CATTLE.GET_SUMMARY.replace(':propertyId', propertyId));
  },

  async recalculateAgeGroups(propertyId: string): Promise<unknown> {
    return apiClient.post<unknown>(API_ROUTES.CATTLE.RECALCULATE_AGE_GROUPS.replace(':propertyId', propertyId));
  },
};

// --- Admin Interfaces ---

export interface AdminDashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalCattle: number;
  mrr: number;
  pendingRequests: number;
  overdueCount: number;
}

export interface AdminMrrSeriesPoint {
  month: string;
  value: number;
}

export interface AdminDashboardActivityItem {
  id: string;
  action: string;
  details: string;
  userName: string;
  timestamp: string;
}

export interface AdminAnalyticsResponse {
  kpis: AdminDashboardStats;
  categories: string[];
  clientGrowth: {
    activeTenants: number[];
    newSignups: number[];
  };
  revenue: {
    mrr: number[];
  };
  planDistribution: {
    labels: string[];
    series: number[];
  };
  cattle: {
    total: number[];
  };
  conversion: {
    approved: number[];
    pending: number[];
    rejected: number[];
  };
}

export interface AdminPlan {
  id: string;
  nome?: string;
  name?: string;
  preco?: number;
  price?: number;
  maxCabecas?: number | null;
  maxCattle?: number | null;
  recursos?: string[];
  features?: string[];
  ativo?: boolean;
  active?: boolean;
}

export interface AdminCoupon {
  id: string;
  codigo?: string;
  code?: string;
  tipo?: string;
  type?: string;
  valor?: number;
  value?: number;
  quantidadeUso?: number;
  usageCount?: number;
  maxUso?: number | null;
  maxUsage?: number | null;
  comissao?: number;
  commission?: number;
  criadoPor?: string;
  createdBy?: string;
  status: string;
}

export interface AdminReferrer {
  id: string;
  nome?: string;
  name?: string;
  codigo?: string;
  code?: string;
  indicacoes?: number;
  referrals?: number;
  comissaoTotal?: number;
  totalCommission?: number;
  comissaoPendente?: number;
  pendingCommission?: number;
  status: string;
}

export interface AdminCommunication {
  id: string;
  tipo?: string;
  type?: string;
  titulo?: string;
  title?: string;
  mensagem?: string;
  message?: string;
  enviadoEm?: string;
  sentAt?: string;
  destinatarios?: number;
  recipients?: number;
  status: string;
  publicoAlvo?: string;
  targetAudience?: string;
  cor?: string | null;
  color?: string | null;
  inicioEm?: string | null;
  startDate?: string | null;
  fimEm?: string | null;
  endDate?: string | null;
}

export interface StateRegulation {
  id: string;
  uf: string;
  stateName: string;
  reportingDeadline: number;
  requiredDocuments: string[];
  saldoReportFrequency: string;
  saldoReportDay: number;
  gtaRequired: boolean;
  observations: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CreateRegulationDto {
  uf: string;
  stateName: string;
  reportingDeadline: number;
  requiredDocuments: string[];
  saldoReportFrequency: string;
  saldoReportDay: number;
  gtaRequired: boolean;
  observations: string;
}

export interface FinancialPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  amount: number;
  paymentMethod: string;
  paymentFrequency: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface PixConfig {
  id: string;
  pixKey: string;
  pixKeyType: string;
  qrCodeImage?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ip: string;
  timestamp: string;
  dataHora?: string; // Backend usa dataHora
}

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return apiClient.get<AdminDashboardStats>(API_ROUTES.ADMIN.DASHBOARD_STATS);
  },

  async getMrrSeries(months = 12): Promise<AdminMrrSeriesPoint[]> {
    const params = months ? `?months=${months}` : '';
    return apiClient.get<AdminMrrSeriesPoint[]>(`${API_ROUTES.ADMIN.DASHBOARD_MRR_SERIES}${params}`);
  },

  async getDashboardActivity(limit = 10): Promise<AdminDashboardActivityItem[]> {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get<AdminDashboardActivityItem[]>(`${API_ROUTES.ADMIN.DASHBOARD_ACTIVITY}${params}`);
  },

  async getAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AdminAnalyticsResponse> {
    const params = period ? `?period=${period}` : '';
    return apiClient.get<AdminAnalyticsResponse>(`${API_ROUTES.ADMIN.ANALYTICS}${params}`);
  },

  async getPendingUsers(): Promise<User[]> {
    return apiClient.get<User[]>(API_ROUTES.ADMIN.PENDING_USERS);
  },

  async getTenants(): Promise<User[]> {
    return apiClient.get<User[]>(API_ROUTES.ADMIN.TENANTS);
  },

  async approveUser(userId: string, status: string): Promise<User> {
    return apiClient.patch<User>(API_ROUTES.ADMIN.APPROVE_USER.replace(':id', userId), { status });
  },

  async rejectUser(userId: string, reason?: string): Promise<User> {
    return apiClient.patch<User>(API_ROUTES.ADMIN.REJECT_USER.replace(':id', userId), { reason });
  },

  async updateUserStatus(userId: string, status: string, reason?: string): Promise<User> {
    return apiClient.patch<User>(API_ROUTES.ADMIN.UPDATE_USER_STATUS.replace(':id', userId), { status, reason });
  },

  async resetUserPassword(userId: string): Promise<{ tempPassword: string }> {
    return apiClient.post<{ tempPassword: string }>(API_ROUTES.ADMIN.RESET_USER_PASSWORD.replace(':id', userId), {});
  },

  async updateUser(userId: string, data: Partial<{ cpfCnpj: string; phone: string | null; email: string }>): Promise<User> {
    return apiClient.patch<User>(API_ROUTES.ADMIN.UPDATE_USER.replace(':id', userId), {
      ...(data.cpfCnpj !== undefined ? { cpfCnpj: data.cpfCnpj } : {}),
      ...(data.phone !== undefined ? { telefone: data.phone } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
    } as any);
  },

  async updateUserPlan(userId: string, plan: string): Promise<unknown> {
    return apiClient.patch(API_ROUTES.ADMIN.UPDATE_USER_PLAN.replace(':id', userId), { plan });
  },

  async impersonateUser(userId: string): Promise<{ token: string }> {
    return apiClient.post<{ token: string }>(API_ROUTES.ADMIN.IMPERSONATE_USER.replace(':id', userId), {});
  },

  async getRegulations(): Promise<StateRegulation[]> {
    return apiClient.get<StateRegulation[]>(API_ROUTES.ADMIN.REGULATIONS);
  },

  async createRegulation(data: CreateRegulationDto): Promise<StateRegulation> {
    return apiClient.post<StateRegulation>(API_ROUTES.ADMIN.REGULATIONS, data);
  },

  async updateRegulation(id: string, data: Partial<CreateRegulationDto>): Promise<StateRegulation> {
    return apiClient.patch<StateRegulation>(API_ROUTES.ADMIN.REGULATIONS_ID.replace(':id', id), data);
  },

  async deleteRegulation(id: string): Promise<void> {
    await apiClient.delete(API_ROUTES.ADMIN.REGULATIONS_ID.replace(':id', id));
  },

  async getPayments(): Promise<FinancialPayment[]> {
    return apiClient.get<FinancialPayment[]>(API_ROUTES.ADMIN.PAYMENTS);
  },

  async createPayment(data: Partial<FinancialPayment>): Promise<FinancialPayment> {
    return apiClient.post<FinancialPayment>(API_ROUTES.ADMIN.PAYMENTS, data);
  },

  async getPixConfig(): Promise<PixConfig> {
    return apiClient.get<PixConfig>(API_ROUTES.ADMIN.PIX_CONFIG);
  },

  async updatePixConfig(data: Partial<PixConfig>): Promise<PixConfig> {
    return apiClient.post<PixConfig>(API_ROUTES.ADMIN.PIX_CONFIG, data);
  },

  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const logs = await apiClient.get<AuditLog[]>(`${API_ROUTES.ADMIN.AUDIT_LOGS}${params}`);
    // Mapear dataHora para timestamp se necessário, ou ajustar a interface
    return logs.map(log => ({
      ...log,
      timestamp: (log as any).dataHora ?? log.timestamp,
      userId: (log as any).usuarioId ?? log.userId,
      userName: (log as any).usuarioNome ?? log.userName,
      action: (log as any).acao ?? log.action,
      details: (log as any).detalhes ?? log.details,
    }));
  },

  async getRequests(): Promise<any[]> {
    return apiClient.get<any[]>(API_ROUTES.ADMIN.GET_SOLICITATIONS);
  },

  async approveRequest(id: string, reason?: string): Promise<any> {
    return apiClient.patch<any>(API_ROUTES.ADMIN.APPROVE_SOLICITATION.replace(':id', id), { reason });
  },

  async rejectRequest(id: string, reason: string): Promise<any> {
    return apiClient.patch<any>(API_ROUTES.ADMIN.REJECT_SOLICITATION.replace(':id', id), { reason });
  },

  async listAdminPlans(): Promise<AdminPlan[]> {
    return apiClient.get<AdminPlan[]>(API_ROUTES.ADMIN.PLANS);
  },

  async createAdminPlan(data: { name: string; price: number; maxCattle?: number | null; features?: string[]; active?: boolean }): Promise<AdminPlan> {
    return apiClient.post<AdminPlan>(API_ROUTES.ADMIN.PLANS, data);
  },

  async updateAdminPlan(id: string, data: Partial<{ name: string; price: number; maxCattle?: number | null; features?: string[]; active?: boolean }>): Promise<AdminPlan> {
    return apiClient.patch<AdminPlan>(API_ROUTES.ADMIN.PLANS_ID.replace(':id', id), data);
  },

  async deleteAdminPlan(id: string): Promise<void> {
    await apiClient.delete(API_ROUTES.ADMIN.PLANS_ID.replace(':id', id));
  },

  async listCoupons(): Promise<AdminCoupon[]> {
    return apiClient.get<AdminCoupon[]>(API_ROUTES.ADMIN.COUPONS);
  },

  async createCoupon(data: { code: string; type: string; value: number; maxUsage?: number | null; commission?: number; createdBy?: string; status?: string }): Promise<AdminCoupon> {
    return apiClient.post<AdminCoupon>(API_ROUTES.ADMIN.COUPONS, data);
  },

  async listReferrers(): Promise<AdminReferrer[]> {
    return apiClient.get<AdminReferrer[]>(API_ROUTES.ADMIN.REFERRERS);
  },

  async listCommunications(): Promise<AdminCommunication[]> {
    return apiClient.get<AdminCommunication[]>(API_ROUTES.ADMIN.COMMUNICATION);
  },

  async createCommunication(data: { type: string; title: string; message: string; sentAt?: string; recipients: number; status: string; targetAudience: string; color?: string; startDate?: string; endDate?: string }): Promise<AdminCommunication> {
    return apiClient.post<AdminCommunication>(API_ROUTES.ADMIN.COMMUNICATION, data);
  },

  async deleteCommunication(id: string): Promise<void> {
    await apiClient.delete(API_ROUTES.ADMIN.COMMUNICATION_ID.replace(':id', id));
  },

  async updateCommunication(id: string, data: Partial<{ type: string; title: string; message: string; sentAt?: string; recipients: number; status: string; targetAudience: string; color?: string | null; startDate?: string | null; endDate?: string | null }>): Promise<AdminCommunication> {
    return apiClient.patch<AdminCommunication>(API_ROUTES.ADMIN.COMMUNICATION_ID.replace(':id', id), data);
  },
};
