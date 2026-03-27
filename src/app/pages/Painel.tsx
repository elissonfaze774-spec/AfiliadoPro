import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Settings,
  Save,
  Wand2,
  Phone,
  Link as LinkIcon,
  Tag,
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
};

type AuthUserLike = {
  id?: string;
  email?: string | null;
  role?: string | null;
  storeId?: string | null;
};

type SettingsForm = {
  name: string;
  slug: string;
  whatsapp: string;
  niche: string;
};

type FakeProduct = {
  store_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

function normalizeStore(raw: any): StoreData | null {
  if (!raw) return null;

  const id = raw.id ?? '';
  const name = raw.name ?? raw.store_name ?? '';
  const slug = raw.slug ?? '';
  const niche = raw.niche ?? null;
  const whatsapp = raw.whatsapp_number ?? raw.whatsapp ?? '';

  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    niche,
    whatsapp,
  };
}

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

function getFakeProductsByNiche(niche: string, storeId: string): FakeProduct[] {
  const normalized = niche.trim().toLowerCase();

  const byNiche: Record<string, Omit<FakeProduct, 'store_id'>[]> = {
    eletronicos: [
      {
        name: 'Smartwatch Ultra Fit',
        description: 'Relógio inteligente moderno com monitoramento e visual premium.',
        price: 189.9,
        image:
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Fone Bluetooth Pro X',
        description: 'Som limpo, grave forte e bateria de longa duração.',
        price: 129.9,
        image:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Caixa de Som Pulse',
        description: 'Portátil, potente e perfeita para qualquer ambiente.',
        price: 159.9,
        image:
          'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Câmera Wi-Fi Vision',
        description: 'Monitoramento inteligente com imagem nítida e instalação fácil.',
        price: 229.9,
        image:
          'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Carregador Turbo Max',
        description: 'Carregamento rápido para vários dispositivos.',
        price: 59.9,
        image:
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Luminária LED Smart',
        description: 'Iluminação moderna para setup, quarto ou escritório.',
        price: 79.9,
        image:
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900&q=80&auto=format&fit=crop',
      },
    ],
    moda: [
      {
        name: 'Relógio Casual Elegance',
        description: 'Visual sofisticado para o dia a dia.',
        price: 99.9,
        image:
          'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Óculos Style Black',
        description: 'Modelo moderno com acabamento premium.',
        price: 89.9,
        image:
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Tênis Urban Move',
        description: 'Conforto e estilo para qualquer ocasião.',
        price: 179.9,
        image:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Bolsa Premium Soft',
        description: 'Design elegante com ótimo acabamento.',
        price: 149.9,
        image:
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Jaqueta Urban Light',
        description: 'Peça versátil para compor looks modernos.',
        price: 199.9,
        image:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Kit Acessórios Trend',
        description: 'Itens escolhidos para elevar seu visual.',
        price: 69.9,
        image:
          'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900&q=80&auto=format&fit=crop',
      },
    ],
    beleza: [
      {
        name: 'Escova Secadora Pro',
        description: 'Mais praticidade para cuidar do visual todos os dias.',
        price: 169.9,
        image:
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Kit Skin Care Glow',
        description: 'Rotina completa para pele com aparência saudável.',
        price: 119.9,
        image:
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Perfume Essence Gold',
        description: 'Fragrância marcante e elegante.',
        price: 139.9,
        image:
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Paleta Make Pro',
        description: 'Cores versáteis para várias composições.',
        price: 59.9,
        image:
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Sérum Facial Repair',
        description: 'Cuidado diário com toque leve e moderno.',
        price: 89.9,
        image:
          'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Modelador Beauty Curl',
        description: 'Acabamento profissional em casa.',
        price: 149.9,
        image:
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&q=80&auto=format&fit=crop',
      },
    ],
    casa: [
      {
        name: 'Luminária Decor Lux',
        description: 'Peça moderna para transformar o ambiente.',
        price: 89.9,
        image:
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Organizador Premium Home',
        description: 'Mais praticidade e estilo na organização.',
        price: 49.9,
        image:
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Kit Cozinha Smart',
        description: 'Itens úteis para facilitar o dia a dia.',
        price: 129.9,
        image:
          'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Mesa Lateral Charm',
        description: 'Design bonito e funcional para sua casa.',
        price: 159.9,
        image:
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Tapete Decor Soft',
        description: 'Conforto e visual elegante para o ambiente.',
        price: 99.9,
        image:
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Kit Banheiro Clean',
        description: 'Visual moderno para renovar o espaço.',
        price: 69.9,
        image:
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80&auto=format&fit=crop',
      },
    ],
    fitness: [
      {
        name: 'Kit Elásticos Power',
        description: 'Treino funcional com ótimo custo-benefício.',
        price: 59.9,
        image:
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Garrafa Térmica Sport',
        description: 'Ideal para treinos e rotina ativa.',
        price: 49.9,
        image:
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Tapete Yoga Flex',
        description: 'Conforto e estabilidade para seus exercícios.',
        price: 89.9,
        image:
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Smartband Active',
        description: 'Acompanhe seu desempenho com mais praticidade.',
        price: 119.9,
        image:
          'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Mochila Gym Pro',
        description: 'Espaçosa e perfeita para sua rotina.',
        price: 99.9,
        image:
          'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=900&q=80&auto=format&fit=crop',
      },
      {
        name: 'Corda Speed Jump',
        description: 'Acessório simples e eficiente para cardio.',
        price: 39.9,
        image:
          'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=900&q=80&auto=format&fit=crop',
      },
    ],
  };

  const fallback = byNiche.eletronicos;
  const selected = byNiche[normalized] ?? fallback;

  return selected.map((item) => ({
    store_id: storeId,
    ...item,
  }));
}

