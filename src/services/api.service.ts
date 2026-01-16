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
    const endpoint = data.type === 'birth' 
      ? API_ROUTES.MOVEMENTS.CREATE_BIRTH
      : data.type === 'death'
      ? API_ROUTES.MOVEMENTS.CREATE_DEATH
      : data.type === 'sale'
      ? API_ROUTES.MOVEMENTS.CREATE_SALE
      : data.type === 'vaccine'
      ? API_ROUTES.MOVEMENTS.CREATE_VACCINE
      : '/lancamentos';
    
    return apiClient.post<Movement>(endpoint, data);
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
};
