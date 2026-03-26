import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Store, Palette, Settings, CheckCircle, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthTemp';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    whatsapp: '',
    niche: '',
    description: '',
    logo: '',
    banner: '',
    primaryColor: '#10b981',
    theme: 'dark',
    whatsappButtonActive: true,
    showFeaturedProducts: true,
    bio: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  });

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (isSaving) return;

    if (!user?.id) {
      toast.error('Usuário não encontrado.');
      return;
    }

    setIsSaving(true);

    try {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_user_id: user.id,
          store_name: formData.name.trim(),
          slug: normalizeSlug(formData.slug),
          whatsapp_number: formData.whatsapp.trim(),
          logo_url: formData.logo.trim() || null,
          banner_url: formData.banner.trim() || null,
        })
        .select('id, slug')
        .single();

      if (storeError) throw storeError;

      const { error: adminError } = await supabase
        .from('admins')
        .update({ store_id: store.id })
        .eq('user_id', user.id);

      if (adminError) throw adminError;

      await refreshUser();

      toast.success('Loja criada com sucesso!');
      navigate('/painel', { replace: true });
    } catch (error: any) {
      console.error('Erro ao criar loja:', error);

      const message =
        error?.message?.includes('duplicate') || error?.code === '23505'
          ? 'Esse link da loja já está em uso. Escolha outro.'
          : error?.message || 'Erro ao criar loja.';

      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dados da loja', icon: Store },
    { number: 2, title: 'Identidade visual', icon: Palette },
    { number: 3, title: 'Configurações', icon: Settings },
    { number: 4, title: 'Confirmação', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AfiliadoPro</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {step <= 4 && (
            <>
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  {steps.map((s, index) => (
                    <div key={s.number} className="flex items-center flex-1">
                      <div className={`flex items-center gap-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                            step >= s.number ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-800 border-gray-700'
                          }`}
                        >
                          {step > s.number ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : (
                            <s.icon className={`w-6 h-6 ${step >= s.number ? 'text-white' : 'text-gray-500'}`} />
                          )}
                        </div>
                        <div className="hidden md:block">
                          <div className={`text-sm ${step >= s.number ? 'text-emerald-400' : 'text-gray-500'}`}>
                            Etapa {s.number}
                          </div>
                          <div className={`font-medium ${step >= s.number ? 'text-white' : 'text-gray-600'}`}>
                            {s.title}
                          </div>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-4 ${step > s.number ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Dados da loja</h2>
                      <p className="text-gray-400">Vamos começar configurando sua loja</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white">Nome da loja</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: Loja do João"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug" className="text-white">Link da loja</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: normalizeSlug(e.target.value) })}
                          placeholder="loja-do-joao"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <p className="text-sm text-gray-500">
                          Sua loja ficará em: /loja/{formData.slug || 'seu-link'}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-white">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })}
                          placeholder="11999999999"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="niche" className="text-white">Nicho</Label>
                        <Select value={formData.niche} onValueChange={(value) => setFormData({ ...formData, niche: value })}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Escolha seu nicho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                            <SelectItem value="beleza">Beleza</SelectItem>
                            <SelectItem value="fitness">Fitness</SelectItem>
                            <SelectItem value="casa">Casa</SelectItem>
                            <SelectItem value="infantil">Infantil</SelectItem>
                            <SelectItem value="moda">Moda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">Descrição curta</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva sua loja em poucas palavras..."
                        className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!formData.name || !formData.slug || !formData.whatsapp || !formData.niche}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    >
                      Continuar
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Identidade visual</h2>
                      <p className="text-gray-400">Personalize a aparência da sua loja</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="logo" className="text-white">URL da logo</Label>
                        <Input
                          id="logo"
                          value={formData.logo}
                          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                          placeholder="https://..."
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <Button type="button" variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                          <Upload className="w-4 h-4 mr-2" />
                          Fazer upload
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="banner" className="text-white">URL do banner</Label>
                        <Input
                          id="banner"
                          value={formData.banner}
                          onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                          placeholder="https://..."
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <Button type="button" variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                          <Upload className="w-4 h-4 mr-2" />
                          Fazer upload
                        </Button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor" className="text-white">Cor principal</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="w-20 h-12 bg-gray-800 border-gray-700"
                          />
                          <Input
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="flex-1 bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="theme" className="text-white">Tema</Label>
                        <Select value={formData.theme} onValueChange={(value) => setFormData({ ...formData, theme: value })}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dark">Escuro</SelectItem>
                            <SelectItem value="light">Claro</SelectItem>
                            <SelectItem value="modern">Moderno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1 border-gray-700 text-white hover:bg-gray-800">
                        Voltar
                      </Button>
                      <Button type="button" onClick={handleNext} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Configurações iniciais</h2>
                      <p className="text-gray-400">Ajuste as preferências da sua loja</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div>
                          <Label className="text-white">Botão WhatsApp ativo?</Label>
                          <p className="text-sm text-gray-400">Exibir botão flutuante de WhatsApp</p>
                        </div>
                        <Switch
                          checked={formData.whatsappButtonActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, whatsappButtonActive: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                        <div>
                          <Label className="text-white">Mostrar produtos em destaque?</Label>
                          <p className="text-sm text-gray-400">Destacar produtos principais na página inicial</p>
                        </div>
                        <Switch
                          checked={formData.showFeaturedProducts}
                          onCheckedChange={(checked) => setFormData({ ...formData, showFeaturedProducts: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-white">Bio da loja</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Conte mais sobre sua loja..."
                        className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-white">Links das redes sociais (opcional)</Label>
                      <Input
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="Instagram (sem @)"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <Input
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="Facebook"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <Input
                        value={formData.tiktok}
                        onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                        placeholder="TikTok (sem @)"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1 border-gray-700 text-white hover:bg-gray-800">
                        Voltar
                      </Button>
                      <Button type="button" onClick={handleNext} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">Confirmação</h2>
                      <p className="text-gray-400">Revise as informações da sua loja</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Nome da loja</div>
                        <div className="text-white font-medium">{formData.name}</div>
                      </div>
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">URL da loja</div>
                        <div className="text-emerald-400 font-medium">/loja/{formData.slug}</div>
                      </div>
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Nicho</div>
                        <div className="text-white font-medium capitalize">{formData.niche}</div>
                      </div>
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">WhatsApp</div>
                        <div className="text-white font-medium">{formData.whatsapp}</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={handleBack} className="flex-1 border-gray-700 text-white hover:bg-gray-800">
                        Voltar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleFinish}
                        disabled={isSaving}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-70"
                      >
                        {isSaving ? 'Criando loja...' : 'Finalizar configuração'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}