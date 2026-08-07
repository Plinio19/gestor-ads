import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Typography, Row, Col, Popconfirm, message, Tooltip, Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PictureOutlined,
} from '@ant-design/icons';
import type { Cotacao } from '../../types';
import { useCotacoesStore } from '../../stores/useCotacoesStore';
import { formatarData } from '../../utils';
import CotacaoForm from './CotacaoForm';
import CotacaoPreview from './CotacaoPreview';

const { Title, Text } = Typography;

export default function CotacoesPage() {
  const { cotacoes, loading, fetch, remove } = useCotacoesStore();
  const [busca, setBusca] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Cotacao | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCotacao, setPreviewCotacao] = useState<Cotacao | null>(null);

  useEffect(() => { fetch(); }, []);

  const filtradas = cotacoes.filter(c => {
    if (!busca) return true;
    const h = [c.pedido, c.tomador, c.mat, ...(c.transRows || []).map(r => r.trans)].join(' ').toLowerCase();
    return h.includes(busca.toLowerCase());
  });

  async function excluir(id: string) {
    try {
      await remove(id);
      message.success('Cotação removida.');
    } catch (e) {
      message.error('Erro ao remover: ' + String(e));
    }
  }

  function melhorCotacao(c: Cotacao): { trans: string; valor: string; prazo: string } | null {
    const rows = (c.transRows || []).filter(r => r.trans && r.valor);
    if (!rows.length) return null;
    rows.sort((a, b) => {
      const va = parseFloat(a.valor.replace(',', '.')) || Infinity;
      const vb = parseFloat(b.valor.replace(',', '.')) || Infinity;
      return va - vb;
    });
    return rows[0];
  }

  const columns: ColumnsType<Cotacao> = [
    {
      title: 'Data',
      dataIndex: 'data',
      width: 100,
      sorter: (a, b) => (a.data || '').localeCompare(b.data || ''),
      defaultSortOrder: 'descend',
      render: (d: string) => formatarData(d),
    },
    {
      title: 'Pedido',
      dataIndex: 'pedido',
      width: 100,
      render: (p: string) => <Text strong>{p || '—'}</Text>,
    },
    {
      title: 'Tomador',
      dataIndex: 'tomador',
      width: 120,
    },
    {
      title: 'NF (R$)',
      dataIndex: 'vnf',
      width: 100,
      render: (v: string) => v ? `R$ ${v}` : '—',
    },
    {
      title: 'Peso',
      dataIndex: 'pes',
      width: 100,
    },
    {
      title: 'Material',
      dataIndex: 'mat',
      ellipsis: true,
      render: (m: string) => <Text type="secondary" style={{ fontSize: 12 }}>{m}</Text>,
    },
    {
      title: 'Melhor Cotação',
      key: 'melhor',
      width: 200,
      render: (_, record) => {
        const melhor = melhorCotacao(record);
        if (!melhor) return <Text type="secondary">—</Text>;
        return (
          <div>
            <Tag color="green" style={{ fontSize: 11 }}>{melhor.trans}</Tag>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              <Text strong>R$ {melhor.valor}</Text>
              {melhor.prazo && <Text type="secondary" style={{ marginLeft: 6 }}>{melhor.prazo}d</Text>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Ver imagem / PDF">
            <Button
              type="text"
              icon={<PictureOutlined />}
              onClick={() => { setPreviewCotacao(record); setPreviewOpen(true); }}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => { setEditando(record); setDrawerOpen(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Excluir cotação?"
            description="Esta ação não pode ser desfeita."
            onConfirm={() => excluir(record.id)}
            okText="Excluir"
            okType="danger"
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
            Cotações <Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>({cotacoes.length})</Text>
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditando(null); setDrawerOpen(true); }}>
            Nova Cotação
          </Button>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar por pedido, transportadora, material..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            allowClear
          />
        </Col>
      </Row>

      <Table
        dataSource={filtradas}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 20, showTotal: t => `${t} cotação(ões)` }}
        locale={{ emptyText: 'Nenhuma cotação cadastrada.' }}
        expandable={{
          expandedRowRender: (record) => {
            const rows = (record.transRows || []).filter(r => r.trans);
            if (!rows.length) return <Text type="secondary">Sem transportadoras cotadas.</Text>;
            return (
              <div style={{ padding: '8px 0' }}>
                <Text strong style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Cotações:</Text>
                <Space wrap>
                  {rows.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#f8faff',
                        border: '1px solid #e8f0fe',
                        borderRadius: 8,
                        padding: '8px 12px',
                        minWidth: 140,
                      }}
                    >
                      <Text strong style={{ fontSize: 12 }}>{r.trans}</Text>
                      {r.valor && <div style={{ fontSize: 13, color: '#1677ff', fontWeight: 700 }}>R$ {r.valor}</div>}
                      {r.prazo && <div style={{ fontSize: 11, color: '#666' }}>{r.prazo} dias</div>}
                      {r.cotacao && <div style={{ fontSize: 11, color: '#888' }}>Cot. {r.cotacao}</div>}
                    </div>
                  ))}
                </Space>
              </div>
            );
          },
          rowExpandable: (r) => (r.transRows || []).some(row => row.trans),
        }}
      />

      <CotacaoForm
        cotacao={editando}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <CotacaoPreview
        cotacao={previewCotacao}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
