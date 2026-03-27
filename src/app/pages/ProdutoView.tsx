import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Phone,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

function onlyDigits(value: string) {
  return String(value ?? '').replace(/\D/g, '');
}

export default function ProdutoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, incrementClicks, store } = useApp();

  const product = products.find((p) => p.id === id);

  const benefits = useMemo(() => {
    if (!product?.description) return [];
    return product.description
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [product?.description]);

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Produto não encontrado</h2>
          <Button
            onClick={() => navigate('/produtos')}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            Voltar aos produtos
          </Button>
        </div>
      </div>
    );
  }

  const handleBuyClick = () => {
    incrementClicks();

    if (product.affiliateLink) {
      window.open(product.affiliateLink, '_blank', 'noopener,noreferrer');
      return;
    }

    if (store?.whatsapp) {
      const phone = onlyDigits(store.whatsapp);
      const message = `Olá! Tenho interesse no produto: ${product.name}`;
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer',
      );
      return;
    }

    toast.error('Este produto ainda não possui um link de compra configurado.');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#020202_0%,_#050505_48%,_#09110d_100%)]">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Button
            variant="ghost"
            className="text-zinc-400 hover:bg-white/5 hover:text-white"
            onClick={() => navigate('/produtos')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos produtos
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="mb-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Página do produto
            </p>

            <h1 className="text-3xl font-black text-white md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 text-4xl font-black text-emerald-400">
              {product.price}
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold text-white">Benefícios</h3>

              <ul className="space-y-3">
                {(benefits.length > 0 ? benefits : [product.description]).map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-lg font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                onClick={handleBuyClick}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Comprar agora
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={() => {
                  if (!store?.whatsapp) {
                    toast.error('WhatsApp da loja não configurado.');
                    return;
                  }

                  const phone = onlyDigits(store.whatsapp);
                  const message = `Olá! Tenho interesse no produto: ${product.name}`;
                  window.open(
                    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
              >
                <Phone className="w-5 h-5 mr-2" />
                Falar no WhatsApp
              </Button>
            </div>

            <p className="mt-4 text-sm text-zinc-500">
              Você será redirecionado para o link do produto ou para o WhatsApp da loja.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}