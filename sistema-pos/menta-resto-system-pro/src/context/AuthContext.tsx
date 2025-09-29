// src/context/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAllCache, clearAuthCache, smartCacheCleanup, softCacheCleanup, shouldSoftCleanup } from '../utils/cacheCleanup';

interface User {
  id_vendedor: number;
  nombre: string;
  email: string;
  rol: string;
  id_sucursal: number;
  id_restaurante: number;
  activo: boolean;
  restaurante?: {
    id: number;
    nombre: string;
    ciudad: string;
    direccion: string;
  };
  sucursal?: {
    id: number;
    nombre: string;
    ciudad: string;
    direccion: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  clearRestaurantData: () => void;
  updateUserFromStorage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  user: 'currentUser',
  token: 'jwtToken',
  selectedBranch: 'selectedBranch',
  restaurantConfig: 'restaurantConfig',
};

const getBackendURL = (): string =>
  (window as any).ENV_OVERRIDE?.VITE_BACKEND_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000/api/v1';

const getStoredAuthData = () => {
  try {
    const user = localStorage.getItem(LOCAL_STORAGE_KEYS.user);
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.token);

    if (user && token) {
      return {
        user: JSON.parse(user) as User,
        token,
      };
    }
  } catch (error) {
    console.error('Error reading auth data from storage:', error);
  }

  // Limpieza por si acaso
  localStorage.removeItem(LOCAL_STORAGE_KEYS.user);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.token);

  return { user: null, token: null };
};

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${getBackendURL()}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    console.log('🚪 [AuthContext] Cerrando sesión...');
    clearAuthCache(); // Limpiar datos de autenticación
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  }, [navigate]);

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);

    const { user: storedUser, token } = getStoredAuthData();

    if (storedUser && token) {
      const isValid = await validateToken(token);
      if (isValid) {
        setUser(storedUser);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } else {
      logout();
    }

    setIsLoading(false);
  }, [logout]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Escuchar cambios en localStorage para actualizar el usuario
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.user && e.newValue) {
        try {
          const newUser = JSON.parse(e.newValue);
          setUser(newUser);
          console.log('🔄 [AuthContext] Usuario actualizado desde storage event:', newUser);
        } catch (error) {
          console.error('Error parsing user from storage event:', error);
        }
      }
    };

    const handleUserUpdated = (e: CustomEvent) => {
      setUser(e.detail);
      console.log('🔄 [AuthContext] Usuario actualizado desde custom event:', e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userUpdated', handleUserUpdated as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdated as EventListener);
    };
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Limpiar caché antes del login para evitar datos obsoletos
      console.log('🧹 [AuthContext] Limpiando caché antes del login...');
      
      // Usar limpieza suave por defecto, completa solo si es necesario
      if (shouldSoftCleanup()) {
        softCacheCleanup();
      } else {
        console.log('ℹ️ [AuthContext] No es necesario limpiar caché en este momento');
      }

      const response = await fetch(`${getBackendURL()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Error de conexión',
        }));
        return { success: false, error: errorData.message || 'Credenciales inválidas' };
      }

      const { token, data: userData } = await response.json();

      if (!token || !userData) {
        return { success: false, error: 'Respuesta del servidor inválida' };
      }

      // Guardar datos de autenticación
      localStorage.setItem(LOCAL_STORAGE_KEYS.token, token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.user, JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('✅ [AuthContext] Login exitoso con caché limpio');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    setIsLoading(true);

    try {
      const { user: storedUser, token } = getStoredAuthData();

      if (storedUser && token) {
        const isValid = await validateToken(token);
        if (isValid) {
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const clearRestaurantData = () => {
    console.log('🏪 [AuthContext] Limpiando datos del restaurante...');
    localStorage.removeItem(LOCAL_STORAGE_KEYS.selectedBranch);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.restaurantConfig);
    // También limpiar caché de planes cuando se cambia de restaurante
    import('../utils/cacheCleanup').then(({ clearPlanCache }) => {
      clearPlanCache();
    });
  };

  // Función para actualizar el usuario desde localStorage
  const updateUserFromStorage = useCallback(() => {
    const { user: storedUser } = getStoredAuthData();
    if (storedUser) {
      setUser(storedUser);
      console.log('🔄 [AuthContext] Usuario actualizado desde localStorage:', storedUser);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth,
    clearRestaurantData,
    updateUserFromStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
