import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageCircle,
  Palette,
  Phone,
  RefreshCcw,
  Save,
  Sparkles,
  Store as StoreIcon,
  Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type SettingsForm = {
  name: string;
  slug: string;
  whatsapp: string;
  niche: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  cardBgColor: string;
  textColor: string;
  mutedTextColor: string;
  headerBgColor: string;
  primaryButtonText: string;
  whatsappButtonText: string;
  themeMode: string;
};

type Preset = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  cardBgColor: string;
  textColor: string;
  mutedTextColor: string;
  headerBgColor: string;
};

const DEFAULTS: Omit<SettingsForm, 'name' | 'slug' | 'whatsapp' | 'niche' | 'logoUrl' | 'bannerUrl' | 'description' | 'slogan'> = {
  primaryColor: '#052e16',
  secondaryColor: '#071b11',
  accentColor: '#10b981',
  buttonBgColor: '#10b981',
  buttonTextColor: '#03120c',
  cardBgColor: 'rgba(255,255,255,0.04)',
  textColor: '#ffffff',
  mutedTextColor: '#a1a1aa',
  headerBgColor: 'rgba(0,0,0,0.35)',
  primaryButtonText: 'Ver produtos',
  whatsappButtonText: 'Falar no WhatsApp',
  themeMode: 'dark',
};

const PRESETS: Preset[] = [
  {
    name: 'Premium Verde',
    primaryColor: '#052e16',
    secondaryColor: '#071b11',
    accentColor: '#10b981',
    buttonBgColor: '#10b981',
    buttonTextColor: '#03120c',
    cardBgColor: 'rgba(255,255,255,0.04)',
    textColor: '#ffffff',
    mutedTextColor: '#a1a1aa',
    headerBgColor: 'rgba(0,0,0,0.35)',
  },
  {
    name: 'Luxo Dourado',
    primaryColor: '#2a2111',
    secondaryColor: '#0c0904',
    accentColor: '#d4a017',
    buttonBgColor: '#d4a017',
    buttonTextColor: '#1a1201',
    cardBgColor: 'rgba(255,255,255,0.04)',
    textColor: '#fff9e8',
    mutedTextColor: '#d6ccb5',
    headerBgColor: 'rgba(0,0,0,0.38)',
  },
  {
    name: 'Azul Profissional',
    primaryColor: '#0f172a',
    secondaryColor: '#111827',
    accentColor: '#38bdf8',
    buttonBgColor: '#38bdf8',
    buttonTextColor: '#07111a',
    cardBgColor: 'rgba(255,255,255,0.04)',
    textColor: '#ffffff',
    mutedTextColor: '#a7b0c0',
    headerBgColor: 'rgba(0,0,0,0.35)',
  },
  {
    name: 'Roxo Elite',
    primaryColor: '#2e1065',
    secondaryColor: '#140824',
    accentColor: '#a855f7',
    buttonBgColor: '#a855f7',
    buttonTextColor: '#12051f',
    cardBgColor: 'rgba(255,255,255,0.04)',
    textColor: '#ffffff',
    mutedTextColor: '#cbb4e7',
    headerBgColor: 'rgba(0,0,0,0.35)',
  },
  {
    name: 'Vermelho Forte',
    primaryColor: '#2b0b0b',
    secondaryColor: '#120505',
    accentColor: '#ef4444',
    buttonBgColor: '#ef4444',
    buttonTextColor: '#1a0404',
    cardBgColor: 'rgba(255,255,255,0.04)',
    textColor: '#ffffff',
    mutedTextColor: '#d7b0b0',
    headerBgColor: 'rgba(0,0,0,0.35)',
  },
];

