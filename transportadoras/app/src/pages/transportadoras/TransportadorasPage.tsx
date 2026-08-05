import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Select, Typography, Row, Col,
  Card, Statistic, Popconfirm, message, Tooltip, Tag, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  GlobalOutlined, CheckCircleOutlined, CarOutlined, WarningOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { Transportadora } from '../../types';
import { useTransportadorasStore } from '../../stores/useTransportadorasStore';
import {
  piorStatusLicencas, statusLicenca, diasParaVencer, formatarData, ESTADOS_BR,
} from '../../utils';
import { dataService } from '../../services/GitHubDataService';
import TransportadoraForm from './TransportadoraForm';

const { Title, Text, Link } = Typography;

const STATUS_COLOR: Record<string, string> = {
  ativo: 'green',
  inativo: 'red',
  suspenso: 'orange',
};

const QUIMICO_COLOR: Record<string, string> = {
  sim: 'green',
  nao: 'default',
  consultar: 'orange',
};

function LicencaBadge({ licencas }: { licencas: Transportadora['licencas'] }) {
  if (!licencas || !licencas.length) {
    return <Badge color="default" text={<Text type="secondary" style={{ fontSize: 12 }}>Sem licença</Text>} />;
  }
  const pior = piorStatusLicencas(licencas);
  const n = licencas.length;

  if (pior === 'vencida') {
    return <Badge color="red" text={<Text style={{ fontSize: 12, color: '#cf1322' }}>Vencida ({n})</Text>} />;
  }
  if (pior === 'vencendo') {
    const minDias = Math.min(
      ...licencas
        .filter(l => statusLicenca(l.vencimento) === 'vencendo')
        .map(l => diasParaVencer(l.vencimento!)),
    );
    return <Badge color="orange" text={<Text style={{ fontSize: 12, color: '#d46b08' }}>Vence em {minDias}d ({n})</Text>} />;
  }
  return <Badge color="green" text={<Text style={{ fontSize: 12, color: '#389e0d' }}>OK ({n})</Text>} />;
}

