import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  TrendingUp,
  DollarSign,
  Plus,
  ExternalLink,
  BookOpen,
  Target,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthTemp';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function Painel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { products, clicks, contents } = useApp();

  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!user?.storeId) return;

      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('id', user.storeId)
        .single();

      setStore(data);
    }

    load();
  }, [user]);

  const earnings = useMemo(() => {
    return products.length * 50 + clicks * 2;
  }, [products.length, clicks]);

  if (!store) return null;

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{store.store_name}</h1>
          <p className="text-gray-400">@{store.slug}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => navigate(`/loja/${store.slug}`)}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver loja
          </Button>

          <Button onClick={logout} variant="outline">
            Sair
          </Button>
        </div>
      </div>

      {/* GANHOS (FOCO PRINCIPAL) */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-emerald-600 to-green-500 text-black">
        <h2 className="text-lg">Seu potencial hoje</h2>
        <p className="text-4xl font-black">R$ {earnings.toFixed(2)}</p>
        <p className="text-sm opacity-80">Quanto mais produtos + cliques, mais você ganha</p>
      </Card>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <Package />
          <p>{products.length} produtos</p>
        </Card>

        <Card className="p-4">
          <TrendingUp />
          <p>{clicks} cliques</p>
        </Card>

        <Card className="p-4">
          <DollarSign />
          <p>R$ {earnings.toFixed(2)}</p>
        </Card>
      </div>

      {/* AÇÕES */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">

        <Button
          className="h-20 text-lg"
          onClick={() => navigate('/adicionar-produto')}
        >
          <Plus className="mr-2" />
          Adicionar produto
        </Button>

        <Button
          className="h-20 text-lg"
          onClick={() => navigate('/gerar-conteudo')}
        >
          🔥 Gerar conteúdo automático
        </Button>

      </div>

      {/* MISSÃO (VICIANTE) */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">🚀 Missão do dia</h2>

        <ul className="space-y-2">
          <li>✔ Adicionar 3 produtos</li>
          <li>✔ Compartilhar 1 link</li>
          <li>✔ Gerar 1 conteúdo</li>
        </ul>
      </Card>

      {/* CURSO EMBUTIDO */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen /> Aprenda a vender (rápido)
        </h2>

        <div className="space-y-3">

          <div className="bg-zinc-900 p-4 rounded">
            <p className="font-bold">1. Escolha produtos que chamam atenção</p>
            <p className="text-sm text-gray-400">
              Produtos visuais vendem mais (ex: gadgets, moda, beleza)
            </p>
          </div>

          <div className="bg-zinc-900 p-4 rounded">
            <p className="font-bold">2. Poste no WhatsApp e Instagram</p>
            <p className="text-sm text-gray-400">
              Seus primeiros clientes vêm do seu círculo
            </p>
          </div>

          <div className="bg-zinc-900 p-4 rounded">
            <p className="font-bold">3. Use prova social</p>
            <p className="text-sm text-gray-400">
              “Mais de 100 vendidos”, “últimas unidades” converte mais
            </p>
          </div>

        </div>
      </Card>

    </div>
  );
}