function slugify(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function onlyDigits(value: string) {
  return String(value ?? '').replace(/\D/g, '');
}

function ensureUrl(value: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getInitials(name: string) {
  return String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function normalizeColor(value: string, fallback: string) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return fallback;
  return trimmed.startsWith('#') || trimmed.startsWith('rgb') ? trimmed : `#${trimmed}`;
}

function buildInitialForm(store: ReturnType<typeof useApp>['store']): SettingsForm {
  return {
    name: store?.name || '',
    slug: store?.username || '',
    whatsapp: store?.whatsapp || '',
    niche: store?.niche || '',
    logoUrl: store?.logoUrl || '',
    bannerUrl: store?.bannerUrl || '',
    description: store?.description || '',
    slogan: store?.slogan || '',
    primaryColor: store?.primaryColor || DEFAULTS.primaryColor,
    secondaryColor: store?.secondaryColor || DEFAULTS.secondaryColor,
    accentColor: store?.accentColor || DEFAULTS.accentColor,
    buttonBgColor: store?.buttonBgColor || DEFAULTS.buttonBgColor,
    buttonTextColor: store?.buttonTextColor || DEFAULTS.buttonTextColor,
    cardBgColor: store?.cardBgColor || DEFAULTS.cardBgColor,
    textColor: store?.textColor || DEFAULTS.textColor,
    mutedTextColor: store?.mutedTextColor || DEFAULTS.mutedTextColor,
    headerBgColor: store?.headerBgColor || DEFAULTS.headerBgColor,
    primaryButtonText: store?.primaryButtonText || DEFAULTS.primaryButtonText,
    whatsappButtonText: store?.whatsappButtonText || DEFAULTS.whatsappButtonText,
    themeMode: store?.themeMode || DEFAULTS.themeMode,
  };
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white">{label}</label>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
        <input
          type="color"
          value={value.startsWith('#') ? value : '#10b981'}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
          placeholder="#10b981"
        />
      </div>
    </div>
  );
}

export default function ConfiguracoesLoja() {
  const navigate = useNavigate();
  const { store, products, refreshAppData } = useApp();

  const [form, setForm] = useState<SettingsForm>(buildInitialForm(store));
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [saving, setSaving] = useState(false);
  const [advancedColumnsMissing, setAdvancedColumnsMissing] = useState(false);

  useEffect(() => {
    if (!store) return;
    const next = buildInitialForm(store);
    setForm(next);
    setSavedSnapshot(JSON.stringify(next));
  }, [store]);

  const dirty = useMemo(() => JSON.stringify(form) !== savedSnapshot, [form, savedSnapshot]);

  const previewSlug = useMemo(() => slugify(form.slug || form.name), [form.slug, form.name]);

  const publicStoreUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/loja/${previewSlug}`;
    return `${window.location.origin}/loja/${previewSlug}`;
  }, [previewSlug]);

  const previewPageStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at top left, ${form.accentColor}26, transparent 24%), linear-gradient(180deg, ${form.primaryColor} 0%, ${form.secondaryColor} 100%)`,
    }),
    [form.primaryColor, form.secondaryColor, form.accentColor],
  );

  const previewHeaderStyle = useMemo(
    () => ({
      background: form.headerBgColor,
      backdropFilter: 'blur(12px)',
    }),
    [form.headerBgColor],
  );

  const previewCardStyle = useMemo(
    () => ({
      background: form.cardBgColor,
      border: `1px solid ${form.accentColor}22`,
    }),
    [form.cardBgColor, form.accentColor],
  );

  const sampleProducts = useMemo(() => {
    if (products.length > 0) return products.slice(0, 3);

    return [
      {
        id: '1',
        name: 'Produto destaque',
        description: 'Seu produto vai aparecer aqui no preview.',
        image: '',
        price: 'R$ 149,90',
        affiliateLink: '',
      },
      {
        id: '2',
        name: 'Oferta especial',
        description: 'Visual mais profissional e mais forte para vender.',
        image: '',
        price: 'R$ 89,90',
        affiliateLink: '',
      },
      {
        id: '3',
        name: 'Produto premium',
        description: 'A sua loja vai refletir as cores escolhidas.',
        image: '',
        price: 'R$ 249,90',
        affiliateLink: '',
      },
    ];
  }, [products]);

  const handleChange = (field: keyof SettingsForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyPreset = (preset: Preset) => {
    setForm((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      buttonBgColor: preset.buttonBgColor,
      buttonTextColor: preset.buttonTextColor,
      cardBgColor: preset.cardBgColor,
      textColor: preset.textColor,
      mutedTextColor: preset.mutedTextColor,
      headerBgColor: preset.headerBgColor,
    }));
  };

  const handleResetAppearance = () => {
    setForm((prev) => ({
      ...prev,
      ...DEFAULTS,
    }));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicStoreUrl);
      toast.success('Link da loja copiado.');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleSave = async () => {
    if (!store?.id) {
      toast.error('Loja não encontrada.');
      return;
    }

    const normalizedName = form.name.trim();
    const normalizedSlug = slugify(form.slug || form.name);
    const normalizedWhatsapp = onlyDigits(form.whatsapp);
    const normalizedNiche = form.niche.trim().toLowerCase();
    const normalizedLogo = ensureUrl(form.logoUrl);
    const normalizedBanner = ensureUrl(form.bannerUrl);

    if (!normalizedName) {
      toast.error('Informe o nome da loja.');
      return;
    }

    if (!normalizedSlug) {
      toast.error('Informe um link válido para a loja.');
      return;
    }

    setSaving(true);

    try {
      const { data: existingSlugStore, error: slugError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', normalizedSlug)
        .neq('id', store.id)
        .maybeSingle();

      if (slugError) throw slugError;

      if (existingSlugStore?.id) {
        toast.error('Esse link já está em uso por outra loja.');
        return;
      }

      const basePayload = {
        store_name: normalizedName,
        slug: normalizedSlug,
        whatsapp_number: normalizedWhatsapp,
        niche: normalizedNiche || null,
        logo_url: normalizedLogo,
        banner_url: normalizedBanner,
      };

      const { error: baseError } = await supabase
        .from('stores')
        .update(basePayload)
        .eq('id', store.id);

      if (baseError) throw baseError;

      const advancedPayload = {
        description: form.description.trim(),
        slogan: form.slogan.trim(),
        primary_color: normalizeColor(form.primaryColor, DEFAULTS.primaryColor),
        secondary_color: normalizeColor(form.secondaryColor, DEFAULTS.secondaryColor),
        accent_color: normalizeColor(form.accentColor, DEFAULTS.accentColor),
        button_bg_color: normalizeColor(form.buttonBgColor, DEFAULTS.buttonBgColor),
        button_text_color: normalizeColor(form.buttonTextColor, DEFAULTS.buttonTextColor),
        card_bg_color: form.cardBgColor.trim() || DEFAULTS.cardBgColor,
        text_color: normalizeColor(form.textColor, DEFAULTS.textColor),
        muted_text_color: normalizeColor(form.mutedTextColor, DEFAULTS.mutedTextColor),
        header_bg_color: form.headerBgColor.trim() || DEFAULTS.headerBgColor,
        primary_button_text: form.primaryButtonText.trim() || DEFAULTS.primaryButtonText,
        whatsapp_button_text: form.whatsappButtonText.trim() || DEFAULTS.whatsappButtonText,
        theme_mode: form.themeMode || 'dark',
      };

      const { error: advancedError } = await supabase
        .from('stores')
        .update(advancedPayload)
        .eq('id', store.id);

      if (advancedError) {
        const message = String(advancedError.message || '').toLowerCase();

        if (message.includes('column') || message.includes('schema cache')) {
          setAdvancedColumnsMissing(true);
          await refreshAppData();
          toast.success('Parte básica salva. Rode o SQL das novas colunas para liberar a personalização total.');
          return;
        }

        throw advancedError;
      }

      setAdvancedColumnsMissing(false);

      const normalizedForm: SettingsForm = {
        ...form,
        name: normalizedName,
        slug: normalizedSlug,
        whatsapp: normalizedWhatsapp,
        niche: normalizedNiche,
        logoUrl: normalizedLogo,
        bannerUrl: normalizedBanner,
        description: form.description.trim(),
        slogan: form.slogan.trim(),
        primaryColor: normalizeColor(form.primaryColor, DEFAULTS.primaryColor),
        secondaryColor: normalizeColor(form.secondaryColor, DEFAULTS.secondaryColor),
        accentColor: normalizeColor(form.accentColor, DEFAULTS.accentColor),
        buttonBgColor: normalizeColor(form.buttonBgColor, DEFAULTS.buttonBgColor),
        buttonTextColor: normalizeColor(form.buttonTextColor, DEFAULTS.buttonTextColor),
        cardBgColor: form.cardBgColor.trim() || DEFAULTS.cardBgColor,
        textColor: normalizeColor(form.textColor, DEFAULTS.textColor),
        mutedTextColor: normalizeColor(form.mutedTextColor, DEFAULTS.mutedTextColor),
        headerBgColor: form.headerBgColor.trim() || DEFAULTS.headerBgColor,
        primaryButtonText: form.primaryButtonText.trim() || DEFAULTS.primaryButtonText,
        whatsappButtonText: form.whatsappButtonText.trim() || DEFAULTS.whatsappButtonText,
        themeMode: form.themeMode || 'dark',
      };

      setForm(normalizedForm);
      setSavedSnapshot(JSON.stringify(normalizedForm));
      await refreshAppData();
      toast.success('Configurações salvas e sincronizadas em tempo real.');
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error?.message || 'Não foi possível salvar as configurações.');
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
        <div className="sticky top-0 z-30 mb-8 rounded-[28px] border border-white/10 bg-black/60 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Button
                variant="ghost"
                className="mb-2 -ml-3 text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={() => navigate('/painel')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao painel
              </Button>
              <h1 className="text-3xl font-black text-white">Configurações da loja</h1>
              <p className="mt-1 text-zinc-400">
                Agora tudo fica centralizado, mais forte e realmente vinculado ao SaaS.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  dirty
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                }`}
              >
                {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
              </div>

              <Button
                variant="outline"
                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={handleCopyLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </Button>

              <Button
                variant="outline"
                className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                onClick={() => navigate(`/loja/${previewSlug}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver loja
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <Card className="border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-white">Geral</CardTitle>
                <CardDescription className="text-zinc-400">
                  Nome, link, contato, nicho e textos principais.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <StoreIcon className="h-4 w-4 text-emerald-400" />
                      Nome da loja
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="Nome da sua loja"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <LinkIcon className="h-4 w-4 text-emerald-400" />
                      Link da loja
                    </label>
                    <input
                      value={form.slug}
                      onChange={(e) => handleChange('slug', slugify(e.target.value))}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="minha-loja"
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      URL final: <span className="text-emerald-400">/loja/{previewSlug}</span>
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <Phone className="h-4 w-4 text-emerald-400" />
                      WhatsApp
                    </label>
                    <input
                      value={form.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="82999999999"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      Nicho
                    </label>
                    <select
                      value={form.niche}
                      onChange={(e) => handleChange('niche', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                    >
                      <option value="">Selecione o nicho</option>
                      <option value="eletronicos">Eletrônicos</option>
                      <option value="moda">Moda</option>
                      <option value="beleza">Beleza</option>
                      <option value="casa">Casa</option>
                      <option value="fitness">Fitness</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <Type className="h-4 w-4 text-emerald-400" />
                      Slogan
                    </label>
                    <input
                      value={form.slogan}
                      onChange={(e) => handleChange('slogan', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="Ex: tecnologia premium com entrega rápida"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white">
                      Descrição da loja
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                      placeholder="Descreva sua loja de forma profissional, clara e convincente..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-white">Branding visual</CardTitle>
                <CardDescription className="text-zinc-400">
                  Logo, banner e textos dos botões principais.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                      URL da logo
                    </label>
                    <input
                      value={form.logoUrl}
                      onChange={(e) => handleChange('logoUrl', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                      <ImageIcon className="h-4 w-4 text-emerald-400" />
                      URL do banner
                    </label>
                    <input
                      value={form.bannerUrl}
                      onChange={(e) => handleChange('bannerUrl', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                        <Type className="h-4 w-4 text-emerald-400" />
                        Texto do botão principal
                      </label>
                      <input
                        value={form.primaryButtonText}
                        onChange={(e) => handleChange('primaryButtonText', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                        placeholder="Ver produtos"
                      />
                    </div>

                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                        <MessageCircle className="h-4 w-4 text-emerald-400" />
                        Texto do botão WhatsApp
                      </label>
                      <input
                        value={form.whatsappButtonText}
                        onChange={(e) => handleChange('whatsappButtonText', e.target.value)}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                        placeholder="Falar no WhatsApp"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04]">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Palette className="h-5 w-5 text-emerald-400" />
                      Aparência profissional
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Cores reais da loja, botões, cards e textos.
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                    onClick={handleResetAppearance}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Restaurar padrão
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-6 flex flex-wrap gap-3">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-white transition hover:border-emerald-500/30 hover:bg-white/5"
                    >
                      <div className="mb-2 flex gap-2">
                        <span className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: preset.primaryColor }} />
                        <span className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: preset.secondaryColor }} />
                        <span className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: preset.accentColor }} />
                      </div>
                      <span className="text-sm font-semibold">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <ColorField label="Cor principal" value={form.primaryColor} onChange={(value) => handleChange('primaryColor', value)} />
                  <ColorField label="Cor secundária" value={form.secondaryColor} onChange={(value) => handleChange('secondaryColor', value)} />
                  <ColorField label="Cor de destaque" value={form.accentColor} onChange={(value) => handleChange('accentColor', value)} />
                  <ColorField label="Fundo do botão" value={form.buttonBgColor} onChange={(value) => handleChange('buttonBgColor', value)} />
                  <ColorField label="Texto do botão" value={form.buttonTextColor} onChange={(value) => handleChange('buttonTextColor', value)} />
                  <ColorField label="Texto principal" value={form.textColor} onChange={(value) => handleChange('textColor', value)} />
                  <ColorField label="Texto secundário" value={form.mutedTextColor} onChange={(value) => handleChange('mutedTextColor', value)} />
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">Fundo dos cards</label>
                    <input
                      value={form.cardBgColor}
                      onChange={(e) => handleChange('cardBgColor', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="rgba(255,255,255,0.04)"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white">Fundo do header</label>
                    <input
                      value={form.headerBgColor}
                      onChange={(e) => handleChange('headerBgColor', e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-500"
                      placeholder="rgba(0,0,0,0.35)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {advancedColumnsMissing ? (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    A parte básica já salvou. Para a personalização completa funcionar em todo o SaaS,
                    rode o SQL das novas colunas no Supabase.
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <Card className="overflow-hidden border-white/10 bg-white/[0.04] xl:sticky xl:top-28">
              <CardHeader>
                <CardTitle className="text-white">Preview completo</CardTitle>
                <CardDescription className="text-zinc-400">
                  Aqui você já vê melhor como a loja vai ficar.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div
                  className="overflow-hidden rounded-[32px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                  style={previewPageStyle}
                >
                  <div className="relative">
                    <div className="relative h-44 overflow-hidden" style={previewHeaderStyle}>
                      {form.bannerUrl ? (
                        <img
                          src={ensureUrl(form.bannerUrl)}
                          alt="Banner"
                          className="h-full w-full object-cover opacity-60"
                        />
                      ) : null}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-black/30 text-2xl font-black text-white">
                          {form.logoUrl ? (
                            <img
                              src={ensureUrl(form.logoUrl)}
                              alt="Logo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{getInitials(form.name || 'L')}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-2xl font-black" style={{ color: form.textColor }}>
                            {form.name || 'Nome da loja'}
                          </h3>
                          <p className="truncate text-sm" style={{ color: form.mutedTextColor }}>
                            @{previewSlug || 'minha-loja'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <div
                        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: `${form.accentColor}22`,
                          color: form.accentColor,
                          border: `1px solid ${form.accentColor}33`,
                        }}
                      >
                        {form.slogan || 'Loja personalizada'}
                      </div>

                      <p className="text-sm leading-6" style={{ color: form.textColor }}>
                        {form.description || 'Sua descrição da loja aparecerá aqui no preview.'}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl p-4" style={previewCardStyle}>
                          <p className="text-xs" style={{ color: form.mutedTextColor }}>Produtos</p>
                          <p className="mt-1 text-xl font-black" style={{ color: form.textColor }}>
                            {products.length}
                          </p>
                        </div>

                        <div className="rounded-2xl p-4" style={previewCardStyle}>
                          <p className="text-xs" style={{ color: form.mutedTextColor }}>Nicho</p>
                          <p className="mt-1 text-base font-bold capitalize" style={{ color: form.textColor }}>
                            {form.niche || 'Sem nicho'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full rounded-2xl px-4 py-4 text-base font-black transition"
                        style={{
                          backgroundColor: form.buttonBgColor,
                          color: form.buttonTextColor,
                        }}
                      >
                        {form.primaryButtonText || 'Ver produtos'}
                      </button>

                      <button
                        type="button"
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-bold transition"
                        style={{ color: form.textColor }}
                      >
                        {form.whatsappButtonText || 'Falar no WhatsApp'}
                      </button>

                      <div className="space-y-3 pt-2">
                        {sampleProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 rounded-2xl p-3"
                            style={previewCardStyle}
                          >
                            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-black/20">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: form.mutedTextColor }}>
                                  Sem img
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold" style={{ color: form.textColor }}>
                                {product.name}
                              </p>
                              <p className="truncate text-xs" style={{ color: form.mutedTextColor }}>
                                {product.description}
                              </p>
                            </div>
                            <div className="text-sm font-black" style={{ color: form.accentColor }}>
                              {product.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-emerald-500/15 bg-emerald-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Link público
                  </p>
                  <p className="mt-2 break-all text-sm text-emerald-100">{publicStoreUrl}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-black hover:from-emerald-400 hover:to-emerald-500"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar configurações'}
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                    onClick={() => navigate(`/loja/${previewSlug}`)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver loja
                  </Button>
                </div>

                {!dirty ? (
                  <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Tudo salvo no momento.
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}