import { useEffect, useState, useRef } from 'react';
import {
  Row, Col, Typography, Button, Modal, Form, Input, Select, Spin,
  message, Popconfirm, Tooltip, Tag, Divider,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, CheckOutlined, CalendarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { Categoria, Asset } from '../types';
import { useCategoriasStore, uid, COLORS } from '../stores/useCategoriasStore';
import { useCaixaStore } from '../stores/useCaixaStore';
import { useRecebimentosStore } from '../stores/useRecebimentosStore';
import { fmtBRL, fmtPct, fmtDate, hoje, parseVal } from '../utils';

const { Text } = Typography;

/* ── Inline editable value ── */
function EditableValue({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function start() {
    setDraft(value.toFixed(2).replace('.', ','));
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 20);
  }

  function commit() {
    setEditing(false);
    const v = parseVal(draft);
    if (v !== value) onChange(v);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: 12,
          fontWeight: 500,
          background: '#fff',
          border: '1px solid #2D6A4F',
          borderRadius: 4,
          padding: '2px 6px',
          outline: 'none',
          width: 110,
          textAlign: 'right',
        }}
      />
    );
  }

  return (
    <span
      onClick={start}
      style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        padding: '2px 5px',
        borderRadius: 4,
        whiteSpace: 'nowrap',
        transition: 'background .1s',
      }}
      title="Clique para editar"
    >
      {fmtBRL(value)}
    </span>
  );
}

