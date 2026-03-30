import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MousePointerClick,
  FileText,
  DollarSign,
  FolderKanban,
  Sparkles,
  ExternalLink,
  CheckCircle,
  LogOut,
  Crown,
  RefreshCw,
  Store as StoreIcon,
  Settings,
  Copy,
  GraduationCap,
  ShieldCheck,
  CalendarClock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthTemp';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

type StoreData = {
  id: string;
  name: string;
  slug: string;
  niche: string | null;
  whatsapp: string;
  logoUrl: string;
  bannerUrl: string;
  active: boolean;
  suspended: boolean;
  accessExpiresAt: string | null;
  autoRenew: boolean;
  accessGrantedDays: number;
};

type AuthUserLike = {
  id?: string;
  email?: string | null;
  role?: string | null;
  storeId?: string | null;
  access?: {
    status?: 'active' | 'expires_today' | 'expiring_soon' | 'expired';
    label?: string;
    expiresAt?: string | null;
    autoRenew?: boolean;
    daysLeft?: number;
    isExpired?: boolean;
  } | null;
};

function normalizeStore(raw: any): StoreData | null {
  if (!raw) return null;

  const id = raw.id ?? '';
  const name = raw.store_name ?? raw.name ?? '';
  const slug = raw.slug ?? '';
  const niche = raw.niche ?? null;
  const whatsapp = raw.whatsapp_number ?? raw.whatsapp ?? '';
  const logoUrl = raw.logo_url ?? '';
  const bannerUrl = raw.banner_url ?? '';
  const active = Boolean(raw.active);
  const suspended = Boolean(raw.suspended);
  const accessExpiresAt = raw.access_expires_at ?? null;
  const autoRenew = Boolean(raw.auto_renew);
  const accessGrantedDays = Number(raw.access_granted_days ?? 0);

  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    niche,
    whatsapp,
    logoUrl,
    bannerUrl,
    active,
    suspended,
    accessExpiresAt,
    autoRenew,
    accessGrantedDays,
  };
}

function getInitials(name: string) {
  return String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('pt-BR');
}

function getBadgeClasses(status?: string | null) {
  if (status === 'expired') {
    return 'border-red-500/20 bg-red-500/10 text-red-300';
  }

  if (status === 'expires_today') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }

  if (status === 'expiring_soon') {
    return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300';
  }

  return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
}

