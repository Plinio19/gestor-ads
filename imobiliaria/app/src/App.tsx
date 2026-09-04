import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { HomeOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import ImoveisPage from './pages/ImoveisPage';
import AlugadosPage from './pages/AlugadosPage';
import ConfigPage from './pages/ConfigPage';

const { Sider, Content, Header } = Layout;

const MENU = [
  { key: 'imoveis',  icon: <HomeOutlined />,      label: 'Imóveis' },
  { key: 'alugados', icon: <FileTextOutlined />,   label: 'Alugados' },
  { key: 'config',   icon: <SettingOutlined />,    label: 'Configurações' },
];

export default function App() {
  const [pag, setPag] = useState('imoveis');
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible breakpoint="lg" collapsedWidth={56} style={{ background: token.colorBgContainer }}>
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, color: token.colorPrimary, borderBottom: `1px solid ${token.colorBorderSecondary}`,
          letterSpacing: 0.5,
        }}>
          🏠 Imobiliária
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pag]}
          items={MENU}
          style={{ borderRight: 0 }}
          onClick={({ key }) => setPag(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px', background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex', alignItems: 'center',
          fontSize: 15, fontWeight: 500, color: token.colorText,
        }}>
          {MENU.find(m => m.key === pag)?.label}
        </Header>
        <Content style={{ background: token.colorBgLayout }}>
          {pag === 'imoveis'  && <ImoveisPage />}
          {pag === 'alugados' && <AlugadosPage />}
          {pag === 'config'   && <ConfigPage />}
        </Content>
      </Layout>
    </Layout>
  );
}
