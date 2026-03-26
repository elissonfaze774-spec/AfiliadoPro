import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Login } from './pages/Login';
import RecuperarSenha from './pages/RecuperarSenha';
import Onboarding from './pages/Onboarding';
import Painel from './pages/Painel';
import AdicionarProduto from './pages/AdicionarProduto';
import ProdutoView from './pages/ProdutoView';
import GerarConteudo from './pages/GerarConteudo';
import LojaPublica from './pages/LojaPublica';
import SuperAdmin from './pages/SuperAdmin';
import App from './App';
import { useAuth } from './context/AuthTemp';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      Carregando...
    </div>
  );
}

function AdminRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'super-admin') {
    return <Navigate to="/super-admin" replace />;
  }

  return <Outlet />;
}

function SuperAdminRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'super-admin') {
    return <Navigate to="/painel" replace />;
  }

  return <Outlet />;
}

function GuestRoute() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <FullScreenLoader />;
  }

  if (user?.role === 'super-admin') {
    return <Navigate to="/super-admin" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/painel" replace />;
  }

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
            path: 'adicionar-produto',
            Component: AdicionarProduto,
          },
          {
            path: 'produto/:id',
            Component: ProdutoView,
          },
          {
            path: 'gerar-conteudo',
            Component: GerarConteudo,
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