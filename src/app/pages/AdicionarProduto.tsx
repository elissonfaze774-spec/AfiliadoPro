import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Package, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useApp } from '../context/AppContext';

export default function AdicionarProduto() {
  const navigate = useNavigate();
  const { addProduct } = useApp();
  const [formData, setFormData] = useState({
    affiliateLink: '',
    name: '',
    image: '',
    price: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.affiliateLink && formData.name && formData.image && formData.price && formData.description) {
      addProduct({
        id: Date.now().toString(),
        ...formData,
      });
      navigate('/painel');
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

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-4">
              <Package className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                Novo produto
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Adicionar produto
            </h1>
            <p className="text-xl text-gray-400">
              Adicione um produto de afiliado à sua loja
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="affiliateLink" className="text-white">
                Link de afiliado
              </Label>
              <Input
                id="affiliateLink"
                type="url"
                placeholder="https://..."
                value={formData.affiliateLink}
                onChange={(e) => setFormData({ ...formData, affiliateLink: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                required
              />
              <p className="text-gray-500 text-sm">
                Cole aqui seu link de afiliado do Shopee, Mercado Livre, Amazon, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Nome do produto
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Fone de Ouvido Bluetooth Premium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-white">
                URL da imagem
              </Label>
              <Input
                id="image"
                type="url"
                placeholder="https://..."
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                required
              />
              <p className="text-gray-500 text-sm">
                Cole a URL da imagem do produto
              </p>
            </div>

            {formData.image && (
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Imagem+Inv%C3%A1lida';
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="price" className="text-white">
                Preço
              </Label>
              <Input
                id="price"
                type="text"
                placeholder="Ex: R$ 149,90"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Descrição curta
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva os principais benefícios do produto..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[120px]"
                required
              />
              <p className="text-gray-500 text-sm">
                Destaque os principais benefícios e diferenciais
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg py-6 h-auto"
            >
              Salvar produto
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}