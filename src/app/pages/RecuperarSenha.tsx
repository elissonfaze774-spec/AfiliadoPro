import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DollarSign, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">AfiliadoPro</span>
          </button>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white mb-6"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para login
          </Button>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
            {!sent ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Recuperar senha
                  </h1>
                  <p className="text-gray-400">
                    Digite seu e-mail para receber o link de recuperação
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg py-6 h-auto"
                  >
                    Enviar link de recuperação
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Link enviado!
                </h2>
                <p className="text-gray-400 mb-8">
                  Verifique seu e-mail <strong className="text-white">{email}</strong> para redefinir sua senha
                </p>
                <Button
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => navigate('/login')}
                >
                  Voltar para login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
