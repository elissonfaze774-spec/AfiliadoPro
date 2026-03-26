import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Sparkles, Copy, Check, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function GerarConteudo() {
  const navigate = useNavigate();
  const { products, generateContent } = useApp();
  const [formData, setFormData] = useState({
    productId: '',
    platform: '',
    style: '',
  });
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = () => {
    if (formData.productId && formData.platform && formData.style) {
      const product = products.find((p) => p.id === formData.productId);
      if (!product) return;

      const styles = {
        agressivo: {
          prefix: '🔥 URGENTE! ',
          tone: 'direto e persuasivo',
        },
        simples: {
          prefix: '✨ ',
          tone: 'casual e amigável',
        },
        viral: {
          prefix: '🚨 ATENÇÃO! ',
          tone: 'emocionante e envolvente',
        },
      };

      const selectedStyle = styles[formData.style as keyof typeof styles];

      const content = {
        text: formData.style === 'agressivo' 
          ? `${selectedStyle.prefix}${product.name} com DESCONTO ABSURDO! 💥\n\n${product.description}\n\n💰 Apenas ${product.price}\n\n⚠️ ESTOQUE LIMITADO! Corre que acaba!\n\n👉 Link na bio ou me chama no direct!`
          : formData.style === 'simples'
          ? `${selectedStyle.prefix}Olha que incrível esse ${product.name}! 😍\n\n${product.description}\n\nE o melhor: ${product.price}! 💜\n\nQuer saber mais? Link na bio! ✨`
          : `${selectedStyle.prefix}Você PRECISA ver isso! 🤯\n\n${product.name} que está BOMBANDO! 🚀\n\n${product.description}\n\nPreço? ${product.price}! 😱\n\nCorre antes que esgote! Link na bio! 👆`,
        
        videoIdea: formData.platform === 'tiktok'
          ? `Vídeo mostrando o ${product.name} em ação, com música trending e transições rápidas. Mostre os benefícios de forma visual e dinâmica.`
          : formData.platform === 'instagram'
          ? `Reels mostrando unboxing do ${product.name} com boa iluminação. Use música popular e adicione legendas destacando os benefícios principais.`
          : `Status mostrando o produto em uso no dia a dia. Seja autêntico e mostre como ele resolve um problema real.`,
        
        callToAction: formData.platform === 'whatsapp'
          ? `Oi! 👋 Vi que você tem interesse no ${product.name}. Acabei de adicionar na minha loja e está com um preço incrível! Te mando o link: [LINK]`
          : `Link na bio para comprar! ☝️ Corre que está acabando! 🔥`,
        
        shortCall: formData.style === 'agressivo'
          ? `🔥 CORRE! ESTOQUE LIMITADO!`
          : formData.style === 'simples'
          ? `✨ Link na bio!`
          : `🚨 NÃO PERCA ESSA!`,
      };

      setGeneratedContent(content);

      generateContent({
        id: Date.now().toString(),
        productId: formData.productId,
        platform: formData.platform,
        style: formData.style,
        text: content.text,
        videoIdea: content.videoIdea,
        callToAction: content.callToAction,
        shortCall: content.shortCall,
        date: new Date().toISOString(),
      });
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AfiliadoPro</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white hover:bg-gray-800 mb-8"
          onClick={() => navigate('/painel')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao painel
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                Gerador de Conteúdo
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Gerar post
            </h1>
            <p className="text-xl text-gray-400">
              Crie conteúdo viral para promover seus produtos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product" className="text-white">
                      Produto
                    </Label>
                    <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione um produto" />
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

                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-white">
                      Plataforma
                    </Label>
                    <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Escolha a plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-white">
                      Estilo
                    </Label>
                    <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Escolha o estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agressivo">Agressivo</SelectItem>
                        <SelectItem value="simples">Simples</SelectItem>
                        <SelectItem value="viral">Viral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    onClick={handleGenerate}
                    disabled={!formData.productId || !formData.platform || !formData.style}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar conteúdo
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {generatedContent ? (
                <>
                  <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">Texto pronto</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-gray-800"
                        onClick={() => copyToClipboard(generatedContent.text, 'text')}
                      >
                        {copiedField === 'text' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 whitespace-pre-wrap">{generatedContent.text}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">Ideia de vídeo</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-gray-800"
                        onClick={() => copyToClipboard(generatedContent.videoIdea, 'video')}
                      >
                        {copiedField === 'video' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{generatedContent.videoIdea}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">CTA (Call to Action)</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-gray-800"
                        onClick={() => copyToClipboard(generatedContent.callToAction, 'cta')}
                      >
                        {copiedField === 'cta' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{generatedContent.callToAction}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-white">Chamada curta</CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-gray-800"
                        onClick={() => copyToClipboard(generatedContent.shortCall, 'short')}
                      >
                        {copiedField === 'short' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-lg font-bold">{generatedContent.shortCall}</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                  <CardContent className="py-12 text-center">
                    <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Configure as opções e gere seu conteúdo
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}