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
  RefreshCw,
  Store as StoreIcon,
  Settings,
  Save,
  Wand2,
  Phone,
  Link as LinkIcon,
  Tag,
  Image as ImageIcon,
  Copy,
  GraduationCap,
  Rocket,
  ArrowUpRight,
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
  logoUrl: string;
  bannerUrl: string;
};

type FakeProduct = {
  store_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  affiliate_link: string;
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

  if (!id || !name || !slug) return null;

  return {
    id,
    name,
    slug,
    niche,
    whatsapp,
    logoUrl,
    bannerUrl,
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

function onlyDigits(value: string) {
  return String(value ?? '').replace(/\D/g, '');
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getFakeProductsByNiche(niche: string, storeId: string): FakeProduct[] {
  const normalized = niche.trim().toLowerCase();

  const byNiche: Record<string, Omit<FakeProduct, 'store_id'>[]> = {
    eletronicos: [
      {
        name: 'Smartwatch Ultra Fit',
        description: 'Relógio inteligente premium com monitoramento diário e visual moderno.',
        price: 189.9,
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Fone Bluetooth Pro',
        description: 'Som limpo, conexão rápida e bateria duradoura para rotina intensa.',
        price: 129.9,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Caixa de Som Pulse',
        description: 'Portátil, potente e perfeita para ambientes internos e externos.',
        price: 159.9,
        image: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Câmera Wi-Fi Vision',
        description: 'Monitoramento inteligente com imagem nítida e instalação prática.',
        price: 229.9,
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Carregador Turbo Max',
        description: 'Carregamento rápido para vários dispositivos do dia a dia.',
        price: 59.9,
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Luminária LED Smart',
        description: 'Iluminação elegante para setup, quarto ou escritório.',
        price: 79.9,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
    ],
    moda: [
      {
        name: 'Relógio Casual Elegance',
        description: 'Visual sofisticado para compor looks modernos e vender com apelo visual.',
        price: 99.9,
        image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Óculos Style Black',
        description: 'Modelo moderno com acabamento premium e boa taxa de interesse.',
        price: 89.9,
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Tênis Urban Move',
        description: 'Conforto e estilo para várias ocasiões do dia a dia.',
        price: 179.9,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Bolsa Premium Soft',
        description: 'Design elegante com ótimo acabamento e alta percepção de valor.',
        price: 149.9,
        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Jaqueta Urban Light',
        description: 'Peça versátil para compor looks modernos e vender bem no visual.',
        price: 199.9,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Kit Acessórios Trend',
        description: 'Itens escolhidos para elevar o visual com ticket acessível.',
        price: 69.9,
        image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
    ],
    beleza: [
      {
        name: 'Escova Secadora Pro',
        description: 'Mais praticidade e resultado visual forte para vender melhor.',
        price: 169.9,
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Kit Skin Care Glow',
        description: 'Rotina completa para pele com aparência saudável e moderna.',
        price: 119.9,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Perfume Essence Gold',
        description: 'Fragrância marcante com ótima apresentação para público feminino.',
        price: 139.9,
        image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Paleta Make Pro',
        description: 'Cores versáteis para várias composições e vídeos curtos.',
        price: 59.9,
        image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Sérum Facial Repair',
        description: 'Cuidado diário com toque leve e apelo visual moderno.',
        price: 89.9,
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Modelador Beauty Curl',
        description: 'Acabamento profissional em casa com ótima taxa de atenção.',
        price: 149.9,
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
    ],
    casa: [
      {
        name: 'Luminária Decor Lux',
        description: 'Peça moderna para transformar o ambiente com ótima apresentação.',
        price: 89.9,
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Organizador Premium Home',
        description: 'Mais praticidade e estilo na organização da casa.',
        price: 49.9,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Kit Cozinha Smart',
        description: 'Itens úteis para facilitar o dia a dia com ótimo apelo.',
        price: 129.9,
        image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Mesa Lateral Charm',
        description: 'Design bonito e funcional para ambientes modernos.',
        price: 159.9,
        image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Tapete Decor Soft',
        description: 'Conforto e visual elegante para renovar o ambiente.',
        price: 99.9,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Kit Banheiro Clean',
        description: 'Visual moderno para renovar o espaço com baixo ticket.',
        price: 69.9,
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
    ],
    fitness: [
      {
        name: 'Kit Elásticos Power',
        description: 'Treino funcional com ótimo custo-benefício e boa demanda.',
        price: 59.9,
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Garrafa Térmica Sport',
        description: 'Ideal para treinos e rotina ativa com forte apelo visual.',
        price: 49.9,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Tapete Yoga Flex',
        description: 'Conforto e estabilidade para exercícios em casa.',
        price: 89.9,
        image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Smartband Active',
        description: 'Acompanhe desempenho com mais praticidade e apelo tecnológico.',
        price: 119.9,
        image: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Mochila Gym Pro',
        description: 'Espaçosa e perfeita para academia, trabalho e rotina.',
        price: 99.9,
        image: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
      },
      {
        name: 'Corda Speed Jump',
        description: 'Acessório simples, barato e ótimo para venda rápida.',
        price: 39.9,
        image: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=1200&q=80&auto=format&fit=crop',
        affiliate_link: '',
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
    logoUrl: '',
    bannerUrl: '',
  });

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastStoreIdRef = useRef<string | null>(null);

  const showConfigSection = searchParams.get('config') === 'true';

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
      { text: 'Configurar nome, banner e logo da loja', done: Boolean(store?.name && store?.bannerUrl && store?.logoUrl) },
      { text: 'Ter pelo menos 1 link de afiliado configurado', done: products.some((product) => Boolean(product.affiliateLink)) },
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
              current?.bannerUrl === resolvedStore.bannerUrl
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
            logoUrl: resolvedStore.logoUrl || '',
            bannerUrl: resolvedStore.bannerUrl || '',
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

  const handleCopyStoreLink = async () => {
    if (!publicStoreUrl) return;

    try {
      await navigator.clipboard.writeText(publicStoreUrl);
      toast.success('Link da loja copiado.');
    } catch {
      toast.error('Não foi possível copiar o link agora.');
    }
  };

  const handleSaveSettings = async () => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    const normalizedName = settingsForm.name.trim();
    const normalizedSlug = slugify(settingsForm.slug || settingsForm.name);
    const normalizedWhatsapp = onlyDigits(settingsForm.whatsapp);
    const normalizedNiche = settingsForm.niche.trim().toLowerCase();
    const normalizedLogo = settingsForm.logoUrl.trim();
    const normalizedBanner = settingsForm.bannerUrl.trim();

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
          logo_url: normalizedLogo,
          banner_url: normalizedBanner,
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
      toast.success('Produtos do nicho criados com sucesso. Agora adicione os links de afiliado.');
    } catch (error: any) {
      console.error('Erro ao gerar produtos fake:', error);
      toast.error(error?.message || 'Não foi possível criar os produtos.');
    } finally {
      setCreatingFakeProducts(false);
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
                      Configure sua loja, adicione produtos com link de afiliado e transforme o painel em uma operação simples de renda extra.
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

        {showConfigSection ? (
          <Card className="mb-8 border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-white">Configurações da loja</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Ajuste nome, link, WhatsApp, nicho, logo e banner em um só lugar.
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
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                      Sua loja ficará em{' '}
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

                  <div className="md:col-span-2">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                      URL da logo
                    </label>
                    <input
                      value={settingsForm.logoUrl}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          logoUrl: e.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                      URL do banner
                    </label>
                    <input
                      value={settingsForm.bannerUrl}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          bannerUrl: e.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                  <div className="relative h-44 bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-500">
                    {settingsForm.bannerUrl ? (
                      <img
                        src={settingsForm.bannerUrl}
                        alt="Preview banner"
                        className="h-full w-full object-cover opacity-60"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-end gap-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/40 text-lg font-black text-white">
                        {settingsForm.logoUrl ? (
                          <img
                            src={settingsForm.logoUrl}
                            alt="Preview logo"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{getInitials(settingsForm.name || 'A')}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xl font-black text-white">
                          {settingsForm.name || 'Nome da loja'}
                        </p>
                        <p className="text-sm text-zinc-300">
                          @{slugify(settingsForm.slug || settingsForm.name || 'minha-loja')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 p-4">
                    <p className="text-sm text-zinc-400">
                      Esse é o preview visual da sua loja pública.
                    </p>
                    <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                      Dica: banner bonito + logo forte + nome claro aumentam muito a confiança.
                    </div>
                  </div>
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
                  {creatingFakeProducts ? 'Gerando...' : 'Gerar produtos do nicho'}
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
                  Tudo o que você precisa para colocar a loja para vender de verdade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    size="lg"
                    className="h-auto justify-start rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-6 font-bold text-black hover:from-emerald-400 hover:to-green-400"
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

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <GraduationCap className="h-5 w-5 text-emerald-400" />
                  Academia AfiliadoPRO
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Mini aulas rápidas para deixar o admin mais confiante e mais vendedor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {academyItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-emerald-500/30"
                    >
                      <div className="mb-4 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                        <Rocket className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{item.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">🚀 Missão do dia</CardTitle>
                <CardDescription className="text-zinc-400">
                  Quanto mais etapas concluídas, mais sua loja fica pronta para converter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
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

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Loja pública</CardTitle>
                <CardDescription className="text-zinc-400">
                  Seu link público pronto para divulgação.
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
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Abrir loja
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  Gere produtos do nicho ou adicione manualmente com seu link de afiliado.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                    onClick={handleGenerateFakeProducts}
                    disabled={creatingFakeProducts}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {creatingFakeProducts ? 'Gerando...' : 'Gerar produtos do nicho'}
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
                  <div>
                    <CardTitle className="text-white">Meus produtos</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Clique em um produto para ver a página dele.
                    </CardDescription>
                  </div>

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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-black/30 transition-all hover:border-emerald-500/40 hover:ring-2 hover:ring-emerald-500/20"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => navigate(`/produto/${product.id}`)}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      </button>

                      <div className="p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                            {product.affiliateLink ? 'Link configurado' : 'Sem link'}
                          </span>
                          <span className="font-bold text-emerald-400">{product.price}</span>
                        </div>

                        <h4 className="mb-2 line-clamp-2 text-lg font-bold text-white">
                          {product.name}
                        </h4>

                        <p className="mb-4 line-clamp-3 text-sm text-zinc-400">
                          {product.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="border-white/10 bg-black/20 text-white hover:bg-white/5"
                            onClick={() => navigate(`/produto/${product.id}`)}
                          >
                            Ver
                          </Button>

                          <Button
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                            onClick={() => navigate(`/produto/${product.id}`)}
                          >
                            Abrir
                          </Button>
                        </div>
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