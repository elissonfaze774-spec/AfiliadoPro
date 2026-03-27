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

export interface Product {
  id: string;
  affiliateLink: string;
  name: string;
  image: string;
  price: string;
  priceValue?: number;
  description: string;
}

export interface Store {
  id?: string;
  name: string;
  username: string;
  whatsapp: string;
  niche: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  slogan?: string;
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

interface AppContextType {
  store: Store | null;
  products: Product[];
  contents: ContentGenerated[];
  clicks: number;
  sales: number;
  selectedNiche: string;
  appLoading: boolean;
  setSelectedNiche: (niche: string) => void;
  createStore: (store: Store) => void;
  addProduct: (product: Product) => void;
  generateContent: (content: ContentGenerated) => void;
  incrementClicks: () => void;
  refreshAppData: () => Promise<void>;
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
    niche: row.niche ?? '',
    logoUrl: row.logo_url ?? '',
    bannerUrl: row.banner_url ?? '',
    description: row.description ?? '',
    slogan: row.slogan ?? '',
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
    affiliateLink: row?.affiliate_link ?? row?.affiliateLink ?? '',
    name: row?.name ?? '',
    image: row?.image ?? '',
    price: formatMoney(priceValue),
    priceValue: Number.isFinite(priceValue) ? priceValue : 0,
    description: row?.description ?? '',
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authLoading } = useAuth();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [contents, setContents] = useState<ContentGenerated[]>([]);
  const [clicks, setClicks] = useState(0);
  const [sales] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [appLoading, setAppLoading] = useState(true);

  const storeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const productChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

    if (authUser.id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', authUser.id)
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

          if (!storeByProfileEmailError && storeByProfileEmail) {
            return normalizeStore(storeByProfileEmail);
          }
        }
      }
    }

    return null;
  }, []);

  const loadStoreByUser = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      return null;
    }

    const mergedUser: AuthUserLike = {
      id: user.id ?? null,
      email: user.email ?? null,
      role: user.role ?? null,
      storeId: user.storeId ?? null,
    };

    return resolveStoreByUser(mergedUser);
  }, [resolveStoreByUser, user]);

  const loadProducts = useCallback(async (storeId?: string | null) => {
    if (!storeId) {
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
    }

    return (data ?? []).map(normalizeProduct);
  }, []);

  const refreshAppData = useCallback(async () => {
    if (authLoading) return;

    if (!user || user.role !== 'admin') {
      setStore(null);
      setProducts([]);
      setContents([]);
      setClicks(0);
      setSelectedNiche('');
      setAppLoading(false);
      return;
    }

    setAppLoading(true);

    try {
      const resolvedStore = await loadStoreByUser();
      setStore(resolvedStore);
      setSelectedNiche(resolvedStore?.niche ?? '');

      const storeId = resolvedStore?.id ?? null;
      const loadedProducts = await loadProducts(storeId);

      setProducts(loadedProducts);
      setContents([]);
      setClicks((prev) => prev);
    } catch (error) {
      console.error('Erro ao atualizar AppContext:', error);
      setStore(null);
      setProducts([]);
      setContents([]);
      setClicks(0);
      setSelectedNiche('');
    } finally {
      setAppLoading(false);
    }
  }, [authLoading, user, loadStoreByUser, loadProducts]);

  useEffect(() => {
    void refreshAppData();
  }, [refreshAppData]);

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
  }, [store?.id, refreshAppData, loadProducts]);

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

  const incrementClicks = useCallback(() => {
    setClicks((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      store,
      products,
      contents,
      clicks,
      sales,
      selectedNiche,
      appLoading,
      setSelectedNiche,
      createStore,
      addProduct,
      generateContent,
      incrementClicks,
      refreshAppData,
    }),
    [
      store,
      products,
      contents,
      clicks,
      sales,
      selectedNiche,
      appLoading,
      createStore,
      addProduct,
      generateContent,
      incrementClicks,
      refreshAppData,
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