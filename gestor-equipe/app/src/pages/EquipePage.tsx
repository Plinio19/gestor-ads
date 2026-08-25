import { useState } from 'react';
import {
  Typography, Button, Table, Tag, Avatar, Space, Drawer, Form,
  Input, Select, Switch, Popconfirm, message, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Funcionario } from '../types';
import { useFuncionariosStore } from '../stores/useFuncionariosStore';
import { uid, agora, CORES_AVATAR } from '../utils';

const { Title } = Typography;

export default function EquipePage() {
  const { funcionarios, upsert, remove } = useFuncionariosStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  function abrirNovo() {
    setEditando(null);
    form.resetFields();
    form.setFieldsValue({ cor: CORES_AVATAR[funcionarios.length % CORES_AVATAR.length], ativo: true });
    setDrawerOpen(true);
  }

  function abrirEdicao(f: Funcionario) {
    setEditando(f);
    form.setFieldsValue(f);
    setDrawerOpen(true);
  }

  async function salvar() {
    const values = await form.validateFields();
    setSalvando(true);
    try {
      await upsert({
        id: editando?.id ?? uid(),
        nome: values.nome,
        cargo: values.cargo,
        email: values.email,
        telefone: values.telefone,
        cor: values.cor,
        ativo: values.ativo ?? true,
        criadoEm: editando?.criadoEm ?? agora(),
      });
      message.success('Salvo!');
      setDrawerOpen(false);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  const columns = [
    {
      title: 'Funcionário', key: 'nome',
      render: (_: unknown, f: Funcionario) => (
        <Space>
          <Avatar size={32} style={{ background: f.cor, fontSize: 12 }}>{f.nome.slice(0, 2).toUpperCase()}</Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{f.nome}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{f.cargo}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string) => v || '—' },
    { title: 'Telefone', dataIndex: 'telefone', key: 'telefone', render: (v: string) => v || '—' },
    {
      title: 'Status', key: 'ativo',
      render: (_: unknown, f: Funcionario) => (
        <Tag color={f.ativo ? 'green' : 'default'}>{f.ativo ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: '', key: 'acoes', width: 80,
      render: (_: unknown, f: Funcionario) => (
        <Space>
          <Tooltip title="Editar"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => abrirEdicao(f)} /></Tooltip>
          <Popconfirm title="Remover funcionário?" onConfirm={() => remove(f.id)} okText="Sim" cancelText="Não" okType="danger">
            <Tooltip title="Remover"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Equipe</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovo}>Novo funcionário</Button>
      </div>

      <Table
        dataSource={funcionarios}
        columns={columns}
        rowKey="id"
        pagination={false}
        style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}
        bordered={false}
      />

      <Drawer
        title={editando ? 'Editar funcionário' : 'Novo funcionário'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" loading={salvando} onClick={salvar}>Salvar</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Nome completo" />
          </Form.Item>
          <Form.Item name="cargo" label="Cargo" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Ex: Gerente, Analista, Operador..." />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="email@empresa.com" />
          </Form.Item>
          <Form.Item name="telefone" label="Telefone">
            <Input placeholder="(11) 99999-9999" />
          </Form.Item>
          <Form.Item name="cor" label="Cor do avatar">
            <Select>
              {CORES_AVATAR.map(c => (
                <Select.Option key={c} value={c}>
                  <Space>
                    <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: c, verticalAlign: 'middle' }} />
                    {c}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="ativo" label="Status" valuePropName="checked">
            <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
