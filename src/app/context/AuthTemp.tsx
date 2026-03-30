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

export type StoreAccessStatus = 'active' | 'expires_today' | 'expiring_soon' | 'expired';

export type StoreAccessInfo = {
  storeId: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
  grantedDays: number;
  status: StoreAccessStatus;
  isExpired: boolean;
  daysLeft: number;
  label: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  storeId: string | null;
  access: StoreAccessInfo | null;
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

function getStoreAccessInfo(store: any): StoreAccessInfo | null {
  if (!store?.id) return null;

  const expiresAt = store.access_expires_at ? String(store.access_expires_at) : null;
  const autoRenew = Boolean(store.auto_renew);
  const grantedDays = Number(store.access_granted_days ?? 0);

  if (!expiresAt) {
    return {
      storeId: String(store.id),
      expiresAt: null,
      autoRenew,
      grantedDays,
      status: 'expired',
      isExpired: true,
      daysLeft: 0,
      label: autoRenew ? 'Expirado • Renovação automática ativa' : 'Expirado',
    };
  }

  const now = new Date();
  const exp = new Date(expiresAt);

  if (Number.isNaN(exp.getTime())) {
    return {
      storeId: String(store.id),
      expiresAt,
      autoRenew,
      grantedDays,
      status: 'expired',
      isExpired: true,
      daysLeft: 0,
      label: autoRenew ? 'Expirado • Renovação automática ativa' : 'Expirado',
    };
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfExpiry = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
  const rawDaysLeft = Math.ceil((startOfExpiry - startOfToday) / 86400000);
  const isExpired = exp.getTime() < now.getTime();

  if (isExpired) {
    return {
      storeId: String(store.id),
      expiresAt,
      autoRenew,
      grantedDays,
      status: 'expired',
      isExpired: true,
      daysLeft: 0,
      label: autoRenew ? 'Expirado • Renovação automática ativa' : 'Expirado',
    };
  }

  if (startOfExpiry === startOfToday) {
    return {
      storeId: String(store.id),
      expiresAt,
      autoRenew,
      grantedDays,
      status: 'expires_today',
      isExpired: false,
      daysLeft: 0,
      label: autoRenew ? 'Vence hoje • Renovação automática ativa' : 'Vence hoje',
    };
  }

  if (rawDaysLeft <= 7) {
    return {
      storeId: String(store.id),
      expiresAt,
      autoRenew,
      grantedDays,
      status: 'expiring_soon',
      isExpired: false,
      daysLeft: Math.max(rawDaysLeft, 0),
      label: autoRenew
        ? `Vence em ${Math.max(rawDaysLeft, 0)} dia(s) • Renovação automática ativa`
        : `Vence em ${Math.max(rawDaysLeft, 0)} dia(s)`,
    };
  }

  return {
    storeId: String(store.id),
    expiresAt,
    autoRenew,
    grantedDays,
    status: 'active',
    isExpired: false,
    daysLeft: Math.max(rawDaysLeft, 0),
    label: autoRenew ? 'Acesso ativo • Renovação automática ativa' : 'Acesso ativo',
  };
}

async function resolveAdminStore(authUserId: string, authUserEmail: string) {
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
    const { data: storeByAdminId, error: storeByAdminIdError } = await supabase
      .from('stores')
      .select('id, access_expires_at, auto_renew, access_granted_days, active, suspended, status')
      .eq('id', adminByUserId.store_id)
      .maybeSingle();

    if (storeByAdminIdError) {
      throw new Error('Não foi possível localizar a loja do admin.');
    }

    return storeByAdminId ?? null;
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
      const { data: storeByAdminEmail, error: storeByAdminEmailError } = await supabase
        .from('stores')
        .select('id, access_expires_at, auto_renew, access_granted_days, active, suspended, status')
        .eq('id', adminByEmail.store_id)
        .maybeSingle();

      if (storeByAdminEmailError) {
        throw new Error('Não foi possível localizar a loja do admin.');
      }

      return storeByAdminEmail ?? null;
    }
  }

  const { data: storeByOwner, error: storeByOwnerError } = await supabase
    .from('stores')
    .select('id, access_expires_at, auto_renew, access_granted_days, active, suspended, status')
    .eq('owner_user_id', authUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (storeByOwnerError) {
    throw new Error('Não foi possível localizar a loja vinculada ao admin.');
  }

  return storeByOwner ?? null;
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
  let access: StoreAccessInfo | null = null;

  if (profileRole === 'admin') {
    const store = await resolveAdminStore(authUserId, profileEmail);
    storeId = store?.id ? String(store.id) : null;
    access = getStoreAccessInfo(store);
  }

  return {
    id: authUserId,
    email: profileEmail,
    name: String(profile?.name ?? '').trim(),
    role: profileRole,
    storeId,
    access,
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