import { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, Typography, Alert, Divider, Popconfirm, message,
} from 'antd';
import { GithubOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { dataService } from '../../services/GitHubDataService';
import { useClientesStore } from '../../stores/useClientesStore';
import { useNegociosStore } from '../../stores/useNegociosStore';
import { useAtividadesStore } from '../../stores/useAtividadesStore';

const { Title, Text, Paragraph } = Typography;

export default function Configuracoes() {
  const [form] = Form.useForm();
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);
  const [zerando, setZerando] = useState(false);

  const saveClientes   = useClientesStore(s => s.save);
  const saveNegocios   = useNegociosStore(s => s.save);
  const saveAtividades = useAtividadesStore(s => s.save);

  useEffect(() => {
    const cfg = dataService.getConfig();
    if (cfg) form.setFieldsValue(cfg);
    else form.setFieldsValue({ owner: 'Plinio19', repo: 'gestor-ads', branch: 'main' });
  }, []);

  function salvarConfig(values: { token: string; owner: string; repo: string; branch: string }) {
    dataService.setConfig(values);
    message.success('Configuração salva!');
  }

  async function testar() {
    const values = form.getFieldsValue();
    dataService.setConfig(values);
    setTestando(true);
    setResultado(null);
    try {
      const nome = await dataService.testarConexao();
      setResultado({ ok: true, msg: `Conectado ao repositório: ${nome}` });
    } catch (e) {
      setResultado({ ok: false, msg: String(e) });
    } finally {
      setTestando(false);
    }
  }

  async function zerarDados() {
    setZerando(true);
    try {
      await saveClientes([],   'Zerar clientes (CRM)');
      await saveNegocios([],   'Zerar negócios (CRM)');
      await saveAtividades([], 'Zerar atividades (CRM)');
      message.success('Todos os dados foram zerados.');
    } catch (e) {
      message.error('Erro: ' + String(e));
    } finally {
      setZerando(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={4} style={{ marginBottom: 20 }}>Configurações</Title>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 20 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <GithubOutlined style={{ fontSize: 20 }} />
          <Title level={5} style={{ margin: 0 }}>Conexão com GitHub</Title>
        </Space>

        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
          Os dados do CRM são armazenados em arquivos JSON no repositório do GitHub.
          Use um <strong>Personal Access Token (Classic)</strong> com permissão <code>repo</code>.
        </Paragraph>

        <Form form={form} layout="vertical" onFinish={salvarConfig}>
          <Form.Item name="token" label="Token GitHub" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input.Password placeholder="ghp_..." autoComplete="off" />
          </Form.Item>

          <Form.Item name="owner" label="Owner (usuário ou organização)">
            <Input placeholder="Plinio19" />
          </Form.Item>

          <Form.Item name="repo" label="Repositório">
            <Input placeholder="gestor-ads" />
          </Form.Item>

          <Form.Item name="branch" label="Branch">
            <Input placeholder="main" />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit">Salvar configuração</Button>
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

      <Card
        bordered={false}
        style={{ borderRadius: 12, borderColor: '#ff4d4f', border: '1px solid #ffa39e' }}
      >
        <Title level={5} style={{ color: '#cf1322', marginBottom: 8 }}>Zona de Perigo</Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
          Estas ações são irreversíveis e apagam dados permanentemente do GitHub.
        </Text>
        <Divider style={{ margin: '0 0 16px' }} />
        <Popconfirm
          title="Zerar todos os dados?"
          description="Clientes, negócios e atividades serão apagados. Não há como desfazer."
          onConfirm={zerarDados}
          okText="Sim, zerar"
          okType="danger"
          cancelText="Cancelar"
        >
          <Button danger loading={zerando}>Zerar todos os dados</Button>
        </Popconfirm>
      </Card>
    </div>
  );
}
