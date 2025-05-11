declare module 'src/lib/useTheme' {
  export function useTheme(): {
    darkMode: boolean;
    toggleTheme: () => void;
    mounted: boolean;
  };
} 