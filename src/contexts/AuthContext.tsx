import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { CreateUserRequest, UserDTO, PropertyDTO } from '@/types';
import { livestockService } from '@/services/api.service';

type RegisterData = CreateUserRequest & { password: string };

interface AuthContextType {
  user: UserDTO | null;
  selectedProperty: PropertyDTO | null;
  isLoading: boolean;
  login: (cpfCnpj: string, password: string) => Promise<{ success: boolean; user: UserDTO | null }>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  selectProperty: (propertyOrId: PropertyDTO | string) => void;
  clearSelectedProperty: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        cpfCnpj,
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
        cpfCnpj: data.cpfCnpj,
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

  const logout = () => {
    setUser(null);
    setSelectedProperty(null);
    localStorage.removeItem('agrosaldo_user_id');
    localStorage.removeItem('agrosaldo_property_id');
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
      login,
      register,
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
