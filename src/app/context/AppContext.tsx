import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthTemp';

export interface ProductCategory {
  id: string;
  name: string;
  sortOrder: number;
  featured: boolean;
}

export interface Product {
  id: string;
  affiliateLink: string;
  name: string;
  image: string;
  price: string;
  priceValue?: number;
  description: string;
  categoryId?: string | null;
  sortOrder?: number;
  isFeatured?: boolean;
  isOffer?: boolean;
  isPromotion?: boolean;
  createdAt?: string | null;
}

export interface Store {
  id?: string;
  name: string;
  username: string;
  whatsapp: string;
  whatsappGroupLink?: string;
  niche: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  slogan?: string;
  publicTitle?: string;
  publicSubtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  cardBgColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  headerBgColor?: string;
  primaryButtonText?: string;
  whatsappButtonText?: string;
  themeMode?: string;
}

export interface ContentGenerated {
  id: string;
  productId: string;
  platform: string;
  style: string;
  text: string;
  videoIdea: string;
  callToAction: string;
  shortCall: string;
  date: string;
}

export interface PresenceInfo {
  checkedToday: boolean;
  streakCount: number;
  lastCheckedDate: string | null;
}

interface AppContextType {
  store: Store | null;
  products: Product[];
  categories: ProductCategory[];
  contents: ContentGenerated[];
  clicks: number;
  sales: number;
  selectedNiche: string;
  appLoading: boolean;
  presence: PresenceInfo;
  setSelectedNiche: (niche: string) => void;
  createStore: (store: Store) => void;
  addProduct: (product: Product) => void;
  generateContent: (content: ContentGenerated) => void;
  incrementClicks: (productId?: string) => Promise<void>;
  refreshAppData: () => Promise<void>;
  refreshPresence: () => Promise<void>;
}

