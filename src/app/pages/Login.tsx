import { useState, useEffect } from 'react';
import { ShieldCheck, LogIn, MessageCircle, Sparkles, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthTemp';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

function normalizeEmailValue(email: string) {
  return email.trim().toLowerCase();
}

function getRedirect(appUser?: { role?: 'admin' | 'super-admin'; storeId?: string | null }) {
  if (appUser?.role === 'super-admin') return '/super-admin';
  if (!appUser?.storeId) return '/onboarding';
  return '/painel';
}

export function Login() {
  const navigate = useNavigate();
  const { login, user, authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappLink =
    'https://wa.me/5582987227433?text=Ol%C3%A1%21%20Tenho%20interesse%20em%20obter%20acesso%20ao%20AfiliadoPRO.%20Pode%20me%20passar%20mais%20informa%C3%A7%C3%B5es%3F';

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const timer = window.setTimeout(() => {
        navigate(getRedirect(user), { replace: true });
      }, 150);

      return () => window.clearTimeout(timer);
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const normalizedEmail = normalizeEmailValue(email);
      const appUser = await login(normalizedEmail, password);

      if (!appUser) {
        toast.error('Email ou senha inválidos.');
        return;
      }

      toast.success('Login realizado com sucesso!');

      window.setTimeout(() => {
        navigate(getRedirect(appUser), { replace: true });
      }, 150);
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetAccess = () => {
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_#020202_0%,_#050505_45%,_#07110a_100%)] text-white">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-400">
            Plataforma de Afiliados
          </p>
          <h1 className="text-lg font-black text-white sm:text-xl">Login AfiliadoPRO</h1>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-2">
        <div className="hidden md:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Área administrativa
            </div>

            <h2 className="text-4xl font-black uppercase leading-tight text-white">
              Controle sua operação e cresça com mais resultado
            </h2>

            <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-400">
              Entre no AfiliadoPRO para acessar sua estrutura, organizar sua operação e acompanhar seu crescimento com mais clareza.
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Estrutura profissional</p>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Tenha uma área organizada para administrar acessos, páginas e sua operação.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Mais controle</p>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Acompanhe sua estrutura com mais clareza e mantenha tudo centralizado.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Visual de crescimento</p>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  Interface pensada para transmitir valor, evolução e mentalidade de escala.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[2rem] border border-emerald-500/20 bg-black/60 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.50)] backdrop-blur-xl md:p-8">
            <div className="mb-6">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <p className="text-sm text-zinc-400">Bem-vindo de volta</p>
              <h2 className="mt-1 text-3xl font-black text-white">Entrar no sistema</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Use seu email e senha para acessar sua conta no AfiliadoPRO.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-zinc-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="mt-2 h-14 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-zinc-200">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="mt-2 h-14 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                className="h-14 w-full rounded-2xl border-0 bg-emerald-500 text-base font-bold text-black shadow-[0_10px_30px_rgba(34,197,94,0.30)] transition hover:bg-emerald-400 disabled:opacity-70"
                disabled={isSubmitting || authLoading}
              >
                <LogIn className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>

              <Button
                type="button"
                onClick={handleGetAccess}
                className="h-14 w-full rounded-2xl border border-emerald-500/20 bg-white/5 text-base font-bold text-white transition hover:bg-emerald-500/10"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Obter acesso
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <p className="text-xs leading-6 text-zinc-400">
                O acesso é individual e liberado pela administração. Caso ainda não tenha acesso, clique em{' '}
                <span className="font-semibold text-white">Obter acesso</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}