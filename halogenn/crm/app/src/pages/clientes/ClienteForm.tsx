import { useEffect, useState } from 'react';
import {
  Drawer, Form, Input, Button, Space, Row, Col, Divider, Select,
  Typography, message, Table, Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Cliente, Contato } from '../../types';
import { useClientesStore } from '../../stores/useClientesStore';
import { uid, hoje, SEGMENTOS, ESTADOS_BR } from '../../utils';

const { Text } = Typography;

interface Props {
  cliente: Cliente | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_CONTATO: Contato = { id: '', nome: '', cargo: '', telefone: '', email: '' };

export default function ClienteForm({ cliente, open, onClose }: Props) {
  const [form] = Form.useForm();
  const { upsert } = useClientesStore();
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [novoContato, setNovoContato] = useState<Contato>({ ...EMPTY_CONTATO });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (cliente) {
      form.setFieldsValue(cliente);
      setContatos(cliente.contatos ?? []);
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'prospecto', criadoEm: hoje() });
      setContatos([]);
    }
    setNovoContato({ ...EMPTY_CONTATO });
  }, [open, cliente]);

  function adicionarContato() {
    if (!novoContato.nome.trim()) { message.warning('Informe o nome do contato.'); return; }
    setContatos(prev => [...prev, { ...novoContato, id: uid() }]);
    setNovoContato({ ...EMPTY_CONTATO });
  }

  function removerContato(id: string) {
    setContatos(prev => prev.filter(c => c.id !== id));
  }

  async function handleSubmit(values: Partial<Cliente>) {
    setSalvando(true);
    try {
      const data: Cliente = {
        ...values as Cliente,
        id: cliente?.id ?? uid(),
        contatos,
        criadoEm: cliente?.criadoEm ?? hoje(),
      };
      await upsert(data);
      message.success(`Cliente ${cliente ? 'atualizado' : 'criado'} com sucesso!`);
      onClose();
    } catch (e) {
      message.error('Erro ao salvar: ' + String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Drawer
      title={cliente ? 'Editar Cliente' : 'Novo Cliente'}
      open={open}
      onClose={onClose}
      width={720}
      destroyOnHidden
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={salvando} onClick={() => form.submit()}>
            {cliente ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={12}>
          <Col span={14}>
            <Form.Item name="razaoSocial" label="Razão Social" rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Ex: Laboratório Exemplo Ltda" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="nomeFantasia" label="Nome Fantasia">
              <Input placeholder="Ex: Lab Exemplo" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="cnpj" label="CNPJ">
              <Input placeholder="00.000.000/0001-00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="segmento" label="Segmento">
              <Select
                placeholder="Selecione"
                options={SEGMENTOS.map(s => ({ value: s, label: s }))}
                showSearch
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="telefone" label="Telefone">
              <Input placeholder="(00) 00000-0000" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="E-mail">
              <Input placeholder="contato@empresa.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="site" label="Site">
              <Input placeholder="www.empresa.com.br" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Status">
              <Select options={[
                { value: 'prospecto', label: 'Prospecto' },
                { value: 'ativo',     label: 'Ativo'     },
                { value: 'inativo',   label: 'Inativo'   },
              ]} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={14}>
            <Form.Item name="cidade" label="Cidade">
              <Input placeholder="Ex: São Paulo" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="uf" label="UF">
              <Select
                placeholder="UF"
                showSearch
                options={ESTADOS_BR.map(s => ({ value: s, label: s }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="obs" label="Observações">
          <Input.TextArea rows={2} placeholder="Notas gerais sobre o cliente..." />
        </Form.Item>
      </Form>

      {/* Contatos */}
      <Divider style={{ margin: '4px 0 16px' }}>Contatos</Divider>

      {/* Adicionar contato */}
      <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Adicionar contato</Text>
        <Row gutter={8}>
          <Col span={8}>
            <Input
              placeholder="Nome *"
              size="small"
              value={novoContato.nome}
              onChange={e => setNovoContato(p => ({ ...p, nome: e.target.value }))}
            />
          </Col>
          <Col span={6}>
            <Input
              placeholder="Cargo"
              size="small"
              value={novoContato.cargo}
              onChange={e => setNovoContato(p => ({ ...p, cargo: e.target.value }))}
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="Telefone"
              size="small"
              value={novoContato.telefone}
              onChange={e => setNovoContato(p => ({ ...p, telefone: e.target.value }))}
            />
          </Col>
          <Col span={5}>
            <Input
              placeholder="E-mail"
              size="small"
              value={novoContato.email}
              onChange={e => setNovoContato(p => ({ ...p, email: e.target.value }))}
            />
          </Col>
        </Row>
        <Button
          icon={<PlusOutlined />}
          size="small"
          style={{ marginTop: 8 }}
          onClick={adicionarContato}
        >
          Adicionar
        </Button>
      </div>

      {contatos.length > 0 && (
        <Table
          size="small"
          dataSource={contatos}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Nome',     dataIndex: 'nome',     ellipsis: true },
            { title: 'Cargo',    dataIndex: 'cargo',    ellipsis: true },
            { title: 'Telefone', dataIndex: 'telefone', width: 120 },
            { title: 'E-mail',   dataIndex: 'email',    ellipsis: true },
            {
              title: '', key: 'del', width: 40,
              render: (_, r) => (
                <Popconfirm title="Remover contato?" onConfirm={() => removerContato(r.id)} okText="Sim">
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              ),
            },
          ]}
        />
      )}
    </Drawer>
  );
}
