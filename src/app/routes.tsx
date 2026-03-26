import { createBrowserRouter } from 'react-router-dom';
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
        path: 'login',
        Component: Login,
      },
      {
        path: 'recuperar-senha',
        Component: RecuperarSenha,
      },
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
      {
        path: 'loja/:username',
        Component: LojaPublica,
      },
      {
        path: 'super-admin',
        Component: SuperAdmin,
      },
    ],
  },
]);