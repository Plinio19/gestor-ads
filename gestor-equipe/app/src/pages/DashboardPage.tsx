import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Badge, Button, Tag, Empty, Avatar } from 'antd';
import { CheckOutlined, ClockCircleOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import { useTarefasStore, tarefasVencidas, tarefasHoje } from '../stores/useTarefasStore';
import { useFuncionariosStore } from '../stores/useFuncionariosStore';
import { useProcessosStore } from '../stores/useProcessosStore';
import { COR_PRIORIDADE, LABEL_PRIORIDADE, fmtDate } from '../utils';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { tarefas } = useTarefasStore();
  const { funcionarios } = useFuncionariosStore();
  const { processos } = useProcessosStore();

  const vencidas = tarefasVencidas(tarefas);
  const hoje = tarefasHoje(tarefas);
  const pendentes = tarefas.filter(t => t.status === 'pendente').length;
  const concluidas = tarefas.filter(t => t.status === 'concluida').length;
  const atrasadas = vencidas.length;

  function nomeFunc(id: string) {
    return funcionarios.find(f => f.id === id)?.nome ?? '—';
  }

  const urgentes = [...vencidas, ...hoje].sort((a, b) => {
    const ord = { urgente: 0, alta: 1, normal: 2, baixa: 3 };
    return (ord[a.prioridade] ?? 3) - (ord[b.prioridade] ?? 3);
  }).slice(0, 8);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Dashboard</Title>

      {/* KPI cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Atrasadas', value: atrasadas, color: '#f5222d', icon: <ClockCircleOutlined /> },
          { label: 'Para hoje', value: hoje.length, color: '#fa8c16', icon: <ClockCircleOutlined /> },
          { label: 'Pendentes', value: pendentes, color: '#1677ff', icon: <ClockCircleOutlined /> },
          { label: 'Concluídas', value: concluidas, color: '#52c41a', icon: <CheckOutlined /> },
          { label: 'Funcionários', value: funcionarios.filter(f => f.ativo).length, color: '#7265E6', icon: <TeamOutlined /> },
          { label: 'Processos', value: processos.filter(p => p.ativo).length, color: '#00A2AE', icon: <FileTextOutlined /> },
        ].map(k => (
          <Col xs={12} sm={8} lg={4} key={k.label}>
            <Card bordered={false} style={{ borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{k.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Tarefas urgentes */}
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>⚠️ Atenção imediata</span>
                <Button type="link" size="small" onClick={() => navigate('/tarefas')}>Ver todas</Button>
              </div>
            }
          >
            {urgentes.length === 0 ? (
              <Empty description="Nenhuma tarefa urgente" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {urgentes.map(t => {
                  const atrasada = t.prazo < new Date().toISOString().slice(0, 10);
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate('/tarefas')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8,
                        background: atrasada ? '#fff1f0' : '#fffbe6',
                        border: `1px solid ${atrasada ? '#ffa39e' : '#ffe58f'}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 3, height: 32, borderRadius: 2, background: COR_PRIORIDADE[t.prioridade], flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(t.prazo)} · {nomeFunc(t.responsavelId)}</Text>
                      </div>
                      <Tag color={COR_PRIORIDADE[t.prioridade]} style={{ fontSize: 10, margin: 0 }}>{LABEL_PRIORIDADE[t.prioridade]}</Tag>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Equipe rápida */}
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>👥 Equipe</span>
                <Button type="link" size="small" onClick={() => navigate('/equipe')}>Gerenciar</Button>
              </div>
            }
          >
            {funcionarios.filter(f => f.ativo).length === 0 ? (
              <Empty description="Nenhum funcionário cadastrado" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" size="small" onClick={() => navigate('/equipe')}>Cadastrar</Button>
              </Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {funcionarios.filter(f => f.ativo).map(f => {
                  const qtdPendentes = tarefas.filter(t => t.responsavelId === f.id && t.status !== 'concluida').length;
                  const qtdAtrasadas = vencidas.filter(t => t.responsavelId === f.id).length;
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                      <Avatar size={32} style={{ background: f.cor, fontSize: 12, flexShrink: 0 }}>
                        {f.nome.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, display: 'block' }}>{f.nome}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{f.cargo}</Text>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {qtdAtrasadas > 0 && <Badge count={qtdAtrasadas} style={{ background: '#f5222d' }} />}
                        {qtdPendentes > 0 && <Badge count={qtdPendentes} style={{ background: '#1677ff' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
