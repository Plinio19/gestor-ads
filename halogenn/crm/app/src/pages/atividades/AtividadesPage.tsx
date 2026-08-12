import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Typography, Row, Col, Popconfirm,
  message, Tag, Select, Drawer, Form, Checkbox, Tooltip, Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import type { Atividade, TipoAtividade } from '../../types';
import { useAtividadesStore } from '../../stores/useAtividadesStore';
import { useClientesStore } from '../../stores/useClientesStore';
import { useNegociosStore } from '../../stores/useNegociosStore';
import { uid, hoje, formatarData, TIPOS_ATIVIDADE } from '../../utils';

const { Title, Text } = Typography;

const TIPO_COLOR: Record<TipoAtividade, string> = {
  ligacao:  'blue',
  email:    'geekblue',
  reuniao:  'purple',
  visita:   'orange',
  proposta: 'gold',
  tarefa:   'cyan',
};

function AtividadeForm({
  atividade, open, onClose,
}: { atividade: Atividade | null; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const { upsert } = useAtividadesStore();
  const { clientes, fetch: fc, loaded: lc } = useClientesStore();
  const { negocios, fetch: fn, loaded: ln } = useNegociosStore();
  const [salvando, setSalvando] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');

  useEffect(() => { if (!lc) fc(); if (!ln) fn(); }, [lc, ln, fc, fn]);

  useEffect(() => {
    if (!open) return;
    if (atividade) {
      form.setFieldsValue(atividade);
      setClienteSelecionado(atividade.clienteId);
    } else {
      form.resetFields();
      form.setFieldsValue({ tipo: 'tarefa', data: hoje(), concluida: false });
      setClienteSelecionado('');
    }
  }, [open, atividade]);

  const negociosDoCliente = negocios.filter(n => n.clienteId === clienteSelecionado);

  async function handleSubmit(values: Partial<Atividade>) {
    setSalvando(true);
    try {
      const data: Atividade = {
        ...values as Atividade,
        id: atividade?.id ?? uid(),
        criadoEm: atividade?.criadoEm ?? hoje(),
        concluida: values.concluida ?? false,
      };
      await upsert(data);
      message.success(`Atividade ${atividade ? 'atualizada' : 'criada'}!`);
      onClose();
    } catch (e) {
      message.error('Erro: ' + String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Drawer
      title={atividade ? 'Editar Atividade' : 'Nova Atividade'}
      open={open}
      onClose={onClose}
      width={520}
      destroyOnHidden
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={salvando} onClick={() => form.submit()}>
            Salvar
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
              <Select
                options={TIPOS_ATIVIDADE.map(t => ({
                  value: t.key,
                  label: `${t.icone} ${t.label}`,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="data" label="Data">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="descricao" label="Descrição" rules={[{ required: true, message: 'Obrigatório' }]}>
          <Input placeholder="Ex: Ligar para confirmar pedido de Xileno" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="clienteId" label="Cliente">
              <Select
                placeholder="Selecione..."
                allowClear
                showSearch
                optionFilterProp="label"
                onChange={id => { setClienteSelecionado(id ?? ''); form.setFieldValue('negocioId', undefined); }}
                options={clientes.map(c => ({
                  value: c.id,
                  label: c.nomeFantasia || c.razaoSocial,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="negocioId" label="Negócio">
              <Select
                placeholder={clienteSelecionado ? 'Selecione...' : 'Selecione um cliente primeiro'}
                allowClear
                disabled={!clienteSelecionado}
                options={negociosDoCliente.map(n => ({ value: n.id, label: n.titulo }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="obs" label="Observações">
          <Input.TextArea rows={2} placeholder="Detalhes adicionais..." />
        </Form.Item>

        <Form.Item name="concluida" valuePropName="checked">
          <Checkbox>Marcar como concluída</Checkbox>
        </Form.Item>
      </Form>
    </Drawer>
  );
}

export default function AtividadesPage() {
  const { atividades, loading, fetch, remove, concluir } = useAtividadesStore();
  const { clientes, fetch: fc } = useClientesStore();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Atividade | null>(null);
  const [aba, setAba] = useState('pendentes');

  useEffect(() => { fetch(); fc(); }, []);

  const filtrar = (lista: Atividade[]) => lista.filter(a => {
    const cli = clientes.find(c => c.id === a.clienteId);
    const h = [a.descricao, a.obs, cli?.razaoSocial, cli?.nomeFantasia].join(' ').toLowerCase();
    if (busca && !h.includes(busca.toLowerCase())) return false;
    if (filtroTipo && a.tipo !== filtroTipo) return false;
    return true;
  });

  const pendentes  = filtrar(atividades.filter(a => !a.concluida)).sort((a, b) => (a.data||'').localeCompare(b.data||''));
  const concluidas = filtrar(atividades.filter(a =>  a.concluida)).sort((a, b) => (b.data||'').localeCompare(a.data||''));
  const lista = aba === 'pendentes' ? pendentes : concluidas;

  async function excluir(id: string) {
    try { await remove(id); message.success('Atividade removida.'); }
    catch (e) { message.error('Erro: ' + String(e)); }
  }

  async function marcarConcluida(id: string) {
    try { await concluir(id); message.success('Atividade concluída!'); }
    catch (e) { message.error('Erro: ' + String(e)); }
  }

  const columns: ColumnsType<Atividade> = [
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      width: 110,
      render: (t: TipoAtividade) => {
        const tp = TIPOS_ATIVIDADE.find(x => x.key === t);
        return (
          <Tag color={TIPO_COLOR[t]} style={{ fontSize: 11 }}>
            {tp?.icone} {tp?.label}
          </Tag>
        );
      },
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      ellipsis: true,
      render: (d: string, r) => {
        const atrasada = !r.concluida && r.data && r.data < hoje();
        return (
          <div>
            <Text style={{ fontSize: 13 }}>{d}</Text>
            {atrasada && <Tag color="error" style={{ fontSize: 10, marginLeft: 6 }}>Atrasada</Tag>}
          </div>
        );
      },
    },
    {
      title: 'Cliente',
      key: 'cliente',
      width: 160,
      ellipsis: true,
      render: (_, r) => {
        const cli = clientes.find(c => c.id === r.clienteId);
        return cli ? (
          <Text style={{ fontSize: 12 }}>{cli.nomeFantasia || cli.razaoSocial}</Text>
        ) : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Data',
      dataIndex: 'data',
      width: 100,
      sorter: (a, b) => (a.data || '').localeCompare(b.data || ''),
      render: d => formatarData(d),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 110,
      render: (_, record) => (
        <Space size={2}>
          {!record.concluida && (
            <Tooltip title="Concluir">
              <Button
                type="text"
                icon={<CheckOutlined />}
                style={{ color: '#389e0d' }}
                onClick={() => marcarConcluida(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />}
              onClick={() => { setEditando(record); setDrawerOpen(true); }} />
          </Tooltip>
          <Popconfirm title="Excluir atividade?" onConfirm={() => excluir(record.id)} okText="Sim" okType="danger">
            <Tooltip title="Excluir">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Atividades</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditando(null); setDrawerOpen(true); }}>
            Nova Atividade
          </Button>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar atividades..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={6}>
          <Select
            placeholder="Tipo"
            style={{ width: '100%' }}
            allowClear
            value={filtroTipo}
            onChange={setFiltroTipo}
            options={TIPOS_ATIVIDADE.map(t => ({ value: t.key, label: `${t.icone} ${t.label}` }))}
          />
        </Col>
      </Row>

      <Tabs
        activeKey={aba}
        onChange={setAba}
        items={[
          {
            key: 'pendentes',
            label: <span>Pendentes <Tag style={{ marginLeft: 4 }}>{pendentes.length}</Tag></span>,
            children: null,
          },
          {
            key: 'concluidas',
            label: <span>Concluídas <Tag style={{ marginLeft: 4 }}>{concluidas.length}</Tag></span>,
            children: null,
          },
        ]}
        style={{ marginBottom: 0 }}
      />

      <Table
        dataSource={lista}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 25, showTotal: t => `${t} atividade(s)` }}
        locale={{ emptyText: aba === 'pendentes' ? '✅ Nenhuma atividade pendente!' : 'Nenhuma atividade concluída.' }}
        rowClassName={r => (!r.concluida && r.data && r.data < hoje()) ? 'row-atrasada' : ''}
      />

      <AtividadeForm
        atividade={editando}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
