import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Typography, Row, Col,
  Popconfirm, message, Tag, Select, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PhoneOutlined } from '@ant-design/icons';
import type { Cliente } from '../../types';
import { useClientesStore } from '../../stores/useClientesStore';
import { useNegociosStore } from '../../stores/useNegociosStore';
import ClienteForm from './ClienteForm';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  ativo:     'green',
  inativo:   'default',
  prospecto: 'blue',
};

export default function ClientesPage() {
  const { clientes, loading, fetch, remove } = useClientesStore();
  const { negocios, fetch: fn } = useNegociosStore();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>();
  const [filtroSegmento, setFiltroSegmento] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  useEffect(() => { fetch(); fn(); }, []);

  const segmentos = [...new Set(clientes.map(c => c.segmento).filter(Boolean))];

  const filtrados = clientes.filter(c => {
    const h = [c.razaoSocial, c.nomeFantasia, c.cnpj, c.cidade, c.email].join(' ').toLowerCase();
    if (busca && !h.includes(busca.toLowerCase())) return false;
    if (filtroStatus && c.status !== filtroStatus) return false;
    if (filtroSegmento && c.segmento !== filtroSegmento) return false;
    return true;
  });

  async function excluir(id: string) {
    try {
      await remove(id);
      message.success('Cliente removido.');
    } catch (e) {
      message.error('Erro: ' + String(e));
    }
  }

  const columns: ColumnsType<Cliente> = [
    {
      title: 'Cliente',
      key: 'cliente',
      ellipsis: true,
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{r.nomeFantasia || r.razaoSocial}</Text>
          {r.nomeFantasia && (
            <div style={{ fontSize: 11, color: '#888' }}>{r.razaoSocial}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Segmento',
      dataIndex: 'segmento',
      width: 130,
      render: s => s ? <Tag style={{ fontSize: 11 }}>{s}</Tag> : '—',
    },
    {
      title: 'Cidade / UF',
      key: 'local',
      width: 130,
      render: (_, r) => r.cidade ? `${r.cidade} / ${r.uf}` : '—',
    },
    {
      title: 'Contato',
      key: 'contato',
      width: 150,
      render: (_, r) => {
        const principal = r.contatos?.[0];
        if (!principal) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        return (
          <div>
            <Text style={{ fontSize: 12 }}>{principal.nome}</Text>
            {principal.telefone && (
              <div style={{ fontSize: 11, color: '#888' }}>
                <PhoneOutlined /> {principal.telefone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Negócios',
      key: 'negocios',
      width: 80,
      align: 'center',
      render: (_, r) => {
        const count = negocios.filter(n => n.clienteId === r.id).length;
        return count > 0
          ? <Tag color="purple">{count}</Tag>
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      render: s => <Tag color={STATUS_COLOR[s] ?? 'default'} style={{ fontSize: 11 }}>
        {s === 'prospecto' ? 'Prospecto' : s === 'ativo' ? 'Ativo' : 'Inativo'}
      </Tag>,
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 80,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />}
              onClick={() => { setEditando(record); setDrawerOpen(true); }} />
          </Tooltip>
          <Popconfirm
            title="Excluir cliente?"
            description="Negócios vinculados não serão excluídos."
            onConfirm={() => excluir(record.id)}
            okText="Excluir" okType="danger"
          >
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
          <Title level={4} style={{ margin: 0 }}>
            Clientes
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 400, marginLeft: 8 }}>
              ({clientes.length})
            </Text>
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditando(null); setDrawerOpen(true); }}>
            Novo Cliente
          </Button>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar por nome, CNPJ, cidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={12} sm={6}>
          <Select
            placeholder="Status"
            style={{ width: '100%' }}
            allowClear
            value={filtroStatus}
            onChange={setFiltroStatus}
            options={[
              { value: 'prospecto', label: 'Prospecto' },
              { value: 'ativo',     label: 'Ativo'     },
              { value: 'inativo',   label: 'Inativo'   },
            ]}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Select
            placeholder="Segmento"
            style={{ width: '100%' }}
            allowClear
            value={filtroSegmento}
            onChange={setFiltroSegmento}
            options={segmentos.map(s => ({ value: s, label: s }))}
          />
        </Col>
      </Row>

      <Table
        dataSource={filtrados}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 25, showTotal: t => `${t} cliente(s)` }}
        locale={{ emptyText: 'Nenhum cliente cadastrado.' }}
        expandable={{
          expandedRowRender: (r) => {
            if (!r.contatos?.length) return <Text type="secondary">Sem contatos cadastrados.</Text>;
            return (
              <Row gutter={[12, 8]} style={{ padding: '4px 0' }}>
                {r.contatos.map(c => (
                  <Col key={c.id} xs={24} sm={12} md={8}>
                    <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px 12px' }}>
                      <Text strong style={{ fontSize: 12 }}>{c.nome}</Text>
                      {c.cargo && <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>({c.cargo})</Text>}
                      {c.telefone && <div style={{ fontSize: 11, color: '#555' }}>📞 {c.telefone}</div>}
                      {c.email && <div style={{ fontSize: 11, color: '#1677ff' }}>✉️ {c.email}</div>}
                    </div>
                  </Col>
                ))}
              </Row>
            );
          },
          rowExpandable: r => (r.contatos?.length ?? 0) > 0,
        }}
      />

      <ClienteForm
        cliente={editando}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
