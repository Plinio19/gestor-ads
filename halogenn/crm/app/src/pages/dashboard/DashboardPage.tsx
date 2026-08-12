import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, List, Tag, Button, Empty, Spin } from 'antd';
import {
  RiseOutlined, TrophyOutlined, CalendarOutlined, FundOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useClientesStore } from '../../stores/useClientesStore';
import { useNegociosStore } from '../../stores/useNegociosStore';
import { useAtividadesStore } from '../../stores/useAtividadesStore';
import { formatarData, formatarValor, getEtapa, TIPOS_ATIVIDADE, hoje } from '../../utils';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { clientes, fetch: fc, loading: lc } = useClientesStore();
  const { negocios, fetch: fn, loading: ln } = useNegociosStore();
  const { atividades, fetch: fa, loading: la } = useAtividadesStore();

  useEffect(() => { fc(); fn(); fa(); }, []);

  const ativos    = negocios.filter(n => !['ganho','perdido'].includes(n.etapa));
  const ganhos    = negocios.filter(n => n.etapa === 'ganho');
  const pipeline  = ativos.reduce((s, n) => s + (parseFloat(n.valor.replace(',', '.')) || 0), 0);
  const mesFechado = ganhos
    .filter(n => n.dataFechamento?.slice(0, 7) === hoje().slice(0, 7))
    .reduce((s, n) => s + (parseFloat(n.valor.replace(',', '.')) || 0), 0);

  const pendentes = atividades
    .filter(a => !a.concluida)
    .sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  const loading = lc || ln || la;

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Visão geral do comercial Halogenn</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/pipeline')}>
            Novo Negócio
          </Button>
        </Col>
      </Row>

      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#6C2BD9,#9b59f5)', borderRadius: 12 }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Negócios Ativos</Text>}
              value={ativos.length}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
              prefix={<FundOutlined style={{ color: 'rgba(255,255,255,.8)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#096dd9,#40a9ff)', borderRadius: 12 }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Pipeline Total</Text>}
              value={formatarValor(pipeline)}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 18 }}
              prefix={<RiseOutlined style={{ color: 'rgba(255,255,255,.8)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#389e0d,#73d13d)', borderRadius: 12 }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Ganhos este Mês</Text>}
              value={formatarValor(mesFechado)}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 18 }}
              prefix={<TrophyOutlined style={{ color: 'rgba(255,255,255,.8)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg,#d46b08,#ffa940)', borderRadius: 12 }}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Tarefas Pendentes</Text>}
              value={pendentes.length}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
              prefix={<CalendarOutlined style={{ color: 'rgba(255,255,255,.8)' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Pipeline por etapa */}
        <Col xs={24} md={12}>
          <Card
            title="Pipeline por Etapa"
            bordered={false}
            extra={<Button type="link" size="small" onClick={() => navigate('/pipeline')}>Ver Kanban →</Button>}
            style={{ borderRadius: 12 }}
          >
            {['lead','qualificado','proposta','negociacao'].map(etapa => {
              const e = getEtapa(etapa as never);
              const grupo = ativos.filter(n => n.etapa === etapa);
              const valor = grupo.reduce((s, n) => s + (parseFloat(n.valor.replace(',', '.')) || 0), 0);
              return (
                <div key={etapa} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #f0f0f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{e.icone}</span>
                    <div>
                      <Text style={{ fontWeight: 600, fontSize: 13 }}>{e.label}</Text>
                      <div style={{ fontSize: 11, color: '#888' }}>{grupo.length} negócio(s)</div>
                    </div>
                  </div>
                  <Text style={{ fontWeight: 700, color: e.color }}>
                    {valor > 0 ? formatarValor(valor) : '—'}
                  </Text>
                </div>
              );
            })}
          </Card>
        </Col>

        {/* Atividades pendentes */}
        <Col xs={24} md={12}>
          <Card
            title="Próximas Atividades"
            bordered={false}
            extra={<Button type="link" size="small" onClick={() => navigate('/atividades')}>Ver todas →</Button>}
            style={{ borderRadius: 12 }}
          >
            {pendentes.length === 0
              ? <Empty description="Nenhuma atividade pendente" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : (
                <List
                  dataSource={pendentes.slice(0, 6)}
                  renderItem={a => {
                    const tipo = TIPOS_ATIVIDADE.find(t => t.key === a.tipo);
                    const cliente = clientes.find(c => c.id === a.clienteId);
                    const atrasada = a.data && a.data < hoje();
                    return (
                      <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span>{tipo?.icone}</span>
                            <Text style={{ fontSize: 13, fontWeight: 500 }}>{a.descricao}</Text>
                            {atrasada && <Tag color="error" style={{ fontSize: 10 }}>Atrasada</Tag>}
                          </div>
                          <div style={{ fontSize: 11, color: '#888' }}>
                            {cliente?.nomeFantasia || cliente?.razaoSocial || '—'}
                            {a.data && <span style={{ marginLeft: 8 }}>📅 {formatarData(a.data)}</span>}
                          </div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              )
            }
          </Card>
        </Col>
      </Row>

      {/* Últimos negócios ganhos */}
      {ganhos.length > 0 && (
        <Card
          title="🏆 Negócios Ganhos"
          bordered={false}
          style={{ marginTop: 16, borderRadius: 12 }}
        >
          <Row gutter={[12, 12]}>
            {ganhos.slice(0, 4).map(n => {
              const cli = clientes.find(c => c.id === n.clienteId);
              return (
                <Col key={n.id} xs={24} sm={12} md={6}>
                  <div style={{
                    background: '#f6ffed', border: '1px solid #b7eb8f',
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <Text strong style={{ fontSize: 13, display: 'block' }}>{n.titulo}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {cli?.nomeFantasia || cli?.razaoSocial || '—'}
                    </Text>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#389e0d', marginTop: 6 }}>
                      {formatarValor(n.valor)}
                    </div>
                    <Text style={{ fontSize: 10, color: '#52c41a' }}>{formatarData(n.dataFechamento)}</Text>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}
    </div>
  );
}
