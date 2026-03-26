import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Store,
  LogOut,
  User,
  Mail,
  Lock,
  Link2,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { supabase } from '../../lib/supabase';

type CreateAdminStoreResponse = {
  success: boolean;
  message?: string;
  adminUserId?: string;
  storeId?: string;
  slug?: string;
  temporaryPassword?: string;
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function SuperAdmin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    loja: '',
    username: '',
  });

  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  const generatedSlug = useMemo(() => {
    return slugify(form.username || form.loja);
  }, [form.username, form.loja]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (feedback.type) {
      setFeedback({ type: null, message: '' });
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      loja: '',
      username: '',
    });
  };

  const handleCreate = async () => {
    if (loading) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const loja = form.loja.trim();
    const slug = generatedSlug;

    if (!name || !email || !password || !loja || !slug) {
      setFeedback({
        type: 'error',
        message: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        type: 'error',
        message: 'A senha precisa ter pelo menos 6 caracteres.',
      });
      return;
    }

    setLoading(true);
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await supabase.functions.invoke<CreateAdminStoreResponse>(
        'create-admin-store',
        {
          body: {
            adminName: name,
            adminEmail: email,
            adminPassword: password,
            storeName: loja,
            storeSlug: slug,
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Não foi possível criar o admin e a estrutura.');
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Falha ao criar o admin e a estrutura.');
      }

      setFeedback({
        type: 'success',
        message: 'Admin e estrutura criados com sucesso.',
      });

      resetForm();

      setTimeout(() => {
        navigate('/painel');
      }, 800);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro inesperado ao criar admin e estrutura.';

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutRedirect = async (path: '/' | '/login') => {
    if (logoutLoading) return;

    setLogoutLoading(true);

    try {
      await supabase.auth.signOut();
      navigate(path, { replace: true });
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(180deg,_#020202_0%,_#050505_45%,_#07110a_100%)] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Controle administrativo
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Super Admin
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">
              Crie novos acessos e deixe a estrutura inicial pronta no Supabase com visual
              profissional e foco em crescimento.
            </p>
          </div>

          <Button
            variant="outline"
            className="border-emerald-500/20 bg-black/40 text-white hover:bg-emerald-500/10"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Estrutura pronta</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Criação de admin e base inicial sem gambiarra local.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Store className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Nova operação</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Configure rapidamente o nome, login e link da nova estrutura.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Visual de crescimento</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Interface alinhada ao AfiliadoPRO: preto, verde e sensação de escala.
            </p>
          </div>
        </div>

        <Card className="border border-emerald-500/10 bg-black/55 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xl font-black text-white">
              Criar novo admin
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-200">Nome do cliente</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="Nome do cliente"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Nome da estrutura</Label>
                <div className="relative">
                  <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="Nome da estrutura"
                    value={form.loja}
                    onChange={(e) => updateField('loja', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Email do admin</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="email"
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-200">Senha inicial</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    type="password"
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="Senha inicial"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-zinc-200">Link da estrutura</Label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500"
                    placeholder="minha-estrutura"
                    value={form.username}
                    onChange={(e) => updateField('username', e.target.value)}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  Link final:{' '}
                  <span className="font-medium text-emerald-300">
                    {generatedSlug || 'minha-estrutura'}
                  </span>
                </p>
              </div>
            </div>

            {feedback.type && (
              <div
                className={[
                  'rounded-2xl border px-4 py-3 text-sm',
                  feedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300',
                ].join(' ')}
              >
                {feedback.message}
              </div>
            )}

            <Button
              className="h-12 w-full rounded-2xl bg-emerald-500 font-bold text-black shadow-[0_10px_30px_rgba(34,197,94,0.28)] transition hover:bg-emerald-400 disabled:opacity-70"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando admin + estrutura...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar admin + estrutura
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-emerald-500/20 bg-[#050505] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-black text-white">Deseja sair?</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Escolha para onde deseja ir após encerrar sua sessão.
                </p>
              </div>

              <button
                type="button"
                onClick={() => !logoutLoading && setShowLogoutModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <Button
                className="h-12 rounded-2xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
                onClick={() => handleLogoutRedirect('/login')}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saindo...
                  </>
                ) : (
                  'Ir para Login'
                )}
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => handleLogoutRedirect('/')}
                disabled={logoutLoading}
              >
                Ir para Tela Inicial
              </Button>

              <Button
                variant="ghost"
                className="h-12 rounded-2xl text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={() => setShowLogoutModal(false)}
                disabled={logoutLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}