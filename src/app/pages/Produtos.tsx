import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  Copy,
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

type FilterType =
  | 'todos'
  | 'com-link'
  | 'sem-link'
  | 'mais-recentes'
  | 'mais-caros'
  | 'mais-baratos';

type ImportedProductPreview = {
  tempId: string;
  sourceUrl: string;
  finalUrl: string;
  siteName: string;
  rawName: string;
  generatedName: string;
  priceValue: number;
  priceFormatted: string;
  image: string;
  images: string[];
  rawDescription: string;
  generatedDescription: string;
  shortCopy: string;
  cta: string;
};

type ImportedSingleResult = {
  mode: 'single';
  product: ImportedProductPreview;
};

type ImportedPageResult = {
  mode: 'page';
  sourceUrl: string;
  finalUrl: string;
  siteName: string;
  pageTitle: string;
  count: number;
  items: ImportedProductPreview[];
};

type ImportResponseData = ImportedSingleResult | ImportedPageResult;
type ExtensionImportPayload = ImportedSingleResult | ImportedPageResult;

declare global {
  interface WindowEventMap {
    'afiliadopro-extension-import': CustomEvent<ExtensionImportPayload>;
    'afiliadopro-extension-import-request': CustomEvent<void>;
    'afiliadopro-extension-import-consumed': CustomEvent<void>;
  }
}

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

function extractPriceNumber(value: string | number) {
  const cleaned = String(value ?? '')
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function toFormPrice(value: number) {
  if (!value || value <= 0) return '';
  return String(value).replace('.', ',');
}

function getProductName(product: any) {
  return String(product?.name ?? '').trim();
}

function getProductDescription(product: any) {
  return String(product?.description ?? '').trim();
}

function getProductImage(product: any) {
  return String(product?.image ?? '').trim();
}

function getProductAffiliateLink(product: any) {
  return String(product?.affiliateLink ?? product?.affiliate_link ?? '').trim();
}

function getProductPrice(product: any) {
  return extractPriceNumber(product?.price ?? product?.priceValue ?? 0);
}

function getProductCreatedAt(product: any) {
  const raw = product?.createdAt ?? product?.created_at ?? null;
  if (!raw) return 0;

  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'com-link', label: 'Com link' },
  { value: 'sem-link', label: 'Sem link' },
  { value: 'mais-recentes', label: 'Mais recentes' },
  { value: 'mais-caros', label: 'Mais caros' },
  { value: 'mais-baratos', label: 'Mais baratos' },
];

