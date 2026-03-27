import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  LayoutDashboard,
  Phone,
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
  banner: string;
  logo: string;
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
    if (!username) return;

    try {
      setLoading(true);

      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', username)
        .maybeSingle();

      if (!data) {
        setStore(null);
        return;
      }

      setStore({
        id: data.id,
        name: data.store_name ?? 'Minha loja',
        username: data.slug ?? username,
        whatsapp: data.whatsapp_number ?? '',
        niche: data.niche ?? '',
        banner: data.banner_url ?? '',
        logo: data.logo_url ?? '',
      });

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', data.id);

      setProducts(
        (productsData ?? []).map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          price: formatMoney(item.price),
          description: item.description,
          affiliateLink: item.affiliate_link,
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadPublicStore();
  }, [loadPublicStore]);

  if (loading) return null;

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loja não encontrada
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">

      {/* 🔥 HERO / BANNER */}
      <div className="relative h-[260px] w-full">
        {store.banner ? (
          <img
            src={store.banner}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-black via-zinc-900 to-black" />
        )}

        <div className="absolute inset-0 flex items-center px-6">
          <div className="flex items-center gap-4">
            {store.logo && (
              <img
                src={store.logo}
                className="w-16 h-16 rounded-xl border border-white/20"
              />
            )}

            <div>
              <h1 className="text-3xl font-bold">{store.name}</h1>
              <p className="text-gray-400">@{store.username}</p>
            </div>
          </div>
        </div>

        {isAdminDono && (
          <div className="absolute top-4 right-4">
            <Button onClick={() => navigate('/painel')}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Painel
            </Button>
          </div>
        )}
      </div>

      {/* PRODUTOS */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6">Produtos</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500 transition"
            >
              <img src={p.image} className="h-56 w-full object-cover" />

              <div className="p-4">
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{p.description}</p>

                <div className="flex justify-between items-center">
                  <span className="text-emerald-400 font-bold">
                    {p.price}
                  </span>

                  <Button
                    onClick={() => {
                      if (p.affiliateLink) {
                        window.open(p.affiliateLink, '_blank');
                      } else if (store.whatsapp) {
                        const phone = onlyDigits(store.whatsapp);
                        window.open(`https://wa.me/${phone}`);
                      }
                    }}
                  >
                    Comprar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}