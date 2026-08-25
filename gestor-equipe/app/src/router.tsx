import { createHashRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EquipePage from './pages/EquipePage';
import TarefasPage from './pages/TarefasPage';
import ProcessosPage from './pages/ProcessosPage';
import ProcessoDetailPage from './pages/ProcessoDetailPage';
import ConfigPage from './pages/ConfigPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true,               element: <DashboardPage /> },
      { path: 'equipe',            element: <EquipePage /> },
      { path: 'tarefas',           element: <TarefasPage /> },
      { path: 'processos',         element: <ProcessosPage /> },
      { path: 'processos/:id',     element: <ProcessoDetailPage /> },
      { path: 'config',            element: <ConfigPage /> },
    ],
  },
]);