export default function Painel() {
  const navigate = useNavigate();
  const { user, authLoading, logout } = useAuth();
  const { products, clicks, contents, refreshAppData } = useApp();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastStoreIdRef = useRef<string | null>(null);

  const publicStoreUrl = useMemo(() => {
    if (!store?.slug) return '';
    return `${window.location.origin}/loja/${store.slug}`;
  }, [store?.slug]);

  const estimatedEarnings = useMemo(() => {
    return products.length * 50 + clicks * 2.5;
  }, [products.length, clicks]);

  const stats = useMemo(
    () => [
      {
        icon: Package,
        title: 'Produtos ativos',
        value: products.length,
        helper: products.length === 1 ? '1 produto na loja' : `${products.length} produtos na loja`,
        color: 'from-emerald-500 to-green-500',
      },
      {
        icon: MousePointerClick,
        title: 'Cliques',
        value: clicks,
        helper: 'Interesse gerado pelos seus links',
        color: 'from-cyan-500 to-emerald-500',
      },
      {
        icon: FileText,
        title: 'Conteúdos',
        value: contents.length,
        helper: 'Textos gerados para vender mais',
        color: 'from-lime-500 to-emerald-500',
      },
      {
        icon: DollarSign,
        title: 'Potencial hoje',
        value: estimatedEarnings.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        helper: 'Estimativa visual do painel',
        color: 'from-yellow-400 to-emerald-500',
      },
    ],
    [products.length, clicks, contents.length, estimatedEarnings],
  );

  const checklist = useMemo(
    () => [
      { text: 'Adicionar pelo menos 3 produtos', done: products.length >= 3 },
      {
        text: 'Configurar nome, banner e logo da loja',
        done: Boolean(store?.name && store?.bannerUrl && store?.logoUrl),
      },
      {
        text: 'Ter pelo menos 1 link de afiliado configurado',
        done: products.some((product) => Boolean(product.affiliateLink)),
      },
      { text: 'Gerar seu primeiro conteúdo automático', done: contents.length > 0 },
    ],
    [products, contents.length, store],
  );

  const academyItems = [
    {
      title: 'Aula 1 — O que vender primeiro',
      description: 'Comece por produtos visuais, simples e com preço fácil de entender.',
    },
    {
      title: 'Aula 2 — Como gerar confiança',
      description: 'Use banner bonito, nome forte, imagens limpas e descrição objetiva.',
    },
    {
      title: 'Aula 3 — Como ter mais cliques',
      description: 'Poste seus produtos em grupos, status, reels e conversas privadas.',
    },
  ];

  const resolveStoreForAdmin = useCallback(async (authUser: AuthUserLike): Promise<StoreData | null> => {
    const authUserId = authUser?.id ?? null;
    const authEmail = authUser?.email?.trim().toLowerCase() ?? null;
    const directStoreId = authUser?.storeId ?? null;

    if (directStoreId) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', directStoreId)
        .maybeSingle();

      if (!error) {
        const normalized = normalizeStore(data);
        if (normalized) return normalized;
      }
    }

    if (authEmail) {
      const { data: adminByEmail, error: adminEmailError } = await supabase
        .from('admins')
        .select('store_id')
        .eq('email', authEmail)
        .maybeSingle();

      if (!adminEmailError && adminByEmail?.store_id) {
        const { data: storeByAdminEmail, error: storeByAdminEmailError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', adminByEmail.store_id)
          .maybeSingle();

        if (!storeByAdminEmailError) {
          const normalized = normalizeStore(storeByAdminEmail);
          if (normalized) return normalized;
        }
      }
    }

    if (authUserId) {
      const { data: storeByOwner, error: storeByOwnerError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_user_id', authUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!storeByOwnerError) {
        const normalized = normalizeStore(storeByOwner);
        if (normalized) return normalized;
      }
    }

    if (authUserId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', authUserId)
        .maybeSingle();

      if (!profileError && profile?.email) {
        const profileEmail = String(profile.email).trim().toLowerCase();

        const { data: adminByProfileEmail, error: adminByProfileEmailError } = await supabase
          .from('admins')
          .select('store_id')
          .eq('email', profileEmail)
          .maybeSingle();

        if (!adminByProfileEmailError && adminByProfileEmail?.store_id) {
          const { data: storeByProfileEmail, error: storeByProfileEmailError } = await supabase
            .from('stores')
            .select('*')
            .eq('id', adminByProfileEmail.store_id)
            .maybeSingle();

          if (!storeByProfileEmailError) {
            const normalized = normalizeStore(storeByProfileEmail);
            if (normalized) return normalized;
          }
        }
      }
    }

    return null;
  }, []);

  const loadStore = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (authLoading) return null;

      const localUser = user as AuthUserLike | null;

      if (!localUser) {
        navigate('/login', { replace: true });
        return null;
      }

      if (localUser.role === 'super-admin') {
        navigate('/super-admin', { replace: true });
        return null;
      }

      try {
        if (!silent && !store) {
          setLoadingStore(true);
        } else {
          setRefreshing(true);
        }

        const {
          data: { user: sessionUser },
        } = await supabase.auth.getUser();

        const mergedUser: AuthUserLike = {
          ...localUser,
          id: localUser.id ?? sessionUser?.id,
          email: localUser.email ?? sessionUser?.email ?? null,
        };

        const resolvedStore = await resolveStoreForAdmin(mergedUser);

        if (resolvedStore) {
          setStore((current) => {
            if (
              current?.id === resolvedStore.id &&
              current?.name === resolvedStore.name &&
              current?.slug === resolvedStore.slug &&
              current?.niche === resolvedStore.niche &&
              current?.whatsapp === resolvedStore.whatsapp &&
              current?.logoUrl === resolvedStore.logoUrl &&
              current?.bannerUrl === resolvedStore.bannerUrl &&
              current?.accessExpiresAt === resolvedStore.accessExpiresAt &&
              current?.autoRenew === resolvedStore.autoRenew &&
              current?.active === resolvedStore.active &&
              current?.suspended === resolvedStore.suspended
            ) {
              return current;
            }

            return resolvedStore;
          });

          return resolvedStore;
        }

        setStore(null);
        return null;
      } catch (error) {
        console.error('Erro ao carregar loja do admin:', error);
        toast.error('Não foi possível carregar sua loja agora.');
        return null;
      } finally {
        setLoadingStore(false);
        setRefreshing(false);
      }
    },
    [authLoading, navigate, resolveStoreForAdmin, store, user],
  );

  useEffect(() => {
    void loadStore();
  }, [loadStore]);

  useEffect(() => {
    const currentStoreId = store?.id ?? null;
    const lastStoreId = lastStoreIdRef.current;

    if (lastStoreId === currentStoreId) return;

    if (storeChannelRef.current) {
      void supabase.removeChannel(storeChannelRef.current);
      storeChannelRef.current = null;
    }

    lastStoreIdRef.current = currentStoreId;

    if (!currentStoreId) return;

    const channel = supabase
      .channel(`painel-store-${currentStoreId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${currentStoreId}`,
        },
        async () => {
          await loadStore({ silent: true });
        },
      )
      .subscribe();

    storeChannelRef.current = channel;

    return () => {
      if (storeChannelRef.current) {
        void supabase.removeChannel(storeChannelRef.current);
        storeChannelRef.current = null;
      }
    };
  }, [store?.id, loadStore]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erro ao sair:', error);
      toast.error('Erro ao sair.');
    }
  };

  const handleRefresh = async () => {
    await loadStore({ silent: true });
    await refreshAppData();
    toast.success('Painel atualizado.');
  };

  const handleCopyStoreLink = async () => {
    if (!publicStoreUrl) return;

    try {
      await navigator.clipboard.writeText(publicStoreUrl);
      toast.success('Link da loja copiado.');
    } catch {
      toast.error('Não foi possível copiar o link agora.');
    }
  };

  if ((authLoading || loadingStore) && !store) {
    return null;
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_50%,_#08120d_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <StoreIcon className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black">Sua loja ainda não está pronta</h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Não encontramos uma loja vinculada a este admin.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const access = user?.access;
  const blocked = Boolean(access?.isExpired);

  if (blocked) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_50%,_#08120d_100%)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <header className="mb-8 border-b border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-black text-white">{store.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-zinc-400">@{store.slug}</span>
                    <span className="text-zinc-700">•</span>
                    <span className="capitalize text-zinc-400">{store.niche || 'Sem nicho'}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="text-zinc-400 hover:bg-white/5 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-3xl">
            <Card className="border-amber-500/20 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
                  <CalendarClock className="h-10 w-10" />
                </div>
                <h2 className="text-3xl font-black text-white">Acesso temporariamente indisponível</h2>
                <p className="mt-3 text-zinc-400">
                  Sua estrutura continua preservada. Assim que a renovação for concluída,
                  tudo volta ao normal.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getBadgeClasses(access?.status)}`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {access?.label || 'Expirado'}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                    <CalendarClock className="h-4 w-4" />
                    Vencimento: {formatDate(access?.expiresAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_50%,_#08120d_100%)]">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-white">{store.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-zinc-400">@{store.slug}</span>
                <span className="text-zinc-700">•</span>
                <span className="capitalize text-zinc-400">{store.niche || 'Sem nicho'}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                  <Crown className="h-3.5 w-3.5" />
                  Admin
                </span>
              </div>

              {access ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${getBadgeClasses(access.status)}`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {access.label}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-300">
                    <CalendarClock className="h-4 w-4" />
                    Vencimento: {formatDate(access.expiresAt)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="border-white/10 bg-black/30 text-white hover:bg-white/5"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>

              <Button
                variant="outline"
                className="border-white/10 bg-black/30 text-white hover:bg-white/5"
                onClick={handleCopyStoreLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </Button>

              <Button
                variant="outline"
                className="border-emerald-500/20 bg-black/30 text-white hover:bg-emerald-500/10"
                onClick={() => navigate(`/loja/${store.slug}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver loja
              </Button>

              <Button
                variant="outline"
                className="border-white/10 bg-black/30 text-white hover:bg-white/5"
                onClick={() => navigate('/configuracoes')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>

              <Button
                variant="ghost"
                className="text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Card className="mb-8 overflow-hidden border-emerald-500/20 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="relative">
            <div className="h-48 w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500">
              {store.bannerUrl ? (
                <img
                  src={store.bannerUrl}
                  alt={store.name}
                  className="h-full w-full object-cover opacity-60"
                />
              ) : null}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-end gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-black/40 text-2xl font-black text-white shadow-xl">
                    {store.logoUrl ? (
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(store.name || 'A')}</span>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Painel principal
                    </p>
                    <h2 className="text-3xl font-black text-white md:text-4xl">
                      Sua estrutura para vender mais
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-zinc-300 md:text-base">
                      Agora seus produtos ficam organizados em uma central própria, sem bagunçar o painel.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/90 px-6 py-5 text-black shadow-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                    Potencial de ganhos
                  </p>
                  <div className="mt-2 text-4xl font-black">
                    {estimatedEarnings.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                  <p className="mt-1 text-sm opacity-80">
                    Mais produtos + mais cliques = mais chance de comissão
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            >
              <CardHeader className="pb-3">
                <div
                  className={`mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5 text-black" />
                </div>
                <CardDescription className="text-zinc-400">{stat.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">{stat.value}</div>
                <p className="mt-2 text-sm text-zinc-500">{stat.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Ações rápidas</CardTitle>
                <CardDescription className="text-zinc-400">
                  Agora o gerenciamento ficou dividido em páginas mais organizadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    size="lg"
                    className="h-auto justify-start rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-6 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                    onClick={() => navigate('/produtos')}
                  >
                    <FolderKanban className="mr-2 h-5 w-5" />
                    Produtos
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto justify-start rounded-2xl border-white/10 bg-black/20 py-6 text-white hover:bg-white/5"
                    onClick={() => navigate('/gerar-conteudo')}
                    disabled={products.length === 0}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gerar conteúdo
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto justify-start rounded-2xl border-white/10 bg-black/20 py-6 text-white hover:bg-white/5"
                    onClick={() => navigate('/configuracoes')}
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Personalizar loja
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto justify-start rounded-2xl border-white/10 bg-black/20 py-6 text-white hover:bg-white/5"
                    onClick={() => navigate(`/loja/${store.slug}`)}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Ver minha loja
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Checklist de ativação</CardTitle>
                <CardDescription className="text-zinc-400">
                  Faça isso para deixar sua estrutura mais forte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-zinc-500'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <p className={item.done ? 'text-white' : 'text-zinc-400'}>{item.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <GraduationCap className="h-5 w-5 text-emerald-400" />
                  Academia AfiliadoPRO
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Mini aulas rápidas para te ajudar a vender mais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {academyItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-emerald-500/30"
                  >
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Link da loja</CardTitle>
                <CardDescription className="text-zinc-400">
                  Compartilhe com facilidade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/10 p-4">
                  <p className="break-all text-sm text-emerald-200">{publicStoreUrl}</p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                    onClick={handleCopyStoreLink}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar link
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                    onClick={() => navigate(`/loja/${store.slug}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir loja
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}