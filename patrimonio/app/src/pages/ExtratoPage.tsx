import { useEffect, useState } from 'react';
import {
  Typography, Select, Empty, Tag, Button, Modal, Form, Input, Row, Col, message, Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { Asset, Categoria, Movimentacao } from '../types';
import { useCategoriasStore } from '../stores/useCategoriasStore';
import { useCaixaStore } from '../stores/useCaixaStore';
import { useMovimentacoesStore } from '../stores/useMovimentacoesStore';
import { fmtBRL, fmtDate, hoje, parseVal, uid } from '../utils';

const { Text } = Typography;

const TIPO_CONFIG: Record<string, { icon: string; bg: string; color: string; label: string }> = {
  recebimento:  { icon: '↓', bg: '#EAF3EE', color: '#2D6A4F', label: 'Recebimento' },
  aporte:       { icon: '↓', bg: '#EAF3EE', color: '#2D6A4F', label: 'Aporte' },
  transferencia:{ icon: '↔', bg: '#EEF0FF', color: '#4361BF', label: 'Transferência' },
  resgate:      { icon: '↑', bg: '#FFF0F0', color: '#CF4444', label: 'Resgate' },
};

function mesAtual() { return new Date().toISOString().slice(0, 7); }
function mesAnterior(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 7);
}
function fmtMes(yyyymm: string) {
  const [y, m] = yyyymm.split('-');
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${nomes[parseInt(m) - 1]}/${y}`;
}

export default function ExtratoPage() {
  const { categorias, fetch: fetchCats, save: saveCats } = useCategoriasStore();
  const { add: addCaixa, fetch: fetchCaixa } = useCaixaStore();
  const { movimentacoes, loading, fetch, add: addMov, remove: removeMov } = useMovimentacoesStore();

  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [periodoInicio, setPeriodoInicio] = useState(mesAnterior(2));
  const [periodoFim, setPeriodoFim] = useState(mesAtual());
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoLanc, setTipoLanc] = useState<'resgate' | 'aporte'>('resgate');
  const [ativoOpts, setAtivoOpts] = useState<{ value: string; label: string }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { fetch(); fetchCats(); fetchCaixa(); }, []);

  /* ── filtros ── */
  const filtradas = [...movimentacoes]
    .filter(m => {
      const mes = m.data.slice(0, 7);
      return mes >= periodoInicio && mes <= periodoFim;
    })
    .filter(m => filtroTipo === 'todos' || m.tipo === filtroTipo)
    .sort((a, b) => b.data.localeCompare(a.data));

  const totalFiltradas = filtradas.reduce((s, m) => s + m.valor, 0);

  /* ── abrir modal lançamento ── */
  function abrirModal(tipo: 'resgate' | 'aporte') {
    setTipoLanc(tipo);
    form.resetFields();
    form.setFieldsValue({ data: hoje(), catId: categorias[0]?.id, ativoId: categorias[0]?.assets[0]?.id });
    atualizarAtivoOpts(categorias[0]?.id ?? '', tipo);
    setModalOpen(true);
  }

  function atualizarAtivoOpts(catId: string, tipo?: 'resgate' | 'aporte') {
    const t = tipo ?? tipoLanc;
    const cat = categorias.find(c => c.id === catId);
    const opts = (cat?.assets ?? []).map((a: Asset) => ({
      value: a.id,
      label: `${a.name}${t === 'resgate' ? ` — ${fmtBRL(a.value)}` : ''}`,
    }));
    setAtivoOpts(opts);
    form.setFieldValue('ativoId', cat?.assets[0]?.id ?? undefined);
  }

  /* ── salvar lançamento ── */
  async function salvar() {
    const values = await form.validateFields();
    const val = parseVal(values.valor || '0');
    if (val <= 0) { message.error('Informe um valor válido.'); return; }
    const cat = categorias.find(c => c.id === values.catId) as Categoria | undefined;
    const ativo = cat?.assets.find(a => a.id === values.ativoId) as Asset | undefined;
    if (!cat || !ativo) { message.error('Ativo não encontrado.'); return; }
    if (tipoLanc === 'resgate' && ativo.value < val) {
      message.error(`Saldo insuficiente. ${ativo.name} tem ${fmtBRL(ativo.value)}.`);
      return;
    }
    setSalvando(true);
    try {
      const descricao = values.descricao?.trim()
        || (tipoLanc === 'resgate' ? `Resgate — ${ativo.name}` : `Aporte — ${ativo.name}`);
      const novoValor = tipoLanc === 'resgate' ? ativo.value - val : ativo.value + val;
      const nextCats = categorias.map(c => c.id === cat.id
        ? { ...c, assets: c.assets.map(a => a.id === ativo.id ? { ...a, value: novoValor } : a) }
        : c);
      await saveCats(nextCats, descricao);
      if (tipoLanc === 'resgate') {
        await addCaixa({ id: uid(), valor: val, origem: descricao, data: values.data });
      }
      await addMov({ id: uid(), data: values.data, descricao, tipo: tipoLanc, origemCat: cat.name, origemAtivo: ativo.name, valor: val });
      setModalOpen(false);
      message.success(tipoLanc === 'resgate' ? `${fmtBRL(val)} resgatado → Caixa` : `${fmtBRL(val)} aportado em ${ativo.name}`);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  /* ── ativo selecionado ── */
  const catIdWatch: string = Form.useWatch('catId', form) ?? '';
  const ativoIdWatch: string = Form.useWatch('ativoId', form) ?? '';
  const ativoSelecionado = categorias.find(c => c.id === catIdWatch)?.assets.find(a => a.id === ativoIdWatch);

  /* ── excluir lançamento ── */
  async function excluir(id: string) {
    try {
      await removeMov(id);
      message.success('Lançamento removido.');
    } catch (e) { message.error(String(e)); }
  }

  /* ── exportar PDF ── */
  function exportarPDF() {
    if (filtradas.length === 0) { message.warning('Nenhuma movimentação no período selecionado.'); return; }

    const byMonth: Record<string, Movimentacao[]> = {};
    filtradas.forEach(m => {
      const mes = m.data.slice(0, 7);
      if (!byMonth[mes]) byMonth[mes] = [];
      byMonth[mes].push(m);
    });

    const totalAporte       = filtradas.filter(m => m.tipo === 'aporte').reduce((s, m) => s + m.valor, 0);
    const totalResgate      = filtradas.filter(m => m.tipo === 'resgate').reduce((s, m) => s + m.valor, 0);
    const totalRecebimento  = filtradas.filter(m => m.tipo === 'recebimento').reduce((s, m) => s + m.valor, 0);
    const totalTransferencia = filtradas.filter(m => m.tipo === 'transferencia').reduce((s, m) => s + m.valor, 0);

    const BADGE: Record<string, { bg: string; color: string }> = {
      resgate:       { bg: '#fff1f0', color: '#CF4444' },
      aporte:        { bg: '#f6ffed', color: '#2D6A4F' },
      recebimento:   { bg: '#f6ffed', color: '#2D6A4F' },
      transferencia: { bg: '#eef0ff', color: '#4361BF' },
    };

    const periodoLabel = periodoInicio === periodoFim
      ? fmtMes(periodoInicio)
      : `${fmtMes(periodoInicio)} a ${fmtMes(periodoFim)}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Extrato — ${periodoLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #222; padding: 40px 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #2D6A4F; }
    .header-left h1 { font-size: 22px; font-weight: 800; color: #2D6A4F; letter-spacing: -.01em; }
    .header-left .sub { font-size: 12px; color: #888; margin-top: 4px; }
    .header-right { text-align: right; font-size: 11px; color: #aaa; }

    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 32px; }
    .card { padding: 12px 14px; border-radius: 8px; border: 1px solid #e8e8e8; }
    .card .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #aaa; margin-bottom: 5px; }
    .card .val { font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; }
    .card.green { border-color: #b7eb8f; background: #f6ffed; }
    .card.red   { border-color: #ffa39e; background: #fff1f0; }
    .card.blue  { border-color: #adc6ff; background: #f0f4ff; }

    .month-block { margin-bottom: 28px; }
    .month-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #888; margin-bottom: 8px; padding: 5px 0; border-bottom: 1.5px solid #e8e8e8; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #bbb; padding: 5px 8px; }
    td { padding: 8px 8px; border-bottom: 1px solid #f5f5f5; font-size: 12px; vertical-align: middle; }
    td.valor { font-family: 'Courier New', monospace; font-weight: 700; text-align: right; white-space: nowrap; }
    td.ativo { font-size: 10.5px; color: #aaa; }

    .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; white-space: nowrap; }

    .totals-row { background: #fafafa; }
    .totals-row td { font-weight: 700; padding: 10px 8px; border-top: 2px solid #e8e8e8; }

    .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #ede9e2; font-size: 10.5px; color: #bbb; display: flex; justify-content: space-between; }

    @media print {
      body { padding: 24px 32px; }
      @page { margin: 16mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>🌿 Extrato de Movimentações</h1>
      <div class="sub">Período: ${periodoLabel}${filtroTipo !== 'todos' ? ` · Tipo: ${TIPO_CONFIG[filtroTipo]?.label}` : ''}</div>
    </div>
    <div class="header-right">
      Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
      ${filtradas.length} registro${filtradas.length !== 1 ? 's' : ''}
    </div>
  </div>

  <div class="summary">
    <div class="card green">
      <div class="lbl">Aportes</div>
      <div class="val" style="color:#2D6A4F">${fmtBRL(totalAporte)}</div>
    </div>
    <div class="card red">
      <div class="lbl">Resgates</div>
      <div class="val" style="color:#CF4444">${fmtBRL(totalResgate)}</div>
    </div>
    <div class="card green">
      <div class="lbl">Recebimentos</div>
      <div class="val" style="color:#2D6A4F">${fmtBRL(totalRecebimento)}</div>
    </div>
    <div class="card blue">
      <div class="lbl">Transferências</div>
      <div class="val" style="color:#4361BF">${fmtBRL(totalTransferencia)}</div>
    </div>
  </div>

  ${Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map(mes => `
    <div class="month-block">
      <div class="month-title">${fmtMes(mes)}</div>
      <table>
        <thead>
          <tr>
            <th style="width:72px">Data</th>
            <th style="width:110px">Tipo</th>
            <th>Descrição</th>
            <th style="width:160px">Categoria / Ativo</th>
            <th style="width:120px;text-align:right">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${byMonth[mes].map(m => {
            const t = TIPO_CONFIG[m.tipo] || { label: m.tipo };
            const bc = BADGE[m.tipo] || { bg: '#f5f5f5', color: '#888' };
            const cor = m.tipo === 'resgate' ? '#CF4444' : m.tipo === 'aporte' || m.tipo === 'recebimento' ? '#2D6A4F' : m.tipo === 'transferencia' ? '#4361BF' : '#333';
            return `
              <tr>
                <td>${fmtDate(m.data)}</td>
                <td><span class="badge" style="background:${bc.bg};color:${bc.color}">${t.label}</span></td>
                <td>${m.descricao}</td>
                <td class="ativo">${m.origemCat || ''}${m.origemAtivo ? ` / ${m.origemAtivo}` : ''}${m.destinoCat ? ` → ${m.destinoCat}${m.destinoAtivo ? ` / ${m.destinoAtivo}` : ''}` : ''}</td>
                <td class="valor" style="color:${cor}">${fmtBRL(m.valor)}</td>
              </tr>
            `;
          }).join('')}
          <tr class="totals-row">
            <td colspan="4" style="text-align:right;font-size:11px;color:#aaa">Total do mês</td>
            <td class="valor">${fmtBRL(byMonth[mes].reduce((s, m) => s + m.valor, 0))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `).join('')}

  <div class="footer">
    <span>Patrimônio — Extrato gerado automaticamente</span>
    <span>Total geral: ${fmtBRL(totalFiltradas)}</span>
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=960,height=750');
    if (win) { win.document.write(html); win.document.close(); }
    else { message.error('Permita pop-ups para exportar o PDF.'); }
  }

  return (
    <div style={{ padding: '32px 28px 72px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text style={{ fontSize: 11.5, fontWeight: 500, color: '#999', letterSpacing: '.07em', textTransform: 'uppercase' }}>Extrato</Text>
          <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 26, color: '#1a1a1a', marginTop: 2 }}>
            Movimentações
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            icon={<PlusOutlined />}
            style={{ background: '#CF4444', borderColor: '#CF4444', color: '#fff' }}
            onClick={() => abrirModal('resgate')}
          >
            Resgate
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirModal('aporte')}>
            Aporte
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={exportarPDF}>
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', padding: '14px 16px', background: '#fff', borderRadius: 10, border: '1px solid #ede9e2' }}>
        <Text style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>Período:</Text>
        <input
          type="month"
          value={periodoInicio}
          onChange={e => setPeriodoInicio(e.target.value)}
          style={{ border: '1px solid #e0ddd6', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', background: '#fafaf8', outline: 'none' }}
        />
        <Text style={{ fontSize: 12, color: '#bbb' }}>até</Text>
        <input
          type="month"
          value={periodoFim}
          onChange={e => setPeriodoFim(e.target.value)}
          style={{ border: '1px solid #e0ddd6', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', background: '#fafaf8', outline: 'none' }}
        />
        <div style={{ width: 1, height: 20, background: '#e8e8e8', margin: '0 4px' }} />
        <Select
          value={filtroTipo}
          onChange={setFiltroTipo}
          style={{ width: 160 }}
          size="small"
          options={[
            { value: 'todos',        label: 'Todos os tipos' },
            { value: 'resgate',      label: 'Resgates' },
            { value: 'aporte',       label: 'Aportes' },
            { value: 'recebimento',  label: 'Recebimentos' },
            { value: 'transferencia',label: 'Transferências' },
          ]}
        />
      </div>

      {/* ── Summary ── */}
      {filtradas.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Aportes',         val: filtradas.filter(m => m.tipo === 'aporte').reduce((s, m) => s + m.valor, 0),       color: '#2D6A4F' },
            { label: 'Resgates',        val: filtradas.filter(m => m.tipo === 'resgate').reduce((s, m) => s + m.valor, 0),      color: '#CF4444' },
            { label: 'Recebimentos',    val: filtradas.filter(m => m.tipo === 'recebimento').reduce((s, m) => s + m.valor, 0),  color: '#2D6A4F' },
            { label: 'Transferências',  val: filtradas.filter(m => m.tipo === 'transferencia').reduce((s, m) => s + m.valor, 0),color: '#4361BF' },
          ].filter(x => x.val > 0).map(x => (
            <div key={x.label} style={{ padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid #ede9e2', minWidth: 120 }}>
              <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{x.label}</div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 700, color: x.color }}>{fmtBRL(x.val)}</div>
            </div>
          ))}
          <div style={{ padding: '10px 14px', background: '#fafaf8', borderRadius: 8, border: '1px solid #ede9e2', minWidth: 120 }}>
            <div style={{ fontSize: 10.5, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Registros</div>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 700 }}>{filtradas.length}</div>
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#ccc', paddingTop: 60 }}>Carregando...</div>
      ) : filtradas.length === 0 ? (
        <Empty description="Nenhuma movimentação no período" style={{ paddingTop: 60 }} />
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
                    {fmtMes(currDate)}
                  </div>
                )}
                <div style={{ background: '#fff', border: '1px solid #ede9e2', borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: t.color }}>
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
                      {(m.origemCat || m.origemAtivo) && (
                        <span style={{ color: '#ccc' }}>
                          {m.origemCat}{m.origemAtivo ? ` / ${m.origemAtivo}` : ''}
                          {m.destinoCat ? ` → ${m.destinoCat}${m.destinoAtivo ? ` / ${m.destinoAtivo}` : ''}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>
                    {fmtBRL(m.valor)}
                  </Text>
                  <Popconfirm
                    title="Remover lançamento?"
                    description="O saldo do ativo não será revertido automaticamente."
                    onConfirm={() => excluir(m.id)}
                    okText="Remover"
                    cancelText="Cancelar"
                    okType="danger"
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ opacity: .4, flexShrink: 0 }} className="del-btn" />
                  </Popconfirm>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: Novo Lançamento ── */}
      <Modal
        title={
          tipoLanc === 'resgate'
            ? <span style={{ color: '#CF4444' }}>↑ Resgate — retirada de ativo</span>
            : <span style={{ color: '#2D6A4F' }}>↓ Aporte — aplicação em ativo</span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={salvar}
        okText={tipoLanc === 'resgate' ? 'Registrar Resgate' : 'Registrar Aporte'}
        okButtonProps={{ style: tipoLanc === 'resgate' ? { background: '#CF4444', borderColor: '#CF4444' } : {} }}
        cancelText="Cancelar"
        confirmLoading={salvando}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="catId" label="Categoria" rules={[{ required: true }]}>
                <Select
                  options={categorias.map(c => ({ value: c.id, label: c.name }))}
                  onChange={id => atualizarAtivoOpts(id)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ativoId" label="Ativo" rules={[{ required: true }]}>
                <Select options={ativoOpts} />
              </Form.Item>
            </Col>
          </Row>
          {ativoSelecionado && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: tipoLanc === 'resgate' ? '#FFF0F0' : '#EAF3EE', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#888' }}>Saldo atual de <strong>{ativoSelecionado.name}</strong></Text>
              <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 15, fontWeight: 700, color: tipoLanc === 'resgate' ? '#CF4444' : '#2D6A4F' }}>
                {fmtBRL(ativoSelecionado.value)}
              </Text>
            </div>
          )}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="valor" label="Valor (R$)" rules={[{ required: true, message: 'Obrigatório' }]}>
                <Input placeholder="0,00" style={{ fontFamily: '"DM Mono", monospace' }} autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="descricao" label="Descrição (opcional)">
            <Input placeholder={tipoLanc === 'resgate' ? `Resgate — ${ativoSelecionado?.name || ''}` : `Aporte — ${ativoSelecionado?.name || ''}`} />
          </Form.Item>
          <div style={{ padding: '10px 14px', background: '#f9f9f7', borderRadius: 8, border: '1px solid #ede9e2' }}>
            <Text style={{ fontSize: 12, color: '#aaa' }}>
              {tipoLanc === 'resgate'
                ? 'O valor será deduzido do ativo e enviado ao Caixa Disponível.'
                : 'O valor será adicionado ao ativo. Use a Agenda para alocar dinheiro do Caixa.'}
            </Text>
          </div>
        </Form>
      </Modal>

      <style>{`.del-btn { opacity: .25 !important; } .del-btn:hover { opacity: 1 !important; }`}</style>
    </div>
  );
}
