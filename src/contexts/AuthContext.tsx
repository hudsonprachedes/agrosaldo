import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Property, authenticateUser, mockUsers } from '@/mocks/mock-auth';

interface AuthContextType {
  user: User | null;
  selectedProperty: Property | null;
  isLoading: boolean;
  login: (cpfCnpj: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectProperty: (property: Property) => void;
  clearSelectedProperty: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUserId = localStorage.getItem('agrosaldo_user_id');
    const storedPropertyId = localStorage.getItem('agrosaldo_property_id');
    
    if (storedUserId) {
      const foundUser = mockUsers.find(u => u.id === storedUserId);
      if (foundUser) {
        setUser(foundUser);
        if (storedPropertyId) {
          const foundProperty = foundUser.properties.find(p => p.id === storedPropertyId);
          if (foundProperty) {
            setSelectedProperty(foundProperty);
          }
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (cpfCnpj: string, password: string): Promise<boolean> => {
    const foundUser = authenticateUser(cpfCnpj, password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('agrosaldo_user_id', foundUser.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setSelectedProperty(null);
    localStorage.removeItem('agrosaldo_user_id');
    localStorage.removeItem('agrosaldo_property_id');
  };

  const selectProperty = (property: Property) => {
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
