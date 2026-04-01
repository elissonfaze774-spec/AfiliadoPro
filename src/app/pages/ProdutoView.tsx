import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  ExternalLink,
  ImageOff,
  Link as LinkIcon,
  Package,
  Phone,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

function onlyDigits(value: string) {
  return String(value ?? '').replace(/\D/g, '');
}

function ensureUrl(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractPriceNumber(value: string | number) {
  const cleaned = String(value ?? '')
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function formatPrice(value: string | number) {
  const parsed = extractPriceNumber(value);

  if (parsed > 0) {
    return parsed.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  return String(value ?? 'Preço não informado');
}

export default function ProdutoView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, incrementClicks, store } = useApp();
  const [imageError, setImageError] = useState(false);

  const product = products.find((p) => p.id === id);

  const affiliateLink = ensureUrl(product?.affiliateLink ?? '');
  const hasAffiliateLink = Boolean(affiliateLink);

  const benefits = useMemo(() => {
    if (!product?.description) return [];

    return product.description
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }, [product?.description]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,_#020202_0%,_#050505_48%,_#09110d_100%)] px-4">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/30">
              <Package className="h-10 w-10 text-zinc-500" />
            </div>

            <h2 className="text-3xl font-black text-white">Produto não encontrado</h2>
            <p className="mt-3 text-zinc-400">
              Esse item pode ter sido removido ou o link acessado não é mais válido.
            </p>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => navigate('/produtos')}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar aos produtos
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleBuyClick = () => {
    incrementClicks();

    if (hasAffiliateLink) {
      window.open(affiliateLink, '_blank', 'noopener,noreferrer');
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

  const handleWhatsApp = () => {
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
  };

  const handleCopyAffiliateLink = async () => {
    if (!hasAffiliateLink) {
      toast.error('Este produto ainda não possui link de afiliado.');
      return;
    }

    try {
      await navigator.clipboard.writeText(affiliateLink);
      toast.success('Link de afiliado copiado.');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Não foi possível copiar o link.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_48%,_#09110d_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Button
            variant="ghost"
            className="rounded-2xl text-zinc-400 hover:bg-white/5 hover:text-white"
            onClick={() => navigate('/produtos')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos produtos
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
              onClick={handleCopyAffiliateLink}
              disabled={!hasAffiliateLink}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar link
            </Button>

            <Button
              variant="outline"
              className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
              onClick={() => hasAffiliateLink && window.open(affiliateLink, '_blank', 'noopener,noreferrer')}
              disabled={!hasAffiliateLink}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir link
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Página do produto
          </span>

          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              hasAffiliateLink
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {hasAffiliateLink ? 'Link afiliado ativo' : 'Sem link afiliado'}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="relative aspect-[4/4] w-full bg-black/30">
                {!imageError && product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/30">
                      <ImageOff className="h-10 w-10 text-zinc-500" />
                    </div>
                    <p className="text-lg font-semibold text-white">Imagem indisponível</p>
                    <p className="mt-2 text-sm text-zinc-400">
                      O produto continua disponível mesmo sem a imagem carregada.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-zinc-400">Status do link</p>
                <p className="mt-2 text-base font-bold text-white">
                  {hasAffiliateLink ? 'Pronto para venda' : 'Contato via WhatsApp'}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-zinc-400">Atendimento</p>
                <p className="mt-2 text-base font-bold text-white">
                  {store?.whatsapp ? 'WhatsApp disponível' : 'Sem WhatsApp configurado'}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-zinc-400">Tipo de ação</p>
                <p className="mt-2 text-base font-bold text-white">
                  Clique para comprar
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-8">
            <h1 className="text-3xl font-black text-white md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <div className="text-4xl font-black text-emerald-400 md:text-5xl">
                {formatPrice(product.price)}
              </div>

              <div className="pb-1 text-sm text-zinc-500">
                Oferta destacada do produto
              </div>
            </div>

            <p className="mt-6 text-base leading-7 text-zinc-300">
              {product.description || 'Sem descrição cadastrada para este produto.'}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-base font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                onClick={handleBuyClick}
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Comprar agora
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={handleWhatsApp}
              >
                <Phone className="mr-2 h-5 w-5" />
                Grupo de ofertas
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={handleCopyAffiliateLink}
                disabled={!hasAffiliateLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </Button>

              <Button
                variant="outline"
                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={() => hasAffiliateLink && window.open(affiliateLink, '_blank', 'noopener,noreferrer')}
                disabled={!hasAffiliateLink}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Abrir oferta
              </Button>
            </div>

            <div className="mt-8 rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.06] p-5">
              <p className="text-sm font-semibold text-emerald-300">Como funciona</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <p className="text-sm text-zinc-300">
                    Clique em <strong className="text-white">Comprar agora</strong> para abrir a oferta do produto.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <p className="text-sm text-zinc-300">
                    Se não houver link afiliado, você pode entrar em contato direto pelo WhatsApp.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <p className="text-sm text-zinc-300">
                    A página foi organizada para dar mais foco no produto e na conversão.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold text-white">Benefícios</h3>

              <div className="mt-4 space-y-3">
                {(benefits.length > 0 ? benefits : [product.description || 'Sem benefícios informados.']).map(
                  (benefit, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                      <span className="text-zinc-300">{benefit}</span>
                    </div>
                  ),
                )}
              </div>
            </div>

            {hasAffiliateLink ? (
              <p className="mt-6 break-all text-xs text-zinc-500">
                Link afiliado: {affiliateLink}
              </p>
            ) : (
              <p className="mt-6 text-xs text-zinc-500">
                Este produto ainda não possui um link afiliado configurado.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}