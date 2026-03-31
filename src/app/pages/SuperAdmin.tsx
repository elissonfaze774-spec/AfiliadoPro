import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Store,
  LogOut,
  User,
  Mail,
  Lock,
  Link2,
  Loader2,
  ShieldCheck,
  X,
  RefreshCw,
  Search,
  Crown,
  Wallet,
  ShoppingCart,
  Users,
  BarChart3,
  Power,
  Trash2,
  ExternalLink,
  Settings2,
  CalendarClock,
  CalendarPlus2,
  Activity,
  Clock3,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Zap,
  TimerReset,
  ArrowUpRight,
  BadgeAlert,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { supabase } from '../../lib/supabase';

type CreateAdminStoreResponse = {
  success: boolean;
  message?: string;
  adminUserId?: string;
  storeId?: string;
  slug?: string;
};

type ManageAdminResponse = {
  success: boolean;
  message?: string;
  step?: string;
};

type PlanRow = {
  id: string;
  name: string | null;
  price: number | null;
  max_products: number | null;
  max_orders: number | null;
};

type StoreRow = {
  id: string;
  store_name: string | null;
  slug: string | null;
  status: string | null;
  plan: string | null;
  created_at: string | null;
  active: boolean | null;
  suspended: boolean | null;
  access_expires_at: string | null;
  auto_renew: boolean | null;
  access_granted_days: number | null;
};

type StoreAccessOverviewRow = {
  store_id: string | null;
  admin_last_sign_in_at?: string | null;
  user_last_sign_in_at?: string | null;
  last_access_at?: string | null;
  last_sign_in_at?: string | null;
};

type AdminRow = {
  id: string | null;
  user_id?: string | null;
  store_id: string | null;
  email: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

type OrderRow = {
  id: string;
  store_id: string | null;
  total: number | null;
  created_at: string | null;
};

type ProductRow = {
  id: string;
  store_id: string | null;
  created_at: string | null;
};

type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  createdAt: string | null;
  adminId: string;
  adminEmail: string;
  adminName: string;
  ordersCount: number;
  revenue: number;
  productsCount: number;
  monthlyPlanPrice: number;
  accessExpiresAt: string | null;
  autoRenew: boolean;
  accessGrantedDays: number;
  active: boolean;
  suspended: boolean;
  lastAccessAt: string | null;
};

type FeedbackState = {
  type: 'success' | 'error' | null;
  message: string;
};

type CredentialsModalState = {
  open: boolean;
  store: StoreSummary | null;
  email: string;
  password: string;
  daysToAdd: string;
  autoRenew: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  iniciante: 'Simples',
  pro: 'Pro',
  premium: 'Premium',
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Nunca acessou';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nunca acessou';
  return date.toLocaleString('pt-BR');
}

function getLastAccessLabel(value?: string | null) {
  if (!value) return 'Sem registro';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem registro';

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return 'Agora há pouco';
  if (diffHours < 24) return `Há ${diffHours} hora(s)`;
  if (diffDays < 30) return `Há ${diffDays} dia(s)`;
  return formatDateTime(value);
}

function normalizeText(value?: string | null) {
  return (value ?? '').trim();
}

function normalizeStatus(status?: string | null) {
  return normalizeText(status).toLowerCase() || 'active';
}

function normalizePlan(plan?: string | null) {
  const value = normalizeText(plan).toLowerCase();
  if (value === 'premium' || value === 'pro') return value;
  return 'iniciante';
}

function getStatusLabel(status: string) {
  if (status === 'suspended') return 'Suspensa';
  if (status === 'inactive') return 'Inativa';
  return 'Ativa';
}

function getStatusClasses(status: string) {
  if (status === 'suspended') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }

  if (status === 'inactive') {
    return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300';
  }

  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
}

function getPlanLabel(plan: string) {
  return PLAN_LABELS[plan] ?? 'Simples';
}

function getPlanPrice(plan: string, plansMap: Record<string, PlanRow>) {
  return Number(plansMap[plan]?.price ?? 0);
}

