import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  MousePointerClick,
  FileText,
  DollarSign,
  Plus,
  Sparkles,
  ExternalLink,
  CheckCircle,
  LogOut,
  Crown,
  TrendingUp,
  RefreshCw,
  Store as StoreIcon,
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
};

type AuthUserLike = {
  id?: string;
  email?: string | null;
  role?: string | null;
  storeId?: string | null;
};

function normalizeStore(raw: any): StoreData | null {
  if (!raw) return null;

  const id = raw.id ?? '';
  const name = raw.name ?? raw.store_name ?? '';
  const slug = raw.slug ?? '';
  const niche = raw.niche ?? null;

  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    niche,
  };
}

export default function Painel() {
  const navigate = useNavigate();
  const { user, authLoading, logout } = useAuth();
  const { products, clicks, contents } = useApp();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onboardingRedirectRef = useRef(false);
  const lastStoreIdRef = useRef<string | null>(null);

  const resolveStoreForAdmin = useCallback(async (authUser: AuthUserLike): Promise<StoreData | null> => {
    const authUserId = authUser?.id ?? null;
    const authEmail = authUser?.email?.trim().toLowerCase() ?? null;
    const directStoreId = authUser?.storeId ?? null;

    if (directStoreId) {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, store_name, slug, niche')
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
          .select('id, name, store_name, slug, niche')
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
        .select('id, name, store_name, slug, niche')
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
            .select('id, name, store_name, slug, niche')
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
        if (!silent) {
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
          onboardingRedirectRef.current = false;
          setStore((current) => {
            if (
              current?.id === resolvedStore.id &&
              current?.name === resolvedStore.name &&
              current?.slug === resolvedStore.slug &&
              current?.niche === resolvedStore.niche
            ) {
              return current;
            }

            return resolvedStore;
          });

          return resolvedStore;
        }

        setStore(null);

        if (!onboardingRedirectRef.current) {
          onboardingRedirectRef.current = true;
          navigate('/onboarding', { replace: true });
        }

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
    [authLoading, navigate, resolveStoreForAdmin, user],
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
    toast.success('Painel atualizado.');
  };

  const estimatedEarnings = useMemo(() => {
    return products.length * 50 + clicks * 2.5;
  }, [products.length, clicks]);

  const stats = [
    {
      icon: Package,
      title: 'Produtos adicionados',
      value: products.length,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: MousePointerClick,
      title: 'Cliques',
      value: clicks,
      color: 'from-green-500 to-green-600',
    },
    {
      icon: FileText,
      title: 'Conteúdos gerados',
      value: contents.length,
      color: 'from-lime-500 to-emerald-600',
    },
    {
      icon: DollarSign,
      title: 'Estimativa de ganhos',
      value: `R$ ${estimatedEarnings.toFixed(2)}`,
      color: 'from-emerald-400 to-green-500',
    },
  ];

  const checklist = [
    { text: 'Cadastrar primeiro produto', done: products.length > 0 },
    { text: 'Gerar primeiro conteúdo', done: contents.length > 0 },
    { text: 'Acessar sua loja pública', done: Boolean(store?.slug) },
    { text: 'Personalizar a loja', done: Boolean(store?.name && store?.slug) },
  ];

  if (authLoading || loadingStore) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020202_0%,_#050505_45%,_#07110a_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black">Carregando painel</h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Estamos preparando sua área administrativa.
          </p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020202_0%,_#050505_45%,_#07110a_100%)] text-white">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <StoreIcon className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black">Sua loja ainda não está pronta</h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Não encontramos uma loja vinculada a este admin. Vamos continuar sua configuração inicial.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="rounded-2xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
              onClick={() => navigate('/onboarding', { replace: true })}
            >
              Continuar configuração
            </Button>

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020202_0%,_#050505_45%,_#07110a_100%)]">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-black text-white">{store.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-zinc-400">@{store.slug}</span>
                <span className="text-zinc-700">•</span>
                <span className="capitalize text-zinc-400">{store.niche || 'Sem nicho'}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                  <Crown className="h-3.5 w-3.5" />
                  Admin
                </span>
              </div>
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
                className="border-emerald-500/20 bg-black/30 text-white hover:bg-emerald-500/10"
                onClick={() => navigate(`/loja/${store.slug}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver loja
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Ações rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    size="lg"
                    className="h-auto justify-start rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-6 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                    onClick={() => navigate('/adicionar-produto')}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar produto
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
                    onClick={() => navigate('/onboarding')}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
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
          </div>

          <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <CardTitle className="text-white">Comece por aqui</CardTitle>
              <CardDescription className="text-zinc-400">
                Complete estas etapas para fortalecer sua estrutura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        item.done ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'
                      }`}
                    >
                      {item.done && <CheckCircle className="h-4 w-4 text-black" />}
                    </div>
                    <span
                      className={`text-sm ${item.done ? 'text-zinc-500 line-through' : 'text-white'}`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          {products.length === 0 ? (
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardContent className="py-14 text-center">
                <Package className="mx-auto mb-4 h-16 w-16 text-zinc-600" />
                <h3 className="mb-2 text-2xl font-black text-white">
                  Nenhum produto adicionado ainda
                </h3>
                <p className="mb-6 text-zinc-400">
                  Adicione seu primeiro produto para começar sua operação.
                </p>
                <Button
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                  onClick={() => navigate('/adicionar-produto')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar produto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-white">Meus produtos</CardTitle>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-black/20 text-white hover:bg-white/5"
                    onClick={() => navigate('/adicionar-produto')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo produto
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-black/30 transition-all hover:border-emerald-500/40 hover:ring-2 hover:ring-emerald-500/20"
                      onClick={() => navigate(`/produto/${product.id}`)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-48 w-full object-cover"
                      />
                      <div className="p-4">
                        <h4 className="mb-1 line-clamp-2 font-semibold text-white">
                          {product.name}
                        </h4>
                        <p className="font-bold text-emerald-400">{product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}