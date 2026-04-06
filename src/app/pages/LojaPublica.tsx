import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  ExternalLink,
  Gift,
  ImageOff,
  Package,
  Search,
  ShoppingBag,
  Store as StoreIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthTemp';

type StoreData = {
  id: string;
  name: string;
  username: string;
  whatsapp: string;
  whatsappGroupLink?: string;
  niche: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  cardBgColor: string;
  textColor: string;
  mutedTextColor: string;
  headerBgColor: string;
  primaryButtonText: string;
  whatsappButtonText: string;
  themeMode: string;
  active: boolean;
  suspended: boolean;
  accessExpiresAt: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  affiliateLink: string;
  priceValue: number;
  categoryName: string;
  createdAt: string | null;
};

type SortType = 'recentes' | 'mais-caros' | 'mais-baratos' | 'nome';

const MONEY_GREEN_DARK = '#052e16';

function ensureUrl(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeGroupButtonText(value?: string | null) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) return 'Grupo de Ofertas';

  const normalized = trimmed.toLowerCase();

  if (
    normalized === 'falar no whatsapp' ||
    normalized === 'grupo no whatsapp' ||
    normalized === 'whatsapp'
  ) {
    return 'Grupo de Ofertas';
  }

  return trimmed;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getInitials(name: string) {
  return String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function isStoreExpired(value?: string | null) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() < Date.now();
}

function normalizeStore(row: any): StoreData | null {
  if (!row?.id) return null;

  return {
    id: String(row.id),
    name: row.store_name ?? row.name ?? 'Loja',
    username: row.slug ?? row.username ?? '',
    whatsapp: row.whatsapp_number ?? row.whatsapp ?? '',
    whatsappGroupLink: row.whatsapp_group_link ?? '',
    niche: row.niche ?? '',
    logoUrl: row.logo_url ?? '',
    bannerUrl: row.banner_url ?? '',
    description: row.description ?? '',
    slogan: row.slogan ?? '',
    primaryColor: row.primary_color ?? '#052e16',
    secondaryColor: row.secondary_color ?? '#071b11',
    accentColor: row.accent_color ?? '#10b981',
    buttonBgColor: row.button_bg_color ?? '#10b981',
    buttonTextColor: row.button_text_color ?? '#03120c',
    cardBgColor: row.card_bg_color ?? 'rgba(255,255,255,0.04)',
    textColor: row.text_color ?? '#ffffff',
    mutedTextColor: row.muted_text_color ?? '#cbd5e1',
    headerBgColor: row.header_bg_color ?? 'rgba(0,0,0,0.35)',
    primaryButtonText: row.primary_button_text ?? 'Ver produtos',
    whatsappButtonText: normalizeGroupButtonText(row.whatsapp_button_text),
    themeMode: row.theme_mode ?? 'dark',
    active: Boolean(row.active),
    suspended: Boolean(row.suspended),
    accessExpiresAt: row.access_expires_at ?? null,
  };
}

function normalizeProduct(row: any, fallbackCategory: string): Product {
  const priceValue =
    typeof row?.price === 'number'
      ? row.price
      : typeof row?.price === 'string'
        ? Number(row.price)
        : 0;

  const categoryName =
    row?.category_name ??
    row?.category ??
    row?.categoryLabel ??
    row?.niche ??
    row?.categories?.name ??
    fallbackCategory;

  return {
    id: String(row?.id ?? ''),
    name: row?.name ?? '',
    description: row?.description ?? '',
    image: row?.image ?? '',
    affiliateLink: row?.affiliate_link ?? row?.affiliateLink ?? '',
    priceValue: Number.isFinite(priceValue) ? priceValue : 0,
    categoryName: String(categoryName ?? fallbackCategory).trim() || fallbackCategory,
    createdAt: row?.created_at ?? null,
  };
}

function ProductImage({
  src,
  alt,
  className = 'h-full w-full object-cover',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black/20">
        <div className="text-center">
          <ImageOff className="mx-auto mb-2 h-8 w-8 text-zinc-500" />
          <p className="text-sm text-zinc-500">Imagem indisponível</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      className={className}
      onError={() => setError(true)}
      draggable={false}
    />
  );
}

