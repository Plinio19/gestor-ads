import { createHashRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientesPage from './pages/clientes/ClientesPage';
import PipelinePage from './pages/pipeline/PipelinePage';
import AtividadesPage from './pages/atividades/AtividadesPage';
import Configuracoes from './pages/configuracoes/Configuracoes';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true,          element: <DashboardPage /> },
      { path: 'clientes',     element: <ClientesPage />  },
      { path: 'pipeline',     element: <PipelinePage />  },
      { path: 'atividades',   element: <AtividadesPage />},
      { path: 'config',       element: <Configuracoes /> },
    ],
  },
]);
