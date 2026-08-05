import { useState } from 'react';
import { Layout, Menu, theme, Typography, Badge, Space } from 'antd';
import {
  HomeOutlined,
  CarOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { dataService } from '../../services/GitHubDataService';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/',              icon: <HomeOutlined />,       label: 'Dashboard' },
  { key: '/transportadoras', icon: <CarOutlined />,      label: 'Transportadoras' },
  { key: '/cotacoes',      icon: <FileTextOutlined />,   label: 'Cotações' },
  { key: '/documentos',    icon: <FolderOpenOutlined />, label: 'Documentos' },
  { key: '/configuracoes', icon: <SettingOutlined />,    label: 'Configurações' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const configurado = dataService.isConfigured();

  const selectedKey = menuItems
    .map(i => i.key)
    .filter(k => location.pathname === k || location.pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0] ?? '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          gap: 8,
        }}>
          <span style={{ fontSize: 22 }}>🚚</span>
          {!collapsed && (
            <Text strong style={{ fontSize: 14, letterSpacing: -0.3 }}>
              Transportadoras
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 4 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}>
          <span
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, cursor: 'pointer', color: token.colorTextSecondary }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>

          <Space>
            {configurado ? (
              <Badge status="success" text={<Text type="secondary" style={{ fontSize: 12 }}>GitHub conectado</Text>} />
            ) : (
              <Badge status="warning" text={
                <Text type="warning" style={{ fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/configuracoes')}>
                  Configure o GitHub
                </Text>
              } />
            )}
            <CloudOutlined style={{ color: token.colorTextQuaternary }} />
          </Space>
        </Header>

        <Content style={{
          margin: 0,
          padding: 24,
          background: token.colorBgLayout,
          minHeight: 'calc(100vh - 56px)',
          overflow: 'auto',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