function getDayKey(dateLike: string | Date) {
  const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getAccessStatus(expiresAt?: string | null) {
  if (!expiresAt) return 'expired';

  const now = new Date();
  const exp = new Date(expiresAt);

  if (Number.isNaN(exp.getTime())) return 'expired';
  if (exp.getTime() < now.getTime()) return 'expired';

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
  const days = Math.ceil((expDay - today) / 86400000);

  if (expDay === today) return 'expires_today';
  if (days <= 7) return 'expiring_soon';
  return 'active';
}

function getAccessLabel(expiresAt?: string | null, autoRenew?: boolean) {
  const status = getAccessStatus(expiresAt);

  if (status === 'expired') {
    return autoRenew ? 'Expirado • Renovação automática ativa' : 'Expirado';
  }

  if (status === 'expires_today') {
    return autoRenew ? 'Vence hoje • Renovação automática ativa' : 'Vence hoje';
  }

  if (status === 'expiring_soon') {
    const now = new Date();
    const exp = new Date(expiresAt ?? '');
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
    const days = Math.max(Math.ceil((expDay - today) / 86400000), 0);
    return autoRenew
      ? `Vence em ${days} dia(s) • Renovação automática ativa`
      : `Vence em ${days} dia(s)`;
  }

  return autoRenew ? 'Acesso ativo • Renovação automática ativa' : 'Acesso ativo';
}

function getAccessClasses(expiresAt?: string | null) {
  const status = getAccessStatus(expiresAt);

  if (status === 'expired') {
    return 'border-red-500/30 bg-red-500/10 text-red-300';
  }

  if (status === 'expires_today') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }

  if (status === 'expiring_soon') {
    return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
  }

  return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
}

function getOperationPriority(expiresAt?: string | null, status?: string) {
  const accessStatus = getAccessStatus(expiresAt);

  if (status === 'suspended' || accessStatus === 'expired') {
    return {
      label: 'Crítico',
      classes: 'border-red-500/30 bg-red-500/10 text-red-300',
      order: 0,
    };
  }

  if (accessStatus === 'expires_today' || accessStatus === 'expiring_soon') {
    return {
      label: 'Atenção',
      classes: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      order: 1,
    };
  }

  return {
    label: 'Saudável',
    classes: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    order: 2,
  };
}

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as {
    message?: string;
    context?: {
      json?: () => Promise<unknown>;
      text?: () => Promise<string>;
    };
  };

  let serverMessage = '';

  try {
    if (maybeError?.context?.json) {
      const payload = (await maybeError.context.json()) as {
        message?: string;
        error?: string;
        step?: string;
      };
      serverMessage = payload?.message || payload?.error || payload?.step || '';
    } else if (maybeError?.context?.text) {
      serverMessage = await maybeError.context.text();
    }
  } catch {
    serverMessage = '';
  }

  return serverMessage || maybeError?.message || fallback;
}

