import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { login as apiLogin, apiLogout } from '../services/api'; // Importa las funciones de login y logout de api.ts
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: number;
  nombre: string;
  username: string;
  rol: 'cajero' | 'admin' | 'gerente' | 'cocinero' | 'super_admin' | 'mesero' | 'contador';
  sucursal: {
    id: number;
    nombre: string;
    ciudad: string;
    direccion: string;
  };
  id_restaurante: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearRestaurantData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previousRestaurantId, setPreviousRestaurantId] = useState<number | null>(null);

  // Al cargar la aplicación, intenta cargar el usuario desde localStorage
  useEffect(() => {
    console.log('AuthContext: Loading user from localStorage');
    const storedUser = localStorage.getItem('currentUser');
    console.log('AuthContext: storedUser:', storedUser);
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        console.log('AuthContext: Parsed user:', parsedUser);
        setUser(parsedUser);
        setPreviousRestaurantId(parsedUser.id_restaurante);
        setIsAuthenticated(true);
        console.log('AuthContext: User loaded successfully');
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('currentUser'); // Limpiar datos corruptos
      }
    } else {
      console.log('AuthContext: No stored user found');
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login for username:', username);
      const userData = await apiLogin(username, password);
      console.log('AuthContext: Login successful, userData:', userData);
      
      // Si hay un usuario anterior con diferente restaurante, limpiar datos
      if (user && user.id_restaurante !== userData.id_restaurante) {
        console.log('AuthContext: Different restaurant detected, clearing previous data');
        clearRestaurantData();
      }
      
      setUser(userData);
      setPreviousRestaurantId(userData.id_restaurante);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(userData)); // Guardar usuario en localStorage
      console.log('AuthContext: User saved to localStorage');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out, clearing all data');
    clearRestaurantData();
    setUser(null);
    setIsAuthenticated(false);
    setPreviousRestaurantId(null);
    localStorage.removeItem('currentUser'); // Limpiar usuario de localStorage
    apiLogout(); // Limpiar token de axios y localStorage
  };

  // Función para limpiar datos del restaurante anterior
  const clearRestaurantData = () => {
    try {
      // Limpiar localStorage específico del restaurante
      const keysToRemove = [
        'selectedSucursalId',
        'lastSelectedSucursal',
        'sucursalPreference'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`AuthContext: Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });

      // Limpiar todas las queries de React Query
      // Esto se hará desde el componente que use este contexto
      console.log('AuthContext: Restaurant data cleared');
    } catch (error) {
      console.error('Error clearing restaurant data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, clearRestaurantData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
