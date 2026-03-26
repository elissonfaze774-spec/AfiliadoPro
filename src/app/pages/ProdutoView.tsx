import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ExternalLink, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';

export default function ProdutoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, incrementClicks } = useApp();

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Produto não encontrado</h2>
          <Button 
            onClick={() => navigate('/painel')} 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            Voltar ao painel
          </Button>
        </div>
      </div>
    );
  }

  const benefits = product.description.split('\n').filter(Boolean);

  const handleBuyClick = () => {
    incrementClicks();
    window.open(product.affiliateLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AfiliadoPro</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white hover:bg-gray-800 mb-8"
          onClick={() => navigate('/painel')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8">
            <div>
              <img
                src={product.image}
                alt={product.name}
                className="w-full rounded-xl shadow-2xl"
              />
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {product.name}
              </h1>

              <div className="text-4xl font-bold text-emerald-400 mb-6">
                {product.price}
              </div>

              <div className="space-y-4 mb-8 flex-grow">
                <h3 className="text-xl font-semibold text-white">
                  Benefícios:
                </h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg py-6 h-auto shadow-xl shadow-emerald-500/20"
                onClick={handleBuyClick}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Comprar agora
              </Button>

              <p className="text-gray-500 text-sm text-center mt-4">
                Você será redirecionado para o marketplace
              </p>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
            <p className="text-gray-400">
              Esta é a visualização do produto como seus clientes verão na sua loja
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}