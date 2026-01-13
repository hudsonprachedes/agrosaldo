/**
 * Cliente HTTP para comunicação com API backend NestJS
 * Implementa interceptors, retry logic, e tratamento de erros
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { ApiResponse, ValidationError } from '@/types';

// Configuração base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 3;

class ApiClient {
  private instance: AxiosInstance;
  private refreshTokenRequest: Promise<string> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Interceptor de requisição
    this.instance.interceptors.request.use(
      this.onRequestFulfilled.bind(this),
      this.onRequestRejected.bind(this)
    );

    // Interceptor de resposta
    this.instance.interceptors.response.use(
      this.onResponseFulfilled.bind(this),
      this.onResponseRejected.bind(this)
    );
  }

  /**
   * Interceptor de requisição: adiciona token JWT
   */
  private async onRequestFulfilled(config: InternalAxiosRequestConfig) {
    const token = localStorage.getItem('auth_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Adicionar ID da propriedade selecionada se disponível
    const propertyId = localStorage.getItem('agrosaldo_property_id');
    if (propertyId && !config.url?.includes('/propriedades')) {
      config.headers['X-Property-ID'] = propertyId;
    }

    return config;
  }

  /**
   * Rejeição de requisição
   */
  private onRequestRejected(error: AxiosError) {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }

  /**
   * Interceptor de resposta bem-sucedida
   */
  private onResponseFulfilled(response: any) {
    return response;
  }

  /**
   * Interceptor de resposta com erro
   */
  private async onResponseRejected(error: AxiosError<any>) {
    const { config, response, status } = error;

    if (!config) {
      return Promise.reject(error);
    }

    // Token expirado - tentar renovar
    if (response?.status === 401 && !config.url?.includes('/auth/login')) {
      return this.handleUnauthorized(config as InternalAxiosRequestConfig);
    }

    // Rate limiting - retry com backoff exponencial
    if (response?.status === 429) {
      return this.handleRateLimit(config as InternalAxiosRequestConfig);
    }

    // Erro do servidor - retry para requisições GET e idempotentes
    if (
      response?.status &&
      response.status >= 500 &&
      this.isRetryableRequest(config)
    ) {
      return this.retryRequest(config as InternalAxiosRequestConfig);
    }

    // Erro de validação
    if (response?.status === 400) {
      console.error('Erro de validação:', response.data);
    }

    return Promise.reject(error);
  }

  /**
   * Renovar token JWT quando expirado
   */
  private async handleUnauthorized(config: InternalAxiosRequestConfig) {
    if (!this.refreshTokenRequest) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // Logout se não tiver refresh token
        this.logout();
        return Promise.reject(new Error('Sessão expirada'));
      }

      // Fazer requisição de renovação
      this.refreshTokenRequest = this.instance
        .post<{ data: { token: string; refreshToken: string } }>(
          '/auth/refresh',
          { refreshToken }
        )
        .then((response) => {
          const newToken = response.data.data.token;
          const newRefreshToken = response.data.data.refreshToken;

          localStorage.setItem('auth_token', newToken);
          localStorage.setItem('refresh_token', newRefreshToken);

          return newToken;
        })
        .catch((error) => {
          this.logout();
          return Promise.reject(error);
        })
        .finally(() => {
          this.refreshTokenRequest = null;
        });
    }

    // Aguardar renovação e retentar requisição
    try {
      const token = await this.refreshTokenRequest;
      config.headers.Authorization = `Bearer ${token}`;
      return this.instance(config);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Lidar com rate limiting (429)
   */
  private async handleRateLimit(config: InternalAxiosRequestConfig) {
    // Aguardar 5 segundos e retentar
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return this.instance(config);
  }

  /**
   * Verificar se requisição é retentável
   */
  private isRetryableRequest(config: AxiosRequestConfig): boolean {
    // Apenas GET e requisições idempotentes
    const retryableMethods = ['GET', 'HEAD', 'OPTIONS', 'DELETE'];
    return retryableMethods.includes((config.method || 'GET').toUpperCase());
  }

  /**
   * Retentar requisição com backoff exponencial
   */
  private async retryRequest(
    config: InternalAxiosRequestConfig,
    attempt: number = 0
  ): Promise<any> {
    if (attempt >= MAX_RETRIES) {
      return Promise.reject(new Error('Máximo de tentativas atingido'));
    }

    // Backoff exponencial: 1s, 2s, 4s
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      return await this.instance(config);
    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        return this.retryRequest(config, attempt + 1);
      }
      return Promise.reject(error);
    }
  }

  /**
   * Logout do usuário
   */
  private logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('agrosaldo_user_id');
    localStorage.removeItem('agrosaldo_property_id');
    window.location.href = '/login';
  }

  /**
   * Requisição GET genérica
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  /**
   * Requisição POST genérica
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * Requisição PUT genérica
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * Requisição PATCH genérica
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  /**
   * Requisição DELETE genérica
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  /**
   * Upload de arquivo (fotos)
   */
  async uploadFile<T>(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data as T;
  }

  /**
   * Obter instância do axios para casos especiais
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * Definir headers customizados
   */
  setHeaders(headers: Record<string, string>): void {
    Object.entries(headers).forEach(([key, value]) => {
      this.instance.defaults.headers.common[key] = value;
    });
  }

  /**
   * Definir token de autenticação
   */
  setAuthToken(token: string): void {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Limpar autenticação
   */
  clearAuth(): void {
    delete this.instance.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }
}

// Exportar singleton
export const apiClient = new ApiClient();

// Exportar tipo para uso em componentes
export type { ApiResponse, ValidationError };
