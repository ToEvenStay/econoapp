import { useEffect, useCallback, useState } from 'react';

// @ts-ignore

export function useTheme(): {
  darkMode: boolean;
  toggleTheme: () => void;
  mounted: boolean;
} {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  useEffect(() => {
    setMounted(true);
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [setTheme]);

  return { darkMode, toggleTheme, mounted };
} 