export default function TransportadorasPage() {
  const { transportadoras, loading, fetch, remove } = useTransportadorasStore();
  const [busca, setBusca] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Transportadora | null>(null);

  useEffect(() => { fetch(); }, []);

  const estadosDisponiveis = [...new Set(transportadoras.flatMap(t => t.estados))].sort();

  const filtradas = transportadoras.filter(t => {
    if (filtroEstado && !t.estados.includes(filtroEstado)) return false;
    if (filtroStatus && t.status !== filtroStatus) return false;
    if (busca) {
      const h = [t.nome, t.contato, t.obs, t.telefone, t.email, t.site].join(' ').toLowerCase();
      if (!h.includes(busca.toLowerCase())) return false;
    }
    return true;
  });

  async function excluir(id: string) {
    try {
      await remove(id);
      message.success('Transportadora removida.');
    } catch (e) {
      message.error('Erro ao remover: ' + String(e));
    }
  }

  function exportarCSV() {
    const linhas = [
      ['Nome', 'Status', 'Quimico', 'Estados', 'Telefone', 'Email', 'Site', 'Contato', 'Licencas', 'Observacoes'],
      ...filtradas.map(t => [
        t.nome,
        t.status,
        t.quimico,
        t.estados.join(';'),
        t.telefone,
        t.email,
        t.site,
        t.contato,
        (t.licencas || []).map(l => `${l.tipo}(${l.vencimento ?? 'sem data'})`).join(';'),
        t.obs,
      ]),
    ];
    const csv = linhas.map(l => l.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    baixar(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), 'transportadoras.csv');
  }

  function exportarJSON() {
    baixar(new Blob([JSON.stringify(transportadoras, null, 2)], { type: 'application/json' }), 'transportadoras.json');
  }

  function baixar(blob: Blob, nome: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome; a.click();
    URL.revokeObjectURL(url);
  }

  const columns: ColumnsType<Transportadora> = [
    {
      title: 'Transportadora',
      dataIndex: 'nome',
      sorter: (a, b) => a.nome.localeCompare(b.nome),
      render: (nome: string, record) => (
        <div>
          <Text strong>{nome}</Text>
          {record.contato && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>👤 {record.contato}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Químico',
      dataIndex: 'quimico',
      width: 100,
      render: (q: string) => (
        <Tag color={QUIMICO_COLOR[q] ?? 'default'} style={{ fontSize: 11 }}>
          {q === 'sim' ? 'Sim' : q === 'nao' ? 'Não' : 'Consultar'}
        </Tag>
      ),
    },
    {
      title: 'Estados',
      dataIndex: 'estados',
      width: 220,
      sorter: (a, b) => b.estados.length - a.estados.length,
      render: (estados: string[]) => {
        if (!estados?.length) return <Text type="secondary">—</Text>;
        if (estados.length === ESTADOS_BR.length) return <Tag color="blue">Nacional (27)</Tag>;
        if (estados.length > 8) return <Tag color="blue">{estados.length} estados</Tag>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {estados.map(e => <Tag key={e} style={{ fontSize: 11, margin: 0 }}>{e}</Tag>)}
          </div>
        );
      },
    },
    {
      title: 'Contato',
      key: 'contato',
      width: 160,
      render: (_, record) => (
        <div>
          {record.telefone && <div style={{ fontSize: 12 }}>{record.telefone}</div>}
          {record.email && (
            <div>
              <Link href={`mailto:${record.email}`} style={{ fontSize: 12 }}>{record.email}</Link>
            </div>
          )}
          {record.site && (
            <div>
              <Link
                href={record.site.startsWith('http') ? record.site : `https://${record.site}`}
                target="_blank"
                style={{ fontSize: 12 }}
              >
                {record.site}
              </Link>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Licenças',
      key: 'licencas',
      width: 140,
      render: (_, record) => {
        const lics = record.licencas || [];
        return (
          <div>
            <LicencaBadge licencas={lics} />
            {lics.map(lic => (
              <div key={lic.id} style={{ marginTop: 3 }}>
                <Text style={{ fontSize: 11 }}>{lic.tipo}</Text>
                {lic.arquivo && (
                  <a
                    href={dataService.rawUrl(lic.arquivo)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 6, fontSize: 11 }}
                  >
                    PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 100,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s] ?? 'default'}>
          {s === 'ativo' ? 'Ativo' : s === 'inativo' ? 'Inativo' : 'Suspenso'}
        </Tag>
      ),
    },
    {
      title: 'Observações',
      dataIndex: 'obs',
      ellipsis: true,
      render: (obs: string) => <Text type="secondary" style={{ fontSize: 12 }}>{obs}</Text>,
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 90,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => { setEditando(record); setDrawerOpen(true); }}
            />
          </Tooltip>
          <Popconfirm
            title="Excluir transportadora?"
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

  const total    = transportadoras.length;
  const ativas   = transportadoras.filter(t => t.status === 'ativo').length;
  const estados  = new Set(transportadoras.flatMap(t => t.estados)).size;
  const alertas  = transportadoras.filter(t => {
    const s = piorStatusLicencas(t.licencas || []);
    return s === 'vencida' || s === 'vencendo';
  }).length;

  // Licenças com datas para ordenação
  const proximasVencer = transportadoras
    .filter(t => {
      const s = piorStatusLicencas(t.licencas || []);
      return s === 'vencendo' || s === 'vencida';
    })
    .flatMap(t =>
      (t.licencas || [])
        .filter(l => {
          const s = statusLicenca(l.vencimento);
          return s === 'vencendo' || s === 'vencida';
        })
        .map(l => ({
          trans: t.nome,
          tipo: l.tipo,
          venc: formatarData(l.vencimento),
          dias: l.vencimento ? diasParaVencer(l.vencimento) : null,
          isVencida: statusLicenca(l.vencimento) === 'vencida',
        })),
    )
    .sort((a, b) => (a.dias ?? -999) - (b.dias ?? -999));

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Transportadoras</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={exportarCSV}>CSV</Button>
            <Button icon={<DownloadOutlined />} onClick={exportarJSON}>JSON</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditando(null); setDrawerOpen(true); }}>
              Nova Transportadora
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total" value={total} prefix={<CarOutlined />} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Ativas" value={ativas} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a', fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Estados cobertos" value={estados} prefix={<GlobalOutlined />} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Licenças em alerta"
              value={alertas}
              prefix={<WarningOutlined />}
              valueStyle={{ color: alertas > 0 ? '#fa8c16' : '#52c41a', fontSize: 22 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerta de licenças próximas */}
      {proximasVencer.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {proximasVencer.filter(l => l.isVencida).length > 0 && (
            <div style={{
              background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8,
              padding: '10px 14px', marginBottom: 8, fontSize: 13,
            }}>
              🔴 <strong>Licenças vencidas:</strong>{' '}
              {proximasVencer.filter(l => l.isVencida).map(l => `${l.trans} — ${l.tipo} (${l.venc})`).join(', ')}
            </div>
          )}
          {proximasVencer.filter(l => !l.isVencida).length > 0 && (
            <div style={{
              background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8,
              padding: '10px 14px', fontSize: 13,
            }}>
              🟡 <strong>Vencendo em até 60 dias:</strong>{' '}
              {proximasVencer.filter(l => !l.isVencida).map(l => `${l.trans} — ${l.tipo} (${l.dias}d)`).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={10}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar por nome, contato, telefone..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={7}>
          <Select
            style={{ width: '100%' }}
            placeholder="Filtrar por estado"
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={[
              { value: '', label: 'Todos os estados' },
              ...estadosDisponiveis.map(e => ({ value: e, label: e })),
            ]}
          />
        </Col>
        <Col xs={24} sm={7}>
          <Select
            style={{ width: '100%' }}
            placeholder="Filtrar por status"
            value={filtroStatus}
            onChange={setFiltroStatus}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
              { value: 'suspenso', label: 'Suspenso' },
            ]}
          />
        </Col>
      </Row>

      <Table
        dataSource={filtradas}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 20, showTotal: t => `${t} transportadora(s)` }}
        locale={{ emptyText: 'Nenhuma transportadora encontrada.' }}
      />

      <TransportadoraForm
        transportadora={editando}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
