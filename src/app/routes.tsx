import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import Onboarding from './pages/Onboarding';
import Painel from './pages/Painel';
import Produtos from './pages/Produtos';
import ProdutoView from './pages/ProdutoView';
import GerarConteudo from './pages/GerarConteudo';
import LojaPublica from './pages/LojaPublica';
import ConfiguracoesLoja from './pages/ConfiguracoesLoja';
import SuperAdmin from './pages/SuperAdmin';
import AfilieSe from './pages/AfilieSe';
import App from './App';
import { useAuth } from './context/AuthTemp';

function FullScreenLoader() {
  return <div className="min-h-screen bg-black" />;
}

function AccessBlockedScreen() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#020202_0%,_#050505_50%,_#08120d_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
          ⏳
        </div>
        <h1 className="text-3xl font-black">Seu acesso está temporariamente indisponível</h1>
        <p className="mt-3 max-w-xl text-zinc-400">
          Sua estrutura continua preservada. Assim que a renovação for concluída,
          tudo volta ao normal.
        </p>
      </div>
    </div>
  );
}

function AdminRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'super-admin') return <Navigate to="/super-admin" replace />;
  if (user.role === 'admin' && user.access?.isExpired) return <AccessBlockedScreen />;

  return <Outlet />;
}

function SuperAdminRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'super-admin') return <Navigate to="/painel" replace />;

  return <Outlet />;
}

function GuestRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) return <FullScreenLoader />;
  if (user?.role === 'super-admin') return <Navigate to="/super-admin" replace />;
  if (user?.role === 'admin') return <Navigate to="/painel" replace />;

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        element: <GuestRoute />,
        children: [
          {
            path: 'login',
            Component: Login,
          },
          {
            path: 'recuperar-senha',
            Component: RecuperarSenha,
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'onboarding',
            Component: Onboarding,
          },
          {
            path: 'painel',
            Component: Painel,
          },
          {
            path: 'produtos',
            Component: Produtos,
          },
          {
            path: 'adicionar-produto',
            element: <Navigate to="/produtos" replace />,
          },
          {
            path: 'produto/:id',
            Component: ProdutoView,
          },
          {
            path: 'gerar-conteudo',
            Component: GerarConteudo,
          },
          {
            path: 'configuracoes',
            Component: ConfiguracoesLoja,
          },
          {
            path: 'afilie-se',
            Component: AfilieSe,
          },
        ],
      },
      {
        path: 'loja/:username',
        Component: LojaPublica,
      },
      {
        element: <SuperAdminRoute />,
        children: [
          {
            path: 'super-admin',
            Component: SuperAdmin,
          },
        ],
      },
    ],
  },
]);