import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Copy,
  Lightbulb,
  Megaphone,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
  Video,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';

type GeneratedPack = {
  headline: string;
  text: string;
  videoIdea: string;
  callToAction: string;
  shortCall: string;
  approach: string;
  dailyStrategy: string;
};

export default function GerarConteudo() {
  const navigate = useNavigate();
  const { products, generateContent, contents } = useApp();

  const [formData, setFormData] = useState({
    productId: '',
    platform: '',
    style: '',
    objective: '',
    awareness: '',
    angle: '',
  });

  const [generatedPack, setGeneratedPack] = useState<GeneratedPack | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customAudience, setCustomAudience] = useState('');

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === formData.productId) ?? null,
    [products, formData.productId],
  );

  const handleGenerate = () => {
    if (
      !formData.productId ||
      !formData.platform ||
      !formData.style ||
      !formData.objective ||
      !formData.awareness
    ) {
      return;
    }

    if (!selectedProduct) return;

    const productName = selectedProduct.name;
    const productPrice = selectedProduct.price;
    const description =
      selectedProduct.description || 'Produto com ótima oportunidade de conversão.';
    const audience = customAudience.trim() || 'pessoas interessadas em ofertas e achadinhos';

    const stylePrefix =
      {
        agressivo: '🔥 Oportunidade forte',
        simples: '✨ Dica boa do dia',
        premium: '💎 Seleção estratégica',
        viral: '🚀 Tendência que chama atenção',
      }[formData.style] || '✨ Conteúdo';

    const objectiveLine =
      {
        clique: 'o foco aqui é gerar clique qualificado',
        grupo: 'o foco aqui é levar as pessoas para o grupo',
        venda: 'o foco aqui é acelerar decisão de compra',
        relacionamento: 'o foco aqui é ganhar confiança e conversa',
      }[formData.objective] || 'o foco aqui é gerar interesse';

    const awarenessLine =
      {
        frio: 'fale como se a pessoa ainda não conhecesse o produto',
        morno: 'fale como se a pessoa já tivesse visto algo parecido',
        quente: 'fale como se a pessoa já estivesse quase pronta para comprar',
      }[formData.awareness] || 'fale de forma clara';

    const angleLine = formData.angle
      ? `Ângulo principal: ${formData.angle}.`
      : 'Ângulo principal: benefício visual, utilidade e oportunidade.';

    const text = `${stylePrefix}: ${productName}

${description}

Preço percebido: ${productPrice}
Público ideal: ${audience}
Estratégia: ${objectiveLine}; ${awarenessLine}. ${angleLine}

Mostre por que esse produto chama atenção, é fácil de entender e tem potencial de compra rápida.
Finalize com um convite claro para clicar, entrar no grupo ou pedir o link.`;

    const videoIdea =
      formData.platform === 'tiktok'
        ? `Abra com um gancho visual forte, mostre o ${productName} em uso, faça 3 cortes rápidos e termine apontando para a oferta.`
        : formData.platform === 'instagram'
          ? `Monte um reels curto do ${productName} com abertura forte, benefício central, prova visual e CTA final para grupo ou link.`
          : formData.platform === 'whatsapp'
            ? `Use 3 telas: gancho rápido, benefício principal e CTA final chamando para o grupo e para a oferta.`
            : 'Crie um post enxuto mostrando utilidade, diferencial e chamada para ação.';

    const callToAction =
      formData.objective === 'grupo'
        ? 'Quer receber mais ofertas como essa? Entre no grupo e acompanhe as novidades todos os dias.'
        : formData.objective === 'relacionamento'
          ? 'Se quiser, eu te explico melhor e te mando outras opções parecidas também.'
          : formData.objective === 'venda'
            ? 'Se esse produto faz sentido para você, entre agora antes que a oportunidade esfrie.'
            : 'Clique agora para ver a oferta completa e aproveitar enquanto está disponível.';

    const shortCall =
      formData.objective === 'grupo'
        ? 'Entre no grupo agora'
        : formData.objective === 'relacionamento'
          ? 'Fala comigo que eu te ajudo'
          : 'Clique e veja a oferta';

    const approach = `Abordagem sugerida:
1. Comece com um gancho simples sobre dor, desejo ou curiosidade.
2. Mostre o ${productName} como solução prática.
3. Reforce benefício + percepção de oportunidade.
4. Convide a pessoa para clicar ou entrar no grupo.`;

    const dailyStrategy = `Plano rápido do dia:
- Publique 1 conteúdo principal no ${formData.platform}.
- Faça 2 chamadas curtas derivadas dele.
- Reaproveite o gancho em status, grupos e conversa privada.
- No fim do dia, observe qual formato gerou mais clique e repita amanhã.`;

    const pack: GeneratedPack = {
      headline: `${stylePrefix} para ${productName}`,
      text,
      videoIdea,
      callToAction,
      shortCall,
      approach,
      dailyStrategy,
    };

    setGeneratedPack(pack);

    generateContent({
      id: Date.now().toString(),
      productId: formData.productId,
      platform: formData.platform,
      style: formData.style,
      text: pack.text,
      videoIdea: pack.videoIdea,
      callToAction: pack.callToAction,
      shortCall: pack.shortCall,
      date: new Date().toISOString(),
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const insights = [
    {
      icon: TrendingUp,
      title: 'Estratégia de consistência',
      description: 'Quem vende mais costuma postar mais vezes de forma simples, clara e repetível.',
    },
    {
      icon: Target,
      title: 'Oferta + contexto',
      description: 'Não mostre só o produto. Mostre para quem serve e por que vale atenção agora.',
    },
    {
      icon: MessageSquareText,
      title: 'Abordagem converte',
      description: 'Uma boa copy abre conversa, gera clique e constrói confiança ao mesmo tempo.',
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,_#020202_0%,_#050505_52%,_#07110a_100%)] text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Central de conteúdo
            </div>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">Gerar conteúdo premium</h1>
            <p className="mt-2 text-sm text-zinc-400 md:text-base">
              Copies, estratégias, abordagens, ideias de vídeo e CTA em uma página só.
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
          {insights.map((item) => (
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

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-emerald-400" />
                Configurações do material
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Monte o briefing e gere um pacote pronto para divulgar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                    <SelectValue placeholder="Escolha o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plataforma</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Escolha a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estilo</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Escolha o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agressivo">Agressivo</SelectItem>
                      <SelectItem value="simples">Simples</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="viral">Viral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Select
                    value={formData.objective}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, objective: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Escolha o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clique">Gerar clique</SelectItem>
                      <SelectItem value="grupo">Levar para o grupo</SelectItem>
                      <SelectItem value="venda">Acelerar compra</SelectItem>
                      <SelectItem value="relacionamento">Abrir conversa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nível de consciência</Label>
                  <Select
                    value={formData.awareness}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, awareness: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                      <SelectValue placeholder="Escolha o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frio">Público frio</SelectItem>
                      <SelectItem value="morno">Público morno</SelectItem>
                      <SelectItem value="quente">Público quente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Público / audiência</Label>
                <Input
                  value={customAudience}
                  onChange={(e) => setCustomAudience(e.target.value)}
                  placeholder="Ex: mulheres que gostam de utilidades para casa"
                  className="h-12 rounded-2xl border-white/10 bg-black/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Ângulo principal</Label>
                <Input
                  value={formData.angle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, angle: e.target.value }))}
                  placeholder="Ex: custo-benefício, presente, praticidade, estética..."
                  className="h-12 rounded-2xl border-white/10 bg-black/20 text-white"
                />
              </div>

              <Button
                size="lg"
                className="h-12 w-full rounded-2xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
                onClick={handleGenerate}
                disabled={
                  !formData.productId ||
                  !formData.platform ||
                  !formData.style ||
                  !formData.objective ||
                  !formData.awareness
                }
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar material premium
              </Button>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-zinc-400">
                  Conteúdos já gerados nesta sessão:{' '}
                  <span className="font-bold text-white">{contents.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {generatedPack ? (
              <>
                <Card className="border border-emerald-500/15 bg-black/30">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{generatedPack.headline}</CardTitle>
                      <CardDescription className="text-zinc-400">
                        Material principal para usar agora.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                      onClick={() => copyToClipboard(generatedPack.text, 'text')}
                    >
                      {copiedField === 'text' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {generatedPack.text}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      title: 'Ideia de vídeo',
                      icon: Video,
                      text: generatedPack.videoIdea,
                      field: 'video',
                    },
                    {
                      title: 'CTA principal',
                      icon: BadgeCheck,
                      text: generatedPack.callToAction,
                      field: 'cta',
                    },
                    {
                      title: 'Chamada curta',
                      icon: Lightbulb,
                      text: generatedPack.shortCall,
                      field: 'short',
                    },
                    {
                      title: 'Abordagem',
                      icon: MessageSquareText,
                      text: generatedPack.approach,
                      field: 'approach',
                    },
                  ].map((item) => (
                    <Card key={item.title} className="border border-white/10 bg-black/30">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-5 w-5 text-emerald-400" />
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                          onClick={() => copyToClipboard(item.text, item.field)}
                        >
                          {copiedField === item.field ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-7 text-zinc-300">{item.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border border-white/10 bg-black/30">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-400" />
                        Estratégia diária
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Como transformar o material em rotina.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-2xl border-white/10 bg-black/20 text-white hover:bg-white/5"
                      onClick={() => copyToClipboard(generatedPack.dailyStrategy, 'strategy')}
                    >
                      {copiedField === 'strategy' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {generatedPack.dailyStrategy}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border border-white/10 bg-black/30">
                <CardContent className="py-16 text-center">
                  <Sparkles className="mx-auto mb-4 h-14 w-14 text-zinc-600" />
                  <p className="text-zinc-400">
                    Configure as opções e gere um pacote completo de conteúdo.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
