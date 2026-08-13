import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Statistic, Typography, List, Tag, Button, Empty, Spin, Alert, Space, Badge,
} from 'antd';
import {
  RiseOutlined, TrophyOutlined, FundOutlined, PlusOutlined,
  CheckOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
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
  const { atividades, fetch: fa, loading: la, concluir } = useAtividadesStore();

  useEffect(() => { fc(); fn(); fa(); }, []);

  const hj = hoje();

  const ativos    = negocios.filter(n => !['ganho','perdido'].includes(n.etapa));
  const ganhos    = negocios.filter(n => n.etapa === 'ganho');
  const pipeline  = ativos.reduce((s, n) => s + (parseFloat(n.valor?.toString().replace(',', '.') ?? '0') || 0), 0);
  const mesFechado = ganhos
    .filter(n => n.dataFechamento?.slice(0, 7) === hj.slice(0, 7))
    .reduce((s, n) => s + (parseFloat(n.valor?.toString().replace(',', '.') ?? '0') || 0), 0);

  const pendentes = atividades.filter(a => !a.concluida);
  const atrasadas = pendentes.filter(a => a.data && a.data < hj);
  const deHoje    = pendentes.filter(a => a.data === hj);
  const proximas  = pendentes.filter(a => a.data && a.data > hj)
    .sort((a, b) => a.data.localeCompare(b.data));

  const agendaHoje = [
    ...atrasadas.sort((a, b) => (a.data||'').localeCompare(b.data||'')),
    ...deHoje,
  ];

  const loading = lc || ln || la;
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Dashboard
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/pipeline')}>
            Novo Negócio
          </Button>
        </Col>
      </Row>

      {/* Alerta de tarefas atrasadas */}
      {atrasadas.length > 0 && (
        <Alert
          type="error"
          icon={<ExclamationCircleOutlined />}
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              Você tem <strong>{atrasadas.length} atividade(s) atrasada(s)</strong> que precisam de atenção.
            </span>
          }
          action={
            <Button size="small" danger onClick={() => navigate('/atividades')}>
              Ver todas
            </Button>
          }
        />
      )}

      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
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
              title={<Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Para Fazer Hoje</Text>}
              value={agendaHoje.length}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
              prefix={<ClockCircleOutlined style={{ color: 'rgba(255,255,255,.8)' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* AGENDA DO DIA — coluna principal */}
        <Col xs={24} md={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, border: '1px solid #e8e8e8' }}
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#6C2BD9' }} />
                <Text strong style={{ fontSize: 15 }}>Agenda do Dia</Text>
                {agendaHoje.length > 0 && (
                  <Badge count={agendaHoje.length} style={{ background: '#6C2BD9' }} />
                )}
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/atividades')}>
                Ver todas →
              </Button>
            }
          >
            {agendaHoje.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">✅ Nada para hoje — dia livre!</Text>}
              />
            ) : (
              <List
                dataSource={agendaHoje}
                renderItem={a => {
                  const tipo = TIPOS_ATIVIDADE.find(t => t.key === a.tipo);
                  const cliente = clientes.find(c => c.id === a.clienteId);
                  const negocio = negocios.find(n => n.id === a.negocioId);
                  const atrasada = a.data && a.data < hj;
                  return (
                    <List.Item
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid #f0f0f0',
                        background: atrasada ? '#fff2f0' : 'transparent',
                        borderRadius: atrasada ? 6 : 0,
                        paddingLeft: atrasada ? 8 : 0,
                        marginBottom: 2,
                      }}
                      actions={[
                        <Button
                          key="ok"
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          style={{ color: '#52c41a' }}
                          onClick={() => concluir(a.id)}
                          title="Marcar como feito"
                        />,
                      ]}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 14 }}>{tipo?.icone}</Text>
                          <Text strong style={{ fontSize: 13 }}>{a.descricao}</Text>
                          {atrasada && (
                            <Tag color="error" style={{ fontSize: 10 }}>
                              Atrasada · {formatarData(a.data)}
                            </Tag>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                          {cliente && <span>🏢 {cliente.nomeFantasia || cliente.razaoSocial}</span>}
                          {negocio && <span style={{ marginLeft: 8 }}>· 📄 {negocio.titulo}</span>}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}

            {/* Próximas atividades */}
            {proximas.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed #e8e8e8' }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  📅 Próximas
                </Text>
                {proximas.slice(0, 4).map(a => {
                  const tipo = TIPOS_ATIVIDADE.find(t => t.key === a.tipo);
                  const cliente = clientes.find(c => c.id === a.clienteId);
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 0', borderBottom: '1px solid #f5f5f5', fontSize: 12,
                    }}>
                      <Text style={{ fontSize: 13 }}>{tipo?.icone}</Text>
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12 }}>{a.descricao}</Text>
                        {cliente && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                          {cliente.nomeFantasia || cliente.razaoSocial}
                        </Text>}
                      </div>
                      <Tag style={{ fontSize: 10, margin: 0 }}>{formatarData(a.data)}</Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Pipeline por etapa */}
        <Col xs={24} md={10}>
          <Card
            title={<Text strong>Pipeline por Etapa</Text>}
            bordered={false}
            style={{ borderRadius: 12, border: '1px solid #e8e8e8', marginBottom: 16 }}
            extra={<Button type="link" size="small" onClick={() => navigate('/pipeline')}>Kanban →</Button>}
          >
            {['lead','qualificado','proposta','negociacao'].map(etapa => {
              const e = getEtapa(etapa as never);
              const grupo = ativos.filter(n => n.etapa === etapa);
              const valor = grupo.reduce((s, n) => s + (parseFloat(n.valor?.toString().replace(',', '.') ?? '0') || 0), 0);
              if (grupo.length === 0) return null;
              return (
                <div key={etapa} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 0', borderBottom: '1px solid #f0f0f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>{e.icone}</span>
                    <div>
                      <Text style={{ fontWeight: 600, fontSize: 12 }}>{e.label}</Text>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{grupo.length} negócio(s)</div>
                    </div>
                  </div>
                  <Text style={{ fontWeight: 700, color: e.color, fontSize: 13 }}>
                    {valor > 0 ? formatarValor(valor) : '—'}
                  </Text>
                </div>
              );
            })}
            {ativos.length === 0 && (
              <Empty description="Nenhum negócio ativo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          {/* Ganhos recentes */}
          {ganhos.length > 0 && (
            <Card
              title={<Text strong>🏆 Ganhos Recentes</Text>}
              bordered={false}
              style={{ borderRadius: 12, border: '1px solid #b7eb8f' }}
            >
              {ganhos.slice(0, 3).map(n => {
                const cli = clientes.find(c => c.id === n.clienteId);
                return (
                  <div key={n.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 0', borderBottom: '1px solid #f6ffed',
                  }}>
                    <div>
                      <Text strong style={{ fontSize: 12 }}>{n.titulo}</Text>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {cli?.nomeFantasia || cli?.razaoSocial}
                      </div>
                    </div>
                    <Text style={{ fontWeight: 700, color: '#389e0d', fontSize: 13 }}>
                      {n.valor ? formatarValor(parseFloat(n.valor.toString().replace(',','.'))) : '—'}
                    </Text>
                  </div>
                );
              })}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
