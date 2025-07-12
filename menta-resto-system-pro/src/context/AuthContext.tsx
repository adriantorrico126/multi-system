import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { login as apiLogin, apiLogout } from '../services/api'; // Importa las funciones de login y logout de api.ts

interface User {
  id: number;
  nombre: string;
  username: string;
  rol: 'cajero' | 'gerente' | 'admin' | 'cocinero' | 'super_admin';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('currentUser', JSON.stringify(userData)); // Guardar usuario en localStorage
      console.log('AuthContext: User saved to localStorage');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser'); // Limpiar usuario de localStorage
    apiLogout(); // Limpiar token de axios y localStorage
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
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
