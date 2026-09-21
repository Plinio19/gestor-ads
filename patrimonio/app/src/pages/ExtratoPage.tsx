import { useEffect, useState } from 'react';
import { Typography, Select, Empty, Tag } from 'antd';
import { useMovimentacoesStore } from '../stores/useMovimentacoesStore';
import { fmtBRL, fmtDate } from '../utils';

const { Text } = Typography;

const TIPO_CONFIG: Record<string, { icon: string; bg: string; color: string; label: string }> = {
  recebimento:  { icon: '↓', bg: '#EAF3EE', color: '#2D6A4F', label: 'Recebimento' },
  aporte:       { icon: '↓', bg: '#EAF3EE', color: '#2D6A4F', label: 'Aporte' },
  transferencia:{ icon: '↔', bg: '#EEF0FF', color: '#4361BF', label: 'Transferência' },
  resgate:      { icon: '↑', bg: '#FFF0F0', color: '#CF4444', label: 'Resgate' },
};

export default function ExtratoPage() {
  const { movimentacoes, loading, fetch } = useMovimentacoesStore();
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => { fetch(); }, []);

  const filtradas = filtroTipo === 'todos'
    ? [...movimentacoes].reverse()
    : [...movimentacoes].reverse().filter(m => m.tipo === filtroTipo);

  const totalFiltradas = filtradas.reduce((s, m) => s + m.valor, 0);

  return (
    <div style={{ padding: '32px 28px 72px', maxWidth: 860, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text style={{ fontSize: 11.5, fontWeight: 500, color: '#999', letterSpacing: '.07em', textTransform: 'uppercase' }}>Extrato</Text>
          <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 26, color: '#1a1a1a', marginTop: 2 }}>
            Movimentações
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={filtroTipo}
            onChange={setFiltroTipo}
            style={{ width: 170 }}
            options={[
              { value: 'todos', label: 'Todos os tipos' },
              { value: 'recebimento', label: 'Recebimentos' },
              { value: 'transferencia', label: 'Transferências' },
              { value: 'aporte', label: 'Aportes' },
              { value: 'resgate', label: 'Resgates' },
            ]}
          />
        </div>
      </div>

      {/* ── Summary ── */}
      {filtradas.length > 0 && (
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #ede9e2' }}>
          <div>
            <Text style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>Registros</Text>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, fontWeight: 700 }}>{filtradas.length}</div>
          </div>
          <div style={{ width: 1, background: '#ede9e2' }} />
          <div>
            <Text style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em' }}>Volume Total</Text>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, fontWeight: 700, color: '#2D6A4F' }}>{fmtBRL(totalFiltradas)}</div>
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#ccc', paddingTop: 60 }}>Carregando...</div>
      ) : filtradas.length === 0 ? (
        <Empty description="Nenhuma movimentação registrada" style={{ paddingTop: 60 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtradas.map((m, i) => {
            const t = TIPO_CONFIG[m.tipo] || { icon: '·', bg: '#f5f5f5', color: '#888', label: m.tipo };
            const prevDate = i > 0 ? filtradas[i - 1].data.slice(0, 7) : null;
            const currDate = m.data.slice(0, 7);
            const showSeparator = prevDate !== currDate;
            return (
              <div key={m.id}>
                {showSeparator && (
                  <div style={{ padding: '10px 4px 6px', fontSize: 11, fontWeight: 600, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {m.data.slice(0, 7).split('-').reverse().join('/')}
                  </div>
                )}
                <div style={{
                  background: '#fff', border: '1px solid #ede9e2', borderRadius: 10,
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: t.color,
                  }}>
                    {t.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.descricao}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                      {fmtDate(m.data)}
                      <Tag style={{ fontSize: 10, padding: '0 5px', lineHeight: '16px', margin: 0, background: t.bg, color: t.color, border: 'none' }}>
                        {t.label}
                      </Tag>
                      {m.tipo === 'transferencia' && m.origemCat && m.destinoCat && (
                        <span style={{ color: '#ccc' }}>
                          {m.origemCat} / {m.origemAtivo} → {m.destinoCat} / {m.destinoAtivo}
                        </span>
                      )}
                    </div>
                  </div>
                  <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>
                    {fmtBRL(m.valor)}
                  </Text>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
