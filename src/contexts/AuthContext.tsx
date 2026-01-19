import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { CreateUserRequest, UserDTO, PropertyDTO } from '@/types';
import { livestockService } from '@/services/api.service';
import { cleanDocument } from '@/lib/utils';

type RegisterData = CreateUserRequest & { password: string };

export interface PreferencesDTO {
  notificacoes: boolean;
  sincronizacaoAuto: boolean;
  modoEscuro: boolean;
  notificacaoNascimento: boolean;
  notificacaoMorte: boolean;
  notificacaoVacina: boolean;
}

interface AuthContextType {
  user: UserDTO | null;
  selectedProperty: PropertyDTO | null;
  isLoading: boolean;
  preferences: PreferencesDTO | null;
  login: (cpfCnpj: string, password: string) => Promise<{ success: boolean; user: UserDTO | null }>;
  register: (data: RegisterData) => Promise<boolean>;
  refreshMe: () => Promise<UserDTO | null>;
  updatePreferences: (next: Partial<PreferencesDTO>) => Promise<PreferencesDTO | null>;
  startImpersonation: (token: string) => Promise<UserDTO | null>;
  stopImpersonation: () => Promise<UserDTO | null>;
  logout: () => void;
  selectProperty: (propertyOrId: PropertyDTO | string) => void;
  clearSelectedProperty: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<PreferencesDTO | null>(null);

  useEffect(() => {
    const runAgeGroupRecalculation = async () => {
      if (!selectedProperty?.id) {
        return;
      }

      const key = `agrosaldo_last_age_recalc_${selectedProperty.id}`;
      const lastRun = localStorage.getItem(key);
      if (lastRun) {
        const lastDate = new Date(lastRun);
        const today = new Date();
        if (lastDate.toDateString() === today.toDateString()) {
          return;
        }
      }

      try {
        await livestockService.recalculateAgeGroups(selectedProperty.id);
        localStorage.setItem(key, new Date().toISOString());
      } catch (error) {
        console.error('Erro ao recalcular faixas etárias no backend:', error);
      }
    };
    void runAgeGroupRecalculation();
  }, [selectedProperty?.id]);

  const startImpersonation = async (token: string): Promise<UserDTO | null> => {
    const current = localStorage.getItem('auth_token');
    if (current) {
      localStorage.setItem('agrosaldo_admin_token_before_impersonation', current);
      localStorage.setItem('agrosaldo_is_impersonating', 'true');
    }

    apiClient.setAuthToken(token);
    localStorage.removeItem('agrosaldo_property_id');
    setSelectedProperty(null);
    return refreshMe();
  };

  const stopImpersonation = async (): Promise<UserDTO | null> => {
    const adminToken = localStorage.getItem('agrosaldo_admin_token_before_impersonation');
    if (!adminToken) {
      return refreshMe();
    }

    apiClient.setAuthToken(adminToken);
    localStorage.removeItem('agrosaldo_admin_token_before_impersonation');
    localStorage.removeItem('agrosaldo_is_impersonating');
    localStorage.removeItem('agrosaldo_property_id');
    setSelectedProperty(null);
    return refreshMe();
  };

  useEffect(() => {
    const loadPreferences = async () => {
      if (!selectedProperty?.id) {
        setPreferences(null);
        document.documentElement.classList.remove('dark');
        return;
      }

      try {
        const data = await apiClient.get<PreferencesDTO>('/preferencias');
        setPreferences(data);
        document.documentElement.classList.toggle('dark', Boolean(data.modoEscuro));
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
        setPreferences(null);
        document.documentElement.classList.remove('dark');
      }
    };

    void loadPreferences();
  }, [selectedProperty?.id]);

  useEffect(() => {
    const loadSession = async () => {
      const storedPropertyId = localStorage.getItem('agrosaldo_property_id');
      const token = localStorage.getItem('auth_token');

      if (token) {
        apiClient.setAuthToken(token);
        try {
          const me = await apiClient.get<UserDTO>('/auth/me');
          setUser(me);
          if (storedPropertyId) {
            const foundProperty = me.properties?.find(p => p.id === storedPropertyId);
            if (foundProperty) {
              setSelectedProperty(foundProperty);
            }
          }
        } catch (error) {
          console.error('Erro ao recuperar sessão:', error);
          apiClient.clearAuth();
          localStorage.removeItem('agrosaldo_user_id');
          localStorage.removeItem('agrosaldo_property_id');
        }
      }
      setIsLoading(false);
    };

    void loadSession();
  }, []);

