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
  Bell,
  ChevronRight,
  Target,
  Rocket,
  LayoutGrid,
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
  whatsappGroupLink?: string;
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

type QuickAction = {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  highlight?: boolean;
};

function normalizeStore(raw: any): StoreData | null {
  if (!raw) return null;

  const id = raw.id ?? '';
  const name = raw.store_name ?? raw.name ?? '';
  const slug = raw.slug ?? '';
  const niche = raw.niche ?? null;
  const whatsapp = raw.whatsapp_number ?? raw.whatsapp ?? '';
  const whatsappGroupLink = raw.whatsapp_group_link ?? '';
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
    whatsappGroupLink,
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
  if (status === 'expired') return 'border-red-500/20 bg-red-500/10 text-red-300';
  if (status === 'expires_today') return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  if (status === 'expiring_soon') return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300';
  return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
}

export default function Painel() {
  const navigate = useNavigate();
  const { user, authLoading, logout } = useAuth();
  const { products, clicks, contents, refreshAppData, store: appStore } = useApp();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastStoreIdRef = useRef<string | null>(null);
  const notificationsDesktopRef = useRef<HTMLDivElement | null>(null);
  const notificationsDesktopButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationsMobileRef = useRef<HTMLDivElement | null>(null);
  const notificationsMobileButtonRef = useRef<HTMLButtonElement | null>(null);

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
        title: 'Total de produtos',
        value: products.length,
        helper: products.length === 1 ? '1 produto na loja' : `${products.length} produtos na loja`,
      },
      {
        icon: MousePointerClick,
        title: 'Cliques',
        value: clicks,
        helper: 'Interesse gerado pelos seus links',
      },
      {
        icon: FileText,
        title: 'Conteúdos',
        value: contents.length,
        helper: 'Textos gerados para vender mais',
      },
      {
        icon: DollarSign,
        title: ' Valor total dos produtos',
        value: estimatedEarnings.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        helper: 'Estimativa visual do painel',
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
      { text: 'Gerar seu primeiro conteúdo', done: contents.length > 0 },
    ],
    [products, contents.length, store],
  );

  const academyItems = [
    {
      title: 'O que vender primeiro',
      description: 'Comece por produtos mais visuais, simples e fáceis de explicar.',
    },
    {
      title: 'Como passar confiança',
      description: 'Banner bonito, foto da loja e descrição forte ajudam muito na conversão.',
    },
    {
      title: 'Como ter mais cliques',
      description: 'Divulgue em grupos, status, reels e conversas privadas todos os dias.',
    },
  ];

  const completedChecklist = useMemo(() => checklist.filter((item) => item.done).length, [checklist]);
  const checklistPercent = useMemo(
    () => Math.round((completedChecklist / checklist.length) * 100),
    [completedChecklist, checklist.length],
  );

  const nextBestAction = useMemo(() => {
    if (products.length < 3) {
      return {
        title: 'Adicione mais produtos',
        description: 'Quanto mais produtos bons você tiver, maior a chance de gerar cliques e comissão.',
        actionLabel: 'Ir para Produtos',
        onClick: () => navigate('/produtos'),
      };
    }

    if (!store?.bannerUrl || !store?.logoUrl) {
      return {
        title: 'Deixe sua loja com cara profissional',
        description: 'Envie logo e banner para passar mais confiança e vender melhor.',
        actionLabel: 'Ir para Configurações',
        onClick: () => navigate('/configuracoes'),
      };
    }

    if (contents.length === 0) {
      return {
        title: 'Gere um conteúdo prêmium',
        description: 'Use a geração de conteúdos para converter o máximo em vendas.',
        actionLabel: 'Gerar conteúdo',
        onClick: () => navigate('/gerar-conteudo'),
      };
    }

    return {
      title: 'Sua loja pronto para divulgação',
      description: 'Clique em copiar link e comece agora.',
      actionLabel: 'Copiar link',
      onClick: () => handleCopyStoreLink(),
    };
  }, [products.length, store?.bannerUrl, store?.logoUrl, contents.length, navigate]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [
      {
        id: 'motivation-1',
        title: 'Vamos pra cima!',
        description: 'Uma pequena ação agora pode trazer sua próxima comissão.',
        highlight: true,
      },
    ];

    if (products.length < 3) {
      items.push({
        id: 'products-warning',
        title: 'Adicione mais produtos',
        description: 'Sua loja fica mais forte quando tem mais opções para o cliente',
      });
    }

    if (!store?.bannerUrl || !store?.logoUrl) {
      items.push({
        id: 'visual-warning',
        title: 'Sua loja pode ficar mais profissional',
        description: 'Envie foto e banner com muita qualidade',
      });
    }

    if (contents.length === 0) {
      items.push({
        id: 'content-warning',
        title: 'Você ainda não gerou conteúdo',
        description: 'Use o gerador para acelerar sua divulgação.',
      });
    }

    items.push({
      id: 'motivation-2',
      title: 'Já vendeu hoje?',
      description: 'Se ainda não divulgou, esse é um ótimo momento para começar.',
    });

    return items.slice(0, 4);
  }, [products.length, store?.bannerUrl, store?.logoUrl, contents.length]);

  const quickActions: QuickAction[] = [
    {
      title: 'Produtos',
      description: 'Adicione, edite e organize seus produtos.',
      icon: FolderKanban,
      onClick: () => navigate('/produtos'),
      primary: true,
    },
    {
      title: 'Gerar conteúdo',
      description: 'Crie textos prontos para divulgar mais rápido.',
      icon: Sparkles,
      onClick: () => navigate('/gerar-conteudo'),
      disabled: products.length === 0,
    },
    {
      title: 'Afilie-se',
      description: 'Veja plataformas para ampliar suas oportunidades.',
      icon: Rocket,
      onClick: () => navigate('/afilie-se'),
    },
    {
      title: 'Ver loja',
      description: 'Abra sua loja pública e veja como ficou.',
      icon: ExternalLink,
      onClick: () => navigate(`/loja/${store?.slug}`),
    },
    {
      title: 'Configurações',
      description: 'Personalize sua loja e deixe tudo mais profissional.',
      icon: Settings,
      onClick: () => navigate('/configuracoes'),
    },
  ];

  const resolveStoreForAdmin = useCallback(
    async (authUser: AuthUserLike): Promise<StoreData | null> => {
      const authUserId = authUser?.id ?? null;
      const authEmail = authUser?.email?.trim().toLowerCase() ?? null;
      const directStoreId = authUser?.storeId ?? null;

      if (directStoreId) {
        const { data, error } = await supabase.from('stores').select('*').eq('id', directStoreId).maybeSingle();
        if (!error) {
          const normalized = normalizeStore(data);
          if (normalized) return normalized;
        }
      }

      if (appStore?.id) {
        return normalizeStore({
          id: appStore.id,
          store_name: appStore.name,
          slug: appStore.username,
          whatsapp: appStore.whatsapp,
          whatsapp_group_link: appStore.whatsappGroupLink,
          niche: appStore.niche,
          logo_url: appStore.logoUrl,
          banner_url: appStore.bannerUrl,
        });
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
    },
    [appStore],
  );

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
        { event: '*', schema: 'public', table: 'stores', filter: `id=eq.${currentStoreId}` },
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

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (notificationsDesktopRef.current?.contains(target)) return;
      if (notificationsDesktopButtonRef.current?.contains(target)) return;
      if (notificationsMobileRef.current?.contains(target)) return;
      if (notificationsMobileButtonRef.current?.contains(target)) return;
      setShowNotifications(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowNotifications(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNotifications]);

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

  if ((authLoading || loadingStore) && !store) return null;

  if (!store) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_50%,_#08120d_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <StoreIcon className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black">Sua loja ainda não está pronta</h1>
          <p className="mt-3 max-w-xl text-zinc-400">Não encontramos uma loja vinculada a este admin.</p>
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
                <Button variant="ghost" className="text-zinc-400 hover:bg-white/5 hover:text-white" onClick={handleLogout}>
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
                  Sua estrutura continua preservada. Assim que a renovação for concluída, tudo volta ao normal.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getBadgeClasses(access?.status)}`}>
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
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_50%,_#08120d_100%)]">
      <header className="relative z-[90] border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-black text-white">{store.name}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                  <Crown className="h-3.5 w-3.5" />
                  Admin
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-zinc-400">@{store.slug}</span>
                <span className="text-zinc-700">•</span>
                <span className="capitalize text-zinc-400">{store.niche || 'Sem nicho'}</span>
              </div>
            </div>

            <div className="relative hidden flex-wrap items-center gap-3 md:flex">
              <div className="relative">
                <Button
                  ref={notificationsDesktopButtonRef}
                  variant="outline"
                  className="border-white/10 bg-black/30 text-white hover:bg-white/5"
                  onClick={() => setShowNotifications((prev) => !prev)}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Avisos
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-black">
                    {notifications.length}
                  </span>
                </Button>

                {showNotifications ? (
                  <div
                    ref={notificationsDesktopRef}
                    className="absolute left-0 top-[calc(100%+12px)] z-[160] w-[min(360px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[#07110c]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                  >
                    <div className="mb-2 px-2 py-1">
                      <p className="text-sm font-bold text-white">Central de avisos</p>
                      <p className="text-xs text-zinc-400">Motivação, dicas e lembretes leves.</p>
                    </div>

                    <div className="space-y-2">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-3 ${
                            item.highlight
                              ? 'border-emerald-500/20 bg-emerald-500/10'
                              : 'border-white/10 bg-black/20'
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-zinc-400">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

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
                variant="ghost"
                className="text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>

            {access ? (
              <div className="hidden flex-wrap items-center gap-3 md:flex xl:col-span-2">
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
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] xl:items-stretch">
          <Card className="h-full overflow-hidden border-emerald-500/20 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="relative h-full min-h-[240px] overflow-hidden md:min-h-[320px]">
              <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,rgba(2,8,5,0.92)_0%,rgba(4,22,15,0.80)_45%,rgba(6,38,26,0.62)_100%)]">
                {store.bannerUrl ? (
                  <img
                    src={store.bannerUrl}
                    alt={store.name}
                    className="h-full w-full object-cover opacity-40 saturate-[0.9]"
                  />
                ) : null}
              </div>

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.42)_42%,rgba(0,0,0,0.84)_100%)]" />

              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex items-end gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-black/40 text-2xl font-black text-white shadow-xl">
                      {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
                      ) : (
                        <span>{getInitials(store.name || 'A')}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="mb-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300 md:text-xs">
                        
                      </p>
                      <h2 className="text-2xl font-black text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.55)] md:text-4xl">Painel completo</h2>
                      <p className="mt-2 max-w-2xl text-sm text-zinc-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] md:text-base">
                        Clique em configurações, personalize sua loja, adicione produtos e comece a divulgar para vender. 
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                      onClick={() => navigate('/configuracoes')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/25 text-white hover:bg-white/5"
                      onClick={handleCopyStoreLink}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar link
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/25 text-white hover:bg-white/5"
                      onClick={() => navigate(`/loja/${store.slug}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver loja
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3 md:hidden">
            <div className="relative flex flex-wrap items-center gap-3">
              <div className="relative">
                <Button
                  ref={notificationsMobileButtonRef}
                  variant="outline"
                  className="border-white/10 bg-black/30 text-white hover:bg-white/5"
                  onClick={() => setShowNotifications((prev) => !prev)}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Avisos
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-black">
                    {notifications.length}
                  </span>
                </Button>

                {showNotifications ? (
                  <div
                    ref={notificationsMobileRef}
                    className="absolute left-0 top-[calc(100%+12px)] z-[220] w-[min(360px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[#07110c]/98 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                  >
                    <div className="mb-2 px-2 py-1">
                      <p className="text-sm font-bold text-white">Central de avisos</p>
                      <p className="text-xs text-zinc-400">Motivação, dicas e lembretes leves.</p>
                    </div>

                    <div className="space-y-2">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-3 ${
                            item.highlight
                              ? 'border-emerald-500/20 bg-emerald-500/10'
                              : 'border-white/10 bg-black/20'
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-zinc-400">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

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
                variant="ghost"
                className="text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>

            {access ? (
              <div className="flex flex-wrap items-center gap-3">
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

          <Card className="h-full border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.18)_0%,rgba(5,10,8,0.9)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <CardContent className="p-5 md:p-6">
              <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Novidade!
              </div>

              <h3 className="mt-4 text-2xl font-black text-white">{nextBestAction.title}</h3>
              <p className="mt-3 text-sm leading-6 text-emerald-50/85">{nextBestAction.description}</p>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Potencial visual</p>
                <div className="mt-2 text-4xl font-black text-white">
                  {estimatedEarnings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="mt-2 text-sm text-zinc-200/80">
                  Mais produtos + mais cliques = mais chance de comissão.
                </p>
              </div>

              <Button
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                onClick={nextBestAction.onClick}
              >
                <Rocket className="mr-2 h-4 w-4" />
                {nextBestAction.actionLabel}
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-400">{stat.title}</p>
                    <div className="mt-3 break-words text-3xl font-black text-white">{stat.value}</div>
                    <p className="mt-2 text-sm text-zinc-500">{stat.helper}</p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500">
                    <stat.icon className="h-5 w-5 text-black" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <LayoutGrid className="h-5 w-5 text-emerald-400" />
                  Menu Principal
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Tudo que você precisa, para melhor experiência!
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.title}
                      type="button"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`rounded-[24px] border p-5 text-left transition ${
                        action.primary
                          ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 hover:border-emerald-400/30'
                          : 'border-white/10 bg-black/20 hover:border-emerald-500/20 hover:bg-white/[0.03]'
                      } ${action.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div
                            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                              action.primary
                                ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-black'
                                : 'bg-white/5 text-emerald-300'
                            }`}
                          >
                            <action.icon className="h-5 w-5" />
                          </div>

                          <h3 className="text-base font-bold text-white">{action.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">{action.description}</p>
                        </div>

                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-zinc-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Progresso da sua estrutura</CardTitle>
                <CardDescription className="text-zinc-400">
                  Quanto mais completo, mais forte fica para vender.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-400">Loja pronta</p>
                    <p className="text-sm font-bold text-emerald-300">{checklistPercent}%</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div
                      key={item.text}
                      className={`flex items-start gap-3 rounded-2xl border p-4 ${
                        item.done
                          ? 'border-emerald-500/15 bg-emerald-500/10'
                          : 'border-white/10 bg-black/20'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          item.done ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-500'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white">{item.text}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {item.done ? 'Concluído' : 'Ainda falta concluir'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <GraduationCap className="h-5 w-5 text-emerald-400" />
                  Academia AfiliadoPRO
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Dicas rápidas para melhorar sua chance de venda.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {academyItems.map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Centro de divulgação</CardTitle>
                <CardDescription className="text-zinc-400">
                  Ações rápidas para divulgação e relacionamento.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <Button
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 font-bold text-black hover:from-emerald-400 hover:to-green-400"
                  onClick={handleCopyStoreLink}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link da loja
                </Button>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={() => navigate('/gerar-conteudo')}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Abrir central de conteúdo
                </Button>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={() => navigate('/afilie-se')}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Ver plataformas para se afiliar
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
