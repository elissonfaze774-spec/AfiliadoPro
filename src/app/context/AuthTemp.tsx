import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

async function loadAppUser(): Promise<AppUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const authUser = session.user;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Perfil do usuário não encontrado.');
  }

  let storeId: string | null = null;

  if (profile.role === 'admin') {
    const { data: adminRow } = await supabase
      .from('admins')
      .select('store_id')
      .eq('user_id', authUser.id)
      .maybeSingle();

    storeId = adminRow?.store_id ?? null;
  }

  return {
    id: profile.id,
    email: profile.email ?? authUser.email ?? '',
    name: profile.name ?? '',
    role: profile.role as AppRole,
    storeId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const appUser = await loadAppUser();
      setUser(appUser);
      return appUser;
    } catch (error) {
      console.error('Erro ao carregar usuário autenticado:', error);
      setUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const appUser = await loadAppUser();
        if (!mounted) return;
        setUser(appUser);
      } catch (error) {
        console.error('Erro ao iniciar autenticação:', error);
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    const appUser = await loadAppUser();
    setUser(appUser);
    return appUser;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
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