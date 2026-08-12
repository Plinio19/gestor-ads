import { useEffect, useState } from 'react';
import { Button, Typography, Space, Tag, Tooltip, Popconfirm, message, Spin, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import type { Negocio, Etapa } from '../../types';
import { useNegociosStore } from '../../stores/useNegociosStore';
import { useClientesStore } from '../../stores/useClientesStore';
import { ETAPAS, formatarValor, formatarData, diasDesde } from '../../utils';
import NegocioForm from './NegocioForm';

const { Title, Text } = Typography;

export default function PipelinePage() {
  const { negocios, loading, fetch, remove } = useNegociosStore();
  const { clientes, fetch: fc } = useClientesStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Negocio | null>(null);
  const [etapaInicial, setEtapaInicial] = useState<Etapa>('lead');

  useEffect(() => { fetch(); fc(); }, []);

  function abrirNovo(etapa: Etapa) {
    setEditando(null);
    setEtapaInicial(etapa);
    setFormOpen(true);
  }

  function abrirEditar(n: Negocio) {
    setEditando(n);
    setFormOpen(true);
  }

  async function excluir(id: string) {
    try { await remove(id); message.success('Negócio removido.'); }
    catch (e) { message.error('Erro: ' + String(e)); }
  }

  const etapasKanban = ETAPAS.filter(e => !['ganho', 'perdido'].includes(e.key));
  const etapasFechadas = ETAPAS.filter(e => ['ganho', 'perdido'].includes(e.key));

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Pipeline de Vendas</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {negocios.filter(n => !['ganho','perdido'].includes(n.etapa)).length} negócios ativos
          </Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirNovo('lead')}>
            Novo Negócio
          </Button>
        </Col>
      </Row>

      {/* Kanban ativo */}
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 16,
        alignItems: 'flex-start',
      }}>
        {etapasKanban.map(etapa => {
          const cards = negocios.filter(n => n.etapa === etapa.key);
          const total = cards.reduce((s, n) => s + (parseFloat(n.valor?.toString().replace(',', '.')) || 0), 0);

          return (
            <div key={etapa.key} style={{
              minWidth: 240,
              width: 240,
              background: etapa.bg,
              borderRadius: 12,
              border: `1px solid ${etapa.color}30`,
              flexShrink: 0,
            }}>
              {/* Header coluna */}
              <div style={{
                padding: '12px 14px 10px',
                borderBottom: `2px solid ${etapa.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <Text style={{ fontWeight: 700, fontSize: 13, color: etapa.color }}>
                    {etapa.icone} {etapa.label}
                  </Text>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                    {cards.length} negócio{cards.length !== 1 ? 's' : ''}
                    {total > 0 && <span style={{ marginLeft: 6, color: etapa.color, fontWeight: 600 }}>
                      · {formatarValor(total)}
                    </span>}
                  </div>
                </div>
                <Tooltip title={`Novo negócio em ${etapa.label}`}>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    style={{ color: etapa.color }}
                    onClick={() => abrirNovo(etapa.key)}
                  />
                </Tooltip>
              </div>

              {/* Cards */}
              <div style={{ padding: '8px', maxHeight: 480, overflowY: 'auto' }}>
                {cards.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#bbb', fontSize: 12 }}>
                    Nenhum negócio
                  </div>
                )}
                {cards.map(n => {
                  const cli = clientes.find(c => c.id === n.clienteId);
                  const dias = diasDesde(n.dataAbertura);
                  const prob = n.probabilidade ? parseInt(n.probabilidade) : null;
                  return (
                    <div
                      key={n.id}
                      onClick={() => abrirEditar(n)}
                      style={{
                        background: '#fff',
                        borderRadius: 10,
                        padding: '10px 12px',
                        marginBottom: 8,
                        cursor: 'pointer',
                        border: '1px solid #e8e8e8',
                        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                        transition: 'box-shadow .15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,.12)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,.05)'; }}
                    >
                      <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.3, marginBottom: 4 }}>
                        {n.titulo}
                      </Text>

                      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
                        🏢 {cli?.nomeFantasia || cli?.razaoSocial || '—'}
                      </Text>

                      {n.valor && (
                        <div style={{ fontWeight: 700, color: '#389e0d', fontSize: 13, marginBottom: 4 }}>
                          <DollarOutlined style={{ marginRight: 4 }} />
                          {formatarValor(parseFloat(n.valor.toString().replace(',', '.')))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={4}>
                          {prob !== null && (
                            <Tag
                              style={{ fontSize: 10, margin: 0 }}
                              color={prob >= 70 ? 'green' : prob >= 40 ? 'orange' : 'default'}
                            >
                              {prob}%
                            </Tag>
                          )}
                          <Text style={{ fontSize: 10, color: '#aaa' }}>{dias}d</Text>
                        </Space>
                        <Space size={2} onClick={e => e.stopPropagation()}>
                          <Tooltip title="Editar">
                            <Button type="text" size="small" icon={<EditOutlined />}
                              style={{ height: 22, width: 22 }}
                              onClick={() => abrirEditar(n)} />
                          </Tooltip>
                          <Popconfirm
                            title="Excluir negócio?"
                            onConfirm={() => excluir(n.id)}
                            okText="Sim" okType="danger"
                          >
                            <Button type="text" size="small" danger icon={<DeleteOutlined />}
                              style={{ height: 22, width: 22 }} />
                          </Popconfirm>
                        </Space>
                      </div>

                      {n.dataFechamento && (
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
                          Fechamento: {formatarData(n.dataFechamento)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ganhos e Perdidos */}
      <Row gutter={16} style={{ marginTop: 8 }}>
        {etapasFechadas.map(etapa => {
          const cards = negocios.filter(n => n.etapa === etapa.key);
          if (cards.length === 0) return null;
          const total = cards.reduce((s, n) => s + (parseFloat(n.valor?.toString().replace(',', '.')) || 0), 0);
          return (
            <Col key={etapa.key} xs={24} md={12}>
              <div style={{
                background: etapa.bg,
                border: `1px solid ${etapa.color}30`,
                borderRadius: 12,
                padding: '12px 16px',
              }}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: 700, color: etapa.color }}>
                    {etapa.icone} {etapa.label}
                  </Text>
                  <Text style={{ fontWeight: 700, color: etapa.color }}>
                    {formatarValor(total)}
                  </Text>
                </div>
                {cards.slice(0, 5).map(n => {
                  const cli = clientes.find(c => c.id === n.clienteId);
                  return (
                    <div key={n.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,.04)',
                    }}>
                      <div style={{ cursor: 'pointer' }} onClick={() => abrirEditar(n)}>
                        <Text style={{ fontSize: 12, fontWeight: 600 }}>{n.titulo}</Text>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          {cli?.nomeFantasia || cli?.razaoSocial || '—'}
                        </div>
                      </div>
                      <Space size={4}>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: etapa.color }}>
                          {n.valor ? formatarValor(parseFloat(n.valor.toString().replace(',','.'))) : '—'}
                        </Text>
                        <Popconfirm
                          title="Excluir?" onConfirm={() => excluir(n.id)} okText="Sim" okType="danger"
                        >
                          <Button type="text" size="small" danger icon={<DeleteOutlined />}
                            style={{ height: 22, width: 22 }} />
                        </Popconfirm>
                      </Space>
                    </div>
                  );
                })}
                {cards.length > 5 && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                    +{cards.length - 5} mais...
                  </Text>
                )}
              </div>
            </Col>
          );
        })}
      </Row>

      <NegocioForm
        negocio={editando}
        etapaInicial={etapaInicial}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
