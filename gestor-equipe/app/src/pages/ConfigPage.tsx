import { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, Typography, Alert, Divider,
  Popconfirm, message, Select, Avatar,
} from 'antd';
import { GithubOutlined, CheckCircleOutlined, WarningOutlined, UserOutlined } from '@ant-design/icons';
import { dataService } from '../services/GitHubDataService';
import { useFuncionariosStore } from '../stores/useFuncionariosStore';
import { useTarefasStore } from '../stores/useTarefasStore';
import { useProcessosStore } from '../stores/useProcessosStore';

const { Title, Text, Paragraph } = Typography;
const LS_USER = 'ge_usuario_id';

export default function ConfigPage() {
  const [form] = Form.useForm();
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);
  const [zerando, setZerando] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string>(localStorage.getItem(LS_USER) ?? '');

  const { funcionarios, save: saveFuncs } = useFuncionariosStore();
  const { save: saveTarefas } = useTarefasStore();
  const { save: saveProcessos } = useProcessosStore();

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
    dataService.setConfig(form.getFieldsValue());
    setTestando(true); setResultado(null);
    try {
      const nome = await dataService.testarConexao();
      setResultado({ ok: true, msg: `Conectado: ${nome}` });
    } catch (e) {
      setResultado({ ok: false, msg: String(e) });
    } finally { setTestando(false); }
  }

  function salvarUsuario() {
    localStorage.setItem(LS_USER, usuarioId);
    message.success('Usuário salvo!');
    window.location.reload();
  }

  async function zerarDados() {
    setZerando(true);
    try {
      await saveFuncs([], 'Zerar funcionários');
      await saveTarefas([], 'Zerar tarefas');
      await saveProcessos([], 'Zerar processos');
      message.success('Dados zerados.');
    } catch (e) { message.error(String(e)); }
    finally { setZerando(false); }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Title level={4} style={{ marginBottom: 20 }}>Configurações</Title>

      {/* Usuário logado */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 20 }}>
        <Space align="center" style={{ marginBottom: 12 }}>
          <UserOutlined style={{ fontSize: 18 }} />
          <Title level={5} style={{ margin: 0 }}>Quem sou eu neste dispositivo?</Title>
        </Space>
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
          Selecione seu nome para ver suas tarefas em destaque no dashboard.
        </Paragraph>
        <Space>
          <Select
            value={usuarioId || undefined}
            onChange={setUsuarioId}
            placeholder="Selecionar funcionário"
            style={{ width: 240 }}
            allowClear
          >
            {funcionarios.filter(f => f.ativo).map(f => (
              <Select.Option key={f.id} value={f.id}>
                <Space>
                  <Avatar size={20} style={{ background: f.cor, fontSize: 10 }}>{f.nome.slice(0, 2).toUpperCase()}</Avatar>
                  {f.nome} — {f.cargo}
                </Space>
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={salvarUsuario}>Salvar</Button>
        </Space>
      </Card>

      {/* GitHub */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 20 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <GithubOutlined style={{ fontSize: 20 }} />
          <Title level={5} style={{ margin: 0 }}>Conexão com GitHub</Title>
        </Space>
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
          Use um <strong>Personal Access Token (Classic)</strong> com permissão <code>repo</code>.
        </Paragraph>
        <Form form={form} layout="vertical" onFinish={salvarConfig}>
          <Form.Item name="token" label="Token GitHub" rules={[{ required: true }]}>
            <Input.Password placeholder="ghp_..." autoComplete="off" />
          </Form.Item>
          <Form.Item name="owner" label="Owner"><Input placeholder="Plinio19" /></Form.Item>
          <Form.Item name="repo" label="Repositório"><Input placeholder="gestor-ads" /></Form.Item>
          <Form.Item name="branch" label="Branch"><Input placeholder="main" /></Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">Salvar</Button>
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

      {/* Danger zone */}
      <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #ffa39e' }}>
        <Title level={5} style={{ color: '#cf1322', marginBottom: 8 }}>Zona de Perigo</Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>Apaga todos os dados permanentemente do GitHub.</Text>
        <Divider style={{ margin: '0 0 12px' }} />
        <Popconfirm
          title="Zerar todos os dados?"
          description="Funcionários, tarefas e processos serão apagados. Não há como desfazer."
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