export default function Painel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, authLoading, logout } = useAuth();
  const { products, clicks, contents, refreshAppData } = useApp();

  const [store, setStore] = useState<StoreData | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingFakeProducts, setCreatingFakeProducts] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SettingsForm>({
    name: '',
    slug: '',
    whatsapp: '',
    niche: 'eletronicos',
  });

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastStoreIdRef = useRef<string | null>(null);

  const showConfigSection = searchParams.get('config') === 'true';

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
          setStore((current) => {
            if (
              current?.id === resolvedStore.id &&
              current?.name === resolvedStore.name &&
              current?.slug === resolvedStore.slug &&
              current?.niche === resolvedStore.niche &&
              current?.whatsapp === resolvedStore.whatsapp
            ) {
              return current;
            }

            return resolvedStore;
          });

          setSettingsForm({
            name: resolvedStore.name,
            slug: resolvedStore.slug,
            whatsapp: resolvedStore.whatsapp,
            niche: resolvedStore.niche || 'eletronicos',
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
    await refreshAppData();
    toast.success('Painel atualizado.');
  };

  const handleOpenConfig = () => {
    const next = new URLSearchParams(searchParams);
    next.set('config', 'true');
    setSearchParams(next, { replace: true });
  };

  const handleCloseConfig = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('config');
    setSearchParams(next, { replace: true });
  };

  const handleSaveSettings = async () => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    const normalizedName = settingsForm.name.trim();
    const normalizedSlug = slugify(settingsForm.slug || settingsForm.name);
    const normalizedWhatsapp = settingsForm.whatsapp.trim();
    const normalizedNiche = settingsForm.niche.trim().toLowerCase();

    if (!normalizedName) {
      toast.error('Informe o nome da loja.');
      return;
    }

    if (!normalizedSlug) {
      toast.error('Informe um link válido para a loja.');
      return;
    }

    setSavingSettings(true);

    try {
      const { data: existingSlugStore, error: slugError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', normalizedSlug)
        .neq('id', store.id)
        .maybeSingle();

      if (slugError) {
        throw slugError;
      }

      if (existingSlugStore?.id) {
        toast.error('Esse link já está em uso por outra loja.');
        return;
      }

      const { error: updateError } = await supabase
        .from('stores')
        .update({
          store_name: normalizedName,
          slug: normalizedSlug,
          whatsapp_number: normalizedWhatsapp,
          niche: normalizedNiche,
        })
        .eq('id', store.id);

      if (updateError) {
        throw updateError;
      }

      toast.success('Configurações salvas com sucesso.');
      await loadStore({ silent: true });
      await refreshAppData();
      handleCloseConfig();
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error?.message || 'Não foi possível salvar as configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGenerateFakeProducts = async () => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    if (products.length > 0) {
      toast.error('Sua loja já possui produtos. Remova os atuais se quiser gerar novos.');
      return;
    }

    setCreatingFakeProducts(true);

    try {
      const fakeProducts = getFakeProductsByNiche(
        settingsForm.niche || store.niche || 'eletronicos',
        store.id,
      );

      const { error } = await supabase.from('products').insert(fakeProducts);

      if (error) {
        throw error;
      }

      await refreshAppData();
      toast.success('Produtos fake criados com sucesso.');
    } catch (error: any) {
      console.error('Erro ao gerar produtos fake:', error);
      toast.error(error?.message || 'Não foi possível criar os produtos fake.');
    } finally {
      setCreatingFakeProducts(false);
    }
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
    { text: 'Cadastrar ou gerar primeiros produtos', done: products.length > 0 },
    { text: 'Acessar sua loja pública', done: Boolean(store?.slug) },
    { text: 'Personalizar nome, link e nicho', done: Boolean(store?.name && store?.slug && store?.niche) },
    { text: 'Gerar primeiro conteúdo', done: contents.length > 0 },
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
                variant="outline"
                className="border-white/10 bg-black/30 text-white hover:bg-white/5"
                onClick={handleOpenConfig}
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
        {showConfigSection ? (
          <Card className="mb-8 border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-white">Configurações da loja</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Aqui fica o que antes estava no onboarding. Agora tudo é ajustado dentro do painel.
                  </CardDescription>
                </div>

                <Button
                  variant="outline"
                  className="border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={handleCloseConfig}
                >
                  Fechar
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <StoreIcon className="h-4 w-4 text-emerald-400" />
                    Nome da loja
                  </label>
                  <input
                    value={settingsForm.name}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="Nome da sua loja"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <LinkIcon className="h-4 w-4 text-emerald-400" />
                    Link da loja
                  </label>
                  <input
                    value={settingsForm.slug}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        slug: slugify(e.target.value),
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="minha-loja"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Sua loja ficará em:{' '}
                    <span className="text-emerald-400">
                      /loja/{slugify(settingsForm.slug || settingsForm.name)}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    WhatsApp
                  </label>
                  <input
                    value={settingsForm.whatsapp}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        whatsapp: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="11999999999"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Tag className="h-4 w-4 text-emerald-400" />
                    Nicho
                  </label>
                  <select
                    value={settingsForm.niche}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        niche: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                  >
                    <option value="eletronicos">Eletrônicos</option>
                    <option value="moda">Moda</option>
                    <option value="beleza">Beleza</option>
                    <option value="casa">Casa</option>
                    <option value="fitness">Fitness</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {savingSettings ? 'Salvando...' : 'Salvar configurações'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGenerateFakeProducts}
                  disabled={creatingFakeProducts || products.length > 0}
                  className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {creatingFakeProducts ? 'Gerando...' : 'Gerar produtos fake do nicho'}
                </Button>

                <Button
                  variant="outline"
                  className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={() => navigate(`/loja/${slugify(settingsForm.slug || settingsForm.name)}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver loja
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

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
                    onClick={handleOpenConfig}
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
                  Gere produtos fake pelo nicho ou adicione manualmente.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                    onClick={handleGenerateFakeProducts}
                    disabled={creatingFakeProducts}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {creatingFakeProducts ? 'Gerando...' : 'Gerar produtos fake'}
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                    onClick={() => navigate('/adicionar-produto')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar produto
                  </Button>
                </div>
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
                        <p className="mb-2 text-sm text-zinc-400 line-clamp-2">
                          {product.description}
                        </p>
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