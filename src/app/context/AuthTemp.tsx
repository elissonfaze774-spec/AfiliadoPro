import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../../lib/supabase';

export type AppRole = 'admin' | 'super-admin';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  storeId: string | null;
};

type AuthContextType = {
  user: AppUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<AppUser | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AppUser | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeEmail(email?: string | null) {
  return (email ?? '').trim().toLowerCase();
}

function normalizeRole(role?: string | null): AppRole {
  return role === 'super-admin' ? 'super-admin' : 'admin';
}

function isInvalidLoginError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('invalid email or password') ||
    normalized.includes('email not confirmed') ||
    normalized.includes('credenciais inválidas') ||
    normalized.includes('email ou senha')
  );
}

async function loadAppUser(): Promise<AppUser | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error('Não foi possível verificar a sessão atual.');
  }

  if (!session?.user) return null;

  const authUser = session.user;
  const authUserId = authUser.id;
  const authUserEmail = normalizeEmail(authUser.email);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', authUserId)
    .maybeSingle();

  if (profileError) {
    throw new Error('Não foi possível carregar o perfil do usuário.');
  }

  const profileRole = normalizeRole(profile?.role);
  let storeId: string | null = null;

  if (profileRole === 'admin') {
    const { data: adminRow, error: adminError } = await supabase
      .from('admins')
      .select('store_id')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (adminError) {
      throw new Error('Não foi possível carregar os dados administrativos da conta.');
    }

    storeId = adminRow?.store_id ?? null;
  }

  return {
    id: authUserId,
    email: normalizeEmail(profile?.email) || authUserEmail,
    name: (profile?.name ?? '').trim(),
    role: profileRole,
    storeId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isMountedRef = useRef(true);
  const refreshingRef = useRef(false);

  const refreshUser = useCallback(async () => {
    if (refreshingRef.current) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (isMountedRef.current) setUser(null);
        if (isMountedRef.current) setAuthLoading(false);
        return null;
      }
    }

    refreshingRef.current = true;

    try {
      const appUser = await loadAppUser();

      if (isMountedRef.current) {
        setUser(appUser);
      }

      return appUser;
    } catch {
      if (isMountedRef.current) {
        setUser(null);
      }
      return null;
    } finally {
      refreshingRef.current = false;

      if (isMountedRef.current) {
        setAuthLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (isMountedRef.current) {
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      void refreshUser();
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (isInvalidLoginError(error.message)) {
        throw new Error('Email ou senha incorretos.');
      }

      throw new Error(error.message || 'Não foi possível fazer login.');
    }

    const appUser = await loadAppUser();

    if (!appUser) {
      throw new Error('Não foi possível carregar sua conta após o login.');
    }

    if (isMountedRef.current) {
      setUser(appUser);
    }

    return appUser;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();

    if (isMountedRef.current) {
      setUser(null);
      setAuthLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      authLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, authLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}