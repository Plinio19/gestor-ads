import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Badge, Avatar, Typography } from 'antd';
import {
  DashboardOutlined, TeamOutlined, CheckSquareOutlined,
  FileTextOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useTarefasStore, tarefasVencidas, tarefasHoje } from '../../stores/useTarefasStore';
import { useFuncionariosStore } from '../../stores/useFuncionariosStore';
import { dataService } from '../../services/GitHubDataService';

const { Sider, Content } = Layout;
const { Text } = Typography;

const LS_USER = 'ge_usuario_id';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tarefas, fetch: fetchTarefas } = useTarefasStore();
  const { funcionarios, fetch: fetchFuncs } = useFuncionariosStore();
  const [usuarioId] = useState<string | null>(localStorage.getItem(LS_USER));
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!dataService.getConfig()?.token) { navigate('/config'); return; }
    fetchTarefas(); fetchFuncs();
  }, []);

  // browser notifications
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  useEffect(() => {
    const vencidas = tarefasVencidas(tarefas);
    const hoje = tarefasHoje(tarefas);
    if ((vencidas.length > 0 || hoje.length > 0) && Notification.permission === 'granted') {
      const total = vencidas.length + hoje.length;
      new Notification('Gestor de Equipe', {
        body: `${total} tarefa${total > 1 ? 's' : ''} requer${total === 1 ? ' atenção' : 'em atenção'} hoje.`,
        icon: '/favicon.ico',
      });
    }
  }, [tarefas]);

  const usuario = funcionarios.find(f => f.id === usuarioId);
  const pendentes = tarefasVencidas(tarefas).length + tarefasHoje(tarefas).length;

  const selectedKey = location.pathname === '/' ? 'dashboard'
    : location.pathname.startsWith('/equipe') ? 'equipe'
    : location.pathname.startsWith('/tarefas') ? 'tarefas'
    : location.pathname.startsWith('/processos') ? 'processos'
    : 'config';

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', onClick: () => navigate('/') },
    { key: 'tarefas',   icon: <Badge count={pendentes} size="small"><CheckSquareOutlined /></Badge>, label: 'Tarefas', onClick: () => navigate('/tarefas') },
    { key: 'equipe',    icon: <TeamOutlined />,          label: 'Equipe',     onClick: () => navigate('/equipe') },
    { key: 'processos', icon: <FileTextOutlined />,      label: 'Processos',  onClick: () => navigate('/processos') },
    { key: 'config',    icon: <SettingOutlined />,       label: 'Config',     onClick: () => navigate('/config') },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0', boxShadow: '2px 0 8px rgba(0,0,0,.04)' }}
      >
        <div style={{ padding: collapsed ? '16px 8px' : '16px', marginBottom: 8, borderBottom: '1px solid #f5f5f5' }}>
          {!collapsed && (
            <Text strong style={{ fontSize: 13, color: '#1677ff', display: 'block', lineHeight: 1.2 }}>
              Gestor de Equipe
            </Text>
          )}
          {usuario && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={28} style={{ background: usuario.cor, fontSize: 11, flexShrink: 0 }}>
                {usuario.nome.slice(0, 2).toUpperCase()}
              </Avatar>
              {!collapsed && (
                <div style={{ minWidth: 0 }}>
                  <Text style={{ fontSize: 11.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario.nome}</Text>
                  <Text type="secondary" style={{ fontSize: 10.5 }}>{usuario.cargo}</Text>
                </div>
              )}
            </div>
          )}
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ border: 'none' }} />
      </Sider>
      <Layout>
        <Content style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