function StoreUnavailable({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/20">
            <StoreIcon className="h-10 w-10 text-zinc-500" />
          </div>

          <h1 className="text-3xl font-black text-white">Loja temporariamente indisponível</h1>
          <p className="mt-3 text-zinc-400">
            Esta loja está temporariamente indisponível no momento. Tente novamente mais tarde.
          </p>

          <div className="mt-6">
            <Button
              variant="outline"
              className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LojaPublica() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('recentes');

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const productChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const categoryRowsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const initializedRowsRef = useRef<Record<string, boolean>>({});

  const isAdminViewing = user?.role === 'admin' || user?.role === 'super-admin';

  const loadStoreAndProducts = async (slugParam?: string) => {
    const slug = String(slugParam ?? username ?? '').trim();

    if (!slug) {
      setStore(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: storeRow, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (storeError) throw storeError;

      const normalizedStore = normalizeStore(storeRow);

      if (!normalizedStore) {
        setStore(null);
        setProducts([]);
        return;
      }

      setStore(normalizedStore);

      if (!normalizedStore.active || normalizedStore.suspended || isStoreExpired(normalizedStore.accessExpiresAt)) {
        setProducts([]);
        return;
      }

      const { data: productRows, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', normalizedStore.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const fallbackCategory = normalizedStore.niche || 'Produtos em destaque';
      setProducts((productRows ?? []).map((row) => normalizeProduct(row, fallbackCategory)));
    } catch (error) {
      console.error('Erro ao carregar loja pública:', error);
      setStore(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStoreAndProducts();
  }, [username]);

  useEffect(() => {
    const storeId = store?.id ?? null;
    const storeUsername = store?.username ?? null;

    if (storeChannelRef.current) {
      void supabase.removeChannel(storeChannelRef.current);
      storeChannelRef.current = null;
    }

    if (productChannelRef.current) {
      void supabase.removeChannel(productChannelRef.current);
      productChannelRef.current = null;
    }

    if (!storeId || !storeUsername) return;

    storeChannelRef.current = supabase
      .channel(`public-store-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${storeId}`,
        },
        async () => {
          await loadStoreAndProducts(storeUsername);
        },
      )
      .subscribe();

    productChannelRef.current = supabase
      .channel(`public-products-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${storeId}`,
        },
        async () => {
          await loadStoreAndProducts(storeUsername);
        },
      )
      .subscribe();

    return () => {
      if (storeChannelRef.current) {
        void supabase.removeChannel(storeChannelRef.current);
        storeChannelRef.current = null;
      }

      if (productChannelRef.current) {
        void supabase.removeChannel(productChannelRef.current);
        productChannelRef.current = null;
      }
    };
  }, [store?.id, store?.username]);

  const pageStyle = useMemo(() => {
    if (!store) return {};

    return {
      background: `radial-gradient(circle at top left, ${store.accentColor}18, transparent 26%), radial-gradient(circle at top right, rgba(255,255,255,0.05), transparent 20%), linear-gradient(180deg, ${store.primaryColor} 0%, ${store.secondaryColor} 100%)`,
    };
  }, [store]);

  const cardStyle = useMemo(() => {
    if (!store) return {};

    return {
      background: store.cardBgColor || 'rgba(255,255,255,0.04)',
      border: `1px solid ${store.accentColor}22`,
    };
  }, [store]);

  const headerStyle = useMemo(() => {
    if (!store) return {};

    return {
      background: store.headerBgColor || 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(14px)',
    };
  }, [store]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = [...products];

    if (term) {
      list = list.filter((product) => {
        return (
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.categoryName.toLowerCase().includes(term)
        );
      });
    }

    if (sort === 'mais-caros') {
      list.sort((a, b) => b.priceValue - a.priceValue);
    } else if (sort === 'mais-baratos') {
      list.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sort === 'nome') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
      list.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    return list;
  }, [products, search, sort]);

  const groupedProducts = useMemo(() => {
    const map = new Map<string, Product[]>();

    filteredProducts.forEach((product) => {
      const categoryLabel = product.categoryName || store?.niche || 'Produtos em destaque';
      const current = map.get(categoryLabel) ?? [];
      current.push(product);
      map.set(categoryLabel, current);
    });

    return Array.from(map.entries()).map(([label, items], index) => ({
      id: `${label}-${index}`.toLowerCase().replace(/[^a-z0-9]+/gi, '-'),
      label,
      items,
      loopItems: items.length > 1 ? [...items, ...items, ...items] : items,
    }));
  }, [filteredProducts, store?.niche]);

  const categoryChips = useMemo(() => {
    return groupedProducts.map((group) => ({
      id: group.id,
      label: group.label,
      total: group.items.length,
    }));
  }, [groupedProducts]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      groupedProducts.forEach((group) => {
        if (group.items.length <= 1) return;

        const row = categoryRowsRef.current[group.id];
        if (!row || initializedRowsRef.current[group.id]) return;

        row.scrollLeft = row.scrollWidth / 3;
        initializedRowsRef.current[group.id] = true;
      });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [groupedProducts]);

  const openProductAction = (product: Product) => {
    const affiliateUrl = ensureUrl(product.affiliateLink);

    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.error('Este produto ainda não possui link de afiliado configurado.');
  };

  const handleOffersGroup = async () => {
    const rawGroupLink = ensureUrl(store?.whatsappGroupLink ?? '');
    const elegantMessage = `Olá! Vim pela loja ${store?.name ?? 'AfiliadoPRO'} e quero participar do grupo de ofertas.`;

    if (rawGroupLink) {
      try {
        const url = new URL(rawGroupLink);
        const host = url.hostname.toLowerCase();

        const supportsPrefilledMessage =
          host.includes('wa.me') ||
          host.includes('whatsapp.com') ||
          host.includes('api.whatsapp.com');

        if (supportsPrefilledMessage) {
          url.searchParams.set('text', elegantMessage);
          window.open(url.toString(), '_blank', 'noopener,noreferrer');
          return;
        }

        await navigator.clipboard.writeText(elegantMessage);
        window.open(url.toString(), '_blank', 'noopener,noreferrer');
        toast.success('Grupo aberto. A mensagem pronta foi copiada.');
        return;
      } catch {
        try {
          await navigator.clipboard.writeText(elegantMessage);
        } catch {}

        window.open(rawGroupLink, '_blank', 'noopener,noreferrer');
        toast.success('Grupo aberto. A mensagem pronta foi copiada.');
        return;
      }
    }

    if (!store?.whatsapp) {
      toast.error('Grupo de ofertas não configurado.');
      return;
    }

    const phone = String(store.whatsapp ?? '').replace(/\D/g, '');

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(elegantMessage)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const scrollToProducts = () => {
    const section = document.getElementById('produtos');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToCategory = (categoryId: string) => {
    const section = document.getElementById(categoryId);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleInfiniteRowScroll = (categoryId: string, originalItemsLength: number) => {
    if (originalItemsLength <= 1) return;

    const row = categoryRowsRef.current[categoryId];
    if (!row) return;

    const oneSetWidth = row.scrollWidth / 3;
    const leftLimit = oneSetWidth * 0.35;
    const rightLimit = oneSetWidth * 1.65;

    if (row.scrollLeft <= leftLimit) {
      row.scrollLeft += oneSetWidth;
    } else if (row.scrollLeft >= rightLimit) {
      row.scrollLeft -= oneSetWidth;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-zinc-400">Carregando loja...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/20">
              <StoreIcon className="h-10 w-10 text-zinc-500" />
            </div>

            <h1 className="text-3xl font-black text-white">Loja não encontrada</h1>
            <p className="mt-3 text-zinc-400">
              Esse link não existe ou a loja ainda não foi configurada.
            </p>

            <div className="mt-6">
              <Button
                variant="outline"
                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store.active || store.suspended || isStoreExpired(store.accessExpiresAt)) {
    return <StoreUnavailable onBack={() => navigate('/')} />;
  }

  const currentStore = store;
  const bannerImageClass =
    'h-full w-full object-cover scale-[1.02] brightness-[1.08] contrast-[1.08] saturate-[1.18]';

  return (
    <>
      <div className="min-h-screen pb-14" style={pageStyle}>
        <header className="sticky top-0 z-40 border-b border-white/10" style={headerStyle}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {isAdminViewing ? (
                <Button
                  variant="ghost"
                  className="rounded-2xl text-zinc-300 hover:bg-white/5 hover:text-white"
                  onClick={() => navigate('/painel')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao painel
                </Button>
              ) : (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{currentStore.name}</p>
                  <p className="truncate text-xs text-zinc-400">@{currentStore.username}</p>
                </div>
              )}
            </div>

            {!isAdminViewing ? (
              <Button
                variant="outline"
                className="hidden rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5 sm:inline-flex"
                onClick={() => void handleOffersGroup()}
              >
                <Gift className="mr-2 h-4 w-4" />
                {normalizeGroupButtonText(currentStore.whatsappButtonText)}
              </Button>
            ) : null}
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 px-4 py-4 md:space-y-7 md:py-8">
          <section className="overflow-hidden rounded-[34px] border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="relative h-[170px] sm:h-[230px] md:h-[340px] lg:h-[400px]">
              {currentStore.bannerUrl ? (
                <ProductImage
                  src={ensureUrl(currentStore.bannerUrl)}
                  alt={currentStore.name}
                  eager
                  className={bannerImageClass}
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_30%),linear-gradient(135deg,#07111f_0%,#0b1730_50%,#06121f_100%)]" />
              )}

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.10)_38%,rgba(0,0,0,0.30)_100%)] md:bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.18)_35%,rgba(0,0,0,0.56)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.10),transparent_34%)]" />

              <div className="absolute inset-x-0 bottom-0 hidden p-6 md:block lg:p-8">
                <div className="max-w-4xl">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {currentStore.slogan ? (
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{
                          backgroundColor: `${currentStore.accentColor}22`,
                          color: currentStore.accentColor,
                          border: `1px solid ${currentStore.accentColor}33`,
                        }}
                      >
                        {currentStore.slogan}
                      </span>
                    ) : null}

                    {!!currentStore.username && (
                      <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-100 backdrop-blur-md">
                        @{currentStore.username}
                      </span>
                    )}

                    {!!currentStore.niche && (
                      <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-100 backdrop-blur-md">
                        {currentStore.niche}
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-black/20 text-xl font-black text-white shadow-2xl backdrop-blur-md">
                      {currentStore.logoUrl ? (
                        <ProductImage
                          src={ensureUrl(currentStore.logoUrl)}
                          alt={currentStore.name}
                          eager
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(currentStore.name || 'L')}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h1
                        className="break-words text-5xl font-black leading-none"
                        style={{ color: currentStore.textColor }}
                      >
                        {currentStore.name}
                      </h1>

                      <p
                        className="mt-3 max-w-2xl text-base leading-7 text-zinc-100/90"
                      >
                        {currentStore.description ||
                          'Explore os produtos disponíveis desta loja e encontre a melhor oferta para você.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="w-full rounded-2xl px-6 font-bold shadow-[0_12px_28px_rgba(255,255,255,0.14)] sm:w-auto"
                      style={{
                        backgroundColor: currentStore.buttonBgColor,
                        color: currentStore.buttonTextColor,
                      }}
                      onClick={scrollToProducts}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      {currentStore.primaryButtonText || 'Ver produtos'}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full rounded-2xl border-white/15 bg-black/15 text-white backdrop-blur-md hover:bg-white/10 sm:w-auto"
                      onClick={() => void handleOffersGroup()}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      {normalizeGroupButtonText(currentStore.whatsappButtonText)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(8,14,32,0.94)_0%,rgba(6,12,28,0.98)_100%)] p-4 md:hidden">
              <div className="mb-3 flex flex-wrap gap-2">
                {currentStore.slogan ? (
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{
                      backgroundColor: `${currentStore.accentColor}20`,
                      color: currentStore.accentColor,
                      border: `1px solid ${currentStore.accentColor}30`,
                    }}
                  >
                    {currentStore.slogan}
                  </span>
                ) : null}

                {!!currentStore.username && (
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-200">
                    @{currentStore.username}
                  </span>
                )}

                {!!currentStore.niche && (
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-200">
                    {currentStore.niche}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-black/30 text-xl font-black text-white shadow-2xl">
                  {currentStore.logoUrl ? (
                    <ProductImage
                      src={ensureUrl(currentStore.logoUrl)}
                      alt={currentStore.name}
                      eager
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(currentStore.name || 'L')}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1
                    className="break-words text-[38px] font-black leading-[0.98] tracking-[-0.03em]"
                    style={{ color: currentStore.textColor }}
                  >
                    {currentStore.name}
                  </h1>
                </div>
              </div>

              <p
                className="mt-3 text-[15px] leading-7 text-zinc-100/90"
              >
                {currentStore.description ||
                  'Explore os produtos disponíveis desta loja e encontre a melhor oferta para você.'}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <Button
                  className="w-full rounded-2xl px-6 font-bold shadow-[0_12px_28px_rgba(255,255,255,0.12)]"
                  style={{
                    backgroundColor: currentStore.buttonBgColor,
                    color: currentStore.buttonTextColor,
                  }}
                  onClick={scrollToProducts}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {currentStore.primaryButtonText || 'Ver produtos'}
                </Button>

                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-white/10 bg-black/18 text-white hover:bg-white/5"
                  onClick={() => void handleOffersGroup()}
                >
                  <Gift className="mr-2 h-4 w-4" />
                  {normalizeGroupButtonText(currentStore.whatsappButtonText)}
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/10 p-4 md:p-5" style={cardStyle}>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
              <div>
                <p
                  className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em]"
                  style={{ color: currentStore.accentColor }}
                >
                  vitrine premium
                </p>

                <h2
                  className="text-2xl font-black md:text-3xl"
                  style={{ color: currentStore.textColor }}
                >
                  Produtos por categoria
                </h2>

                <p
                  className="mt-2 max-w-3xl text-sm leading-6 md:text-base"
                  style={{ color: currentStore.mutedTextColor }}
                >
                  Agora com sensação de vitrine infinita ao deslizar, deixando a loja mais elegante, viva e viciante.
                </p>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="Buscar por nome, descrição ou categoria..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <ArrowUpDown className="h-4 w-4 text-emerald-400" />
                  Ordenar por
                </label>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="mais-caros">Mais caros</option>
                  <option value="mais-baratos">Mais baratos</option>
                  <option value="nome">Nome</option>
                </select>
              </div>
            </div>

            {categoryChips.length > 0 ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categoryChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-500/30 hover:bg-emerald-500/10"
                    onClick={() => scrollToCategory(chip.id)}
                  >
                    <span>{chip.label}</span>
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-black text-black">
                      {chip.total}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section id="produtos" className="scroll-mt-24 space-y-5">
            {groupedProducts.length === 0 ? (
              <div
                className="rounded-[32px] border border-white/10 p-10 text-center"
                style={cardStyle}
              >
                <Package className="mx-auto mb-4 h-14 w-14 text-zinc-600" />
                <h3 className="text-xl font-bold" style={{ color: currentStore.textColor }}>
                  Nenhum produto encontrado
                </h3>
                <p className="mt-2" style={{ color: currentStore.mutedTextColor }}>
                  Tente buscar por outro nome ou volte mais tarde.
                </p>
              </div>
            ) : (
              groupedProducts.map((group) => (
                <div
                  key={group.id}
                  id={group.id}
                  className="rounded-[34px] border border-white/10 p-4 md:p-5"
                  style={cardStyle}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="text-[11px] font-bold uppercase tracking-[0.28em]"
                        style={{ color: currentStore.accentColor }}
                      >
                        categoria
                      </p>
                      <h3
                        className="truncate text-2xl font-black md:text-3xl"
                        style={{ color: currentStore.textColor }}
                      >
                        {group.label}
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: currentStore.mutedTextColor }}>
                        {group.items.length} {group.items.length === 1 ? 'produto disponível' : 'produtos disponíveis'}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/35 via-black/15 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/35 via-black/15 to-transparent" />

                    <div
                      ref={(element) => {
                        categoryRowsRef.current[group.id] = element;
                      }}
                      onScroll={() => handleInfiniteRowScroll(group.id, group.items.length)}
                      className="flex gap-4 overflow-x-auto px-1 pb-2 pr-14 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {group.loopItems.map((product, index) => (
                        <article
                          key={`${group.id}-${product.id}-${index}`}
                          className="group overflow-hidden rounded-[30px] border border-white/10 bg-black/20 shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30"
                          style={{
                            width: 'min(84vw, 330px)',
                            minWidth: 'min(84vw, 330px)',
                          }}
                        >
                          <div className="relative h-[280px] overflow-hidden bg-black/30">
                            <ProductImage
                              src={ensureUrl(product.image)}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                            />

                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.00)_0%,rgba(0,0,0,0.08)_45%,rgba(0,0,0,0.62)_100%)]" />

                            <div className="absolute left-4 top-4">
                              <span className="inline-flex rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                                {group.label}
                              </span>
                            </div>

                            <div className="absolute right-4 top-4">
                              <span
                                className="inline-flex items-center rounded-full border px-4 py-2 text-base font-black shadow-[0_10px_30px_rgba(34,197,94,0.28)]"
                                style={{
                                  color: MONEY_GREEN_DARK,
                                  borderColor: 'rgba(255,255,255,0.18)',
                                  background:
                                    'linear-gradient(135deg, rgba(34,197,94,0.96) 0%, rgba(74,222,128,0.96) 100%)',
                                  backdropFilter: 'blur(16px)',
                                }}
                              >
                                {formatMoney(product.priceValue)}
                              </span>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <h4 className="line-clamp-2 text-xl font-black text-white">{product.name}</h4>
                            </div>
                          </div>

                          <div className="p-5">
                            <p
                              className="line-clamp-3 text-sm leading-6"
                              style={{ color: currentStore.mutedTextColor }}
                            >
                              {product.description || 'Sem descrição disponível para este produto.'}
                            </p>

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <Button
                                className="w-full rounded-2xl font-bold"
                                style={{
                                  backgroundColor: currentStore.buttonBgColor,
                                  color: currentStore.buttonTextColor,
                                }}
                                onClick={() => openProductAction(product)}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Comprar
                              </Button>

                              <Button
                                variant="outline"
                                className="w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                onClick={() => setSelectedProduct(product)}
                              >
                                Ver detalhes
                              </Button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>

      {selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#050505] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid max-h-[90vh] overflow-auto md:grid-cols-2">
              <div className="h-[320px] bg-black/20 md:h-full">
                <ProductImage
                  src={ensureUrl(selectedProduct.image)}
                  alt={selectedProduct.name}
                  eager
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 md:p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-emerald-400">
                      {selectedProduct.categoryName}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">{selectedProduct.name}</h3>
                    <p className="mt-2 text-2xl font-black text-emerald-400">
                      {formatMoney(selectedProduct.priceValue)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    className="shrink-0 rounded-2xl text-zinc-400 hover:bg-white/5 hover:text-white"
                    onClick={() => setSelectedProduct(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-sm leading-7 text-zinc-400">
                  {selectedProduct.description || 'Sem descrição disponível para este produto.'}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1 rounded-2xl font-bold"
                    style={{
                      backgroundColor: currentStore.buttonBgColor,
                      color: currentStore.buttonTextColor,
                    }}
                    onClick={() => openProductAction(selectedProduct)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Comprar agora
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
