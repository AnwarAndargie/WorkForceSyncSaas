import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'client_admin' | 'employee';
  tenantId?: string;
  clientId?: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData.user,
          loading: false,
          error: null,
        });
      } else if (response.status === 401) {
        setAuthState({
          user: null,
          loading: false,
          error: 'Not authenticated',
        });
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      });
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        });
        return { success: true };
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: data.message || 'Login failed',
        });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login error';
      setAuthState({
        user: null,
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name: string, email: string, password: string, role: 'super_admin' | 'tenant_admin' | 'client_admin' | 'employee') => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        });
        return { success: true };
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: data.message || 'Registration failed',
        });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration error';
      setAuthState({
        user: null,
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    refetch: fetchUser,
  };
}; 