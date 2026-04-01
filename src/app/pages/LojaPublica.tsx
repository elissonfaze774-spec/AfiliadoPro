import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff,
  MessageCircle,
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
  whatsappGroupLink: string;
  niche: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  slogan: string;
  publicTitle: string;
  publicSubtitle: string;
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

type ProductCategory = {
  id: string;
  name: string;
  sortOrder: number;
  featured: boolean;
};

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  affiliateLink: string;
  priceValue: number;
  categoryId: string | null;
  sortOrder: number;
  isFeatured: boolean;
  isOffer: boolean;
  isPromotion: boolean;
  createdAt: string | null;
};

type SortType = 'recentes' | 'mais-caros' | 'mais-baratos' | 'nome';
type ShowcaseType = 'todos' | 'em-alta' | 'ofertas' | 'promocoes';

const MONEY_GREEN_DARK = '#052e16';

function ensureUrl(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
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

function buildDeviceHash() {
  try {
    const storageKey = 'afiliadopro-public-device-id';
    const existing = localStorage.getItem(storageKey);

    if (existing) return existing;

    const created =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function buildFingerprint() {
  const nav = globalThis.navigator;
  const screenData = globalThis.screen
    ? `${globalThis.screen.width}x${globalThis.screen.height}`
    : '0x0';

  return [
    buildDeviceHash(),
    nav?.userAgent ?? '',
    nav?.language ?? '',
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    screenData,
  ].join('::');
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
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
    publicTitle: row.public_title ?? '',
    publicSubtitle: row.public_subtitle ?? '',
    primaryColor: row.primary_color ?? '#052e16',
    secondaryColor: row.secondary_color ?? '#071b11',
    accentColor: row.accent_color ?? '#10b981',
    buttonBgColor: row.button_bg_color ?? '#10b981',
    buttonTextColor: row.button_text_color ?? '#03120c',
    cardBgColor: row.card_bg_color ?? 'rgba(255,255,255,0.04)',
    textColor: row.text_color ?? '#ffffff',
    mutedTextColor: row.muted_text_color ?? '#a1a1aa',
    headerBgColor: row.header_bg_color ?? 'rgba(0,0,0,0.35)',
    primaryButtonText: row.primary_button_text ?? 'Ver produtos',
    whatsappButtonText: row.whatsapp_button_text ?? 'Grupo no WhatsApp',
    themeMode: row.theme_mode ?? 'dark',
    active: Boolean(row.active),
    suspended: Boolean(row.suspended),
    accessExpiresAt: row.access_expires_at ?? null,
  };
}

function normalizeCategory(row: any): ProductCategory {
  return {
    id: String(row?.id ?? ''),
    name: String(row?.name ?? row?.title ?? 'Categoria'),
    sortOrder: Number(row?.sort_order ?? row?.order ?? 0),
    featured: Boolean(row?.is_featured),
  };
}

function normalizeProduct(row: any): Product {
  const priceValue =
    typeof row?.price === 'number'
      ? row.price
      : typeof row?.price === 'string'
        ? Number(row.price)
        : 0;

  return {
    id: String(row?.id ?? ''),
    name: row?.name ?? '',
    description: row?.description ?? '',
    image: row?.image ?? '',
    affiliateLink: row?.affiliate_link ?? row?.affiliateLink ?? '',
    priceValue: Number.isFinite(priceValue) ? priceValue : 0,
    categoryId: row?.category_id ?? null,
    sortOrder: Number(row?.sort_order ?? 0),
    isFeatured: Boolean(row?.is_featured),
    isOffer: Boolean(row?.is_offer),
    isPromotion: Boolean(row?.is_promotion),
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
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortType>('recentes');
  const [showcase, setShowcase] = useState<ShowcaseType>('todos');

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const productChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const categoryChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isAdminViewing = user?.role === 'admin' || user?.role === 'super-admin';

  const loadStoreAndProducts = async (slugParam?: string) => {
    const slug = String(slugParam ?? username ?? '').trim();

    if (!slug) {
      setStore(null);
      setCategories([]);
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
        setCategories([]);
        setProducts([]);
        return;
      }

      setStore(normalizedStore);

      if (
        !normalizedStore.active ||
        normalizedStore.suspended ||
        isStoreExpired(normalizedStore.accessExpiresAt)
      ) {
        setCategories([]);
        setProducts([]);
        return;
      }

      const [{ data: categoryRows, error: categoryError }, { data: productRows, error: productsError }] =
        await Promise.all([
          supabase
            .from('categories')
            .select('*')
            .eq('store_id', normalizedStore.id)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
          supabase
            .from('products')
            .select('*')
            .eq('store_id', normalizedStore.id)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false }),
        ]);

      if (categoryError) throw categoryError;
      if (productsError) throw productsError;

      setCategories((categoryRows ?? []).map(normalizeCategory));
      setProducts((productRows ?? []).map(normalizeProduct));
    } catch (error) {
      console.error('Erro ao carregar loja pública:', error);
      setStore(null);
      setCategories([]);
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

    if (categoryChannelRef.current) {
      void supabase.removeChannel(categoryChannelRef.current);
      categoryChannelRef.current = null;
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

    categoryChannelRef.current = supabase
      .channel(`public-categories-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
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

      if (categoryChannelRef.current) {
        void supabase.removeChannel(categoryChannelRef.current);
        categoryChannelRef.current = null;
      }
    };
  }, [store?.id, store?.username]);

  const pageStyle = useMemo(() => {
    if (!store) return {};

    return {
      background: `radial-gradient(circle at top left, ${store.accentColor}20, transparent 25%), linear-gradient(180deg, ${store.primaryColor} 0%, ${store.secondaryColor} 100%)`,
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
      backdropFilter: 'blur(12px)',
    };
  }, [store]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    let list = [...products];

    if (term) {
      list = list.filter((product) => {
        return (
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term)
        );
      });
    }

    if (showcase === 'em-alta') {
      list = list.filter((product) => product.isFeatured);
    } else if (showcase === 'ofertas') {
      list = list.filter((product) => product.isOffer);
    } else if (showcase === 'promocoes') {
      list = list.filter((product) => product.isPromotion);
    }

    if (sort === 'mais-caros') {
      list.sort((a, b) => b.priceValue - a.priceValue);
    } else if (sort === 'mais-baratos') {
      list.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sort === 'nome') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
      list.sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime();
        const bTime = new Date(b.createdAt ?? 0).getTime();
        return bTime - aTime;
      });
    }

    return list;
  }, [products, search, sort, showcase]);

  const groupedRows = useMemo(() => {
    const map = new Map<string, Product[]>();

    categories.forEach((category) => {
      map.set(category.id, []);
    });

    filteredProducts.forEach((product) => {
      const key = product.categoryId || '__sem_categoria__';
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    });

    const rows: Array<{ id: string; title: string; products: Product[] }> = [];

    const featured = filteredProducts.filter((item) => item.isFeatured);
    if (showcase === 'todos' && featured.length > 0) {
      rows.push({ id: '__em_alta__', title: 'Em alta', products: featured });
    }

    categories
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'pt-BR'))
      .forEach((category) => {
        const categoryProducts = (map.get(category.id) ?? []).sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );

        if (categoryProducts.length > 0) {
          rows.push({
            id: category.id,
            title: category.name,
            products: categoryProducts,
          });
        }
      });

    const withoutCategory = map.get('__sem_categoria__') ?? [];
    if (withoutCategory.length > 0 && rows.length === 0) {
      rows.push({
        id: '__geral__',
        title: store?.niche || 'Produtos',
        products: withoutCategory,
      });
    }

    return rows;
  }, [categories, filteredProducts, showcase, store?.niche]);

  const openProductAction = async (product: Product) => {
    if (store?.id && product.id) {
      const today = getTodayKey();
      const deviceHash = buildDeviceHash();
      const fingerprint = buildFingerprint();
      const userAgent = navigator.userAgent;

      const { data: existing } = await supabase
        .from('click_tracking')
        .select('id')
        .eq('store_id', store.id)
        .eq('product_id', product.id)
        .eq('click_date', today)
        .eq('device_hash', deviceHash)
        .eq('fingerprint', fingerprint)
        .maybeSingle();

      if (!existing?.id) {
        await supabase.from('click_tracking').insert({
          store_id: store.id,
          product_id: product.id,
          device_hash: deviceHash,
          fingerprint,
          user_agent: userAgent,
          click_date: today,
        });
      } else {
        await supabase
          .from('click_tracking')
          .update({ last_clicked_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
    }

    const affiliateUrl = ensureUrl(product.affiliateLink);

    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.error('Este produto ainda não possui link de afiliado configurado.');
  };

  const handleGroupWhatsApp = () => {
    const groupUrl = ensureUrl(store?.whatsappGroupLink ?? '');

    if (groupUrl) {
      window.open(groupUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!store?.whatsapp) {
      toast.error('Grupo do WhatsApp não configurado.');
      return;
    }

    const phone = String(store.whatsapp ?? '').replace(/\D/g, '');
    const message = `Olá! Vim pela loja ${store.name} e quero entrar no grupo.`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const scrollRow = (rowId: string, direction: 'left' | 'right') => {
    const element = rowRefs.current[rowId];
    if (!element) return;

    const amount = Math.max(element.clientWidth * 0.85, 280);
    element.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
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

  return (
    <>
      <div className="min-h-screen pb-16" style={pageStyle}>
        <header className="sticky top-0 z-30 border-b border-white/10" style={headerStyle}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
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
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:space-y-8 md:py-10">
          <section className="overflow-hidden rounded-[36px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="relative h-[120px] sm:h-[150px] md:h-[190px] lg:h-[220px]">
              {currentStore.bannerUrl ? (
                <ProductImage
                  src={ensureUrl(currentStore.bannerUrl)}
                  alt={currentStore.name}
                  eager
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-black via-zinc-900 to-black" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>

            <div className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(3,10,24,0.92)_0%,rgba(4,18,38,0.96)_100%)] px-4 py-4 md:px-6 md:py-5">
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
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
                      @{currentStore.username}
                    </span>
                  )}

                  {!!currentStore.niche && (
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
                      {currentStore.niche}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/15 bg-black/30 text-xl font-black text-white shadow-2xl md:h-24 md:w-24 md:rounded-[28px]">
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

                  <div className="min-w-0 flex-1 pt-1">
                    <h1
                      className="break-words text-3xl font-black leading-none md:text-5xl"
                      style={{ color: currentStore.textColor }}
                    >
                      {currentStore.publicTitle || currentStore.name}
                    </h1>

                    <p
                      className="mt-3 max-w-2xl text-sm leading-7 md:text-base"
                      style={{ color: currentStore.mutedTextColor }}
                    >
                      {currentStore.publicSubtitle ||
                        currentStore.description ||
                        'Explore os produtos disponíveis desta loja e encontre a melhor oferta para você.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="w-full rounded-2xl px-6 font-bold sm:w-auto"
                    style={{
                      backgroundColor: currentStore.buttonBgColor,
                      color: currentStore.buttonTextColor,
                    }}
                    onClick={() => {
                      const section = document.getElementById('produtos');
                      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    {currentStore.primaryButtonText || 'Ver produtos'}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5 sm:w-auto"
                    onClick={handleGroupWhatsApp}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {currentStore.whatsappButtonText || 'Grupo no WhatsApp'}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <div className="rounded-[32px] border border-white/10 p-6 md:p-7" style={cardStyle}>
              <div className="grid gap-6 xl:grid-cols-[1fr_280px] xl:items-end">
                <div>
                  <h2
                    className="text-2xl font-black md:text-3xl"
                    style={{ color: currentStore.textColor }}
                  >
                    Vitrine organizada para vender melhor
                  </h2>

                  <p
                    className="mt-3 max-w-3xl text-base leading-7"
                    style={{ color: currentStore.mutedTextColor }}
                  >
                    Navegue por categorias, deslize as fileiras e encontre o produto certo mais rápido.
                  </p>

                  <div className="relative mt-5">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="Buscar produtos..."
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {[
                      { value: 'todos', label: 'Todos' },
                      { value: 'em-alta', label: 'Em alta' },
                      { value: 'ofertas', label: 'Ofertas' },
                      { value: 'promocoes', label: 'Promoções' },
                    ].map((chip) => {
                      const active = showcase === chip.value;
                      return (
                        <button
                          key={chip.value}
                          type="button"
                          onClick={() => setShowcase(chip.value as ShowcaseType)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? 'border-emerald-500/20 bg-emerald-500 text-black'
                              : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]'
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
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
            </div>
          </section>

          <section id="produtos" className="scroll-mt-28">
            <div className="mb-6">
              <h2
                className="text-2xl font-black md:text-3xl"
                style={{ color: currentStore.textColor }}
              >
                Produtos da loja
              </h2>
              <p className="mt-2" style={{ color: currentStore.mutedTextColor }}>
                Escolha um produto, veja os detalhes e avance para a oferta.
              </p>
            </div>

            {groupedRows.length === 0 ? (
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
              <div className="space-y-8">
                {groupedRows.map((row) => (
                  <div key={row.id}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-white md:text-2xl">{row.title}</h3>
                        <p className="mt-1 text-sm text-zinc-400">
                          {row.products.length} produto(s) nesta fileira
                        </p>
                      </div>

                      <div className="hidden gap-2 md:flex">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                          onClick={() => scrollRow(row.id, 'left')}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                          onClick={() => scrollRow(row.id, 'right')}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div
                      ref={(node) => {
                        rowRefs.current[row.id] = node;
                      }}
                      className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      {row.products.map((product) => (
                        <div
                          key={product.id}
                          className="group w-[260px] shrink-0 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30"
                          style={cardStyle}
                        >
                          <div className="relative h-56 overflow-hidden bg-black/20">
                            <ProductImage
                              src={ensureUrl(product.image)}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

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
                          </div>

                          <div className="p-5">
                            <h3 className="text-lg font-black" style={{ color: currentStore.textColor }}>
                              {product.name}
                            </h3>

                            <p
                              className="mt-3 line-clamp-3 text-sm leading-6"
                              style={{ color: currentStore.mutedTextColor }}
                            >
                              {product.description || 'Sem descrição disponível para este produto.'}
                            </p>

                            <div className="mt-5 flex flex-col gap-3">
                              <Button
                                className="w-full rounded-2xl font-bold"
                                style={{
                                  backgroundColor: currentStore.buttonBgColor,
                                  color: currentStore.buttonTextColor,
                                }}
                                onClick={() => void openProductAction(product)}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Comprar agora
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
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                    <h3 className="text-2xl font-black text-white">{selectedProduct.name}</h3>
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
                    onClick={() => void openProductAction(selectedProduct)}
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
