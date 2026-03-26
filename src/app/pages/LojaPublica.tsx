import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Store,
  LayoutDashboard,
  Phone,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthTemp';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

type PublicStore = {
  id: string;
  name: string;
  username: string;
  whatsapp: string;
  niche: string;
};

type PublicProduct = {
  id: string;
  name: string;
  image: string;
  price: string;
  description: string;
  affiliateLink?: string;
};

function formatMoney(value: unknown) {
  const amount =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : 0;

  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export default function LojaPublica() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [store, setStore] = useState<PublicStore | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminDono = useMemo(() => {
    return user?.role === 'admin' && user?.storeId && store && user.storeId === store.id;
  }, [user, store]);

  const loadPublicStore = useCallback(async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, store_name, slug, username, whatsapp_number, whatsapp, niche')
        .eq('slug', username)
        .maybeSingle();

      if (storeError) {
        throw storeError;
      }

      if (!storeData) {
        setStore(null);
        setProducts([]);
        return;
      }

      const normalizedStore: PublicStore = {
        id: storeData.id,
        name: storeData.name ?? storeData.store_name ?? 'Minha loja',
        username: storeData.slug ?? storeData.username ?? username,
        whatsapp: storeData.whatsapp_number ?? storeData.whatsapp ?? '',
        niche: storeData.niche ?? '',
      };

      setStore(normalizedStore);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, image, price, description, affiliate_link')
        .eq('store_id', normalizedStore.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      const normalizedProducts: PublicProduct[] = (productsData ?? []).map((item: any) => ({
        id: String(item.id ?? ''),
        name: item.name ?? '',
        image: item.image ?? '',
        price: formatMoney(item.price ?? 0),
        description: item.description ?? '',
        affiliateLink: item.affiliate_link ?? '',
      }));

      setProducts(normalizedProducts);
    } catch (error) {
      console.error('Erro ao carregar loja pública:', error);
      toast.error('Não foi possível carregar a loja agora.');
      setStore(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadPublicStore();
  }, [loadPublicStore]);

  const handleProductClick = (product: PublicProduct) => {
    if (product.affiliateLink) {
      window.open(product.affiliateLink, '_blank', 'noopener,noreferrer');
      return;
    }

    if (store?.whatsapp) {
      const phone = onlyDigits(store.whatsapp);
      const message = `Olá! Tenho interesse no produto: ${product.name}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.error('Este produto ainda não possui link de compra configurado.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Carregando loja...
      </div>
    );
  }

  if (!store || store.username !== username) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold text-white mb-4">Loja não encontrada</h2>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-black"
          >
            Criar minha loja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{store.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <p className="text-gray-400">@{store.username}</p>
                {store.niche ? (
                  <>
                    <span className="text-gray-700">•</span>
                    <p className="capitalize text-emerald-400">{store.niche}</p>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAdminDono && (
                <Button
                  onClick={() => navigate('/painel')}
                  className="bg-emerald-500 text-black hover:bg-emerald-400"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Ver painel
                </Button>
              )}

              {store.whatsapp ? (
                <Button
                  onClick={() => {
                    const phone = onlyDigits(store.whatsapp);
                    window.open(`https://wa.me/${phone}`, '_blank', 'noopener,noreferrer');
                  }}
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-gray-700 bg-gray-900 p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Em breve novos produtos!
              </h3>
              <p className="text-gray-400">
                Esta loja ainda está preparando os primeiros produtos.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-white">Nossos produtos</h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 transition-all hover:border-emerald-500 hover:scale-[1.01]"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-64 w-full object-cover"
                    />

                    <div className="p-6">
                      <h3 className="mb-2 text-xl font-bold text-white">{product.name}</h3>

                      <p className="mb-4 min-h-[48px] text-gray-400">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-2xl font-bold text-emerald-400">
                          {product.price}
                        </span>

                        <Button
                          onClick={() => handleProductClick(product)}
                          className="bg-emerald-500 text-black hover:bg-emerald-400"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Comprar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 text-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-emerald-500 text-black hover:bg-emerald-400"
            >
              Criar minha loja grátis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}