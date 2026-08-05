import { useEffect } from 'react';
import { Row, Col, Card, Statistic, Alert, Tag, Typography, Space } from 'antd';
import {
  CarOutlined, CheckCircleOutlined, GlobalOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTransportadorasStore } from '../stores/useTransportadorasStore';
import { piorStatusLicencas, statusLicenca, diasParaVencer, formatarData } from '../utils';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { transportadoras, fetch } = useTransportadorasStore();

  useEffect(() => { fetch(); }, []);

  const total   = transportadoras.length;
  const ativas  = transportadoras.filter(t => t.status === 'ativo').length;
  const estados = new Set(transportadoras.flatMap(t => t.estados)).size;

  const comAlerta = transportadoras.filter(t => {
    const s = piorStatusLicencas(t.licencas || []);
    return s === 'vencida' || s === 'vencendo';
  });

  const vencidas = comAlerta.filter(t => piorStatusLicencas(t.licencas || []) === 'vencida');
  const vencendo = comAlerta.filter(t => piorStatusLicencas(t.licencas || []) === 'vencendo');

  // Próximas licenças a vencer (todas, ordenadas)
  const proximasLicencas = transportadoras
    .flatMap(t => (t.licencas || []).map(lic => ({
      transportadora: t.nome,
      tipo: lic.tipo,
      vencimento: lic.vencimento,
      status: statusLicenca(lic.vencimento),
    })))
    .filter(l => l.status === 'vencendo' || l.status === 'vencida')
    .sort((a, b) => {
      if (!a.vencimento) return 1;
      if (!b.vencimento) return -1;
      return a.vencimento.localeCompare(b.vencimento);
    })
    .slice(0, 10);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Dashboard</Title>

      {/* Alertas */}
      {vencidas.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 12 }}
          message={
            <span>
              <strong>{vencidas.length} transportadora(s) com licença VENCIDA:</strong>{' '}
              {vencidas.map(t => (
                <Tag
                  key={t.id}
                  color="red"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/transportadoras')}
                >
                  {t.nome}
                </Tag>
              ))}
            </span>
          }
        />
      )}
      {vencendo.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            <span>
              <strong>{vencendo.length} transportadora(s) com licença vencendo em até 60 dias:</strong>{' '}
              {vencendo.map(t => (
                <Tag
                  key={t.id}
                  color="orange"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/transportadoras')}
                >
                  {t.nome}
                </Tag>
              ))}
            </span>
          }
        />
      )}

      {/* Cards de estatísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total"
              value={total}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1677ff', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Ativas"
              value={ativas}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Estados cobertos"
              value={estados}
              prefix={<GlobalOutlined />}
              valueStyle={{ fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Licenças em alerta"
              value={comAlerta.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: comAlerta.length > 0 ? '#fa8c16' : '#52c41a', fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabela de licenças próximas */}
      {proximasLicencas.length > 0 && (
        <Card title="Licenças a vencer / vencidas" size="small">
          <Space direction="vertical" style={{ width: '100%' }} size={6}>
            {proximasLicencas.map((l, i) => {
              const dias = l.vencimento ? diasParaVencer(l.vencimento) : null;
              const isVencida = l.status === 'vencida';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: isVencida ? '#fff1f0' : '#fffbe6',
                    borderRadius: 8,
                    border: `1px solid ${isVencida ? '#ffa39e' : '#ffe58f'}`,
                  }}
                >
                  <Tag color={isVencida ? 'red' : 'orange'} style={{ minWidth: 70, textAlign: 'center' }}>
                    {isVencida ? 'Vencida' : `${dias}d`}
                  </Tag>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 13 }}>{l.transportadora}</Text>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{l.tipo}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatarData(l.vencimento)}
                  </Text>
                </div>
              );
            })}
          </Space>
        </Card>
      )}

      {comAlerta.length === 0 && transportadoras.length > 0 && (
        <Alert
          type="success"
          showIcon
          message="Todas as licenças estão em dia."
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
}
