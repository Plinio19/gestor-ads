import { useEffect, useState, useRef } from 'react';
import {
  Row, Col, Typography, Button, Modal, Form, Input, Select,
  Popconfirm, Tooltip, Divider, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SwapOutlined, CalendarOutlined,
} from '@ant-design/icons';
import type { Asset, Categoria } from '../types';
import { useCategoriasStore, COLORS } from '../stores/useCategoriasStore';
import { useRecebimentosStore } from '../stores/useRecebimentosStore';
import { fmtBRL, fmtPct, hoje, parseVal, uid } from '../utils';

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
          fontFamily: '"DM Mono", monospace', fontSize: 12, fontWeight: 500,
          background: '#fff', border: '1px solid #2D6A4F', borderRadius: 4,
          padding: '2px 6px', outline: 'none', width: 110, textAlign: 'right',
        }}
      />
    );
  }

  return (
    <span
      onClick={start}
      title="Clique para editar"
      style={{
        fontFamily: '"DM Mono", monospace', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap',
      }}
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
          fontFamily: 'inherit', fontSize: 12.5, background: '#fff',
          border: '1px solid #2D6A4F', borderRadius: 3, padding: '1px 5px',
          outline: 'none', flex: 1, minWidth: 0, width: '100%',
        }}
      />
    );
  }

  return (
    <span
      onClick={start}
      title="Clique para editar"
      style={{ flex: 1, fontSize: 12.5, cursor: 'text', padding: '1px 3px', borderRadius: 3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {value}
    </span>
  );
}

/* ── EditableCategoryName ── */
function EditableCategoryName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function start(e: React.MouseEvent) {
    e.stopPropagation();
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
          fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: 'transparent',
          border: 'none', borderBottom: '1px solid #2D6A4F', padding: '0 2px', outline: 'none', minWidth: 0, flex: 1,
        }}
      />
    );
  }

  return (
    <span
      onClick={start}
      title="Clique para renomear"
      style={{ fontSize: 13, fontWeight: 600, cursor: 'text', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
    >
      {value}
    </span>
  );
}

export default function CarteiraPage() {
  const { categorias, loading: lc, loaded, fetch, save: saveCats } = useCategoriasStore();
  const { add: addRecv, fetch: fetchRecv } = useRecebimentosStore();

  const [salvando, setSalvando] = useState(false);
  const [modalTransferir, setModalTransferir] = useState(false);
  const [modalRecv, setModalRecv] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [origemAtivoOpts, setOrigemAtivoOpts] = useState<{ value: string; label: string }[]>([]);
  const [destinoAtivoOpts, setDestinoAtivoOpts] = useState<{ value: string; label: string }[]>([]);
  const [formTransferir] = Form.useForm();
  const [formRecv] = Form.useForm();

  useEffect(() => { fetch(); fetchRecv(); }, []);

  function catTotal(cat: Categoria) { return cat.assets.reduce((s, a) => s + (a.value || 0), 0); }
  const gt = categorias.reduce((s, c) => s + catTotal(c), 0);

  /* ── Asset mutations ── */
  async function updateAssetName(catId: string, assetId: string, name: string) {
    const next = categorias.map(c => c.id === catId
      ? { ...c, assets: c.assets.map(a => a.id === assetId ? { ...a, name } : a) }
      : c);
    await saveCats(next, 'Renomear ativo');
  }

  async function updateAssetValue(catId: string, assetId: string, value: number) {
    const next = categorias.map(c => c.id === catId
      ? { ...c, assets: c.assets.map(a => a.id === assetId ? { ...a, value } : a) }
      : c);
    await saveCats(next, 'Atualizar valor');
  }

  async function deleteAsset(catId: string, assetId: string) {
    const next = categorias.map(c => c.id === catId
      ? { ...c, assets: c.assets.filter(a => a.id !== assetId) }
      : c);
    await saveCats(next, 'Remover ativo');
  }

  async function addAsset(catId: string) {
    const a: Asset = { id: uid(), name: 'Novo ativo', value: 0 };
    const next = categorias.map(c => c.id === catId ? { ...c, assets: [...c.assets, a] } : c);
    await saveCats(next, 'Adicionar ativo');
  }

  async function updateCatName(catId: string, name: string) {
    const next = categorias.map(c => c.id === catId ? { ...c, name } : c);
    await saveCats(next, 'Renomear categoria');
  }

  async function deleteCategoria(catId: string) {
    await saveCats(categorias.filter(c => c.id !== catId), 'Remover categoria');
  }

  async function addCategoria() {
    const used = categorias.map(c => c.color);
    const color = COLORS.find(c => !used.includes(c)) || COLORS[categorias.length % COLORS.length];
    const nova: Categoria = {
      id: uid(), name: 'Nova Categoria', color,
      assets: [{ id: uid(), name: 'Novo ativo', value: 0 }],
    };
    await saveCats([...categorias, nova], 'Nova categoria');
  }

  /* ── Novo Recebimento ── */
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
        id: uid(), catId: selectedCatId,
        descricao: values.descricao,
        valor: parseVal(values.valor || '0'),
        vencimento: values.vencimento,
        recebido: false, dataRecebimento: null,
      });
      setModalRecv(false);
      message.success('Recebimento programado!');
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  /* ── Transferir ── */
  function openTransferir() {
    formTransferir.resetFields();
    formTransferir.setFieldsValue({ data: hoje(), origemCat: categorias[0]?.id, destinoCat: categorias[0]?.id });
    updateOrigemAtivos(categorias[0]?.id ?? '');
    updateDestinoAtivos(categorias[0]?.id ?? '');
    setModalTransferir(true);
  }

  function updateOrigemAtivos(catId: string) {
    const cat = categorias.find(c => c.id === catId);
    const opts = (cat?.assets ?? []).map((a: Asset) => ({ value: a.id, label: `${a.name} — ${fmtBRL(a.value)}` }));
    setOrigemAtivoOpts(opts);
    formTransferir.setFieldValue('origemAtivo', cat?.assets[0]?.id);
  }

  function updateDestinoAtivos(catId: string) {
    const cat = categorias.find(c => c.id === catId);
    const opts = (cat?.assets ?? []).map((a: Asset) => ({ value: a.id, label: `${a.name} — ${fmtBRL(a.value)}` }));
    setDestinoAtivoOpts(opts);
    formTransferir.setFieldValue('destinoAtivo', cat?.assets[0]?.id);
  }

  async function confirmarTransferir() {
    const values = await formTransferir.validateFields();
    const val = parseVal(values.valor || '0');
    if (val <= 0) { message.error('Valor inválido'); return; }
    setSalvando(true);
    try {
      const origemCat = categorias.find(c => c.id === values.origemCat);
      const destinoCat = categorias.find(c => c.id === values.destinoCat);
      const origemAtivo = origemCat?.assets.find(a => a.id === values.origemAtivo);
      const destinoAtivo = destinoCat?.assets.find(a => a.id === values.destinoAtivo);
      if (!origemCat || !destinoCat || !origemAtivo || !destinoAtivo) { message.error('Ativo inválido'); return; }
      if (origemAtivo.value < val) { message.error(`Saldo insuficiente. Disponível: ${fmtBRL(origemAtivo.value)}`); return; }

      const nextCats = categorias.map(c => {
        if (c.id === origemCat.id && c.id === destinoCat.id) {
          return { ...c, assets: c.assets.map(a => {
            if (a.id === origemAtivo.id) return { ...a, value: a.value - val };
            if (a.id === destinoAtivo.id) return { ...a, value: a.value + val };
            return a;
          })};
        }
        if (c.id === origemCat.id) return { ...c, assets: c.assets.map(a => a.id === origemAtivo.id ? { ...a, value: a.value - val } : a) };
        if (c.id === destinoCat.id) return { ...c, assets: c.assets.map(a => a.id === destinoAtivo.id ? { ...a, value: a.value + val } : a) };
        return c;
      });
      await saveCats(nextCats, `Transferência: ${origemAtivo.name} → ${destinoAtivo.name}`);
      setModalTransferir(false);
      message.success(`${fmtBRL(val)} transferido!`);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  if (!loaded || lc) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '32px 28px 72px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text style={{ fontSize: 11.5, fontWeight: 500, color: '#999', letterSpacing: '.07em', textTransform: 'uppercase' }}>
            Carteira
          </Text>
          <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 28, color: '#1a1a1a', marginTop: 2 }}>
            {fmtBRL(gt)}
          </div>
        </div>
        <Button icon={<SwapOutlined />} onClick={openTransferir}>
          Transferir
        </Button>
      </div>

      {/* ── Allocation bar ── */}
      {gt > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
            {categorias.map(cat => {
              const pct = gt > 0 ? catTotal(cat) / gt * 100 : 0;
              return <div key={cat.id} style={{ background: cat.color, width: `${pct}%`, minWidth: pct > 0 ? 3 : 0, borderRadius: 2 }} />;
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
            {categorias.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#777' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color }} />
                <span>{cat.name}</span>
                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#bbb' }}>
                  {fmtPct(gt > 0 ? catTotal(cat) / gt * 100 : 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category grid ── */}
      <Row gutter={[12, 12]}>
        {categorias.map(cat => {
          const ct = catTotal(cat);
          const pct = gt > 0 ? ct / gt * 100 : 0;
          return (
            <Col key={cat.id} xs={24} sm={12} lg={8}>
              <div style={{
                background: '#fff',
                border: '1px solid #ede9e2',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,.04)',
              }}>
                {/* Card header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px 10px', borderBottom: '1px solid #f5f2ec',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                    <EditableCategoryName value={cat.name} onChange={name => updateCatName(cat.id, name)} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtBRL(ct)}</div>
                      <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#bbb' }}>{fmtPct(pct)}</div>
                    </div>
                    <Popconfirm title="Remover categoria?" onConfirm={() => deleteCategoria(cat.id)} okText="Sim" cancelText="Não" okType="danger">
                      <Tooltip title="Remover categoria">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ opacity: .35, padding: '0 4px' }} />
                      </Tooltip>
                    </Popconfirm>
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
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ opacity: .35, padding: '0 4px' }} className="del-asset-btn" />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  ))}
                </div>

                {/* Card footer */}
                <div style={{ display: 'flex', borderTop: '1px solid #f5f2ec', marginTop: 2 }}>
                  <button
                    onClick={() => addAsset(cat.id)}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '8px 6px 9px', fontSize: 11.5, color: '#bbb', cursor: 'pointer', borderRight: '1px solid #f5f2ec', fontFamily: 'inherit' }}
                  >
                    <PlusOutlined /> Ativo
                  </button>
                  <button
                    onClick={() => openNovoRecv(cat.id)}
                    style={{ flex: 1, border: 'none', background: 'none', padding: '8px 6px 9px', fontSize: 11.5, color: '#bbb', cursor: 'pointer', fontFamily: 'inherit' }}
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
              width: '100%', height: '100%', minHeight: 90,
              border: '1.5px dashed #d8d4cc', borderRadius: 12,
              background: 'none', color: '#c5c0b8', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <PlusOutlined /> Nova categoria
          </button>
        </Col>
      </Row>

      {/* MODAL: Novo Recebimento */}
      <Modal
        title={<><CalendarOutlined style={{ marginRight: 8, color: '#E9A23B' }} />Programar Recebimento</>}
        open={modalRecv}
        onCancel={() => setModalRecv(false)}
        onOk={salvarRecv}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={salvando}
        destroyOnHidden
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          Categoria: <strong>{categorias.find(c => c.id === selectedCatId)?.name}</strong>
        </Text>
        <Form form={formRecv} layout="vertical">
          <Form.Item name="descricao" label="Descrição" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="Ex: Retorno Halogenn — Outubro" />
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

      {/* MODAL: Transferir */}
      <Modal
        title={<><SwapOutlined style={{ marginRight: 8 }} />Transferir entre ativos</>}
        open={modalTransferir}
        onCancel={() => setModalTransferir(false)}
        onOk={confirmarTransferir}
        okText="Confirmar transferência"
        cancelText="Cancelar"
        confirmLoading={salvando}
        destroyOnHidden
        width={480}
      >
        <Form form={formTransferir} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="descricao" label="Descrição">
            <Input placeholder="Ex: Realocação de ativos" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="valor" label="Valor (R$)" rules={[{ required: true, message: 'Obrigatório' }]}>
                <Input placeholder="0,00" style={{ fontFamily: '"DM Mono", monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '4px 0 14px', fontSize: 12 }}>De</Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="origemCat" label="Categoria" rules={[{ required: true }]}>
                <Select options={categorias.map(c => ({ value: c.id, label: c.name }))} onChange={updateOrigemAtivos} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="origemAtivo" label="Ativo" rules={[{ required: true }]}>
                <Select options={origemAtivoOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '4px 0 14px', fontSize: 12 }}>Para</Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="destinoCat" label="Categoria" rules={[{ required: true }]}>
                <Select options={categorias.map(c => ({ value: c.id, label: c.name }))} onChange={updateDestinoAtivos} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="destinoAtivo" label="Ativo" rules={[{ required: true }]}>
                <Select options={destinoAtivoOpts} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <style>{`
        .asset-row:hover .del-asset-btn { opacity: 1 !important; }
        .asset-row { transition: background .1s; }
        .asset-row:hover { background: rgba(0,0,0,.02); }
      `}</style>
    </div>
  );
}
