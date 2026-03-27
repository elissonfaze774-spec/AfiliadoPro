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
  const currentStoreIdRef = useRef<string | null>(null);

  const loadStoreByUser = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      return null;
    }

    if (user.storeId) {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', user.storeId)
        .maybeSingle();

      if (error) {
        throw new Error('Não foi possível carregar a loja vinculada ao admin.');
      }

      if (data) {
        return normalizeStore(data);
      }
    }

    const { data: storeByOwner, error: storeByOwnerError } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (storeByOwnerError) {
      throw new Error('Não foi possível carregar a loja do admin.');
    }

    if (storeByOwner) {
      return normalizeStore(storeByOwner);
    }

    const adminEmail = user.email?.trim().toLowerCase() ?? '';

    if (adminEmail) {
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('store_id')
        .eq('email', adminEmail)
        .maybeSingle();

      if (!adminError && adminData?.store_id) {
        const { data: storeByAdmin, error: storeByAdminError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', adminData.store_id)
          .maybeSingle();

        if (!storeByAdminError && storeByAdmin) {
          return normalizeStore(storeByAdmin);
        }
      }
    }

    return null;
  }, [user]);

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
      currentStoreIdRef.current = null;
      return;
    }

    setAppLoading(true);

    try {
      const resolvedStore = await loadStoreByUser();
      setStore(resolvedStore);

      const resolvedNiche = resolvedStore?.niche ?? '';
      setSelectedNiche(resolvedNiche);

      const storeId = resolvedStore?.id ?? null;
      const loadedProducts = await loadProducts(storeId);

      setProducts(loadedProducts);
      setContents([]);
      setClicks((prev) => prev);
      currentStoreIdRef.current = storeId;
    } catch (error) {
      console.error('Erro ao atualizar AppContext:', error);
      setStore(null);
      setProducts([]);
      setContents([]);
      setClicks(0);
      setSelectedNiche('');
      currentStoreIdRef.current = null;
    } finally {
      setAppLoading(false);
    }
  }, [authLoading, user, loadStoreByUser, loadProducts]);

  useEffect(() => {
    void refreshAppData();
  }, [refreshAppData]);

  useEffect(() => {
    const storeId = currentStoreIdRef.current;

    if (storeChannelRef.current) {
      void supabase.removeChannel(storeChannelRef.current);
      storeChannelRef.current = null;
    }

    if (productChannelRef.current) {
      void supabase.removeChannel(productChannelRef.current);
      productChannelRef.current = null;
    }

    if (!storeId) return;

    storeChannelRef.current = supabase
      .channel(`app-store-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${storeId}`,
        },
        async () => {
          await refreshAppData();
        },
      )
      .subscribe();

    productChannelRef.current = supabase
      .channel(`app-products-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${storeId}`,
        },
        async () => {
          const loadedProducts = await loadProducts(storeId);
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
  }, [refreshAppData, loadProducts]);

  const createStore = useCallback((newStore: Store) => {
    setStore(newStore);
    setSelectedNiche(newStore.niche || '');
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev]);
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