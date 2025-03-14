import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeOption = 'light' | 'dark' | 'device';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themePreference: ThemeOption;
  toggleTheme: () => void;
  setTheme: (theme: ThemeOption) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themePreference: 'device',
  toggleTheme: () => {},
  setTheme: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme() ?? 'light';
  const [themePreference, setThemePreference] = useState<ThemeOption>('device');

  const activeTheme = themePreference === 'device' ? systemTheme : themePreference;

  useEffect(() => {
    AsyncStorage.getItem('@theme_preference')
      .then(pref => {
        if (pref === 'light' || pref === 'dark' || pref === 'device') {
          setThemePreference(pref);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@theme_preference', themePreference);
  }, [themePreference]);

  const value = useMemo(() => ({
    theme: activeTheme,
    themePreference,
    toggleTheme: () => setThemePreference(prev => 
      prev === 'device' ? 'light' : prev === 'light' ? 'dark' : 'device'
    ),
    setTheme: setThemePreference
  }), [activeTheme, themePreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};