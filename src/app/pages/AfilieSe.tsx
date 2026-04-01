import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeDollarSign,
  ExternalLink,
  Loader2,
  Rocket,
  ShieldCheck,
  Store,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type AffiliateNetwork = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  affiliateUrl: string;
  buttonText: string;
  active: boolean;
  sortOrder: number;
};

function ensureUrl(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getFallbackGradient(slug: string) {
  const gradients: Record<string, string> = {
    shopee: 'from-orange-500/30 via-red-500/20 to-amber-500/20',
    'mercado-livre': 'from-yellow-500/25 via-slate-400/15 to-blue-500/25',
    amazon: 'from-zinc-500/20 via-zinc-700/10 to-yellow-500/20',
    magalu: 'from-blue-500/25 via-cyan-400/15 to-indigo-500/25',
    shein: 'from-zinc-600/20 via-zinc-700/20 to-zinc-900/30',
  };

  return gradients[slug] ?? 'from-emerald-500/20 via-cyan-500/10 to-lime-500/20';
}

function getInitials(name: string) {
  return String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function LogoBox({
  logoUrl,
  name,
  slug,
}: {
  logoUrl: string;
  name: string;
  slug: string;
}) {
  const [error, setError] = useState(false);
  const url = ensureUrl(logoUrl);

  if (!url || error) {
    return (
      <div
        className={`flex h-28 items-center justify-center bg-gradient-to-br ${getFallbackGradient(slug)}`}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-black/30 text-2xl font-black text-white backdrop-blur-xl">
          {getInitials(name)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-28 items-center justify-center bg-gradient-to-br ${getFallbackGradient(slug)} p-4`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[22px] border border-white/10 bg-white px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <img
          src={url}
          alt={name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setError(true)}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default function AfilieSe() {
  const navigate = useNavigate();
  const [networks, setNetworks] = useState<AffiliateNetwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNetworks = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('affiliate_networks')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;

        setNetworks(
          (data ?? []).map((row: any) => ({
            id: String(row.id),
            name: row.name ?? 'Plataforma',
            slug: row.slug ?? '',
            logoUrl: row.logo_url ?? '',
            description: row.description ?? '',
            affiliateUrl: row.affiliate_url ?? '',
            buttonText: row.button_text ?? 'Seja afiliado',
            active: Boolean(row.active),
            sortOrder: Number(row.sort_order ?? 0),
          })),
        );
      } catch (error) {
        console.error('Erro ao carregar redes de afiliados:', error);
        setNetworks([]);
      } finally {
        setLoading(false);
      }
    };

    void loadNetworks();
  }, []);

  const highlights = useMemo(
    () => [
      {
        icon: Rocket,
        title: 'Comece mais rápido',
        description: 'Escolha uma plataforma, faça seu cadastro e ganhe velocidade para operar.',
      },
      {
        icon: TrendingUp,
        title: 'Expanda seu catálogo',
        description: 'Quanto mais redes úteis você tiver, maior o leque de ofertas e nichos.',
      },
      {
        icon: ShieldCheck,
        title: 'Estratégia mais forte',
        description: 'Diversificar fontes ajuda a manter sua vitrine viva e competitiva.',
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020202_0%,_#050505_52%,_#07110a_100%)] text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <BadgeDollarSign className="h-4 w-4" />
              Área do afiliado
            </div>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">Afilie-se</h1>
            <p className="mt-2 text-sm text-zinc-400 md:text-base">
              Escolha suas plataformas, entre nas redes certas e fortaleça sua operação.
            </p>
          </div>

          <Button
            variant="outline"
            className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
            onClick={() => navigate('/painel')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="border border-white/10 bg-black/30">
              <CardContent className="p-5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-black">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-6">
          {loading ? (
            <Card className="border border-white/10 bg-black/30">
              <CardContent className="flex items-center justify-center py-16 text-zinc-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando plataformas...
              </CardContent>
            </Card>
          ) : networks.length === 0 ? (
            <Card className="border border-white/10 bg-black/30">
              <CardContent className="py-16 text-center">
                <Store className="mx-auto mb-4 h-14 w-14 text-zinc-600" />
                <h3 className="text-xl font-black">Nenhuma plataforma disponível</h3>
                <p className="mt-2 text-zinc-400">
                  Adicione redes na tabela affiliate_networks para exibir aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {networks.map((network) => (
                <Card
                  key={network.id}
                  className="overflow-hidden border border-white/10 bg-black/30 shadow-[0_16px_48px_rgba(0,0,0,0.28)]"
                >
                  <LogoBox logoUrl={network.logoUrl} name={network.name} slug={network.slug} />

                  <CardHeader className="pb-3">
                    <CardTitle className="text-2xl">{network.name}</CardTitle>
                    <CardDescription className="min-h-[52px] text-zinc-400">
                      {network.description || 'Rede disponível para você começar a operar.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <Button
                      className="h-12 w-full rounded-2xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
                      onClick={() => {
                        const url = ensureUrl(network.affiliateUrl);
                        if (url) {
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {network.buttonText || 'Seja afiliado'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
