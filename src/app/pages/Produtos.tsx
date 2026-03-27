import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  ExternalLink,
  FolderKanban,
  Image as ImageIcon,
  Link as LinkIcon,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
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

function ensureUrl(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parsePrice(value: string) {
  const cleaned = String(value ?? '')
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function extractPriceNumber(value: string) {
  const cleaned = String(value ?? '')
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

export default function Produtos() {
  const navigate = useNavigate();
  const { store, products, refreshAppData } = useApp();

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingMany, setDeletingMany] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    price: '',
    image: '',
    affiliateLink: '',
    description: '',
  });

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    });
  }, [products, search]);

  const selectedCount = selectedIds.length;

  const linkedProductsCount = useMemo(
    () => products.filter((product) => Boolean(product.affiliateLink)).length,
    [products],
  );

  const avgPrice = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((acc, product) => acc + extractPriceNumber(product.price), 0);
    return total / products.length;
  }, [products]);

  const isEditing = Boolean(editingId);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      price: '',
      image: '',
      affiliateLink: '',
      description: '',
    });
  };

  const startEdit = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    setEditingId(product.id);
    setForm({
      name: product.name ?? '',
      price: String(extractPriceNumber(product.price) || ''),
      image: product.image ?? '',
      affiliateLink: product.affiliateLink ?? '',
      description: product.description ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleSave = async () => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    const payload = {
      store_id: store.id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: parsePrice(form.price),
      image: ensureUrl(form.image),
      affiliate_link: ensureUrl(form.affiliateLink),
    };

    if (!payload.name) {
      toast.error('Informe o nome do produto.');
      return;
    }

    if (!payload.description) {
      toast.error('Informe a descrição do produto.');
      return;
    }

    if (!payload.price || payload.price <= 0) {
      toast.error('Informe um preço válido.');
      return;
    }

    if (!payload.image) {
      toast.error('Informe a imagem do produto.');
      return;
    }

    if (!payload.affiliate_link) {
      toast.error('Informe o link de afiliado.');
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update({
            name: payload.name,
            description: payload.description,
            price: payload.price,
            image: payload.image,
            affiliate_link: payload.affiliate_link,
          })
          .eq('id', editingId)
          .eq('store_id', store.id);

        if (error) throw error;

        toast.success('Produto atualizado com sucesso.');
      } else {
        const { error } = await supabase.from('products').insert(payload);

        if (error) throw error;

        toast.success('Produto criado com sucesso.');
      }

      await refreshAppData();
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error?.message || 'Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    const confirmed = window.confirm('Deseja realmente excluir este produto?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', store.id);

      if (error) throw error;

      setSelectedIds((prev) => prev.filter((item) => item !== id));
      if (editingId === id) resetForm();

      await refreshAppData();
      toast.success('Produto excluído com sucesso.');
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      toast.error(error?.message || 'Não foi possível excluir o produto.');
    }
  };

  const handleDeleteSelected = async () => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um produto.');
      return;
    }

    const confirmed = window.confirm(`Deseja excluir ${selectedIds.length} produto(s)?`);
    if (!confirmed) return;

    setDeletingMany(true);

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedIds)
        .eq('store_id', store.id);

      if (error) throw error;

      setSelectedIds([]);
      if (editingId && selectedIds.includes(editingId)) resetForm();

      await refreshAppData();
      toast.success('Produtos excluídos com sucesso.');
    } catch (error: any) {
      console.error('Erro ao excluir produtos:', error);
      toast.error(error?.message || 'Não foi possível excluir os produtos.');
    } finally {
      setDeletingMany(false);
    }
  };

  if (!store) return null;

  const visibleIds = filteredProducts.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

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
            <h1 className="text-3xl font-black text-white">Central de produtos</h1>
            <p className="mt-2 text-zinc-400">
              Cadastre, edite, selecione e exclua seus produtos em um só lugar.
            </p>
          </div>

          <Button
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
            onClick={() => navigate(`/loja/${store.username}`)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver loja
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/10 bg-white/[0.04]">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Total de produtos</p>
                  <p className="text-2xl font-black text-white">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04]">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Com link afiliado</p>
                  <p className="text-2xl font-black text-white">{linkedProductsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04]">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Selecionados</p>
                  <p className="text-2xl font-black text-white">{selectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04]">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Preço médio</p>
                  <p className="text-2xl font-black text-white">{formatMoney(avgPrice)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/10 bg-white/[0.04]">
            <CardHeader>
              <CardTitle className="text-white">
                {isEditing ? 'Editar produto' : 'Novo produto'}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Preencha os campos e salve. Cada produto já fica pronto com link de afiliado.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Package className="h-4 w-4 text-emerald-400" />
                  Nome do produto
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                  placeholder="Ex: Smartwatch Ultra Fit"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  Imagem do produto
                </label>
                <input
                  value={form.image}
                  onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Package className="h-4 w-4 text-emerald-400" />
                    Preço
                  </label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="Ex: 199,90"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <LinkIcon className="h-4 w-4 text-emerald-400" />
                    Link de afiliado
                  </label>
                  <input
                    value={form.affiliateLink}
                    onChange={(e) => setForm((prev) => ({ ...prev, affiliateLink: e.target.value }))}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Pencil className="h-4 w-4 text-emerald-400" />
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-[160px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  placeholder="Descreva benefícios, diferenciais e argumentos de venda..."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar produto'}
                </Button>

                <Button
                  variant="outline"
                  className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                  onClick={resetForm}
                >
                  {isEditing ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar edição
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Limpar formulário
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04]">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-white">Todos os produtos</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Selecione, edite ou exclua seus produtos.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                    onClick={toggleSelectAllVisible}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    {allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}
                  </Button>

                  <Button
                    className="rounded-2xl bg-red-500 text-white hover:bg-red-600"
                    onClick={handleDeleteSelected}
                    disabled={selectedCount === 0 || deletingMany}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingMany ? 'Excluindo...' : `Excluir selecionados (${selectedCount})`}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="Buscar produto..."
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center">
                  <FolderKanban className="mx-auto mb-4 h-14 w-14 text-zinc-600" />
                  <h3 className="text-xl font-bold text-white">Nenhum produto encontrado</h3>
                  <p className="mt-2 text-zinc-400">
                    Ajuste a busca ou cadastre um novo produto.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const checked = selectedIds.includes(product.id);

                    return (
                      <div
                        key={product.id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 transition hover:border-emerald-500/30"
                      >
                        <div className="grid grid-cols-1 gap-0 md:grid-cols-[56px_130px_1fr]">
                          <div className="flex items-center justify-center border-b border-white/10 md:border-b-0 md:border-r">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelect(product.id)}
                              className="h-5 w-5 cursor-pointer accent-emerald-500"
                            />
                          </div>

                          <div className="border-b border-white/10 md:border-b-0 md:border-r">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full min-h-[130px] w-full object-cover"
                            />
                          </div>

                          <div className="p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                                    {product.affiliateLink ? 'Link configurado' : 'Sem link'}
                                  </span>
                                  <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                                    {product.price}
                                  </span>
                                </div>

                                <h3 className="text-lg font-bold text-white">{product.name}</h3>
                                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                                  {product.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 lg:min-w-[240px]">
                                <Button
                                  variant="outline"
                                  className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                  onClick={() => startEdit(product.id)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </Button>

                                <Button
                                  variant="outline"
                                  className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                  onClick={() => navigate(`/produto/${product.id}`)}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Ver
                                </Button>

                                <Button
                                  className="col-span-2 rounded-2xl bg-red-500 text-white hover:bg-red-600"
                                  onClick={() => handleDeleteOne(product.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir produto
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}