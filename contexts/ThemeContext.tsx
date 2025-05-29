
import React, { createContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const defaultTheme: Theme = 'dark'; // Default to dark theme

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const storedTheme = localStorage.getItem('portfolio-theme-bc-style') as Theme | null; // Use a new storage key
    // System preference is less critical now as we default to dark, but can be a fallback
    // const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme(defaultTheme); // Default to dark if nothing stored
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    // Always add 'dark' class to html tag as per new design's default
    // The toggle will switch this if light mode is implemented/desired
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#0a192f'; // Ensure body bg matches
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#ffffff'; // Example light mode bg
    }
    localStorage.setItem('portfolio-theme-bc-style', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