/* ── Inline editable name ── */
function EditableName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function start() {
    setDraft(value);
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 20);
  }

  function commit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onChange(draft.trim());
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{
          fontFamily: 'inherit',
          fontSize: 12.5,
          background: '#fff',
          border: '1px solid #2D6A4F',
          borderRadius: 3,
          padding: '1px 5px',
          outline: 'none',
          flex: 1,
          minWidth: 0,
          width: '100%',
        }}
      />
    );
  }

  return (
    <span
      onClick={start}
      style={{ flex: 1, fontSize: 12.5, cursor: 'text', padding: '1px 3px', borderRadius: 3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      title="Clique para editar"
    >
      {value}
    </span>
  );
}

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const { categorias, loading: lc, loaded, fetch, save: saveCats } = useCategoriasStore();
  const { caixa, loading: lx, fetch: fetchCaixa, add: addCaixa, remove: removeCaixa, update: updateCaixa } = useCaixaStore();
  const { recebimentos, loading: lr, fetch: fetchRecv, add: addRecv, remove: removeRecv, marcarRecebido } = useRecebimentosStore();

  const [recvOpen, setRecvOpen] = useState(true);
  const [modalRecv, setModalRecv] = useState(false);
  const [modalAlocar, setModalAlocar] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedCaixaId, setSelectedCaixaId] = useState<string>('');
  const [selectedRecvId, setSelectedRecvId] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [formRecv] = Form.useForm();
  const [formAlocar] = Form.useForm();
  const [formConfirmar] = Form.useForm();

  useEffect(() => { fetch(); fetchCaixa(); fetchRecv(); }, []);

  const [ativoOptions, setAtivoOptions] = useState<{ value: string; label: string }[]>([]);
  const [ativoIdWatch, setAtivoIdWatch] = useState<string>('');

  if (!loaded || lc || lx || lr) {
    return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  }

  /* ── totals ── */
  function catTotal(cat: Categoria) { return cat.assets.reduce((s, a) => s + (a.value || 0), 0); }
  const caixaTotal = caixa.reduce((s, c) => s + (c.valor || 0), 0);
  const gt = categorias.reduce((s, c) => s + catTotal(c), 0) + caixaTotal;
  const totalAssets = categorias.reduce((s, c) => s + c.assets.length, 0);
  const pendentes = recebimentos.filter(r => !r.recebido);

  /* ── categorias mutations ── */
  async function updateAssetName(catId: string, assetId: string, name: string) {
    const next = categorias.map(c => c.id === catId
      ? { ...c, assets: c.assets.map(a => a.id === assetId ? { ...a, name } : a) }
      : c);
    await saveCats(next, `Renomear ativo`);
  }

  async function updateAssetValue(catId: string, assetId: string, value: number) {
    const next = categorias.map(c => c.id === catId
      ? { ...c, assets: c.assets.map(a => a.id === assetId ? { ...a, value } : a) }
      : c);
    await saveCats(next, `Atualizar valor`);
  }

  async function deleteAsset(catId: string, assetId: string) {
    const next = categorias.map(c => c.id === catId
      ? { ...c, assets: c.assets.filter(a => a.id !== assetId) }
      : c);
    await saveCats(next, `Remover ativo`);
  }

  async function addAsset(catId: string) {
    const a: Asset = { id: uid(), name: 'Novo ativo', value: 0 };
    const next = categorias.map(c => c.id === catId ? { ...c, assets: [...c.assets, a] } : c);
    await saveCats(next, `Adicionar ativo`);
  }

  async function addCategoria() {
    const used = categorias.map(c => c.color);
    const color = COLORS.find(c => !used.includes(c)) || COLORS[categorias.length % COLORS.length];
    const nova: Categoria = { id: uid(), name: 'Nova Categoria', color, assets: [{ id: uid(), name: 'Novo ativo', value: 0 }] };
    await saveCats([...categorias, nova], 'Nova categoria');
  }

  /* ── Recebimento ── */
  function openNovoRecv(catId: string) {
    setSelectedCatId(catId);
    formRecv.resetFields();
    formRecv.setFieldsValue({ vencimento: hoje() });
    setModalRecv(true);
  }

  async function salvarRecv() {
    const values = await formRecv.validateFields();
    setSalvando(true);
    try {
      await addRecv({
        id: uid(),
        catId: selectedCatId,
        descricao: values.descricao,
        valor: parseVal(values.valor || '0'),
        vencimento: values.vencimento,
        recebido: false,
        dataRecebimento: null,
      });
      setModalRecv(false);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  /* ── Confirmar Recebimento ── */
  function openConfirmar(recvId: string) {
    const r = recebimentos.find(x => x.id === recvId);
    if (!r) return;
    setSelectedRecvId(recvId);
    formConfirmar.setFieldsValue({
      valor: r.valor.toFixed(2).replace('.', ','),
      data: hoje(),
    });
    setModalConfirmar(true);
  }

  async function confirmarRecv() {
    const values = await formConfirmar.validateFields();
    setSalvando(true);
    try {
      const r = await marcarRecebido(selectedRecvId, values.data);
      if (r) {
        await addCaixa({
          id: uid(),
          valor: parseVal(values.valor || '0'),
          origem: r.descricao,
          data: values.data,
        });
      }
      setModalConfirmar(false);
      message.success('Valor enviado para o Caixa!');
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  /* ── Alocar do Caixa ── */
  function openAlocar(caixaId: string) {
    const c = caixa.find(x => x.id === caixaId);
    if (!c) return;
    setSelectedCaixaId(caixaId);
    formAlocar.resetFields();
    formAlocar.setFieldsValue({
      valor: c.valor.toFixed(2).replace('.', ','),
      catId: categorias[0]?.id,
      ativoId: categorias[0]?.assets[0]?.id,
    });
    setModalAlocar(true);
  }

  async function confirmarAlocar() {
    const values = await formAlocar.validateFields();
    setSalvando(true);
    try {
      const val = parseVal(values.valor || '0');
      if (val <= 0) { message.error('Valor inválido'); return; }
      const c = caixa.find(x => x.id === selectedCaixaId);
      if (!c) return;
      const cat = categorias.find(x => x.id === values.catId);
      if (!cat) return;

      let nextCats: Categoria[];
      if (values.ativoId === '__novo__') {
        const nome = values.novoNome?.trim() || 'Novo ativo';
        nextCats = categorias.map(cat2 => cat2.id === values.catId
          ? { ...cat2, assets: [...cat2.assets, { id: uid(), name: nome, value: val }] }
          : cat2);
      } else {
        nextCats = categorias.map(cat2 => cat2.id === values.catId
          ? { ...cat2, assets: cat2.assets.map(a => a.id === values.ativoId ? { ...a, value: a.value + val } : a) }
          : cat2);
      }

      await saveCats(nextCats, `Alocar ${fmtBRL(val)} para ${cat.name}`);

      if (val >= c.valor) {
        await removeCaixa(selectedCaixaId);
      } else {
        await updateCaixa({ ...c, valor: c.valor - val });
      }

      setModalAlocar(false);
      message.success(`${fmtBRL(val)} alocado com sucesso!`);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  /* ── Watch ativoId options based on catId ── */
  function updateAtivoOptions(catId: string) {
    const cat = categorias.find(c => c.id === catId);
    const opts = (cat?.assets ?? []).map((a: Asset) => ({ value: a.id, label: `${a.name} — ${fmtBRL(a.value)}` }));
    opts.push({ value: '__novo__', label: '+ Criar novo ativo' });
    setAtivoOptions(opts);
    const defaultAtivo = cat?.assets[0]?.id ?? '__novo__';
    formAlocar.setFieldValue('ativoId', defaultAtivo);
    formAlocar.setFieldValue('novoNome', undefined);
    setAtivoIdWatch(defaultAtivo);
  }

  const selectedCaixaItem = caixa.find(x => x.id === selectedCaixaId);

  return (
    <div style={{ padding: '28px 20px 72px', maxWidth: 900, margin: '0 auto' }}>

      {/* HERO */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 4 }}>Patrimônio Total</div>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 'clamp(34px, 6.5vw, 52px)',
          lineHeight: 1.05,
          letterSpacing: '-.01em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtBRL(gt)}
        </div>
        <div style={{ marginTop: 6, fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#aaa' }}>
          {categorias.length} categorias · {totalAssets} ativos
          {caixaTotal > 0 && ` · 💵 ${fmtBRL(caixaTotal)} em caixa`}
          {pendentes.length > 0 && ` · 📅 ${pendentes.length} recebimento${pendentes.length > 1 ? 's' : ''} pendente${pendentes.length > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* ALLOCATION BAR */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 12 }}>
          {categorias.map(cat => {
            const pct = gt > 0 ? catTotal(cat) / gt * 100 : 0;
            return <div key={cat.id} style={{ background: cat.color, width: `${pct}%`, minWidth: pct > 0 ? 4 : 0, borderRadius: 2 }} />;
          })}
          {caixaTotal > 0 && <div style={{ background: '#2D6A4F', width: `${gt > 0 ? caixaTotal / gt * 100 : 0}%`, minWidth: 4, opacity: .35, borderRadius: 2 }} />}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
          {categorias.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#666' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
              <span>{cat.name}</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#aaa' }}>
                {fmtPct(gt > 0 ? catTotal(cat) / gt * 100 : 0)}
              </span>
            </div>
          ))}
          {caixaTotal > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#666' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2D6A4F', opacity: .5, flexShrink: 0 }} />
              <span>Caixa</span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#aaa' }}>
                {fmtPct(gt > 0 ? caixaTotal / gt * 100 : 0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CAIXA */}
      {caixa.length > 0 && (
        <div style={{
          background: '#EAF3EE',
          border: '1.5px solid #2D6A4F',
          borderRadius: 10,
          marginBottom: 20,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #d4e8dc' }}>
            <Text strong style={{ color: '#2D6A4F', fontSize: 13 }}>💵 Caixa Disponível</Text>
            <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 500, color: '#2D6A4F' }}>
              {fmtBRL(caixaTotal)}
            </Text>
          </div>
          {caixa.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12, borderBottom: '1px solid #d4e8dc' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5 }}>{c.origem}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{fmtDate(c.data)}</div>
              </div>
              <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 12.5, fontWeight: 500, color: '#2D6A4F', whiteSpace: 'nowrap' }}>
                {fmtBRL(c.valor)}
              </Text>
              <Button
                type="primary"
                size="small"
                icon={<ArrowRightOutlined />}
                style={{ background: '#2D6A4F', borderColor: '#2D6A4F', fontSize: 12 }}
                onClick={() => { openAlocar(c.id); updateAtivoOptions(categorias[0]?.id ?? ''); }}
              >
                Alocar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* CATEGORIAS GRID */}
      <Row gutter={[10, 10]}>
        {categorias.map(cat => {
          const ct = catTotal(cat);
          const pct = gt > 0 ? ct / gt * 100 : 0;
          return (
            <Col key={cat.id} xs={24} sm={12} lg={8}>
              <div style={{
                background: '#F7F5F0',
                border: '1px solid #e0ddd6',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,.05)',
              }}>
                {/* Card head */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 10px', borderBottom: '1px solid #e0ddd6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                    <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</Text>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtBRL(ct)}</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#aaa' }}>{fmtPct(pct)}</div>
                  </div>
                </div>

                {/* Assets */}
                <div>
                  {cat.assets.map(asset => (
                    <div
                      key={asset.id}
                      style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', gap: 8, minHeight: 34 }}
                      className="asset-row"
                    >
                      <EditableName
                        value={asset.name}
                        onChange={name => updateAssetName(cat.id, asset.id, name)}
                      />
                      <EditableValue
                        value={asset.value}
                        onChange={val => updateAssetValue(cat.id, asset.id, val)}
                      />
                      <Popconfirm title="Remover?" onConfirm={() => deleteAsset(cat.id, asset.id)} okText="Sim" cancelText="Não" okType="danger">
                        <Tooltip title="Remover ativo">
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ opacity: 0.4, padding: '0 4px' }} className="del-asset-btn" />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', borderTop: '1px solid #e0ddd6', marginTop: 1 }}>
                  <button
                    onClick={() => addAsset(cat.id)}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '8px 6px 9px', fontSize: 11.5, color: '#aaa', cursor: 'pointer', borderRight: '1px solid #e0ddd6', fontFamily: 'inherit' }}
                  >
                    <PlusOutlined /> Ativo
                  </button>
                  <button
                    onClick={() => openNovoRecv(cat.id)}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '8px 6px 9px', fontSize: 11.5, color: '#aaa', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <CalendarOutlined /> Recebimento
                  </button>
                </div>
              </div>
            </Col>
          );
        })}

        {/* Add category */}
        <Col xs={24} sm={12} lg={8}>
          <button
            onClick={addCategoria}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 80,
              border: '1px dashed #d0ccc5',
              borderRadius: 10,
              background: 'none',
              color: '#bbb',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <PlusOutlined /> Nova categoria
          </button>
        </Col>
      </Row>

      {/* RECEBIMENTOS */}
      {recebimentos.length > 0 && (
        <div style={{ marginTop: 28, borderTop: '1px solid #e8e8e8', paddingTop: 20 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, cursor: 'pointer' }}
            onClick={() => setRecvOpen(o => !o)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#888' }}>
                📅 Recebimentos
              </Text>
              <Tag style={{ fontSize: 10, fontFamily: '"DM Mono", monospace' }}>{recebimentos.length}</Tag>
              {pendentes.length > 0 && (
                <span style={{ fontSize: 10.5, color: '#E9A23B', fontWeight: 500 }}>
                  {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Text style={{ fontSize: 11, color: '#bbb' }}>{recvOpen ? '▲ recolher' : '▼ expandir'}</Text>
          </div>

          {recvOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[...recebimentos.filter(r => !r.recebido), ...recebimentos.filter(r => r.recebido)].map(r => {
                const cat = categorias.find(c => c.id === r.catId);
                return (
                  <div
                    key={r.id}
                    style={{
                      background: '#F7F5F0',
                      border: '1px solid #e0ddd6',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      opacity: r.recebido ? .55 : 1,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.recebido ? '#2D6A4F' : (cat?.color || '#E9A23B'), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descricao}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                        {cat?.name || '—'} ·{' '}
                        {r.recebido
                          ? <span style={{ color: '#2D6A4F' }}>✓ recebido em {fmtDate(r.dataRecebimento)}</span>
                          : <span style={{ color: '#E9A23B' }}>vence {fmtDate(r.vencimento)}</span>
                        }
                      </div>
                    </div>
                    <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {fmtBRL(r.valor)}
                    </Text>
                    {r.recebido ? (
                      <Popconfirm title="Remover?" onConfirm={() => removeRecv(r.id)} okText="Sim" cancelText="Não" okType="danger">
                        <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ) : (
                      <Button
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => openConfirmar(r.id)}
                        style={{ fontSize: 11 }}
                      >
                        Recebido
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Novo Recebimento */}
      <Modal
        title="📅 Programar Recebimento"
        open={modalRecv}
        onCancel={() => setModalRecv(false)}
        onOk={salvarRecv}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={salvando}
        destroyOnHidden
      >
        <Form form={formRecv} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="descricao" label="Descrição" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Ex: Retorno Halogenn — Setembro" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="valor" label="Valor Esperado (R$)">
                <Input placeholder="0,00" style={{ fontFamily: '"DM Mono", monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vencimento" label="Data Prevista">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* MODAL: Confirmar Recebimento */}
      <Modal
        title="✓ Confirmar Recebimento"
        open={modalConfirmar}
        onCancel={() => setModalConfirmar(false)}
        onOk={confirmarRecv}
        okText="→ Enviar para Caixa"
        cancelText="Cancelar"
        confirmLoading={salvando}
        destroyOnHidden
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          {recebimentos.find(r => r.id === selectedRecvId)?.descricao}
        </Text>
        <Form form={formConfirmar} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="valor" label="Valor Recebido (R$)" rules={[{ required: true }]}>
                <Input style={{ fontFamily: '"DM Mono", monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>O valor vai para o Caixa Disponível e você decide onde alocar.</Text>
      </Modal>

      {/* MODAL: Alocar do Caixa */}
      <Modal
        title="Alocar para o Patrimônio"
        open={modalAlocar}
        onCancel={() => setModalAlocar(false)}
        onOk={confirmarAlocar}
        okText="Alocar"
        cancelText="Cancelar"
        confirmLoading={salvando}
        destroyOnHidden
      >
        {selectedCaixaItem && (
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13 }}>{selectedCaixaItem.origem}</Text>
            <br />
            <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 15, fontWeight: 500, color: '#2D6A4F' }}>
              {fmtBRL(selectedCaixaItem.valor)} disponível
            </Text>
          </div>
        )}
        <Divider style={{ margin: '0 0 16px' }} />
        <Form form={formAlocar} layout="vertical">
          <Form.Item name="valor" label="Valor a Alocar (R$)" rules={[{ required: true }]}>
            <Input style={{ fontFamily: '"DM Mono", monospace' }} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="catId" label="Categoria Destino" rules={[{ required: true }]}>
                <Select
                  options={categorias.map(c => ({ value: c.id, label: c.name }))}
                  onChange={id => updateAtivoOptions(id)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ativoId" label="Ativo" rules={[{ required: true }]}>
                <Select options={ativoOptions} onChange={(v) => setAtivoIdWatch(String(v))} />
              </Form.Item>
            </Col>
          </Row>
          {ativoIdWatch === '__novo__' && (
            <Form.Item name="novoNome" label="Nome do Novo Ativo" rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Ex: Tesouro Selic 2027" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <style>{`
        .asset-row:hover .del-asset-btn { opacity: 1 !important; }
        .asset-row { transition: background .1s; }
        .asset-row:hover { background: rgba(0,0,0,.03); }
      `}</style>
    </div>
  );
}
