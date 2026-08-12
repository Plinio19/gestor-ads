import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Tag } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  FundOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { dataService } from '../../services/GitHubDataService';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const MENU = [
  { key: '/',           icon: <DashboardOutlined />, label: 'Dashboard'   },
  { key: '/clientes',   icon: <TeamOutlined />,      label: 'Clientes'    },
  { key: '/pipeline',   icon: <FundOutlined />,      label: 'Pipeline'    },
  { key: '/atividades', icon: <CalendarOutlined />,  label: 'Atividades'  },
  { key: '/config',     icon: <SettingOutlined />,   label: 'Config.'     },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const connected = !!dataService.getConfig()?.token;

  const selectedKey = MENU.find(m => m.key !== '/' && location.pathname.startsWith(m.key))?.key
    ?? (location.pathname === '/' ? '/' : '/');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={210}
        style={{ background: '#1a0533' }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 8px' : '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          textAlign: collapsed ? 'center' : 'left',
          transition: 'all .2s',
        }}>
          <Text style={{ fontSize: collapsed ? 22 : 18, fontWeight: 800, color: '#c084fc', letterSpacing: -0.5 }}>
            {collapsed ? 'H' : '⚗️ Halogenn'}
          </Text>
          {!collapsed && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              CRM
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
          items={MENU}
          style={{ background: 'transparent', borderRight: 'none', marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: 52,
        }}>
          {connected
            ? <Tag color="success">GitHub conectado</Tag>
            : <Tag color="warning">GitHub não configurado</Tag>}
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
