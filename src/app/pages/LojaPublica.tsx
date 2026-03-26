import { useParams, useNavigate } from 'react-router-dom';
import { ExternalLink, Store, DollarSign, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthTemp';

export default function LojaPublica() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { store, products, incrementClicks } = useApp();
  const { user } = useAuth();

  if (!store || store.username !== username) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-2xl font-bold text-white mb-4">Loja não encontrada</h2>
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600"
          >
            Criar minha loja
          </Button>
        </div>
      </div>
    );
  }

  const handleProductClick = (product: any) => {
    incrementClicks();
    window.open(product.affiliateLink, '_blank');
  };

  const isAdminDono =
    user?.role === 'admin' &&
    user?.storeId &&
    store &&
    user.storeId === store.id;

  return (
    <div className="min-h-screen bg-black">

      {/* HEADER */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {store.name}
              </h1>
              <p className="text-gray-400">@{store.username}</p>
            </div>

            {/* 🔥 BOTÃO VER PAINEL */}
            {isAdminDono && (
              <Button
                onClick={() => navigate('/painel')}
                className="bg-emerald-500 text-black hover:bg-emerald-400"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Ver painel
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">

          {products.length === 0 ? (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-12 text-center">
              <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Em breve novos produtos!
              </h3>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Nossos produtos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-emerald-500 hover:scale-105 transition-all cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-64 object-cover"
                    />

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {product.name}
                      </h3>

                      <p className="text-gray-400 mb-4">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-emerald-400">
                          {product.price}
                        </span>

                        <Button className="bg-emerald-500 text-black">
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
              className="bg-emerald-500 text-black"
            >
              Criar minha loja grátis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}