export default function Produtos() {
  const navigate = useNavigate();
  const { store, products, refreshAppData } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingMany, setDeletingMany] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportedProductPreview | null>(null);
  const [importPagePreview, setImportPagePreview] = useState<ImportedPageResult | null>(null);
  const [selectedImportedIds, setSelectedImportedIds] = useState<string[]>([]);
  const [savingImportedBatch, setSavingImportedBatch] = useState(false);

  const [form, setForm] = useState<ProductForm>({
    name: '',
    price: '',
    image: '',
    affiliateLink: '',
    description: '',
  });

  const enrichedProducts = useMemo(() => {
    return products.map((product, index) => ({
      product,
      index,
      name: getProductName(product),
      description: getProductDescription(product),
      image: getProductImage(product),
      affiliateLink: getProductAffiliateLink(product),
      priceNumber: getProductPrice(product),
      createdAt: getProductCreatedAt(product),
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = [...enrichedProducts];

    if (term) {
      list = list.filter(({ name, description, affiliateLink }) => {
        return (
          name.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term) ||
          affiliateLink.toLowerCase().includes(term)
        );
      });
    }

    if (filter === 'com-link') {
      list = list.filter(({ affiliateLink }) => Boolean(affiliateLink));
    }

    if (filter === 'sem-link') {
      list = list.filter(({ affiliateLink }) => !affiliateLink);
    }

    if (filter === 'mais-recentes') {
      list.sort((a, b) => {
        if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
        return b.index - a.index;
      });
    } else if (filter === 'mais-caros') {
      list.sort((a, b) => {
        if (b.priceNumber !== a.priceNumber) return b.priceNumber - a.priceNumber;
        return b.index - a.index;
      });
    } else if (filter === 'mais-baratos') {
      list.sort((a, b) => {
        if (a.priceNumber !== b.priceNumber) return a.priceNumber - b.priceNumber;
        return b.index - a.index;
      });
    } else {
      list.sort((a, b) => b.index - a.index);
    }

    return list.map((item) => item.product);
  }, [enrichedProducts, filter, search]);

  const selectedCount = selectedIds.length;

  const linkedProductsCount = useMemo(
    () => products.filter((product) => Boolean(getProductAffiliateLink(product))).length,
    [products],
  );

  const productsWithoutLinkCount = useMemo(
    () => products.filter((product) => !getProductAffiliateLink(product)).length,
    [products],
  );

  const avgPrice = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((acc, product) => acc + getProductPrice(product), 0);
    return total / products.length;
  }, [products]);

  const isEditing = Boolean(editingId);

  const selectedImportedCount = selectedImportedIds.length;

  const allImportedSelected = useMemo(() => {
    if (!importPagePreview || importPagePreview.items.length === 0) return false;
    return importPagePreview.items.every((item) => selectedImportedIds.includes(item.tempId));
  }, [importPagePreview, selectedImportedIds]);

  const resetImport = () => {
    setImportUrl('');
    setImportPreview(null);
    setImportPagePreview(null);
    setSelectedImportedIds([]);
    setImporting(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      price: '',
      image: '',
      affiliateLink: '',
      description: '',
    });
    resetImport();
  };

  const applyImportedPreview = (preview: ImportedProductPreview) => {
    setForm((prev) => ({
      ...prev,
      name: preview.generatedName || preview.rawName || prev.name,
      price: preview.priceValue > 0 ? toFormPrice(preview.priceValue) : prev.price,
      image: preview.image || preview.images[0] || prev.image,
      affiliateLink: preview.finalUrl || preview.sourceUrl || prev.affiliateLink,
      description: preview.generatedDescription || preview.rawDescription || prev.description,
    }));
  };

  useEffect(() => {
    const applyPreviewToForm = (preview: ImportedProductPreview) => {
      setForm((prev) => ({
        ...prev,
        name: preview.generatedName || preview.rawName || prev.name,
        price: preview.priceValue > 0 ? toFormPrice(preview.priceValue) : prev.price,
        image: preview.image || preview.images[0] || prev.image,
        affiliateLink: preview.finalUrl || preview.sourceUrl || prev.affiliateLink,
        description: preview.generatedDescription || preview.rawDescription || prev.description,
      }));
    };

    const handleExtensionImport = (event: CustomEvent<ExtensionImportPayload>) => {
      const payload = event.detail;
      if (!payload) return;

      setIsFormOpen(true);
      setEditingId(null);
      setImporting(false);
      setSavingImportedBatch(false);
      setImportUrl('');

      if (payload.mode === 'single') {
        setImportPagePreview(null);
        setSelectedImportedIds([]);
        setImportPreview(payload.product);
        applyPreviewToForm(payload.product);
        toast.success('Produto recebido da extensão com sucesso.');
      } else {
        setImportPreview(null);
        setImportPagePreview(payload);
        setSelectedImportedIds(payload.items.map((item) => item.tempId));

        if (payload.items[0]) {
          applyPreviewToForm(payload.items[0]);
        }

        toast.success(`${payload.items.length} produto(s) recebidos da extensão.`);
      }

      window.dispatchEvent(
        new CustomEvent('afiliadopro-extension-import-consumed'),
      );
    };

    window.addEventListener(
      'afiliadopro-extension-import',
      handleExtensionImport as EventListener,
    );

    window.dispatchEvent(
      new CustomEvent('afiliadopro-extension-import-request'),
    );

    return () => {
      window.removeEventListener(
        'afiliadopro-extension-import',
        handleExtensionImport as EventListener,
      );
    };
  }, []);

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    if (saving || importing || savingImportedBatch) return;
    setIsFormOpen(false);
    resetForm();
  };

  const startEdit = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    setEditingId(product.id);
    setForm({
      name: getProductName(product),
      price: String(getProductPrice(product) || '').replace('.', ','),
      image: getProductImage(product),
      affiliateLink: getProductAffiliateLink(product),
      description: getProductDescription(product),
    });
    resetImport();
    setIsFormOpen(true);
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
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const toggleImportedSelection = (tempId: string) => {
    setSelectedImportedIds((prev) => {
      if (prev.includes(tempId)) {
        return prev.filter((item) => item !== tempId);
      }
      return [...prev, tempId];
    });
  };

  const toggleSelectAllImported = () => {
    if (!importPagePreview) return;

    const ids = importPagePreview.items.map((item) => item.tempId);
    const allSelected = ids.length > 0 && ids.every((id) => selectedImportedIds.includes(id));

    if (allSelected) {
      setSelectedImportedIds([]);
      return;
    }

    setSelectedImportedIds(ids);
  };

  const handleImportByLink = async () => {
    const url = ensureUrl(importUrl);

    if (!url) {
      toast.error('Cole um link válido para importar.');
      return;
    }

    setImporting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('Sua sessão expirou. Faça login novamente.');
      }

      const { data, error } = await supabase.functions.invoke('import-affiliate-product', {
        body: { url },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Não foi possível importar este link.');
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.message || 'Não foi possível importar este link.');
      }

      const result = data.data as ImportResponseData;

      if (result.mode === 'single') {
        setImportPagePreview(null);
        setSelectedImportedIds([]);
        setImportPreview(result.product);
        applyImportedPreview(result.product);
        toast.success('Produto importado com sucesso. Revise e salve.');
        return;
      }

      setImportPreview(null);
      setImportPagePreview(result);
      setSelectedImportedIds(result.items.map((item) => item.tempId));

      if (result.items[0]) {
        applyImportedPreview(result.items[0]);
      }

      toast.success(`Página lida com sucesso. ${result.items.length} produto(s) encontrado(s).`);
    } catch (error: any) {
      console.error('Erro ao importar produto:', error);
      toast.error(error?.message || 'Não foi possível importar este link.');
    } finally {
      setImporting(false);
    }
  };

  const handleUseImportedImage = (imageUrl: string) => {
    if (!imageUrl) return;

    setImportPreview((prev) => {
      if (!prev) return prev;
      return { ...prev, image: imageUrl };
    });

    setForm((prev) => ({
      ...prev,
      image: imageUrl,
    }));
  };

  const handleLoadPageItemIntoForm = (item: ImportedProductPreview) => {
    setImportPreview(item);
    applyImportedPreview(item);
    toast.success('Produto carregado no formulário.');
  };

  const handleSaveImportedPage = async () => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    if (!importPagePreview) {
      toast.error('Nenhuma página importada.');
      return;
    }

    const selectedItems = importPagePreview.items.filter((item) =>
      selectedImportedIds.includes(item.tempId),
    );

    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um produto da página.');
      return;
    }

    const rows = selectedItems
      .map((item) => ({
        store_id: store.id,
        name: item.generatedName || item.rawName || 'Produto importado',
        description:
          item.generatedDescription ||
          item.rawDescription ||
          item.shortCopy ||
          'Produto importado automaticamente.',
        price: item.priceValue,
        image: ensureUrl(item.image || item.images[0] || ''),
        affiliate_link: ensureUrl(item.finalUrl || item.sourceUrl || ''),
      }))
      .filter((row) => row.name && row.description && row.price > 0 && row.image && row.affiliate_link);

    const skipped = selectedItems.length - rows.length;

    if (rows.length === 0) {
      toast.error('Nenhum produto selecionado possui dados suficientes para salvar.');
      return;
    }

    setSavingImportedBatch(true);

    try {
      const { error } = await supabase.from('products').insert(rows);

      if (error) throw error;

      await refreshAppData();

      const successMessage =
        skipped > 0
          ? `${rows.length} produto(s) importado(s). ${skipped} item(ns) foram ignorado(s) por falta de dados.`
          : `${rows.length} produto(s) importado(s) com sucesso.`;

      toast.success(successMessage);
      setImportPagePreview(null);
      setSelectedImportedIds([]);
    } catch (error: any) {
      console.error('Erro ao importar página:', error);
      toast.error(error?.message || 'Não foi possível importar os produtos da página.');
    } finally {
      setSavingImportedBatch(false);
    }
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
      setIsFormOpen(false);
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

      if (editingId === id) {
        resetForm();
        setIsFormOpen(false);
      }

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

      if (editingId && selectedIds.includes(editingId)) {
        resetForm();
        setIsFormOpen(false);
      }

      await refreshAppData();
      toast.success('Produtos excluídos com sucesso.');
    } catch (error: any) {
      console.error('Erro ao excluir produtos:', error);
      toast.error(error?.message || 'Não foi possível excluir os produtos.');
    } finally {
      setDeletingMany(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    const product = products.find((item) => item.id === id);
    if (!product) {
      toast.error('Produto não encontrado.');
      return;
    }

    setDuplicatingId(id);

    try {
      const baseName = getProductName(product) || 'Produto';
      const existingNames = new Set(
        products.map((item) => getProductName(item).toLowerCase()).filter(Boolean),
      );

      let duplicatedName = `${baseName} (Cópia)`;
      let counter = 2;

      while (existingNames.has(duplicatedName.toLowerCase())) {
        duplicatedName = `${baseName} (Cópia ${counter})`;
        counter += 1;
      }

      const { error } = await supabase.from('products').insert({
        store_id: store.id,
        name: duplicatedName,
        description: getProductDescription(product),
        price: getProductPrice(product),
        image: ensureUrl(getProductImage(product)),
        affiliate_link: ensureUrl(getProductAffiliateLink(product)),
      });

      if (error) throw error;

      await refreshAppData();
      toast.success('Produto duplicado com sucesso.');
    } catch (error: any) {
      console.error('Erro ao duplicar produto:', error);
      toast.error(error?.message || 'Não foi possível duplicar o produto.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleCopyAffiliateLink = async (product: any) => {
    const url = ensureUrl(getProductAffiliateLink(product));

    if (!url) {
      toast.error('Este produto não possui link de afiliado.');
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link de afiliado copiado.');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleOpenAffiliateLink = (product: any) => {
    const url = ensureUrl(getProductAffiliateLink(product));

    if (!url) {
      toast.error('Este produto não possui link de afiliado.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!store) return null;

  const visibleIds = filteredProducts.map((product) => product.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <>
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
                Gerencie seus produtos com mais controle, velocidade e organização.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={() => navigate(`/loja/${store.username}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver loja
              </Button>

              <Button
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                onClick={openCreateModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo produto
              </Button>
            </div>
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
                  <div className="rounded-2xl bg-red-500/10 p-3 text-red-300">
                    <X className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Sem link afiliado</p>
                    <p className="text-2xl font-black text-white">{productsWithoutLinkCount}</p>
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

          <Card className="border-white/10 bg-white/[0.04]">
            <CardHeader>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <CardTitle className="text-white">Lista de produtos</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Busque, filtre, selecione e execute ações rápidas por produto.
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
              <div className="mb-5 space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-11 pr-4 text-white outline-none transition focus:border-emerald-500"
                    placeholder="Buscar por nome, descrição ou link..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map((option) => {
                    const active = filter === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFilter(option.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            : 'border-white/10 bg-black/20 text-zinc-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span>
                    Mostrando <strong className="text-white">{filteredProducts.length}</strong> de{' '}
                    <strong className="text-white">{products.length}</strong> produtos
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span>
                    Selecionados: <strong className="text-white">{selectedCount}</strong>
                  </span>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-black/20 p-10 text-center">
                  <FolderKanban className="mx-auto mb-4 h-14 w-14 text-zinc-600" />
                  <h3 className="text-xl font-bold text-white">Nenhum produto encontrado</h3>
                  <p className="mt-2 text-zinc-400">
                    Ajuste os filtros, refine a busca ou cadastre um novo produto.
                  </p>
                  <div className="mt-6">
                    <Button
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                      onClick={openCreateModal}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar produto
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => {
                    const checked = selectedIds.includes(product.id);
                    const affiliateLink = getProductAffiliateLink(product);
                    const hasLink = Boolean(affiliateLink);
                    const price = getProductPrice(product);
                    const image = getProductImage(product);
                    const name = getProductName(product);
                    const description = getProductDescription(product);
                    const isDuplicating = duplicatingId === product.id;

                    return (
                      <div
                        key={product.id}
                        className={`overflow-hidden rounded-3xl border bg-black/20 transition ${
                          checked
                            ? 'border-emerald-500/40 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]'
                            : 'border-white/10 hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="grid grid-cols-1 gap-0 xl:grid-cols-[56px_160px_1fr_320px]">
                          <div className="flex items-center justify-center border-b border-white/10 xl:border-b-0 xl:border-r">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelect(product.id)}
                              className="h-5 w-5 cursor-pointer accent-emerald-500"
                            />
                          </div>

                          <div className="border-b border-white/10 xl:border-b-0 xl:border-r">
                            <div className="relative h-full min-h-[180px] bg-zinc-950">
                              {image ? (
                                <img
                                  src={image}
                                  alt={name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}

                              <div
                                className={`absolute inset-0 items-center justify-center bg-gradient-to-br from-zinc-900 to-black ${
                                  image ? 'hidden' : 'flex'
                                }`}
                              >
                                <div className="text-center">
                                  <Package className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                                  <p className="text-sm text-zinc-500">Sem imagem</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                  hasLink
                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                                    : 'border-red-500/20 bg-red-500/10 text-red-300'
                                }`}
                              >
                                {hasLink ? 'Com link afiliado' : 'Sem link afiliado'}
                              </span>

                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                                {formatMoney(price)}
                              </span>

                              {checked ? (
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                  Selecionado
                                </span>
                              ) : null}
                            </div>

                            <h3 className="text-xl font-black text-white">{name}</h3>

                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                              {description || 'Sem descrição cadastrada.'}
                            </p>

                            {affiliateLink ? (
                              <p className="mt-4 truncate text-xs text-zinc-500">
                                Link: {affiliateLink}
                              </p>
                            ) : (
                              <p className="mt-4 text-xs text-zinc-600">
                                Este produto ainda não possui link de afiliado.
                              </p>
                            )}
                          </div>

                          <div className="border-t border-white/10 p-5 xl:border-l xl:border-t-0">
                            <p className="mb-3 text-sm font-semibold text-white">Ações rápidas</p>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
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
                                onClick={() => handleDuplicate(product.id)}
                                disabled={isDuplicating}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                              </Button>

                              <Button
                                variant="outline"
                                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                onClick={() => handleCopyAffiliateLink(product)}
                                disabled={!hasLink}
                              >
                                <LinkIcon className="mr-2 h-4 w-4" />
                                Copiar link
                              </Button>

                              <Button
                                variant="outline"
                                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                onClick={() => handleOpenAffiliateLink(product)}
                                disabled={!hasLink}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Abrir link
                              </Button>

                              <Button
                                variant="outline"
                                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                onClick={() => navigate(`/produto/${product.id}`)}
                              >
                                <Package className="mr-2 h-4 w-4" />
                                Ver produto
                              </Button>

                              <Button
                                className="rounded-2xl bg-red-500 text-white hover:bg-red-600"
                                onClick={() => handleDeleteOne(product.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </Button>
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

      {isFormOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={closeFormModal}
        >
          <div
            className="w-full max-w-6xl rounded-[28px] border border-white/10 bg-[#050505] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-2xl font-black text-white">
                  {isEditing ? 'Editar produto' : 'Novo produto'}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Importação inteligente por produto ou página.
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[84vh] overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-lg font-black text-white">Importar por link</h3>
                    </div>

                    <p className="mb-4 text-sm leading-6 text-zinc-300">
                      Cole o link de um produto para preencher o formulário automaticamente ou cole o link de uma página para importar vários produtos de uma vez.
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                        placeholder="Cole aqui o link do produto ou da página..."
                      />

                      <Button
                        className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                        onClick={handleImportByLink}
                        disabled={importing}
                      >
                        {importing ? 'Importando...' : 'Importar'}
                      </Button>
                    </div>

                    {importPreview ? (
                      <div className="mt-5 rounded-[20px] border border-white/10 bg-black/25 p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Produto lido com sucesso
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                            {importPreview.priceFormatted}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                            {importPreview.siteName}
                          </span>
                        </div>

                        <h4 className="text-lg font-black text-white">
                          {importPreview.generatedName || importPreview.rawName}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {importPreview.generatedDescription}
                        </p>

                        {importPreview.shortCopy ? (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                              Copy automática
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-200">
                              {importPreview.shortCopy}
                            </p>
                            <p className="mt-3 text-sm font-semibold text-emerald-300">
                              CTA: {importPreview.cta}
                            </p>
                          </div>
                        ) : null}

                        {importPreview.images.length > 0 ? (
                          <div className="mt-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                              Escolha a imagem principal
                            </p>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                              {importPreview.images.map((imageUrl) => {
                                const active = form.image === imageUrl;

                                return (
                                  <button
                                    key={imageUrl}
                                    type="button"
                                    onClick={() => handleUseImportedImage(imageUrl)}
                                    className={`overflow-hidden rounded-2xl border transition ${
                                      active
                                        ? 'border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]'
                                        : 'border-white/10 hover:border-emerald-500/40'
                                    }`}
                                  >
                                    <div className="aspect-square bg-black/30">
                                      <img
                                        src={imageUrl}
                                        alt="Imagem importada"
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {importPagePreview ? (
                      <div className="mt-5 rounded-[20px] border border-white/10 bg-black/25 p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                Página lida com sucesso
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                                {importPagePreview.siteName}
                              </span>
                            </div>
                            <h4 className="text-lg font-black text-white">
                              {importPagePreview.pageTitle}
                            </h4>
                            <p className="mt-1 text-sm text-zinc-400">
                              {importPagePreview.items.length} produto(s) encontrado(s)
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              variant="outline"
                              className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                              onClick={toggleSelectAllImported}
                            >
                              <CheckSquare className="mr-2 h-4 w-4" />
                              {allImportedSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                            </Button>

                            <Button
                              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                              onClick={handleSaveImportedPage}
                              disabled={savingImportedBatch || selectedImportedCount === 0}
                            >
                              {savingImportedBatch
                                ? 'Importando...'
                                : `Importar selecionados (${selectedImportedCount})`}
                            </Button>
                          </div>
                        </div>

                        <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                          {importPagePreview.items.map((item) => {
                            const checked = selectedImportedIds.includes(item.tempId);

                            return (
                              <div
                                key={item.tempId}
                                className={`rounded-2xl border p-4 transition ${
                                  checked
                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                    : 'border-white/10 bg-black/20'
                                }`}
                              >
                                <div className="flex flex-col gap-4 md:flex-row">
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleImportedSelection(item.tempId)}
                                      className="mt-1 h-5 w-5 cursor-pointer accent-emerald-500"
                                    />

                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/30">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.generatedName}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                                          <ImageIcon className="h-6 w-6" />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                                        {item.priceFormatted}
                                      </span>
                                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                                        {item.siteName}
                                      </span>
                                    </div>

                                    <h5 className="text-base font-black text-white">
                                      {item.generatedName || item.rawName}
                                    </h5>

                                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-400">
                                      {item.generatedDescription || item.rawDescription}
                                    </p>

                                    <div className="mt-4 flex flex-wrap gap-3">
                                      <Button
                                        variant="outline"
                                        className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                        onClick={() => handleLoadPageItemIntoForm(item)}
                                      >
                                        Usar no formulário
                                      </Button>

                                      <Button
                                        variant="outline"
                                        className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                                        onClick={() =>
                                          window.open(
                                            ensureUrl(item.finalUrl || item.sourceUrl),
                                            '_blank',
                                            'noopener,noreferrer',
                                          )
                                        }
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Abrir link
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
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
                        <Package className="h-4 w-4 text-emerald-400" />
                        Preço
                      </label>
                      <input
                        value={form.price}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                        placeholder="Ex: 149,90"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                        <LinkIcon className="h-4 w-4 text-emerald-400" />
                        Link de afiliado
                      </label>
                      <input
                        value={form.affiliateLink}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, affiliateLink: e.target.value }))
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                        <ImageIcon className="h-4 w-4 text-emerald-400" />
                        Imagem principal
                      </label>
                      <input
                        value={form.image}
                        onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                        <Pencil className="h-4 w-4 text-emerald-400" />
                        Descrição
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                        placeholder="Descrição profissional do produto..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <h3 className="text-lg font-black text-white">Preview rápido</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      Revise antes de salvar no painel.
                    </p>

                    <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                      <div className="aspect-square bg-black/20">
                        {form.image ? (
                          <img
                            src={ensureUrl(form.image)}
                            alt={form.name || 'Preview'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        <div
                          className={`h-full w-full items-center justify-center ${
                            form.image ? 'hidden' : 'flex'
                          }`}
                        >
                          <div className="text-center">
                            <ImageIcon className="mx-auto mb-2 h-10 w-10 text-zinc-600" />
                            <p className="text-sm text-zinc-500">Sem imagem selecionada</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Produto pronto
                          </span>

                          {form.price ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
                              {formatMoney(parsePrice(form.price))}
                            </span>
                          ) : null}
                        </div>

                        <h4 className="text-xl font-black text-white">
                          {form.name || 'Nome do produto'}
                        </h4>

                        <p className="mt-3 line-clamp-6 text-sm leading-6 text-zinc-400">
                          {form.description || 'A descrição aparecerá aqui assim que você preencher ou importar.'}
                        </p>

                        {form.affiliateLink ? (
                          <p className="mt-4 truncate text-xs text-zinc-500">
                            {form.affiliateLink}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3">
                      <Button
                        className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                        onClick={handleSave}
                        disabled={saving || importing || savingImportedBatch}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar produto'}
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                        onClick={closeFormModal}
                        disabled={saving || importing || savingImportedBatch}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>

                  {importPreview?.rawDescription &&
                  importPreview.generatedDescription !== importPreview.rawDescription ? (
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                      <h3 className="text-lg font-black text-white">Descrição original</h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {importPreview.rawDescription}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}