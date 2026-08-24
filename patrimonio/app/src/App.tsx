import { useState, useEffect } from 'react';
import {
  ConfigProvider, theme, Alert, Button, Card, Form, Input, Space,
  Typography, message,
} from 'antd';
import { GithubOutlined, CheckCircleOutlined, WarningOutlined, SettingOutlined } from '@ant-design/icons';
import ptBR from 'antd/locale/pt_BR';
import DashboardPage from './pages/DashboardPage';
import { dataService } from './services/GitHubDataService';

const { Title, Paragraph } = Typography;

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F7F5F0' }}>
      <Card style={{ width: '100%', maxWidth: 480, borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,.08)' }} bordered={false}>
        <Space align="center" style={{ marginBottom: 4 }}>
          <GithubOutlined style={{ fontSize: 20 }} />
          <Title level={4} style={{ margin: 0 }}>Configurar GitHub</Title>
        </Space>
        <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 10, marginBottom: 20 }}>
          Os dados são armazenados em JSON no repositório GitHub.
          Crie um <strong>Personal Access Token (Classic)</strong> com permissão <code>repo</code>.
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
            <Button type="primary" htmlType="submit" style={{ background: '#2D6A4F' }}>Salvar e entrar</Button>
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
  const [page, setPage] = useState<'dashboard' | 'config'>('dashboard');
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    const cfg = dataService.getConfig();
    setHasToken(!!(cfg?.token));
  }, []);

  if (!hasToken) {
    return (
      <ConfigProvider locale={ptBR} theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#2D6A4F', borderRadius: 8, fontFamily: "'DM Sans', -apple-system, sans-serif" } }}>
        <ConfigPage onSaved={() => setHasToken(true)} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={ptBR} theme={{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#2D6A4F', borderRadius: 8, fontFamily: "'DM Sans', -apple-system, sans-serif" } }}>
      <div style={{ minHeight: '100vh', background: '#F7F5F0' }}>
        {/* Minimal top bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(247,245,240,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e8e5de', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#333', letterSpacing: '-.01em' }}>Patrimônio</span>
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setPage(p => p === 'config' ? 'dashboard' : 'config')}
            style={{ color: '#aaa', fontSize: 12 }}
          >
            {page === 'config' ? 'Voltar' : 'Config'}
          </Button>
        </div>

        {page === 'config' ? (
          <div style={{ padding: 24, maxWidth: 540, margin: '0 auto' }}>
            <ConfigPage onSaved={() => { message.success('Token atualizado!'); setPage('dashboard'); }} />
          </div>
        ) : (
          <DashboardPage />
        )}
      </div>
    </ConfigProvider>
  );
}