  const login = async (cpfCnpj: string, password: string): Promise<{ success: boolean; user: UserDTO | null }> => {
    try {
      const response = await apiClient.post<{ user: UserDTO; token: string }>('/auth/login', {
        cpfCnpj: cleanDocument(cpfCnpj),
        password,
      });
      apiClient.setAuthToken(response.token);
      setUser(response.user);
      localStorage.setItem('agrosaldo_user_id', response.user.id);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      return { success: false, user: null };
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      await apiClient.post<UserDTO>('/auth/register', {
        name: data.name,
        cpfCnpj: cleanDocument(data.cpfCnpj),
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      return true;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return false;
    }
  };

  const refreshMe = async (): Promise<UserDTO | null> => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setSelectedProperty(null);
      return null;
    }

    try {
      const me = await apiClient.get<UserDTO>('/auth/me');
      setUser(me);

      const storedPropertyId = localStorage.getItem('agrosaldo_property_id');
      const props = me.properties ?? [];
      const found = storedPropertyId ? props.find((p) => p.id === storedPropertyId) : undefined;

      if (found) {
        setSelectedProperty(found);
      } else if (props.length > 0) {
        setSelectedProperty(props[0]);
        localStorage.setItem('agrosaldo_property_id', props[0].id);
      } else {
        setSelectedProperty(null);
        localStorage.removeItem('agrosaldo_property_id');
      }

      return me;
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      return null;
    }
  };

  const updatePreferences = async (next: Partial<PreferencesDTO>): Promise<PreferencesDTO | null> => {
    if (!selectedProperty?.id) {
      return null;
    }

    const payload: PreferencesDTO = {
      notificacoes: next.notificacoes ?? preferences?.notificacoes ?? true,
      sincronizacaoAuto: next.sincronizacaoAuto ?? preferences?.sincronizacaoAuto ?? true,
      modoEscuro: next.modoEscuro ?? preferences?.modoEscuro ?? false,
      notificacaoNascimento: next.notificacaoNascimento ?? preferences?.notificacaoNascimento ?? true,
      notificacaoMorte: next.notificacaoMorte ?? preferences?.notificacaoMorte ?? true,
      notificacaoVacina: next.notificacaoVacina ?? preferences?.notificacaoVacina ?? true,
    };

    try {
      const updated = await apiClient.put<PreferencesDTO>('/preferencias', payload);
      setPreferences(updated);
      document.documentElement.classList.toggle('dark', Boolean(updated.modoEscuro));
      return updated;
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedProperty(null);
    apiClient.clearAuth();
    localStorage.removeItem('agrosaldo_user_id');
    localStorage.removeItem('agrosaldo_property_id');
    localStorage.removeItem('agrosaldo_admin_token_before_impersonation');
    localStorage.removeItem('agrosaldo_is_impersonating');
  };

  const selectProperty = (propertyOrId: PropertyDTO | string) => {
    let property: PropertyDTO | undefined;

    if (typeof propertyOrId === 'string') {
      property = user?.properties?.find(p => p.id === propertyOrId);
      if (!property) {
        console.error('Propriedade não encontrada');
        return;
      }
    } else {
      property = propertyOrId;
    }

    setSelectedProperty(property);
    localStorage.setItem('agrosaldo_property_id', property.id);
  };

  const clearSelectedProperty = () => {
    setSelectedProperty(null);
    localStorage.removeItem('agrosaldo_property_id');
  };

  return (
    <AuthContext.Provider value={{
      user,
      selectedProperty,
      isLoading,
      preferences,
      login,
      register,
      refreshMe,
      updatePreferences,
      startImpersonation,
      stopImpersonation,
      logout,
      selectProperty,
      clearSelectedProperty,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
