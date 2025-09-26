import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Declaración global para TypeScript
declare global {
  interface Window {
    __themeWarningShown?: boolean;
    __themeDebugShown?: boolean;
  }
}

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    console.log('🎨 ThemeProvider inicializado con tema:', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Solo mostrar el log una vez para evitar spam infinito
  if (typeof window !== 'undefined' && !window.__themeDebugShown) {
    console.log('🔍 useTheme llamado, contexto disponible:', !!context);
    window.__themeDebugShown = true;
  }
  
  if (!context) {
    // Solo mostrar el warning una vez para evitar spam infinito
    if (typeof window !== 'undefined' && !window.__themeWarningShown) {
      console.warn('useTheme called outside ThemeProvider, returning default values');
      window.__themeWarningShown = true;
    }
    return { theme: 'light' as Theme, toggleTheme: () => {} };
  }
  return context;
}; 