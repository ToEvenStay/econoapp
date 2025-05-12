import { useState, useEffect, useCallback } from 'react';
import { isAuthenticatedClient, getUserFromToken } from './auth';
import { useRouter } from 'next/router';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setIsAuthenticated(isAuthenticatedClient());
      setUser(getUserFromToken(token));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [router.asPath]);

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(getUserFromToken(token));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return { isAuthenticated, user, login, logout };
} 