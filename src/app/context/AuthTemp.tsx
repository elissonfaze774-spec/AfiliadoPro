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

async function resolveStoreId(authUserId: string, authUserEmail: string) {
  const normalizedEmail = normalizeEmail(authUserEmail);

  const { data: adminByUserId, error: adminByUserIdError } = await supabase
    .from('admins')
    .select('store_id')
    .eq('user_id', authUserId)
    .maybeSingle();

  if (adminByUserIdError) {
    throw new Error('Não foi possível carregar os dados administrativos da conta.');
  }

  if (adminByUserId?.store_id) {
    return adminByUserId.store_id as string;
  }

  if (normalizedEmail) {
    const { data: adminByEmail, error: adminByEmailError } = await supabase
      .from('admins')
      .select('store_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (adminByEmailError) {
      throw new Error('Não foi possível localizar a loja do admin.');
    }

    if (adminByEmail?.store_id) {
      return adminByEmail.store_id as string;
    }
  }

  const { data: storeByOwner, error: storeByOwnerError } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (storeByOwnerError) {
    throw new Error('Não foi possível localizar a loja vinculada ao admin.');
  }

  return storeByOwner?.id ?? null;
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
  const profileEmail = normalizeEmail(profile?.email) || authUserEmail;

  let storeId: string | null = null;

  if (profileRole === 'admin') {
    storeId = await resolveStoreId(authUserId, profileEmail);
  }

  return {
    id: authUserId,
    email: profileEmail,
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
        if (isMountedRef.current) {
          setUser(null);
          setAuthLoading(false);
        }
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
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);

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
      setAuthLoading(false);
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
    [user, authLoading, login, logout, refreshUser],
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