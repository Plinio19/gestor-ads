import { useEffect, useState } from 'react';
import {
  Typography, Button, Table, Tag, Space, Drawer, Form, Input,
  Select, Popconfirm, message, Tooltip, Badge, Spin, Alert,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { Ticket, TicketPrioridade, TicketPosicao } from '../../types';
import { useTicketsStore } from '../../stores/useTicketsStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const COR_PRIORIDADE: Record<TicketPrioridade, string> = {
  alta: 'red',
  media: 'orange',
};

const COR_POSICAO: Record<TicketPosicao, string> = {
  aberto: 'default',
  andamento: 'blue',
  finalizado: 'green',
};

const LABEL_POSICAO: Record<TicketPosicao, string> = {
  aberto: 'Em aberto',
  andamento: 'Em andamento',
  finalizado: 'Finalizado',
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function agora() { return new Date().toISOString(); }
function proximoNumero(tickets: Ticket[]): string {
  if (tickets.length === 0) return '0001';
  const nums = tickets.map(t => parseInt(t.numero, 10)).filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return String(max + 1).padStart(4, '0');
}

export default function TicketsPage() {
  const { tickets, loading, loaded, error, fetch, upsert, remove } = useTicketsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Ticket | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [filtroPosicao, setFiltroPosicao] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [buscaTexto, setBuscaTexto] = useState('');
  const [form] = Form.useForm();

  useEffect(() => { fetch(); }, []);

  function abrirNovo() {
    setEditando(null);
    form.resetFields();
    form.setFieldsValue({
      prioridade: 'media',
      posicao: 'aberto',
      numero: proximoNumero(tickets),
    });
    setDrawerOpen(true);
  }

  function abrirEdicao(t: Ticket) {
    setEditando(t);
    form.setFieldsValue(t);
    setDrawerOpen(true);
  }

  async function salvar() {
    const values = await form.validateFields();
    setSalvando(true);
    try {
      const now = agora();
      const ticket: Ticket = {
        id: editando?.id ?? uid(),
        numero: values.numero,
        assunto: values.assunto,
        notaFiscal: values.notaFiscal,
        empenho: values.empenho ?? '',
        pedido: values.pedido,
        problemaRaiz: values.problemaRaiz ?? '',
        acaoTomada: values.acaoTomada ?? '',
        prioridade: values.prioridade,
        posicao: values.posicao,
        criadoEm: editando?.criadoEm ?? now,
        atualizadoEm: now,
      };
      await upsert(ticket);
      message.success('Ticket salvo!');
      setDrawerOpen(false);
    } catch (e) {
      message.error(`Erro ao salvar: ${String(e)}`);
    } finally {
      setSalvando(false);
    }
  }

  const filtrados = tickets.filter(t => {
    if (filtroPosicao !== 'todos' && t.posicao !== filtroPosicao) return false;
    if (filtroPrioridade !== 'todas' && t.prioridade !== filtroPrioridade) return false;
    if (buscaTexto) {
      const q = buscaTexto.toLowerCase();
      return (
        t.numero.includes(q) ||
        t.assunto.toLowerCase().includes(q) ||
        t.notaFiscal.toLowerCase().includes(q) ||
        t.pedido.toLowerCase().includes(q) ||
        (t.empenho ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const abertos = tickets.filter(t => t.posicao === 'aberto').length;
  const andamento = tickets.filter(t => t.posicao === 'andamento').length;

  const columns = [
    {
      title: 'Nº', dataIndex: 'numero', key: 'numero', width: 70,
      render: (v: string) => <Text strong style={{ fontFamily: 'monospace' }}>#{v}</Text>,
    },
    {
      title: 'Assunto', key: 'assunto', width: '25%',
      render: (_: unknown, t: Ticket) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{t.assunto}</Text>
          <div style={{ marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>NF: {t.notaFiscal}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>Pedido: {t.pedido}</Text>
            {t.empenho && <Text type="secondary" style={{ fontSize: 11 }}>Empenho: {t.empenho}</Text>}
          </div>
        </div>
      ),
    },
    {
      title: 'Problema Raiz', dataIndex: 'problemaRaiz', key: 'problemaRaiz',
      render: (v: string) => v
        ? <Text style={{ fontSize: 12 }}>{v.length > 80 ? v.slice(0, 80) + '…' : v}</Text>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Ação', dataIndex: 'acaoTomada', key: 'acaoTomada',
      render: (v: string) => v
        ? <Text style={{ fontSize: 12 }}>{v.length > 80 ? v.slice(0, 80) + '…' : v}</Text>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Prioridade', dataIndex: 'prioridade', key: 'prioridade', width: 100,
      render: (v: TicketPrioridade) => (
        <Tag color={COR_PRIORIDADE[v]} style={{ fontWeight: 600 }}>
          {v === 'alta' ? '⚠ Alta' : '● Média'}
        </Tag>
      ),
    },
    {
      title: 'Posição', dataIndex: 'posicao', key: 'posicao', width: 120,
      render: (v: TicketPosicao) => <Tag color={COR_POSICAO[v]}>{LABEL_POSICAO[v]}</Tag>,
    },
    {
      title: '', key: 'acoes', width: 80,
      render: (_: unknown, t: Ticket) => (
        <Space>
          <Tooltip title="Editar">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => abrirEdicao(t)} />
          </Tooltip>
          <Popconfirm
            title="Remover ticket?"
            onConfirm={() => remove(t.id).catch(e => message.error(String(e)))}
            okText="Sim"
            cancelText="Não"
            okType="danger"
          >
            <Tooltip title="Remover">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!loaded && loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Tickets</Title>
          <Space>
            <Badge count={abertos} color="default" overflowCount={99}>
              <Tag style={{ cursor: 'pointer' }} onClick={() => setFiltroPosicao('aberto')}>Em aberto</Tag>
            </Badge>
            <Badge count={andamento} color="blue" overflowCount={99}>
              <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => setFiltroPosicao('andamento')}>Em andamento</Tag>
            </Badge>
          </Space>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovo}>
          Novo ticket
        </Button>
      </div>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} closable />}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Buscar por Nº, assunto, NF, pedido..."
          value={buscaTexto}
          onChange={e => setBuscaTexto(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select value={filtroPosicao} onChange={setFiltroPosicao} style={{ width: 160 }}>
          <Select.Option value="todos">Todas as posições</Select.Option>
          <Select.Option value="aberto">Em aberto</Select.Option>
          <Select.Option value="andamento">Em andamento</Select.Option>
          <Select.Option value="finalizado">Finalizados</Select.Option>
        </Select>
        <Select value={filtroPrioridade} onChange={setFiltroPrioridade} style={{ width: 140 }}>
          <Select.Option value="todas">Todas as prioridades</Select.Option>
          <Select.Option value="alta">Alta</Select.Option>
          <Select.Option value="media">Média</Select.Option>
        </Select>
        {(filtroPosicao !== 'todos' || filtroPrioridade !== 'todas' || buscaTexto) && (
          <Button onClick={() => { setFiltroPosicao('todos'); setFiltroPrioridade('todas'); setBuscaTexto(''); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      <Table
        dataSource={filtrados}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false, showTotal: t => `${t} ticket${t !== 1 ? 's' : ''}` }}
        rowClassName={t => t.posicao === 'finalizado' ? 'row-finalizado' : ''}
        style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}
        bordered={false}
      />

      {/* Drawer novo/editar */}
      <Drawer
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#1677ff' }} />
            {editando ? `Ticket #${editando.numero}` : 'Novo ticket'}
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" loading={salvando} onClick={salvar}>Salvar</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {/* Identificação */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="numero" label="Nº Ticket" style={{ width: 110 }} rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input prefix="#" placeholder="0001" />
            </Form.Item>
            <Form.Item name="assunto" label="Assunto" style={{ flex: 1 }} rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Descreva o assunto brevemente" />
            </Form.Item>
          </div>

          {/* Referências */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="notaFiscal" label="Nota Fiscal" style={{ flex: 1 }} rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Nº da NF" />
            </Form.Item>
            <Form.Item name="pedido" label="Pedido" style={{ flex: 1 }} rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Nº do pedido" />
            </Form.Item>
            <Form.Item name="empenho" label="Empenho" style={{ flex: 1 }}>
              <Input placeholder="Opcional" />
            </Form.Item>
          </div>

          {/* Classificação */}
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="prioridade" label="Prioridade" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select>
                <Select.Option value="alta">
                  <Tag color="red" style={{ margin: 0 }}>⚠ Alta</Tag>
                </Select.Option>
                <Select.Option value="media">
                  <Tag color="orange" style={{ margin: 0 }}>● Média</Tag>
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="posicao" label="Posição" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select>
                <Select.Option value="aberto"><Tag style={{ margin: 0 }}>Em aberto</Tag></Select.Option>
                <Select.Option value="andamento"><Tag color="blue" style={{ margin: 0 }}>Em andamento</Tag></Select.Option>
                <Select.Option value="finalizado"><Tag color="green" style={{ margin: 0 }}>Finalizado</Tag></Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* Análise */}
          <Form.Item name="problemaRaiz" label="Problema Raiz">
            <TextArea
              rows={3}
              placeholder="Qual é a causa raiz do problema?"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item name="acaoTomada" label="Ação a ser tomada">
            <TextArea
              rows={3}
              placeholder="Quais ações serão tomadas para resolver?"
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Form>
      </Drawer>

      <style>{`
        .row-finalizado td { opacity: 0.55; }
        .row-finalizado:hover td { opacity: 0.75; }
      `}</style>
    </div>
  );
}
