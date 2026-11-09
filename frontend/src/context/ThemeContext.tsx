import React, { createContext, useContext, useState, useEffect } from 'react';
import { storeApi } from '../services/api';

export type StoreTheme = 'neo-brutal' | 'rokad-sticker' | 'minimal-premium' | 'dark-neon' | 'soft-playful';
export type PersonaTheme = 'ecosystem' | 'male' | 'female' | 'college' | 'club';

interface ThemeContextType {
  theme: StoreTheme;
  persona: PersonaTheme;
  darkMode: boolean;
  storeName: string;
  setTheme: (theme: StoreTheme) => void;
  setPersona: (persona: PersonaTheme) => void;
  toggleDarkMode: () => void;
  refreshSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<StoreTheme>('neo-brutal');
  const [persona, setPersonaState] = useState<PersonaTheme>('ecosystem');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [storeName, setStoreName] = useState<string>('بوفه رُکاد');

  // Initialize theme from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('romenu_theme') as StoreTheme;
      if (savedTheme) setThemeState(savedTheme);
      const savedPersona = localStorage.getItem('romenu_persona') as PersonaTheme;
      if (savedPersona) setPersonaState(savedPersona);
      const savedDark = localStorage.getItem('romenu_dark');
      if (savedDark !== null) setDarkMode(savedDark === 'true');
    }
  }, []);

  const refreshSettings = async () => {
    try {
      const data = await storeApi.getStoreSettings();
      if (data.activeTheme) {
        setThemeState(data.activeTheme);
        if (typeof window !== 'undefined') {
          localStorage.setItem('romenu_theme', data.activeTheme);
        }
      }
      if (data.storeName) {
        setStoreName(data.storeName);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Remove previous theme classes
    root.classList.remove(
      'theme-neo-brutal',
      'theme-rokad-sticker',
      'theme-minimal-premium',
      'theme-dark-neon',
      'theme-soft-playful'
    );
    root.classList.add(`theme-${theme}`);
    root.setAttribute('data-theme', persona);

    if (darkMode || theme === 'dark-neon') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, persona, darkMode]);

  const setTheme = (newTheme: StoreTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('romenu_theme', newTheme);
    }
  };

  const setPersona = (newPersona: PersonaTheme) => {
    setPersonaState(newPersona);
    if (typeof window !== 'undefined') {
      localStorage.setItem('romenu_persona', newPersona);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('romenu_dark', String(next));
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        persona,
        darkMode,
        storeName,
        setTheme,
        setPersona,
        toggleDarkMode,
        refreshSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