export default function SuperAdmin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    loja: '',
    username: '',
    accessDays: '30',
    autoRenew: false,
  });

  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>({
    type: null,
    message: '',
  });

  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [plansMap, setPlansMap] = useState<Record<string, PlanRow>>({});
  const [ordersForChart, setOrdersForChart] = useState<OrderRow[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>(
    'all',
  );
  const [planFilter, setPlanFilter] = useState<'all' | 'iniciante' | 'pro' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'name' | 'createdAt'>('orders');

  const [credentialsModal, setCredentialsModal] = useState<CredentialsModalState>({
    open: false,
    store: null,
    email: '',
    password: '',
    daysToAdd: '30',
    autoRenew: false,
  });

  const generatedSlug = useMemo(() => {
    return slugify(form.username || form.loja);
  }, [form.username, form.loja]);

  const updateField = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (feedback.type) {
      setFeedback({ type: null, message: '' });
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      loja: '',
      username: '',
      accessDays: '30',
      autoRenew: false,
    });
  };

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);

    try {
      const [
        storesResponse,
        adminsResponse,
        profilesResponse,
        ordersResponse,
        productsResponse,
        plansResponse,
        accessOverviewResponse,
      ] = await Promise.all([
        supabase
          .from('stores')
          .select(
            'id, store_name, slug, status, plan, created_at, active, suspended, access_expires_at, auto_renew, access_granted_days',
          )
          .order('created_at', { ascending: false }),
        supabase.from('admins').select('id, user_id, store_id, email, created_at'),
        supabase.from('profiles').select('id, name, email, role, created_at'),
        supabase.from('orders').select('id, store_id, total, created_at'),
        supabase.from('products').select('id, store_id, created_at'),
        supabase.from('plans').select('id, name, price, max_products, max_orders'),
        supabase
          .from('store_access_overview')
          .select('store_id, admin_last_sign_in_at, user_last_sign_in_at, last_access_at, last_sign_in_at'),
      ]);

      if (storesResponse.error) throw storesResponse.error;
      if (adminsResponse.error) throw adminsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;
      if (ordersResponse.error) throw ordersResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (plansResponse.error) throw plansResponse.error;
      if (accessOverviewResponse.error) {
        console.warn('store_access_overview indisponível:', accessOverviewResponse.error.message);
      }

      const storeRows = (storesResponse.data ?? []) as StoreRow[];
      const adminRows = (adminsResponse.data ?? []) as AdminRow[];
      const profileRows = (profilesResponse.data ?? []) as ProfileRow[];
      const orderRows = (ordersResponse.data ?? []) as OrderRow[];
      const productRows = (productsResponse.data ?? []) as ProductRow[];
      const planRows = (plansResponse.data ?? []) as PlanRow[];
      const accessOverviewRows = ((accessOverviewResponse.data ?? []) as StoreAccessOverviewRow[]);

      const nextPlansMap = Object.fromEntries(planRows.map((plan) => [plan.id, plan]));
      setPlansMap(nextPlansMap);

      const profileById = new Map(profileRows.map((profile) => [profile.id, profile]));
      const profileByEmail = new Map(
        profileRows
          .filter((profile) => normalizeText(profile.email))
          .map((profile) => [normalizeText(profile.email).toLowerCase(), profile]),
      );

      const adminsByStore = new Map<string, AdminRow[]>();
      adminRows.forEach((admin) => {
        const key = admin.store_id ?? '';
        if (!key) return;
        const list = adminsByStore.get(key) ?? [];
        list.push(admin);
        adminsByStore.set(key, list);
      });

      const ordersByStore = new Map<string, OrderRow[]>();
      orderRows.forEach((order) => {
        const key = order.store_id ?? '';
        if (!key) return;
        const list = ordersByStore.get(key) ?? [];
        list.push(order);
        ordersByStore.set(key, list);
      });

      const productsByStore = new Map<string, ProductRow[]>();
      productRows.forEach((product) => {
        const key = product.store_id ?? '';
        if (!key) return;
        const list = productsByStore.get(key) ?? [];
        list.push(product);
        productsByStore.set(key, list);
      });

      const accessOverviewByStore = new Map<string, StoreAccessOverviewRow>();
      accessOverviewRows.forEach((row) => {
        const key = normalizeText(row.store_id);
        if (!key) return;
        accessOverviewByStore.set(key, row);
      });

      const summaries: StoreSummary[] = storeRows.map((store) => {
        const storeAdmins = adminsByStore.get(store.id) ?? [];
        const mainAdmin = storeAdmins[0];
        const linkedUserId = normalizeText(mainAdmin?.user_id) || normalizeText(mainAdmin?.id);
        const mainAdminEmail = normalizeText(mainAdmin?.email).toLowerCase();
        const profile =
          (linkedUserId ? profileById.get(linkedUserId) : undefined) ||
          (mainAdminEmail ? profileByEmail.get(mainAdminEmail) : undefined);

        const storeOrders = ordersByStore.get(store.id) ?? [];
        const storeProducts = productsByStore.get(store.id) ?? [];
        const plan = normalizePlan(store.plan);
        const accessOverview = accessOverviewByStore.get(store.id);
        const lastAccessAt =
          accessOverview?.admin_last_sign_in_at ??
          accessOverview?.last_access_at ??
          accessOverview?.last_sign_in_at ??
          accessOverview?.user_last_sign_in_at ??
          null;

        return {
          id: store.id,
          name: normalizeText(store.store_name) || 'Estrutura sem nome',
          slug: normalizeText(store.slug) || 'sem-slug',
          status: normalizeStatus(store.status),
          plan,
          createdAt: store.created_at,
          adminId: linkedUserId,
          adminEmail: normalizeText(mainAdmin?.email) || normalizeText(profile?.email) || '—',
          adminName: normalizeText(profile?.name) || '—',
          ordersCount: storeOrders.length,
          revenue: storeOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
          productsCount: storeProducts.length,
          monthlyPlanPrice: getPlanPrice(plan, nextPlansMap),
          accessExpiresAt: store.access_expires_at ?? null,
          autoRenew: Boolean(store.auto_renew),
          accessGrantedDays: Number(store.access_granted_days ?? 0),
          active: Boolean(store.active),
          suspended: Boolean(store.suspended),
          lastAccessAt,
        };
      });

      setStores(summaries);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o painel do Super Admin.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadOrdersForChart = useCallback(async () => {
    try {
      const since = new Date();
      since.setDate(since.getDate() - 6);

      const { data, error } = await supabase
        .from('orders')
        .select('id, store_id, total, created_at')
        .gte('created_at', since.toISOString());

      if (error) throw error;

      setOrdersForChart((data ?? []) as OrderRow[]);
    } catch {
      setOrdersForChart([]);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void loadOrdersForChart();
  }, [loadOrdersForChart]);

  const handleCreate = async () => {
    if (loading) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const loja = form.loja.trim();
    const slug = generatedSlug;
    const accessDays = Number(form.accessDays || 0);

    if (!name || !email || !password || !loja || !slug) {
      setFeedback({
        type: 'error',
        message: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        type: 'error',
        message: 'A senha precisa ter pelo menos 6 caracteres.',
      });
      return;
    }

    if (!Number.isFinite(accessDays) || accessDays <= 0) {
      setFeedback({
        type: 'error',
        message: 'Informe uma quantidade válida de dias de acesso.',
      });
      return;
    }

    setLoading(true);
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await supabase.functions.invoke('create-admin-store', {
        body: {
          adminName: name,
          adminEmail: email,
          adminPassword: password,
          storeName: loja,
          storeSlug: slug,
          planName: 'iniciante',
          accessDays,
          autoRenew: form.autoRenew,
        },
      });

      if (error) {
        throw new Error(
          await getFunctionErrorMessage(
            error,
            'Não foi possível criar o admin e a estrutura.',
          ),
        );
      }

      const result = data as CreateAdminStoreResponse | null;

      if (!result?.success) {
        throw new Error(result?.message || 'Falha ao criar o admin e a estrutura.');
      }

      setFeedback({
        type: 'success',
        message: result.message || 'Admin e estrutura criados com sucesso.',
      });

      resetForm();
      await loadDashboard();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro inesperado ao criar admin e estrutura.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutRedirect = async (path: '/' | '/login') => {
    if (logoutLoading) return;

    setLogoutLoading(true);

    try {
      await supabase.auth.signOut();
      navigate(path, { replace: true });
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  const handleUpdateStoreField = async (
    storeId: string,
    payload: Partial<Pick<StoreRow, 'status'>>,
    successMessage: string,
  ) => {
    setActionLoading(storeId);
    setFeedback({ type: null, message: '' });

    try {
      const nextStatus = payload.status ?? 'active';
      const nextSuspended = nextStatus === 'suspended';
      const nextActive = nextStatus !== 'inactive';

      const { error } = await supabase
        .from('stores')
        .update({
          status: nextStatus,
          suspended: nextSuspended,
          active: nextActive,
        })
        .eq('id', storeId);

      if (error) throw error;

      setFeedback({
        type: 'success',
        message: successMessage,
      });

      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar a estrutura.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openCredentialsModal = (store: StoreSummary) => {
    setCredentialsModal({
      open: true,
      store,
      email: store.adminEmail === '—' ? '' : store.adminEmail,
      password: '',
      daysToAdd: '30',
      autoRenew: store.autoRenew,
    });
    setFeedback({ type: null, message: '' });
  };

  const closeCredentialsModal = () => {
    if (actionLoading?.startsWith('modal-')) return;

    setCredentialsModal({
      open: false,
      store: null,
      email: '',
      password: '',
      daysToAdd: '30',
      autoRenew: false,
    });
  };

  const handleSaveCredentials = async () => {
    const store = credentialsModal.store;
    if (!store) return;

    const email = credentialsModal.email.trim().toLowerCase();
    const password = credentialsModal.password.trim();

    if (!email && !password) {
      setFeedback({
        type: 'error',
        message: 'Informe ao menos o novo email ou a nova senha.',
      });
      return;
    }

    if (password && password.length < 6) {
      setFeedback({
        type: 'error',
        message: 'A nova senha precisa ter pelo menos 6 caracteres.',
      });
      return;
    }

    setActionLoading('modal-save-credentials');
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await supabase.functions.invoke('manage-admin-store', {
        body: {
          action: 'update_admin_credentials',
          storeId: store.id,
          adminEmail: email,
          adminPassword: password,
        },
      });

      if (error) {
        throw new Error(
          await getFunctionErrorMessage(
            error,
            'Não foi possível atualizar as credenciais do admin.',
          ),
        );
      }

      const result = data as ManageAdminResponse | null;

      if (!result?.success) {
        throw new Error(result?.message || 'Não foi possível atualizar as credenciais do admin.');
      }

      setFeedback({
        type: 'success',
        message: result.message || 'Credenciais do admin atualizadas com sucesso.',
      });

      await loadDashboard();
      closeCredentialsModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar as credenciais do admin.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddAccessDays = async () => {
    const store = credentialsModal.store;
    if (!store) return;

    const daysToAdd = Number(credentialsModal.daysToAdd || 0);

    if (!Number.isFinite(daysToAdd) || daysToAdd <= 0) {
      setFeedback({
        type: 'error',
        message: 'Informe uma quantidade válida de dias.',
      });
      return;
    }

    setActionLoading('modal-add-days');
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await supabase.functions.invoke('manage-admin-store', {
        body: {
          action: 'add_access_days',
          storeId: store.id,
          daysToAdd,
        },
      });

      if (error) {
        throw new Error(
          await getFunctionErrorMessage(error, 'Não foi possível adicionar dias de acesso.'),
        );
      }

      const result = data as ManageAdminResponse | null;

      if (!result?.success) {
        throw new Error(result?.message || 'Não foi possível adicionar dias de acesso.');
      }

      setFeedback({
        type: 'success',
        message: result.message || 'Dias de acesso adicionados com sucesso.',
      });

      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível adicionar dias de acesso.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAutoRenew = async () => {
    const store = credentialsModal.store;
    if (!store) return;

    setActionLoading('modal-auto-renew');
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await supabase.functions.invoke('manage-admin-store', {
        body: {
          action: 'set_auto_renew',
          storeId: store.id,
          autoRenew: credentialsModal.autoRenew,
        },
      });

      if (error) {
        throw new Error(
          await getFunctionErrorMessage(error, 'Não foi possível atualizar a renovação automática.'),
        );
      }

      const result = data as ManageAdminResponse | null;

      if (!result?.success) {
        throw new Error(result?.message || 'Não foi possível atualizar a renovação automática.');
      }

      setFeedback({
        type: 'success',
        message: result.message || 'Renovação automática atualizada com sucesso.',
      });

      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar a renovação automática.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStructure = async (store: StoreSummary) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a estrutura "${store.name}"?\n\nEssa ação remove loja, pedidos, produtos e também o login do admin vinculado.`,
    );

    if (!confirmed) return;

    setActionLoading(`delete-${store.id}`);
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await supabase.functions.invoke('manage-admin-store', {
        body: {
          action: 'delete_structure',
          storeId: store.id,
        },
      });

      if (error) {
        throw new Error(
          await getFunctionErrorMessage(error, 'Não foi possível excluir a estrutura.'),
        );
      }

      const result = data as ManageAdminResponse | null;

      if (!result?.success) {
        throw new Error(result?.message || 'Não foi possível excluir a estrutura.');
      }

      setFeedback({
        type: 'success',
        message: result.message || `Estrutura "${store.name}" removida com sucesso.`,
      });

      await loadDashboard();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível excluir a estrutura.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStores = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const next = stores.filter((store) => {
      const matchesSearch =
        !normalizedSearch ||
        store.name.toLowerCase().includes(normalizedSearch) ||
        store.slug.toLowerCase().includes(normalizedSearch) ||
        store.adminEmail.toLowerCase().includes(normalizedSearch) ||
        store.adminName.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
      const matchesPlan = planFilter === 'all' || store.plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });

    next.sort((a, b) => {
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      if (sortBy === 'orders') return b.ordersCount - a.ordersCount;
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return next;
  }, [stores, search, statusFilter, planFilter, sortBy]);

  const totalStores = stores.length;
  const totalAdmins = stores.filter((store) => store.adminEmail !== '—').length;
  const totalOrders = stores.reduce((sum, store) => sum + store.ordersCount, 0);
  const totalRevenue = stores.reduce((sum, store) => sum + store.revenue, 0);
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const recurringRevenue = stores.reduce((sum, store) => sum + store.monthlyPlanPrice, 0);
  const activeStores = stores.filter((store) => store.status === 'active').length;
  const suspendedStores = stores.filter((store) => store.status === 'suspended').length;

  const sevenDayMetrics = useMemo(() => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();

    const base = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        key: getDayKey(date),
        label: labels[date.getDay()],
        revenue: 0,
        orders: 0,
      };
    });

    const keyed = new Map(base.map((item) => [item.key, item]));

    ordersForChart.forEach((order) => {
      if (!order.created_at) return;
      const key = getDayKey(order.created_at);
      const bucket = keyed.get(key);
      if (!bucket) return;

      bucket.revenue += Number(order.total ?? 0);
      bucket.orders += 1;
    });

    return Array.from(keyed.values());
  }, [ordersForChart]);

  const maxRevenue = Math.max(...sevenDayMetrics.map((item) => item.revenue), 1);

  const priorityStores = useMemo(() => {
    return [...stores]
      .sort((a, b) => {
        const pa = getOperationPriority(a.accessExpiresAt, a.status);
        const pb = getOperationPriority(b.accessExpiresAt, b.status);
        if (pa.order !== pb.order) return pa.order - pb.order;
        return new Date(a.accessExpiresAt ?? 0).getTime() - new Date(b.accessExpiresAt ?? 0).getTime();
      })
      .slice(0, 5);
  }, [stores]);

  const recentStores = useMemo(() => {
    return [...stores]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 5);
  }, [stores]);

  const topRevenueStores = useMemo(() => {
    return [...stores]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [stores]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020202_0%,_#050505_45%,_#07110a_100%)] p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Controle administrativo
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Super Admin
            </h1>

            <p className="mt-3 text-sm leading-7 text-zinc-400 md:text-base">
              Painel central de operação do AfiliadoPRO com métricas, gestão de admins,
              controle de acesso e ações rápidas.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Operação premium
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                <TimerReset className="h-3.5 w-3.5" />
                Gestão de acesso
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                <BadgeAlert className="h-3.5 w-3.5" />
                Prioridades visíveis
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-emerald-500/20 bg-black/40 text-white hover:bg-emerald-500/10"
              onClick={() => void loadDashboard()}
              disabled={dashboardLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button
              variant="outline"
              className="border-emerald-500/20 bg-black/40 text-white hover:bg-emerald-500/10"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {feedback.type ? (
          <div
            className={`mb-6 rounded-3xl border px-5 py-4 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                : 'border-red-500/20 bg-red-500/10 text-red-200'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Store className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Total de estruturas</p>
              <h3 className="mt-1 text-3xl font-black text-white">{totalStores}</h3>
              <p className="mt-2 text-xs text-zinc-500">
                {activeStores} ativas • {suspendedStores} suspensas
              </p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Admins vinculados</p>
              <h3 className="mt-1 text-3xl font-black text-white">{totalAdmins}</h3>
              <p className="mt-2 text-xs text-zinc-500">Gestão centralizada do acesso</p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Pedidos totais</p>
              <h3 className="mt-1 text-3xl font-black text-white">{totalOrders}</h3>
              <p className="mt-2 text-xs text-zinc-500">
                Ticket médio: {formatMoney(averageTicket)}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Faturamento total</p>
              <h3 className="mt-1 text-3xl font-black text-emerald-400">
                {formatMoney(totalRevenue)}
              </h3>
              <p className="mt-2 text-xs text-zinc-500">
                MRR estimado: {formatMoney(recurringRevenue)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Lojas com acesso ativo</p>
              <h3 className="mt-1 text-3xl font-black text-white">{stores.filter((store) => getAccessStatus(store.accessExpiresAt) === 'active').length}</h3>
              <p className="mt-2 text-xs text-zinc-500">Operação saudável no momento</p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Vencendo em breve</p>
              <h3 className="mt-1 text-3xl font-black text-white">{stores.filter((store) => ['expires_today', 'expiring_soon'].includes(getAccessStatus(store.accessExpiresAt))).length}</h3>
              <p className="mt-2 text-xs text-zinc-500">Bom ponto para ação preventiva</p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Produtos cadastrados</p>
              <h3 className="mt-1 text-3xl font-black text-white">{stores.reduce((sum, store) => sum + store.productsCount, 0)}</h3>
              <p className="mt-2 text-xs text-zinc-500">Volume total da operação</p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm text-zinc-400">Renovação automática</p>
              <h3 className="mt-1 text-3xl font-black text-white">{stores.filter((store) => store.autoRenew).length}</h3>
              <p className="mt-2 text-xs text-zinc-500">Estruturas protegidas por renovação</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-white">
                <ShieldAlert className="h-5 w-5 text-emerald-400" />
                Radar operacional
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5">
              <div className="space-y-3">
                {priorityStores.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
                    Nenhuma estrutura para monitorar agora.
                  </div>
                ) : (
                  priorityStores.map((store) => {
                    const priority = getOperationPriority(store.accessExpiresAt, store.status);

                    return (
                      <div
                        key={store.id}
                        className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black text-white">{store.name}</p>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${priority.classes}`}>
                              {priority.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">{store.adminEmail}</p>
                          <p className="mt-2 text-xs text-zinc-500">
                            {getAccessLabel(store.accessExpiresAt, store.autoRenew)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="h-10 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => openCredentialsModal(store)}
                          >
                            <Settings2 className="mr-2 h-4 w-4" />
                            Gerenciar
                          </Button>

                          <Button
                            variant="outline"
                            className="h-10 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() =>
                              void handleUpdateStoreField(
                                store.id,
                                {
                                  status: store.status === 'suspended' ? 'active' : 'suspended',
                                },
                                store.status === 'suspended'
                                  ? `Estrutura "${store.name}" ativada.`
                                  : `Estrutura "${store.name}" suspensa.`,
                              )
                            }
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {store.status === 'suspended' ? 'Ativar' : 'Suspender'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Top faturamento
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5">
              <div className="space-y-3">
                {topRevenueStores.map((store, index) => (
                  <div
                    key={store.id}
                    className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-sm font-black text-emerald-300">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{store.name}</p>
                          <p className="truncate text-xs text-zinc-500">{store.adminEmail}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pl-3 text-right">
                      <p className="font-black text-emerald-400">{formatMoney(store.revenue)}</p>
                      <p className="text-xs text-zinc-500">{store.ordersCount} pedidos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-emerald-400" />
                Novas estruturas
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5">
              <div className="space-y-3">
                {recentStores.map((store) => (
                  <div
                    key={store.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{store.name}</p>
                        <p className="truncate text-xs text-zinc-500">{store.slug}</p>
                      </div>
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        {getPlanLabel(store.plan)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                      <span>Criada em {formatDate(store.createdAt)}</span>
                      <span>{store.adminEmail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-white">
                <Plus className="h-5 w-5 text-emerald-400" />
                Criar admin + estrutura premium
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="text-zinc-300">Nome do admin</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Senha</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Nome da estrutura</Label>
                <Input
                  value={form.loja}
                  onChange={(e) => updateField('loja', e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="Nome da estrutura"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Link da estrutura</Label>
                <Input
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder={generatedSlug || 'slug-da-loja'}
                />
              </div>

              <div>
                <Label className="text-zinc-300">Dias de acesso</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.accessDays}
                  onChange={(e) => updateField('accessDays', e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="30"
                />
              </div>

              <div className="flex items-end">
                <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={form.autoRenew}
                    onChange={(e) => updateField('autoRenew', e.target.checked)}
                  />
                  Renovação automática
                </label>
              </div>

              <div className="md:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
                  <Link2 className="h-4 w-4" />
                  Slug gerado: <span className="font-semibold text-zinc-300">{generatedSlug || '—'}</span>
                </div>

                <Button
                  onClick={() => void handleCreate()}
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-emerald-500 text-base font-bold text-black hover:bg-emerald-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar admin e estrutura
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Últimos 7 dias
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-7 gap-3">
                {sevenDayMetrics.map((item) => {
                  const percent = Math.max(
                    (item.revenue / maxRevenue) * 100,
                    item.revenue > 0 ? 8 : 2,
                  );

                  return (
                    <div key={item.key} className="flex flex-col items-center gap-3">
                      <div className="flex h-52 w-full items-end">
                        <div className="relative h-full w-full rounded-2xl bg-white/5 p-2">
                          <div
                            className="absolute bottom-2 left-2 right-2 rounded-xl bg-emerald-500 shadow-[0_10px_20px_rgba(34,197,94,0.18)] transition-all"
                            style={{ height: `${percent}%` }}
                            title={`${item.label}: ${formatMoney(item.revenue)} / ${item.orders} pedidos`}
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs font-semibold text-white">{item.label}</p>
                        <p className="text-[11px] text-zinc-500">{item.orders} pedidos</p>
                        <p className="text-[11px] text-emerald-300">
                          {formatMoney(item.revenue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
          <CardHeader className="border-b border-white/5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Crown className="h-5 w-5 text-emerald-400" />
                Estruturas criadas
              </CardTitle>

              <div className="grid gap-3 md:grid-cols-4 xl:w-[860px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-white/5 pl-10 text-white"
                    placeholder="Buscar..."
                  />
                </div>

                <select
                  className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | 'active' | 'suspended' | 'inactive')
                  }
                >
                  <option value="all" className="bg-black text-white">Todos status</option>
                  <option value="active" className="bg-black text-white">Ativas</option>
                  <option value="suspended" className="bg-black text-white">Suspensas</option>
                  <option value="inactive" className="bg-black text-white">Inativas</option>
                </select>

                <select
                  className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                  value={planFilter}
                  onChange={(e) =>
                    setPlanFilter(e.target.value as 'all' | 'iniciante' | 'pro' | 'premium')
                  }
                >
                  <option value="all" className="bg-black text-white">Todos planos</option>
                  <option value="iniciante" className="bg-black text-white">Simples</option>
                  <option value="pro" className="bg-black text-white">Pro</option>
                  <option value="premium" className="bg-black text-white">Premium</option>
                </select>

                <select
                  className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'revenue' | 'orders' | 'name' | 'createdAt')
                  }
                >
                  <option value="orders" className="bg-black text-white">Ordenar por pedidos</option>
                  <option value="revenue" className="bg-black text-white">Ordenar por faturamento</option>
                  <option value="name" className="bg-black text-white">Ordenar por nome</option>
                  <option value="createdAt" className="bg-black text-white">Ordenar por criação</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-16 text-zinc-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando...
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="py-16 text-center text-zinc-400">
                Nenhuma estrutura encontrada.
              </div>
            ) : (
              <div className="space-y-5">
                {filteredStores.map((store) => {
                  const isBusy =
                    actionLoading === store.id ||
                    actionLoading === `delete-${store.id}`;

                  const publicUrl = `${window.location.origin}/loja/${store.slug}`;

                  return (
                    <div
                      key={store.id}
                      className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex-1">
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-black text-white">{store.name}</h3>

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(store.status)}`}
                            >
                              {getStatusLabel(store.status)}
                            </span>

                            <span className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                              Plano {getPlanLabel(store.plan)}
                            </span>

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getAccessClasses(store.accessExpiresAt)}`}
                            >
                              {getAccessLabel(store.accessExpiresAt, store.autoRenew)}
                            </span>

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getOperationPriority(store.accessExpiresAt, store.status).classes}`}
                            >
                              Operação {getOperationPriority(store.accessExpiresAt, store.status).label}
                            </span>
                          </div>

                          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                Admin
                              </p>
                              <p className="mt-3 text-lg font-black text-white">{store.adminName}</p>
                              <p className="mt-1 text-sm text-zinc-400">{store.adminEmail}</p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                Pedidos
                              </p>
                              <p className="mt-3 text-3xl font-black text-white">{store.ordersCount}</p>
                              <p className="mt-1 text-sm text-zinc-400">
                                Criada em {formatDate(store.createdAt)}
                              </p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                Faturamento
                              </p>
                              <p className="mt-3 text-3xl font-black text-emerald-400">
                                {formatMoney(store.revenue)}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                Ticket mensal do plano: {formatMoney(store.monthlyPlanPrice)}
                              </p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                Acesso
                              </p>
                              <p className="mt-3 text-lg font-black text-white">
                                {formatDate(store.accessExpiresAt)}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                {store.autoRenew ? 'Renovação automática ativa' : 'Renovação manual'}
                              </p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                                Último acesso
                              </p>
                              <p className="mt-3 text-lg font-black text-white">
                                {getLastAccessLabel(store.lastAccessAt)}
                              </p>
                              <p className="mt-1 text-sm text-zinc-400">
                                {formatDateTime(store.lastAccessAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid w-full gap-3 xl:w-[320px]">
                          <Button
                            variant="outline"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() =>
                              void handleUpdateStoreField(
                                store.id,
                                {
                                  status: store.status === 'suspended' ? 'active' : 'suspended',
                                },
                                store.status === 'suspended'
                                  ? `Estrutura "${store.name}" ativada.`
                                  : `Estrutura "${store.name}" suspensa.`,
                              )
                            }
                            disabled={isBusy}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {store.status === 'suspended' ? 'Ativar' : 'Suspender'}
                          </Button>

                          <Button
                            variant="outline"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => openCredentialsModal(store)}
                            disabled={isBusy}
                          >
                            <Settings2 className="mr-2 h-4 w-4" />
                            Gerenciar admin
                          </Button>

                          <Button
                            variant="outline"
                            className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                            onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver estrutura
                          </Button>

                          <Button
                            variant="outline"
                            className="h-11 rounded-2xl border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            onClick={() => void handleDeleteStructure(store)}
                            disabled={isBusy}
                          >
                            {actionLoading === `delete-${store.id}` ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Excluindo...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir estrutura
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {credentialsModal.open && credentialsModal.store && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-emerald-500/20 bg-[#050505] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white">Gerenciar admin</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {credentialsModal.store.name}
                </p>
              </div>

              <Button
                variant="ghost"
                className="rounded-2xl text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={closeCredentialsModal}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Status</p>
                <p className={`mt-2 text-sm font-semibold ${getAccessClasses(credentialsModal.store.accessExpiresAt).split(' ').pop()}`}>
                  {getAccessLabel(credentialsModal.store.accessExpiresAt, credentialsModal.store.autoRenew)}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Vencimento</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {formatDate(credentialsModal.store.accessExpiresAt)}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Último acesso</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {getLastAccessLabel(credentialsModal.store.lastAccessAt)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatDateTime(credentialsModal.store.lastAccessAt)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-zinc-300">Novo email</Label>
                <Input
                  value={credentialsModal.email}
                  onChange={(e) =>
                    setCredentialsModal((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="novoemail@exemplo.com"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Nova senha</Label>
                <Input
                  type="password"
                  value={credentialsModal.password}
                  onChange={(e) =>
                    setCredentialsModal((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Adicionar dias</Label>
                <Input
                  type="number"
                  min="1"
                  value={credentialsModal.daysToAdd}
                  onChange={(e) =>
                    setCredentialsModal((prev) => ({ ...prev, daysToAdd: e.target.value }))
                  }
                  className="mt-2 h-12 rounded-2xl border-white/10 bg-white/5 text-white"
                  placeholder="30"
                />
              </div>

              <div className="flex items-end">
                <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={credentialsModal.autoRenew}
                    onChange={(e) =>
                      setCredentialsModal((prev) => ({ ...prev, autoRenew: e.target.checked }))
                    }
                  />
                  Renovação automática
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Button
                onClick={() => void handleSaveCredentials()}
                disabled={actionLoading === 'modal-save-credentials'}
                className="h-12 rounded-2xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
              >
                {actionLoading === 'modal-save-credentials' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Salvar credenciais
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => void handleAddAccessDays()}
                disabled={actionLoading === 'modal-add-days'}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                {actionLoading === 'modal-add-days' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <CalendarPlus2 className="mr-2 h-4 w-4" />
                    Adicionar dias
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => void handleToggleAutoRenew()}
                disabled={actionLoading === 'modal-auto-renew'}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                {actionLoading === 'modal-auto-renew' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Salvar renovação
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#050505] p-6 text-white">
            <h3 className="text-2xl font-black">Deseja sair?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Escolha para onde deseja ir após sair.
            </p>

            <div className="mt-6 grid gap-3">
              <Button
                onClick={() => void handleLogoutRedirect('/login')}
                disabled={logoutLoading}
                className="h-12 rounded-2xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
              >
                {logoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair para login
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => void handleLogoutRedirect('/')}
                disabled={logoutLoading}
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Sair para página inicial
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowLogoutModal(false)}
                disabled={logoutLoading}
                className="h-12 rounded-2xl text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}