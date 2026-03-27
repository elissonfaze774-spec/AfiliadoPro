import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Package,
  Save,
  ShoppingBag,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type ProductForm = {
  name: string;
  price: string;
  image: string;
  affiliateLink: string;
  description: string;
};

function formatPreviewPrice(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    : 'R$ 0,00';
}

function parsePrice(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function ensureUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function AdicionarProduto() {
  const navigate = useNavigate();
  const { store, refreshAppData } = useApp();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    price: '',
    image: '',
    affiliateLink: '',
    description: '',
  });

  const previewPrice = useMemo(() => formatPreviewPrice(form.price), [form.price]);

  const handleChange = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      price: '',
      image: '',
      affiliateLink: '',
      description: '',
    });
  };

  const handleSubmit = async (mode: 'back' | 'continue') => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    const name = form.name.trim();
    const price = parsePrice(form.price);
    const image = ensureUrl(form.image);
    const affiliateLink = ensureUrl(form.affiliateLink);
    const description = form.description.trim();

    if (!name) {
      toast.error('Informe o nome do produto.');
      return;
    }

    if (!price || price <= 0) {
      toast.error('Informe um preço válido.');
      return;
    }

    if (!image) {
      toast.error('Informe a imagem do produto.');
      return;
    }

    if (!affiliateLink) {
      toast.error('Informe o link de afiliado.');
      return;
    }

    if (!description) {
      toast.error('Informe a descrição do produto.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('products').insert({
        store_id: store.id,
        name,
        price,
        image,
        affiliate_link: affiliateLink,
        description,
      });

      if (error) {
        throw error;
      }

      await refreshAppData();
      toast.success('Produto criado com sucesso.');

      if (mode === 'continue') {
        resetForm();
        return;
      }

      navigate('/painel');
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      toast.error(error?.message || 'Não foi possível criar o produto.');
    } finally {
      setSaving(false);
    }
  };

  if (!store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),_transparent_20%),linear-gradient(180deg,_#020202_0%,_#050505_50%,_#08120d_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              className="mb-3 -ml-3 text-zinc-400 hover:bg-white/5 hover:text-white"
              onClick={() => navigate('/painel')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Button>

            <h1 className="text-3xl font-black text-white">Adicionar produto</h1>
            <p className="mt-2 text-zinc-400">
              Crie um produto completo com imagem, descrição e link de afiliado.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/10 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Loja atual
            </p>
            <p className="mt-1 text-lg font-bold text-white">{store.name}</p>
            <p className="text-sm text-zinc-400">@{store.username}</p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <CardTitle className="text-white">Dados do produto</CardTitle>
              <CardDescription className="text-zinc-400">
                Quanto mais bonito e claro estiver, mais fácil fica para vender.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Package className="h-4 w-4 text-emerald-400" />
                    Nome do produto
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="Ex: Smartwatch Ultra Fit"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <ShoppingBag className="h-4 w-4 text-emerald-400" />
                      Preço
                    </label>
                    <input
                      value={form.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="Ex: 199.90"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <LinkIcon className="h-4 w-4 text-emerald-400" />
                      Link de afiliado
                    </label>
                    <input
                      value={form.affiliateLink}
                      onChange={(e) => handleChange('affiliateLink', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <ImageIcon className="h-4 w-4 text-emerald-400" />
                    Imagem do produto
                  </label>
                  <input
                    value={form.image}
                    onChange={(e) => handleChange('image', e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Wand2 className="h-4 w-4 text-emerald-400" />
                    Descrição
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                    placeholder="Descreva benefícios, diferenciais e porque vale a compra..."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleSubmit('back')}
                    disabled={saving}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar produto'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleSubmit('continue')}
                    disabled={saving}
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  >
                    Salvar e continuar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/painel')}
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="overflow-hidden border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Preview do produto</CardTitle>
                <CardDescription className="text-zinc-400">
                  Veja como o produto vai chamar atenção no seu painel.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                  <div className="h-64 bg-zinc-900">
                    {form.image ? (
                      <img
                        src={ensureUrl(form.image)}
                        alt={form.name || 'Preview'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-500">
                        Imagem do produto
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                        {form.affiliateLink ? 'Link pronto' : 'Configure o link'}
                      </span>
                      <span className="font-bold text-emerald-400">{previewPrice}</span>
                    </div>

                    <h3 className="text-xl font-bold text-white">
                      {form.name || 'Nome do produto'}
                    </h3>

                    <p className="mt-3 text-sm text-zinc-400">
                      {form.description || 'Sua descrição aparecerá aqui.'}
                    </p>

                    <Button
                      disabled={!form.affiliateLink}
                      className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Comprar agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <CardTitle className="text-white">Boas práticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-400">
                <p>• Use imagens limpas e bem iluminadas.</p>
                <p>• Dê preferência a nomes curtos e claros.</p>
                <p>• Foque em benefícios e não só em características.</p>
                <p>• Nunca deixe o link de afiliado vazio.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}