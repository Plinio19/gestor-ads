import { useEffect } from 'react';
import { Row, Col, Card, Typography, Spin, Tag } from 'antd';
import { WalletOutlined, CalendarOutlined, FundOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Categoria } from '../types';
import { useCategoriasStore } from '../stores/useCategoriasStore';
import { useCaixaStore } from '../stores/useCaixaStore';
import { useRecebimentosStore } from '../stores/useRecebimentosStore';
import { useMovimentacoesStore } from '../stores/useMovimentacoesStore';
import { fmtBRL, fmtPct, fmtDate } from '../utils';

const { Text } = Typography;

function catTotal(cat: Categoria) {
  return cat.assets.reduce((s, a) => s + (a.value || 0), 0);
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: { color: string };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.payload.color }} />
        <span style={{ fontWeight: 500 }}>{d.name}</span>
      </div>
      <div style={{ fontFamily: '"DM Mono", monospace', fontWeight: 600 }}>{fmtBRL(d.value)}</div>
    </div>
  );
}

const TIPO_MAP: Record<string, { icon: string; bg: string; color: string }> = {
  recebimento: { icon: '↓',  bg: '#EAF3EE', color: '#2D6A4F' },
  aporte:      { icon: '↓',  bg: '#EAF3EE', color: '#2D6A4F' },
  transferencia: { icon: '↔', bg: '#F0F4FF', color: '#4361BF' },
  resgate:     { icon: '↑',  bg: '#FFF0F0', color: '#CF4444' },
};

export default function DashboardPage() {
  const { categorias, loading: lc, loaded, fetch } = useCategoriasStore();
  const { caixa, loading: lx, fetch: fetchCaixa } = useCaixaStore();
  const { recebimentos, loading: lr, fetch: fetchRecv } = useRecebimentosStore();
  const { movimentacoes, loading: lm, fetch: fetchMovs } = useMovimentacoesStore();

  useEffect(() => { fetch(); fetchCaixa(); fetchRecv(); fetchMovs(); }, []);

  if (!loaded || lc || lx || lr || lm) {
    return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;
  }

  const caixaTotal = caixa.reduce((s, c) => s + c.valor, 0);
  const gt = categorias.reduce((s, c) => s + catTotal(c), 0) + caixaTotal;
  const totalAReceber = recebimentos.filter(r => !r.recebido).reduce((s, r) => s + r.valor, 0);
  const totalAssets = categorias.reduce((s, c) => s + c.assets.length, 0);
  const pendentes = recebimentos.filter(r => !r.recebido).length;
  const recentMovs = [...movimentacoes].reverse().slice(0, 6);

  const pieData = [
    ...categorias.map(c => ({ name: c.name, value: catTotal(c), color: c.color })),
    ...(caixaTotal > 0 ? [{ name: 'Caixa', value: caixaTotal, color: '#52B788' }] : []),
  ].filter(d => d.value > 0);

  return (
    <div style={{ padding: '32px 28px 72px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Hero ── */}
      <div style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 11.5, fontWeight: 500, color: '#999', letterSpacing: '.07em', textTransform: 'uppercase' }}>
          Patrimônio Total
        </Text>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 'clamp(36px, 6vw, 54px)',
          lineHeight: 1.05,
          letterSpacing: '-.01em',
          fontVariantNumeric: 'tabular-nums',
          margin: '6px 0 8px',
          color: '#1a1a1a',
        }}>
          {fmtBRL(gt)}
        </div>
        <Text style={{ fontSize: 12, color: '#bbb' }}>
          {categorias.length} categori{categorias.length === 1 ? 'a' : 'as'} · {totalAssets} ativo{totalAssets !== 1 ? 's' : ''}
          {pendentes > 0 && ` · ${pendentes} recebimento${pendentes > 1 ? 's' : ''} pendente${pendentes > 1 ? 's' : ''}`}
        </Text>
      </div>

      {/* ── KPI cards ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#EAF3EE', border: '1.5px solid #C5DFD1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text style={{ fontSize: 11.5, color: '#2D6A4F', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Caixa Disponível
                </Text>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, fontWeight: 700, color: '#2D6A4F', marginTop: 4 }}>
                  {fmtBRL(caixaTotal)}
                </div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#2D6A4F22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WalletOutlined style={{ fontSize: 18, color: '#2D6A4F' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#FFF8EC', border: '1.5px solid #F0D89A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text style={{ fontSize: 11.5, color: '#B07D18', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  A Receber
                </Text>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, fontWeight: 700, color: '#B07D18', marginTop: 4 }}>
                  {fmtBRL(totalAReceber)}
                </div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E9A23B22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarOutlined style={{ fontSize: 18, color: '#E9A23B' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#fff', border: '1.5px solid #ede9e2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text style={{ fontSize: 11.5, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Ativos Cadastrados
                </Text>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, fontWeight: 700, color: '#333', marginTop: 4 }}>
                  {totalAssets}
                </div>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FundOutlined style={{ fontSize: 18, color: '#aaa' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Gráfico + Distribuição ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
            title={<Text style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Alocação</Text>}
          >
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 13 }}>
                Nenhum ativo cadastrado
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
            title={<Text style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Distribuição</Text>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ...categorias.map(c => ({ name: c.name, value: catTotal(c), color: c.color })),
                ...(caixaTotal > 0 ? [{ name: 'Caixa', value: caixaTotal, color: '#52B788' }] : []),
              ]
                .sort((a, b) => b.value - a.value)
                .map((item, i) => {
                  const pct = gt > 0 ? item.value / gt * 100 : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                          <Text style={{ fontSize: 12.5 }}>{item.name}</Text>
                        </div>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11.5, color: '#aaa', fontFamily: '"DM Mono", monospace' }}>{fmtPct(pct)}</Text>
                          <Text style={{ fontSize: 12.5, fontFamily: '"DM Mono", monospace', fontWeight: 600, minWidth: 110, textAlign: 'right' }}>
                            {fmtBRL(item.value)}
                          </Text>
                        </div>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: '#f0ede6', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 3, transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Últimas Movimentações ── */}
      {recentMovs.length > 0 && (
        <Card
          bordered={false}
          style={{ borderRadius: 12 }}
          title={<Text style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Últimas Movimentações</Text>}
        >
          <div>
            {recentMovs.map((m, i) => {
              const t = TIPO_MAP[m.tipo] || { icon: '·', bg: '#f5f5f5', color: '#888' };
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '11px 4px',
                    borderBottom: i < recentMovs.length - 1 ? '1px solid #f5f2ec' : 'none',
                    gap: 12,
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: t.color,
                  }}>
                    {t.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.descricao}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                      {fmtDate(m.data)}
                      <Tag style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', margin: 0 }}>{m.tipo}</Tag>
                    </div>
                  </div>
                  <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', color: '#333' }}>
                    {fmtBRL(m.valor)}
                  </Text>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
