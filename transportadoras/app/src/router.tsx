import { createHashRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import TransportadorasPage from './pages/transportadoras/TransportadorasPage';
import CotacoesPage from './pages/cotacoes/CotacoesPage';
import DocumentosPage from './pages/documentos/DocumentosPage';
import Configuracoes from './pages/configuracoes/Configuracoes';
import TicketsPage from './pages/tickets/TicketsPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true,              element: <Dashboard /> },
      { path: 'transportadoras',  element: <TransportadorasPage /> },
      { path: 'cotacoes',         element: <CotacoesPage /> },
      { path: 'documentos',       element: <DocumentosPage /> },
      { path: 'tickets',          element: <TicketsPage /> },
      { path: 'configuracoes',    element: <Configuracoes /> },
    ],
  },
]);
