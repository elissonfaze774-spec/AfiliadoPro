import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Phone,
  Save,
  Sparkles,
  Store as StoreIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

type VisualSettings = {
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
};

type SettingsForm = {
  name: string;
  slug: string;
  whatsapp: string;
  niche: string;
  logoUrl: string;
  bannerUrl: string;
} & VisualSettings;

type Preset = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
};

const DEFAULT_VISUAL: VisualSettings = {
  description: '',
  primaryColor: '#0f172a',
  secondaryColor: '#111827',
  accentColor: '#10b981',
  buttonBgColor: '#10b981',
  buttonTextColor: '#03120c',
};

const PRESETS: Preset[] = [
  {
    name: 'Premium Verde',
    primaryColor: '#052e16',
    secondaryColor: '#071b11',
    accentColor: '#10b981',
    buttonBgColor: '#10b981',
    buttonTextColor: '#02120c',
  },
  {
    name: 'Luxo Dourado',
    primaryColor: '#2a2111',
    secondaryColor: '#0c0a06',
    accentColor: '#d4a017',
    buttonBgColor: '#d4a017',
    buttonTextColor: '#160f02',
  },
  {
    name: 'Azul Profissional',
    primaryColor: '#0f172a',
    secondaryColor: '#111827',
    accentColor: '#38bdf8',
    buttonBgColor: '#38bdf8',
    buttonTextColor: '#07111a',
  },
  {
    name: 'Roxo Elite',
    primaryColor: '#2e1065',
    secondaryColor: '#140824',
    accentColor: '#a855f7',
    buttonBgColor: '#a855f7',
    buttonTextColor: '#12051f',
  },
  {
    name: 'Vermelho Forte',
    primaryColor: '#2b0b0b',
    secondaryColor: '#120505',
    accentColor: '#ef4444',
    buttonBgColor: '#ef4444',
    buttonTextColor: '#190404',
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

function getLocalConfigKey(storeId?: string, username?: string) {
  return `afiliadopro:store-advanced-settings:${storeId || username || 'default'}`;
}

function readLocalVisual(storeId?: string, username?: string): VisualSettings {
  try {
    const raw = localStorage.getItem(getLocalConfigKey(storeId, username));
    if (!raw) return DEFAULT_VISUAL;

    const parsed = JSON.parse(raw);

    return {
      description: parsed?.description || '',
      primaryColor: parsed?.primaryColor || DEFAULT_VISUAL.primaryColor,
      secondaryColor: parsed?.secondaryColor || DEFAULT_VISUAL.secondaryColor,
      accentColor: parsed?.accentColor || DEFAULT_VISUAL.accentColor,
      buttonBgColor: parsed?.buttonBgColor || DEFAULT_VISUAL.buttonBgColor,
      buttonTextColor: parsed?.buttonTextColor || DEFAULT_VISUAL.buttonTextColor,
    };
  } catch {
    return DEFAULT_VISUAL;
  }
}

function saveLocalVisual(storeId: string | undefined, username: string | undefined, visual: VisualSettings) {
  localStorage.setItem(getLocalConfigKey(storeId, username), JSON.stringify(visual));
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
          value={value}
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

  const [saving, setSaving] = useState(false);
  const [advancedSavedInBrowser, setAdvancedSavedInBrowser] = useState(false);
  const [form, setForm] = useState<SettingsForm>({
    name: '',
    slug: '',
    whatsapp: '',
    niche: 'eletronicos',
    logoUrl: '',
    bannerUrl: '',
    ...DEFAULT_VISUAL,
  });

  useEffect(() => {
    if (!store) return;

    const localVisual = readLocalVisual(store.id, store.username);

    setForm({
      name: store.name || '',
      slug: store.username || '',
      whatsapp: store.whatsapp || '',
      niche: store.niche || 'eletronicos',
      logoUrl: store.logoUrl || '',
      bannerUrl: store.bannerUrl || '',
      ...localVisual,
    });
  }, [store]);

  const previewSlug = useMemo(() => slugify(form.slug || form.name), [form.slug, form.name]);

  const publicStoreUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/loja/${previewSlug}`;
    return `${window.location.origin}/loja/${previewSlug}`;
  }, [previewSlug]);

  const previewBannerStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${form.primaryColor} 0%, ${form.secondaryColor} 100%)`,
    }),
    [form.primaryColor, form.secondaryColor],
  );

  const previewPageStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at top left, ${form.accentColor}20, transparent 24%), linear-gradient(180deg, ${form.primaryColor} 0%, ${form.secondaryColor} 100%)`,
    }),
    [form.primaryColor, form.secondaryColor, form.accentColor],
  );

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
    const normalizedDescription = form.description.trim();

    if (!normalizedName) {
      toast.error('Informe o nome da loja.');
      return;
    }

    if (!normalizedSlug) {
      toast.error('Informe um link válido para a loja.');
      return;
    }

    setSaving(true);
    setAdvancedSavedInBrowser(false);

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

      const corePayload = {
        store_name: normalizedName,
        slug: normalizedSlug,
        whatsapp_number: normalizedWhatsapp,
        niche: normalizedNiche,
        logo_url: normalizedLogo,
        banner_url: normalizedBanner,
      };

      const { error: coreError } = await supabase
        .from('stores')
        .update(corePayload)
        .eq('id', store.id);

      if (coreError) throw coreError;

      const visualPayload = {
        description: normalizedDescription,
        primary_color: form.primaryColor,
        secondary_color: form.secondaryColor,
        accent_color: form.accentColor,
        button_bg_color: form.buttonBgColor,
        button_text_color: form.buttonTextColor,
      };

      const { error: visualError } = await supabase
        .from('stores')
        .update(visualPayload)
        .eq('id', store.id);

      saveLocalVisual(store.id, normalizedSlug, {
        description: normalizedDescription,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        accentColor: form.accentColor,
        buttonBgColor: form.buttonBgColor,
        buttonTextColor: form.buttonTextColor,
      });

      if (visualError) {
        setAdvancedSavedInBrowser(true);
      }

      await refreshAppData();

      toast.success(
        visualError
          ? 'Configurações salvas. A personalização avançada ficou salva neste navegador.'
          : 'Configurações salvas com sucesso.',
      );
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

            <h1 className="text-3xl font-black text-white">Configurações da loja</h1>
            <p className="mt-2 text-zinc-400">
              Personalize sua loja em uma página própria, mais organizada e profissional.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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

        <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8">
            <Card className="border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-white">Informações principais</CardTitle>
                <CardDescription className="text-zinc-400">
                  Nome, link, contato e descrição principal da loja.
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
                      <option value="eletronicos">Eletrônicos</option>
                      <option value="moda">Moda</option>
                      <option value="beleza">Beleza</option>
                      <option value="casa">Casa</option>
                      <option value="fitness">Fitness</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-white">
                      Descrição da loja
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                      placeholder="Descreva sua loja, estilo, proposta e o que faz ela parecer profissional e confiável..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="text-white">Branding visual</CardTitle>
                <CardDescription className="text-zinc-400">
                  Defina imagem de perfil e banner da sua loja.
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
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Palette className="h-5 w-5 text-emerald-400" />
                  Cores e aparência
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Escolha um visual mais premium para sua marca.
                </CardDescription>
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
                        <span
                          className="h-4 w-4 rounded-full border border-white/10"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <span
                          className="h-4 w-4 rounded-full border border-white/10"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                        <span
                          className="h-4 w-4 rounded-full border border-white/10"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <ColorField
                    label="Cor principal"
                    value={form.primaryColor}
                    onChange={(value) => handleChange('primaryColor', value)}
                  />

                  <ColorField
                    label="Cor secundária"
                    value={form.secondaryColor}
                    onChange={(value) => handleChange('secondaryColor', value)}
                  />

                  <ColorField
                    label="Cor de destaque"
                    value={form.accentColor}
                    onChange={(value) => handleChange('accentColor', value)}
                  />

                  <ColorField
                    label="Fundo do botão"
                    value={form.buttonBgColor}
                    onChange={(value) => handleChange('buttonBgColor', value)}
                  />

                  <div className="md:col-span-2">
                    <ColorField
                      label="Texto do botão"
                      value={form.buttonTextColor}
                      onChange={(value) => handleChange('buttonTextColor', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
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

            {advancedSavedInBrowser ? (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                Sua parte avançada de visual ficou salva neste navegador. Depois eu ajusto sua
                loja pública para ler isso direto e aplicar tudo automático.
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <Card className="overflow-hidden border-white/10 bg-white/[0.04] xl:sticky xl:top-6">
              <CardHeader>
                <CardTitle className="text-white">Preview da loja</CardTitle>
                <CardDescription className="text-zinc-400">
                  Veja ao vivo como sua loja pode ficar.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div
                  className="overflow-hidden rounded-[32px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                  style={previewPageStyle}
                >
                  <div className="relative h-48" style={previewBannerStyle}>
                    {form.bannerUrl ? (
                      <img
                        src={ensureUrl(form.bannerUrl)}
                        alt="Banner"
                        className="h-full w-full object-cover opacity-60"
                      />
                    ) : null}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

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
                        <h3 className="truncate text-2xl font-black text-white">
                          {form.name || 'Nome da loja'}
                        </h3>
                        <p className="truncate text-sm text-zinc-300">@{previewSlug}</p>
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
                      Loja personalizada
                    </div>

                    <p className="text-sm leading-6 text-zinc-200">
                      {form.description || 'Sua descrição da loja aparecerá aqui no preview.'}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs text-zinc-400">Produtos</p>
                        <p className="mt-1 text-xl font-black text-white">{products.length}</p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs text-zinc-400">Nicho</p>
                        <p className="mt-1 text-base font-bold capitalize text-white">
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
                      Ver produtos
                    </button>

                    <button
                      type="button"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base font-bold text-white transition"
                    >
                      Falar no WhatsApp
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-emerald-500/15 bg-emerald-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Link público
                  </p>
                  <p className="mt-2 break-all text-sm text-emerald-100">{publicStoreUrl}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}