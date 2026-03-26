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
  AlertTriangle,
  X,
  RefreshCw,
  Search,
  Filter,
  Crown,
  Wallet,
  ShoppingCart,
  Users,
  BarChart3,
  Power,
  Trash2,
  KeyRound,
  ExternalLink,
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
  temporaryPassword?: string;
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
};

type AdminRow = {
  id: string;
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
  adminEmail: string;
  adminName: string;
  ordersCount: number;
  revenue: number;
  productsCount: number;
  monthlyPlanPrice: number;
};

type FeedbackState = {
  type: 'success' | 'error' | null;
  message: string;
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

export default function SuperAdmin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    loja: '',
    username: '',
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>(
    'all',
  );
  const [planFilter, setPlanFilter] = useState<'all' | 'iniciante' | 'pro' | 'premium'>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'name' | 'createdAt'>('orders');

  const [ordersForChart, setOrdersForChart] = useState<OrderRow[]>([]);

  const generatedSlug = useMemo(() => {
    return slugify(form.username || form.loja);
  }, [form.username, form.loja]);

  const updateField = (field: keyof typeof form, value: string) => {
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
      ] = await Promise.all([
        supabase
          .from('stores')
          .select('id, store_name, slug, status, plan, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('admins').select('id, store_id, email, created_at'),
        supabase.from('profiles').select('id, name, email, role, created_at'),
        supabase.from('orders').select('id, store_id, total, created_at'),
        supabase.from('products').select('id, store_id, created_at'),
        supabase.from('plans').select('id, name, price, max_products, max_orders'),
      ]);

      if (storesResponse.error) throw storesResponse.error;
      if (adminsResponse.error) throw adminsResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;
      if (ordersResponse.error) throw ordersResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (plansResponse.error) throw plansResponse.error;

      const storeRows = (storesResponse.data ?? []) as StoreRow[];
      const adminRows = (adminsResponse.data ?? []) as AdminRow[];
      const profileRows = (profilesResponse.data ?? []) as ProfileRow[];
      const orderRows = (ordersResponse.data ?? []) as OrderRow[];
      const productRows = (productsResponse.data ?? []) as ProductRow[];
      const planRows = (plansResponse.data ?? []) as PlanRow[];

      const nextPlansMap = Object.fromEntries(planRows.map((plan) => [plan.id, plan]));
      setPlansMap(nextPlansMap);

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

      const summaries: StoreSummary[] = storeRows.map((store) => {
        const storeAdmins = adminsByStore.get(store.id) ?? [];
        const mainAdmin = storeAdmins[0];
        const mainAdminEmail = normalizeText(mainAdmin?.email).toLowerCase();
        const profile = mainAdminEmail ? profileByEmail.get(mainAdminEmail) : undefined;
        const storeOrders = ordersByStore.get(store.id) ?? [];
        const storeProducts = productsByStore.get(store.id) ?? [];
        const plan = normalizePlan(store.plan);

        return {
          id: store.id,
          name: normalizeText(store.store_name) || 'Estrutura sem nome',
          slug: normalizeText(store.slug) || 'sem-slug',
          status: normalizeStatus(store.status),
          plan,
          createdAt: store.created_at,
          adminEmail: normalizeText(mainAdmin?.email) || '—',
          adminName: normalizeText(profile?.name) || '—',
          ordersCount: storeOrders.length,
          revenue: storeOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0),
          productsCount: storeProducts.length,
          monthlyPlanPrice: getPlanPrice(plan, nextPlansMap),
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

    setLoading(true);
    setFeedback({ type: null, message: '' });

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error('Não foi possível validar sua sessão. Faça login novamente.');
      }

      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-store`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adminName: name,
            adminEmail: email,
            adminPassword: password,
            storeName: loja,
            storeSlug: slug,
          }),
        },
      );

      const data = (await response.json().catch(() => null)) as CreateAdminStoreResponse | null;

      if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível criar o admin e a estrutura.');
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Falha ao criar o admin e a estrutura.');
      }

      setFeedback({
        type: 'success',
        message: 'Admin e estrutura criados com sucesso.',
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
    payload: Partial<Pick<StoreRow, 'status' | 'plan'>>,
    successMessage: string,
  ) => {
    setActionLoading(storeId);
    setFeedback({ type: null, message: '' });

    try {
      const { error } = await supabase.from('stores').update(payload).eq('id', storeId);

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

  const handleSendReset = async (email: string) => {
    if (!email || email === '—') {
      setFeedback({
        type: 'error',
        message: 'Este admin não possui email válido para redefinição.',
      });
      return;
    }

    setActionLoading(`reset-${email}`);
    setFeedback({ type: null, message: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });

      if (error) throw error;

      setFeedback({
        type: 'success',
        message: `Link de redefinição enviado para ${email}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível enviar o reset de senha.';

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
      `Tem certeza que deseja excluir a estrutura "${store.name}"?\n\nEssa ação remove loja, pedidos, produtos, categorias, cupons e vínculo do admin da estrutura.`,
    );

    if (!confirmed) return;

    setActionLoading(`delete-${store.id}`);
    setFeedback({ type: null, message: '' });

    try {
      const deleteOrders = await supabase.from('orders').delete().eq('store_id', store.id);
      if (deleteOrders.error) throw deleteOrders.error;

      const deleteProducts = await supabase.from('products').delete().eq('store_id', store.id);
      if (deleteProducts.error) throw deleteProducts.error;

      const deleteCategories = await supabase.from('categories').delete().eq('store_id', store.id);
      if (deleteCategories.error) throw deleteCategories.error;

      const deleteCoupons = await supabase.from('coupons').delete().eq('store_id', store.id);
      if (deleteCoupons.error) throw deleteCoupons.error;

      const clearAdmins = await supabase
        .from('admins')
        .update({ store_id: null })
        .eq('store_id', store.id);
      if (clearAdmins.error) throw clearAdmins.error;

      const deleteStore = await supabase.from('stores').delete().eq('id', store.id);
      if (deleteStore.error) throw deleteStore.error;

      setFeedback({
        type: 'success',
        message: `Estrutura "${store.name}" removida com sucesso.`,
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
  const totalProducts = stores.reduce((sum, store) => sum + store.productsCount, 0);
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
              Painel central de operação do AfiliadoPRO com métricas reais, gestão de
              estruturas, planos, admins, faturamento e ações rápidas.
            </p>
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

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
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

          <Card className="border border-emerald-500/10 bg-black/55 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-white">
                <Crown className="h-5 w-5 text-emerald-400" />
                Resumo operacional
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 p-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">Produtos cadastrados</p>
                <p className="mt-1 text-2xl font-black text-white">{totalProducts}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">Plano mais barato</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatMoney(Number(plansMap.iniciante?.price ?? 59.9))}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">Plano Pro</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatMoney(Number(plansMap.pro?.price ?? 99.9))}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-zinc-400">Plano Premium</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatMoney(Number(plansMap.premium?.price ?? 149.9))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border border-emerald-500/10 bg-black/55 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xl font-black text-white">Criar novo admin</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-200">Nome do cliente</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="Nome do cliente"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Nome da estrutura</Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="Nome da estrutura"
                    value={form.loja}
                    onChange={(e) => updateField('loja', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Email do admin</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="email"
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Senha inicial</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="password"
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="Senha inicial"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-zinc-200">Link da estrutura</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="minha-estrutura"
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  Link final:{' '}
                  <span className="font-medium text-emerald-300">
                    {generatedSlug || 'minha-estrutura'}
                  </span>
                </p>
              </div>
            </div>

            {feedback.type && (
              <div
                className={[
                  'rounded-2xl border px-4 py-3 text-sm',
                  feedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300',
                ].join(' ')}
              >
                {feedback.message}
              </div>
            )}

            <Button
              className="h-12 w-full rounded-2xl bg-emerald-500 font-bold text-black shadow-[0_10px_30px_rgba(34,197,94,0.28)] transition hover:bg-emerald-400 disabled:opacity-70"
              onClick={() => void handleCreate()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando admin + estrutura...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar admin + estrutura
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/10 bg-black/55 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <CardHeader className="border-b border-white/5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <CardTitle className="text-xl font-black text-white">
                Gestão completa das estruturas
              </CardTitle>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    className="h-11 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500"
                    placeholder="Buscar loja, admin ou slug"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <select
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'active' | 'suspended' | 'inactive')
                    }
                  >
                    <option value="all" className="bg-black text-white">
                      Todos status
                    </option>
                    <option value="active" className="bg-black text-white">
                      Ativas
                    </option>
                    <option value="suspended" className="bg-black text-white">
                      Suspensas
                    </option>
                    <option value="inactive" className="bg-black text-white">
                      Inativas
                    </option>
                  </select>
                </div>

                <select
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                  value={planFilter}
                  onChange={(e) =>
                    setPlanFilter(e.target.value as 'all' | 'iniciante' | 'pro' | 'premium')
                  }
                >
                  <option value="all" className="bg-black text-white">
                    Todos planos
                  </option>
                  <option value="iniciante" className="bg-black text-white">
                    Simples
                  </option>
                  <option value="pro" className="bg-black text-white">
                    Pro
                  </option>
                  <option value="premium" className="bg-black text-white">
                    Premium
                  </option>
                </select>

                <select
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'revenue' | 'orders' | 'name' | 'createdAt')
                  }
                >
                  <option value="orders" className="bg-black text-white">
                    Ordenar por pedidos
                  </option>
                  <option value="revenue" className="bg-black text-white">
                    Ordenar por faturamento
                  </option>
                  <option value="name" className="bg-black text-white">
                    Ordenar por nome
                  </option>
                  <option value="createdAt" className="bg-black text-white">
                    Ordenar por criação
                  </option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {dashboardLoading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando dados do Super Admin...
                </div>
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
                <p className="text-lg font-bold text-white">Nenhuma estrutura encontrada</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Ajuste os filtros ou crie uma nova estrutura acima.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredStores.map((store) => {
                  const isBusy =
                    actionLoading === store.id ||
                    actionLoading === `delete-${store.id}` ||
                    actionLoading === `reset-${store.adminEmail}`;

                  const publicUrl = `${window.location.origin.replace(/\/$/, '')}/loja/${store.slug}`;

                  return (
                    <div
                      key={store.id}
                      className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="grid flex-1 gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-black text-white">{store.name}</h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                store.status,
                              )}`}
                            >
                              {getStatusLabel(store.status)}
                            </span>

                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                              {getPlanLabel(store.plan)}
                            </span>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Admin
                              </p>
                              <p className="mt-2 text-sm font-semibold text-white">
                                {store.adminName}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">{store.adminEmail}</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Pedidos
                              </p>
                              <p className="mt-2 text-2xl font-black text-white">
                                {store.ordersCount}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">
                                Criada em {formatDate(store.createdAt)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Faturamento
                              </p>
                              <p className="mt-2 text-2xl font-black text-emerald-400">
                                {formatMoney(store.revenue)}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">
                                Ticket mensal do plano: {formatMoney(store.monthlyPlanPrice)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                                Produtos
                              </p>
                              <p className="mt-2 text-2xl font-black text-white">
                                {store.productsCount}
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">Slug: {store.slug}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 xl:w-[320px]">
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
                            <select
                              className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none"
                              value={store.plan}
                              disabled={isBusy}
                              onChange={(e) =>
                                void handleUpdateStoreField(
                                  store.id,
                                  { plan: e.target.value },
                                  `Plano da estrutura "${store.name}" atualizado.`,
                                )
                              }
                            >
                              <option value="iniciante" className="bg-black text-white">
                                Plano Simples
                              </option>
                              <option value="pro" className="bg-black text-white">
                                Plano Pro
                              </option>
                              <option value="premium" className="bg-black text-white">
                                Plano Premium
                              </option>
                            </select>

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
                          </div>

                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
                            <Button
                              variant="outline"
                              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                              onClick={() => void handleSendReset(store.adminEmail)}
                              disabled={isBusy}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Resetar senha
                            </Button>

                            <Button
                              variant="outline"
                              className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                              onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Ver estrutura
                            </Button>
                          </div>

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

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-emerald-500/20 bg-[#050505] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-black text-white">Deseja sair?</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Escolha para onde deseja ir após encerrar sua sessão.
                </p>
              </div>

              <button
                type="button"
                onClick={() => !logoutLoading && setShowLogoutModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <Button
                className="h-12 rounded-2xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
                onClick={() => void handleLogoutRedirect('/login')}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saindo...
                  </>
                ) : (
                  'Ir para Login'
                )}
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => void handleLogoutRedirect('/')}
                disabled={logoutLoading}
              >
                Ir para Tela Inicial
              </Button>

              <Button
                variant="ghost"
                className="h-12 rounded-2xl text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={() => setShowLogoutModal(false)}
                disabled={logoutLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}