import { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Alert, Typography, Space, Divider, Popconfirm, message,
} from 'antd';
import {
  SaveOutlined, CheckCircleOutlined, ApiOutlined, DeleteOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { GitHubConfig } from '../../types';
import { dataService } from '../../services/GitHubDataService';

const { Title, Text } = Typography;
const LS_CONFIG = 'trans_config_v1';
const DEFAULTS = { owner: 'Plinio19', repo: 'gestor-ads', branch: 'main' };

export default function Configuracoes() {
  const [form] = Form.useForm();
  const [saved, setSaved] = useState(false);
  const [testando, setTestando] = useState(false);
  const [zerando, setZerando] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_CONFIG) || '{}');
      form.setFieldsValue({ ...DEFAULTS, ...stored });
    } catch {}
  }, []);

  function salvar(values: GitHubConfig) {
    localStorage.setItem(LS_CONFIG, JSON.stringify(values));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    message.success('Configuração salva!');
  }

  async function testar() {
    const values = form.getFieldsValue() as GitHubConfig;
    if (!values.token || !values.owner || !values.repo) {
      message.error('Preencha todos os campos primeiro.');
      return;
    }
    setTestando(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${values.owner}/${values.repo}`, {
        headers: { Authorization: `token ${values.token}` },
      });
      if (res.ok) {
        message.success('GitHub conectado com sucesso!');
      } else {
        message.error('Repositório não encontrado ou token inválido.');
      }
    } catch {
      message.error('Erro de rede ao testar conexão.');
    }
    setTestando(false);
  }

  async function zerarDados() {
    setZerando(true);
    try {
      await Promise.all([
        dataService.saveCollection('transportadoras/data/transportadoras.json', [], null, 'Zerar transportadoras'),
        dataService.saveCollection('transportadoras/data/cotacoes.json', [], null, 'Zerar cotações'),
        dataService.saveCollection('transportadoras/data/documentos.json', [], null, 'Zerar documentos'),
      ]);
      localStorage.setItem('trans_transportadoras', '[]');
      localStorage.setItem('trans_cotacoes', '[]');
      localStorage.setItem('trans_docs', '[]');
      message.success('Dados zerados! Recarregando...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      message.error('Erro ao zerar: ' + String(e));
      setZerando(false);
    }
  }

  const isConfigured = dataService.isConfigured();

  return (
    <div style={{ maxWidth: 720 }}>
      <Title level={4}>Configurações</Title>

      <Card
        title="Conexão GitHub (banco de dados)"
        style={{ marginBottom: 20 }}
        extra={
          isConfigured ? (
            <Text type="success" style={{ fontSize: 12 }}>✓ Conectado</Text>
          ) : (
            <Text type="warning" style={{ fontSize: 12 }}>Não configurado</Text>
          )
        }
      >
        {saved && (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            message="Configuração salva com sucesso!"
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              Os dados são salvos diretamente no repositório{' '}
              <Text code>Plinio19/gestor-ads</Text> em{' '}
              <Text code>transportadoras/data/</Text>.
              Gere um token em{' '}
              <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer">
                github.com/settings/tokens
              </a>{' '}
              com permissão <Text code>repo</Text>.
            </span>
          }
        />

        <Form form={form} layout="vertical" onFinish={salvar}>
          <Form.Item name="token" label="Personal Access Token" rules={[{ required: true, message: 'Token obrigatório' }]}>
            <Input.Password placeholder="ghp_..." />
          </Form.Item>
          <Form.Item name="owner" label="Usuário / Organização" rules={[{ required: true }]}>
            <Input placeholder="Plinio19" />
          </Form.Item>
          <Form.Item name="repo" label="Repositório" rules={[{ required: true }]}>
            <Input placeholder="gestor-ads" />
          </Form.Item>
          <Form.Item name="branch" label="Branch" rules={[{ required: true }]}>
            <Input placeholder="main" />
          </Form.Item>
          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Salvar configuração
            </Button>
            <Button icon={<ApiOutlined />} loading={testando} onClick={testar}>
              Testar conexão
            </Button>
          </Space>
        </Form>
      </Card>

      <Card
        title={<span style={{ color: '#ff4d4f' }}><WarningOutlined /> Zona de Perigo</span>}
        style={{ borderColor: '#ffccc7' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            Apaga <strong>transportadoras, cotações e documentos</strong> do GitHub e do localStorage.
            Os arquivos PDF das licenças não são removidos. <strong>Ação irreversível.</strong>
          </Text>
          <Popconfirm
            title="Zerar todos os dados?"
            description="Apaga transportadoras, cotações e documentos. Sem volta."
            onConfirm={zerarDados}
            okText="Sim, zerar tudo"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} loading={zerando} size="large">
              Zerar dados
            </Button>
          </Popconfirm>
        </Space>
      </Card>
    </div>
  );
}
