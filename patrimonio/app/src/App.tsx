import { useState, useEffect } from 'react';
import {
  ConfigProvider, Layout, Menu, Alert, Button, Card,
  Form, Input, Space, Typography, message,
} from 'antd';
import {
  PieChartOutlined, WalletOutlined, CalendarOutlined, UnorderedListOutlined,
  SettingOutlined, GithubOutlined, CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import ptBR from 'antd/locale/pt_BR';
import DashboardPage from './pages/DashboardPage';
import CarteiraPage from './pages/CarteiraPage';
import AgendaPage from './pages/AgendaPage';
import ExtratoPage from './pages/ExtratoPage';
import { dataService } from './services/GitHubDataService';

const { Sider, Content } = Layout;
const { Title, Paragraph } = Typography;

const THEME = {
  token: {
    colorPrimary: '#2D6A4F',
    borderRadius: 8,
    fontFamily: "'DM Sans', -apple-system, sans-serif",
  },
};

const MENU_ITEMS = [
  { key: 'dashboard', icon: <PieChartOutlined />, label: 'Visão Geral' },
  { key: 'carteira',  icon: <WalletOutlined />,   label: 'Carteira' },
  { key: 'agenda',    icon: <CalendarOutlined />,  label: 'Agenda' },
  { key: 'extrato',   icon: <UnorderedListOutlined />, label: 'Extrato' },
  { key: 'config',    icon: <SettingOutlined />,   label: 'Configurações' },
];

function ConfigPage({ onSaved }: { onSaved: () => void }) {
  const [form] = Form.useForm();
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const cfg = dataService.getConfig();
    if (cfg) form.setFieldsValue(cfg);
    else form.setFieldsValue({ owner: 'Plinio19', repo: 'gestor-ads', branch: 'main' });
  }, []);

  function salvar(values: { token: string; owner: string; repo: string; branch: string }) {
    dataService.setConfig(values);
    message.success('Configuração salva!');
    onSaved();
  }

  async function testar() {
    const values = form.getFieldsValue();
    dataService.setConfig(values);
    setTestando(true);
    setResultado(null);
    try {
      const nome = await dataService.testarConexao();
      setResultado({ ok: true, msg: `Conectado: ${nome}` });
    } catch (e) {
      setResultado({ ok: false, msg: String(e) });
    } finally {
      setTestando(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '40px auto' }}>
      <Card bordered={false} style={{ borderRadius: 14 }}>
        <Space align="center" style={{ marginBottom: 4 }}>
          <GithubOutlined style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>Configurar GitHub</Title>
        </Space>
        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 10, marginBottom: 20 }}>
          Dados armazenados em JSON no repositório GitHub. Crie um{' '}
          <strong>Personal Access Token (Classic)</strong> com permissão <code>repo</code>.
        </Paragraph>
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="token" label="Token GitHub" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input.Password placeholder="ghp_..." autoComplete="off" />
          </Form.Item>
          <Form.Item name="owner" label="Owner">
            <Input placeholder="Plinio19" />
          </Form.Item>
          <Form.Item name="repo" label="Repositório">
            <Input placeholder="gestor-ads" />
          </Form.Item>
          <Form.Item name="branch" label="Branch">
            <Input placeholder="main" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">Salvar e entrar</Button>
            <Button onClick={testar} loading={testando}>Testar conexão</Button>
          </Space>
        </Form>
        {resultado && (
          <Alert
            style={{ marginTop: 16 }}
            type={resultado.ok ? 'success' : 'error'}
            icon={resultado.ok ? <CheckCircleOutlined /> : <WarningOutlined />}
            message={resultado.msg}
            showIcon
          />
        )}
      </Card>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const cfg = dataService.getConfig();
    setHasToken(!!(cfg?.token));
  }, []);

  if (!hasToken) {
    return (
      <ConfigProvider locale={ptBR} theme={THEME}>
        <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center' }}>
          <ConfigPage onSaved={() => setHasToken(true)} />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={ptBR} theme={THEME}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={200}
          collapsible
          breakpoint="lg"
          collapsedWidth={56}
          style={{ background: '#fff', borderRight: '1px solid #f0ede6' }}
        >
          <div style={{
            height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: '#2D6A4F',
            borderBottom: '1px solid #f0ede6', letterSpacing: .3, gap: 6,
          }}>
            🌿 Patrimônio
          </div>
          <Menu
            mode="inline"
            selectedKeys={[page]}
            items={MENU_ITEMS}
            style={{ borderRight: 0, marginTop: 4 }}
            onClick={({ key }) => setPage(key)}
          />
        </Sider>
        <Layout style={{ background: '#F7F5F0' }}>
          <Content>
            {page === 'dashboard' && <DashboardPage />}
            {page === 'carteira'  && <CarteiraPage />}
            {page === 'agenda'    && <AgendaPage />}
            {page === 'extrato'   && <ExtratoPage />}
            {page === 'config'    && (
              <ConfigPage onSaved={() => { message.success('Token atualizado!'); setPage('dashboard'); }} />
            )}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
