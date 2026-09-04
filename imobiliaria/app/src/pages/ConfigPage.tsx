import { useState } from 'react';
import { Form, Input, Button, message, Typography, Card, Alert, Divider } from 'antd';
import { SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { dataService } from '../services/GitHubDataService';

const { Title, Text } = Typography;

export default function ConfigPage() {
  const [form] = Form.useForm();
  const [testando, setTestando] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const cfg = dataService.getConfig();

  const salvar = () => {
    const vals = form.getFieldsValue() as { owner: string; repo: string; branch: string; token: string };
    dataService.setConfig({ owner: vals.owner || 'Plinio19', repo: vals.repo || 'gestor-ads', branch: vals.branch || 'main', token: vals.token });
    message.success('Configurações salvas!');
  };

  const testar = async () => {
    salvar();
    setTestando(true);
    setOk(null);
    try {
      const nome = await dataService.testarConexao();
      setOk(nome);
      message.success('Conexão OK — ' + nome);
    } catch (e) {
      message.error('Erro: ' + String(e));
    } finally {
      setTestando(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <SettingOutlined style={{ fontSize: 22 }} />
        <Title level={4} style={{ margin: 0 }}>Configurações</Title>
      </div>

      <Card>
        <Text type="secondary">
          Os dados do sistema são salvos em arquivos JSON no seu repositório GitHub.
          Configure o acesso abaixo.
        </Text>
        <Divider />
        <Form form={form} layout="vertical" initialValues={{ owner: cfg?.owner ?? 'Plinio19', repo: cfg?.repo ?? 'gestor-ads', branch: cfg?.branch ?? 'main', token: cfg?.token ?? '' }}>
          <Form.Item name="token" label="GitHub Token" rules={[{ required: true, message: 'Token obrigatório' }]}>
            <Input.Password placeholder="ghp_..." />
          </Form.Item>
          <Form.Item name="owner" label="Owner (usuário/organização)">
            <Input />
          </Form.Item>
          <Form.Item name="repo" label="Repositório">
            <Input />
          </Form.Item>
          <Form.Item name="branch" label="Branch">
            <Input />
          </Form.Item>
          <Button type="primary" onClick={testar} loading={testando} style={{ marginRight: 8 }}>
            Testar e Salvar
          </Button>
          <Button onClick={salvar}>Salvar</Button>
        </Form>

        {ok && (
          <Alert
            style={{ marginTop: 16 }}
            type="success"
            icon={<CheckCircleOutlined />}
            showIcon
            message={`Conectado: ${ok}`}
          />
        )}
      </Card>
    </div>
  );
}