type AuthUserLike = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  storeId?: string | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function formatMoney(value: unknown) {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : 0;

  const safe = Number.isFinite(num) ? num : 0;

  return safe.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function normalizeStore(row: any): Store | null {
  if (!row) return null;

  return {
    id: row.id ?? undefined,
    name: row.store_name ?? row.name ?? '',
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
    buttonBgColor: row.button_bg_color ?? row.accent_color ?? '#10b981',
    buttonTextColor: row.button_text_color ?? '#03120c',
    cardBgColor: row.card_bg_color ?? 'rgba(255,255,255,0.04)',
    textColor: row.text_color ?? '#ffffff',
    mutedTextColor: row.muted_text_color ?? '#a1a1aa',
    headerBgColor: row.header_bg_color ?? 'rgba(0,0,0,0.35)',
    primaryButtonText: row.primary_button_text ?? 'Ver produtos',
    whatsappButtonText: row.whatsapp_button_text ?? 'Grupo no WhatsApp',
    themeMode: row.theme_mode ?? 'dark',
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
    affiliateLink: row?.affiliate_link ?? row?.affiliateLink ?? '',
    name: row?.name ?? '',
    image: row?.image ?? '',
    price: formatMoney(priceValue),
    priceValue: Number.isFinite(priceValue) ? priceValue : 0,
    description: row?.description ?? '',
    categoryId: row?.category_id ?? null,
    sortOrder: Number(row?.sort_order ?? 0),
    isFeatured: Boolean(row?.is_featured),
    isOffer: Boolean(row?.is_offer),
    isPromotion: Boolean(row?.is_promotion),
    createdAt: row?.created_at ?? null,
  };
}

function buildDeviceHash() {
  try {
    const storageKey = 'afiliadopro-device-id';
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
    nav?.platform ?? '',
  ].join('::');
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authLoading } = useAuth();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [contents, setContents] = useState<ContentGenerated[]>([]);
  const [clicks, setClicks] = useState(0);
  const [sales] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [appLoading, setAppLoading] = useState(true);
  const [presence, setPresence] = useState<PresenceInfo>({
    checkedToday: false,
    streakCount: 0,
    lastCheckedDate: null,
  });

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const productChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const categoryChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const resolveStoreByUser = useCallback(async (authUser: AuthUserLike): Promise<Store | null> => {
    if (!authUser || authUser.role !== 'admin') {
      return null;
    }

    if (authUser.storeId) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', authUser.storeId)
        .maybeSingle();

      if (!error && data) {
        return normalizeStore(data);
      }
    }

    const authEmail = authUser.email?.trim().toLowerCase() ?? '';

    if (authEmail) {
      const { data: adminByEmail, error: adminByEmailError } = await supabase
        .from('admins')
        .select('store_id')
        .eq('email', authEmail)
        .maybeSingle();

      if (!adminByEmailError && adminByEmail?.store_id) {
        const { data: storeByAdminEmail, error: storeByAdminEmailError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', adminByEmail.store_id)
          .maybeSingle();

        if (!storeByAdminEmailError && storeByAdminEmail) {
          return normalizeStore(storeByAdminEmail);
        }
      }
    }

    if (authUser.id) {
      const { data: adminByUserId, error: adminByUserIdError } = await supabase
        .from('admins')
        .select('store_id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!adminByUserIdError && adminByUserId?.store_id) {
        const { data: storeByUserId, error: storeByUserIdError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', adminByUserId.store_id)
          .maybeSingle();

        if (!storeByUserIdError && storeByUserId) {
          return normalizeStore(storeByUserId);
        }
      }

      const { data: storeByOwner, error: storeByOwnerError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!storeByOwnerError && storeByOwner) {
        return normalizeStore(storeByOwner);
      }
    }

    return null;
  }, []);

  const loadProducts = useCallback(async (storeId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map(normalizeProduct);
  }, []);

  const loadCategories = useCallback(async (storeId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(normalizeCategory);
  }, []);

  const loadClicks = useCallback(async (storeId: string) => {
    const { count, error } = await supabase
      .from('click_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if (error) {
      console.warn('Não foi possível carregar os cliques:', error.message);
      return 0;
    }

    return Number(count ?? 0);
  }, []);

  const refreshPresence = useCallback(async () => {
    if (!store?.id || user?.role !== 'admin') {
      setPresence({
        checkedToday: false,
        streakCount: 0,
        lastCheckedDate: null,
      });
      return;
    }

    const today = getTodayKey();
    const yesterday = getYesterdayKey();

    const { data: existingToday, error: existingTodayError } = await supabase
      .from('store_presence')
      .select('*')
      .eq('store_id', store.id)
      .eq('presence_date', today)
      .maybeSingle();

    if (existingTodayError) {
      console.warn('Erro ao verificar presença de hoje:', existingTodayError.message);
      return;
    }

    if (existingToday) {
      setPresence({
        checkedToday: true,
        streakCount: Number(existingToday.streak_count ?? 1),
        lastCheckedDate: String(existingToday.presence_date ?? today),
      });
      return;
    }

    const { data: yesterdayRow } = await supabase
      .from('store_presence')
      .select('*')
      .eq('store_id', store.id)
      .eq('presence_date', yesterday)
      .maybeSingle();

    const streakCount = yesterdayRow ? Number(yesterdayRow.streak_count ?? 0) + 1 : 1;

    const { error: insertError } = await supabase.from('store_presence').insert({
      store_id: store.id,
      user_id: user?.id ?? null,
      presence_date: today,
      streak_count: streakCount,
    });

    if (insertError) {
      console.warn('Erro ao registrar presença:', insertError.message);
      return;
    }

    setPresence({
      checkedToday: true,
      streakCount,
      lastCheckedDate: today,
    });
  }, [store?.id, user?.id, user?.role]);

  const refreshAppData = useCallback(async () => {
    if (authLoading) return;

    const authUser = user as AuthUserLike | null;

    if (!authUser || authUser.role !== 'admin') {
      setStore(null);
      setProducts([]);
      setCategories([]);
      setClicks(0);
      setSelectedNiche('');
      setAppLoading(false);
      return;
    }

    try {
      setAppLoading(true);

      const resolvedStore = await resolveStoreByUser(authUser);

      if (!resolvedStore?.id) {
        setStore(null);
        setProducts([]);
        setCategories([]);
        setClicks(0);
        setSelectedNiche('');
        return;
      }

      const [loadedProducts, loadedCategories, loadedClicks] = await Promise.all([
        loadProducts(resolvedStore.id),
        loadCategories(resolvedStore.id),
        loadClicks(resolvedStore.id),
      ]);

      setStore(resolvedStore);
      setProducts(loadedProducts);
      setCategories(loadedCategories);
      setClicks(loadedClicks);
      setSelectedNiche(resolvedStore.niche || '');
    } catch (error) {
      console.error('Erro ao atualizar dados do app:', error);
      setStore(null);
      setProducts([]);
      setCategories([]);
      setClicks(0);
    } finally {
      setAppLoading(false);
    }
  }, [authLoading, user, resolveStoreByUser, loadProducts, loadCategories, loadClicks]);

  useEffect(() => {
    void refreshAppData();
  }, [refreshAppData]);

  useEffect(() => {
    if (!store?.id) return;
    void refreshPresence();
  }, [store?.id, refreshPresence]);

  useEffect(() => {
    const activeStoreId = store?.id ?? null;

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

    if (!activeStoreId) return;

    storeChannelRef.current = supabase
      .channel(`app-store-${activeStoreId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${activeStoreId}`,
        },
        async () => {
          await refreshAppData();
        },
      )
      .subscribe();

    productChannelRef.current = supabase
      .channel(`app-products-${activeStoreId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${activeStoreId}`,
        },
        async () => {
          const loadedProducts = await loadProducts(activeStoreId);
          setProducts(loadedProducts);
          setClicks(await loadClicks(activeStoreId));
        },
      )
      .subscribe();

    categoryChannelRef.current = supabase
      .channel(`app-categories-${activeStoreId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `store_id=eq.${activeStoreId}`,
        },
        async () => {
          const loadedCategories = await loadCategories(activeStoreId);
          setCategories(loadedCategories);
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
  }, [store?.id, refreshAppData, loadProducts, loadCategories, loadClicks]);

  const createStore = useCallback((newStore: Store) => {
    setStore(newStore);
    setSelectedNiche(newStore.niche || '');
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev.filter((item) => item.id !== product.id)]);
  }, []);

  const generateContent = useCallback((content: ContentGenerated) => {
    setContents((prev) => [content, ...prev]);
  }, []);

  const incrementClicks = useCallback(
    async (productId?: string) => {
      setClicks((prev) => prev + 1);

      if (!store?.id || !productId) return;

      const today = getTodayKey();
      const deviceHash = buildDeviceHash();
      const fingerprint = buildFingerprint();
      const userAgent = globalThis.navigator?.userAgent ?? '';

      const { data: existing } = await supabase
        .from('click_tracking')
        .select('id')
        .eq('store_id', store.id)
        .eq('product_id', productId)
        .eq('click_date', today)
        .eq('device_hash', deviceHash)
        .eq('fingerprint', fingerprint)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('click_tracking')
          .update({
            last_clicked_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        const freshCount = await loadClicks(store.id);
        setClicks(freshCount);
        return;
      }

      const { error } = await supabase.from('click_tracking').insert({
        store_id: store.id,
        product_id: productId,
        device_hash: deviceHash,
        fingerprint,
        user_agent: userAgent,
        click_date: today,
      });

      if (error) {
        console.warn('Erro ao registrar clique único:', error.message);
      }

      const freshCount = await loadClicks(store.id);
      setClicks(freshCount);
    },
    [store?.id, loadClicks],
  );

  const value = useMemo(
    () => ({
      store,
      products,
      categories,
      contents,
      clicks,
      sales,
      selectedNiche,
      appLoading,
      presence,
      setSelectedNiche,
      createStore,
      addProduct,
      generateContent,
      incrementClicks,
      refreshAppData,
      refreshPresence,
    }),
    [
      store,
      products,
      categories,
      contents,
      clicks,
      sales,
      selectedNiche,
      appLoading,
      presence,
      createStore,
      addProduct,
      generateContent,
      incrementClicks,
      refreshAppData,
      refreshPresence,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context;
};
