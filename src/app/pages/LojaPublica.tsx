import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpDown,
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
};

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  affiliateLink: string;
  priceValue: number;
};

type SortType = 'recentes' | 'mais-caros' | 'mais-baratos' | 'nome';

const MONEY_GREEN = '#22c55e';
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

function normalizeStore(row: any): StoreData | null {
  if (!row?.id) return null;

  return {
    id: String(row.id),
    name: row.store_name ?? row.name ?? 'Loja',
    username: row.slug ?? row.username ?? '',
    whatsapp: row.whatsapp_number ?? row.whatsapp ?? '',
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
    mutedTextColor: row.muted_text_color ?? '#a1a1aa',
    headerBgColor: row.header_bg_color ?? 'rgba(0,0,0,0.35)',
    primaryButtonText: row.primary_button_text ?? 'Ver produtos',
    whatsappButtonText: row.whatsapp_button_text ?? 'Falar no WhatsApp',
    themeMode: row.theme_mode ?? 'dark',
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

      const { data: productRows, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', normalizedStore.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      setProducts((productRows ?? []).map(normalizeProduct));
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

    if (sort === 'mais-caros') {
      list.sort((a, b) => b.priceValue - a.priceValue);
    } else if (sort === 'mais-baratos') {
      list.sort((a, b) => a.priceValue - b.priceValue);
    } else if (sort === 'nome') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }

    return list;
  }, [products, search, sort]);

  const openProductAction = (product: Product) => {
    const affiliateUrl = ensureUrl(product.affiliateLink);

    if (affiliateUrl) {
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.error('Este produto ainda não possui link de afiliado configurado.');
  };

  const handleWhatsApp = () => {
    if (!store?.whatsapp) {
      toast.error('WhatsApp da loja não configurado.');
      return;
    }

    const phone = String(store.whatsapp ?? '').replace(/\D/g, '');
    const message = `Olá! Vim pela loja ${store.name} e quero mais informações.`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
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
                      {currentStore.name}
                    </h1>

                    <p
                      className="mt-3 max-w-2xl text-sm leading-7 md:text-base"
                      style={{ color: currentStore.mutedTextColor }}
                    >
                      {currentStore.description ||
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
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {currentStore.whatsappButtonText || 'Falar no WhatsApp'}
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
                    Encontre o produto ideal
                  </h2>

                  <p
                    className="mt-3 max-w-3xl text-base leading-7"
                    style={{ color: currentStore.mutedTextColor }}
                  >
                    Navegue pela vitrine, filtre mais rápido e abra o produto que mais combina com
                    você.
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
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
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
            </div>

            {filteredProducts.length === 0 ? (
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group overflow-hidden rounded-[32px] border border-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30"
                    style={cardStyle}
                  >
                    <div className="relative h-64 overflow-hidden bg-black/20">
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
                      <h3 className="text-xl font-black" style={{ color: currentStore.textColor }}>
                        {product.name}
                      </h3>

                      <p
                        className="mt-3 line-clamp-3 text-sm leading-6"
                        style={{ color: currentStore.mutedTextColor }}
                      >
                        {product.description || 'Sem descrição disponível para este produto.'}
                      </p>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Button
                          className="flex-1 rounded-2xl font-bold"
                          style={{
                            backgroundColor: currentStore.buttonBgColor,
                            color: currentStore.buttonTextColor,
                          }}
                          onClick={() => openProductAction(product)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Comprar agora
                        </Button>

                        <Button
                          variant="outline"
                          className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
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
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-6">
              <div className="min-w-0">
                <h3 className="truncate text-2xl font-black text-white">
                  {selectedProduct.name}
                </h3>
                <p className="mt-1 truncate text-zinc-400">{currentStore.name}</p>
              </div>

              <button
                type="button"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:text-white"
                onClick={() => setSelectedProduct(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="h-[280px] bg-black/20 sm:h-[320px] lg:h-full">
                  <ProductImage
                    src={ensureUrl(selectedProduct.image)}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-6 md:p-8">
                  <div
                    className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: `${currentStore.accentColor}22`,
                      color: currentStore.accentColor,
                      border: `1px solid ${currentStore.accentColor}33`,
                    }}
                  >
                    Produto em destaque
                  </div>

                  <div
                    className="mb-5 text-3xl font-black md:text-4xl"
                    style={{ color: MONEY_GREEN }}
                  >
                    {formatMoney(selectedProduct.priceValue)}
                  </div>

                  <p className="leading-7 text-zinc-300">
                    {selectedProduct.description || 'Sem descrição disponível para este produto.'}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="rounded-2xl font-bold"
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
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {currentStore.whatsappButtonText || 'Falar no WhatsApp'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}