import { useEffect, useState } from 'react';
import {
  Typography, Button, Modal, Form, Input, Select,
  Row, Col, Popconfirm, message, Divider,
} from 'antd';
import {
  PlusOutlined, CheckOutlined, DeleteOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import type { Asset } from '../types';
import { useCategoriasStore } from '../stores/useCategoriasStore';
import { useCaixaStore } from '../stores/useCaixaStore';
import { useRecebimentosStore } from '../stores/useRecebimentosStore';
import { useMovimentacoesStore } from '../stores/useMovimentacoesStore';
import { fmtBRL, fmtDate, hoje, parseVal, uid } from '../utils';

const { Text } = Typography;

export default function AgendaPage() {
  const { categorias, fetch: fetchCats } = useCategoriasStore();
  const { caixa, fetch: fetchCaixa, add: addCaixa, remove: removeCaixa, update: updateCaixa } = useCaixaStore();
  const { recebimentos, fetch: fetchRecv, add: addRecv, remove: removeRecv, marcarRecebido } = useRecebimentosStore();
  const { add: addMov, fetch: fetchMovs } = useMovimentacoesStore();
  const { save: saveCats } = useCategoriasStore();

  const [salvando, setSalvando] = useState(false);
  const [modalRecv, setModalRecv] = useState(false);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [modalAlocar, setModalAlocar] = useState(false);
  const [selectedRecvId, setSelectedRecvId] = useState('');
  const [selectedCaixaId, setSelectedCaixaId] = useState('');
  const [ativoOptions, setAtivoOptions] = useState<{ value: string; label: string }[]>([]);
  const [ativoIdWatch, setAtivoIdWatch] = useState('');
  const [formRecv] = Form.useForm();
  const [formConfirmar] = Form.useForm();
  const [formAlocar] = Form.useForm();

  useEffect(() => { fetchCats(); fetchCaixa(); fetchRecv(); fetchMovs(); }, []);

  const caixaTotal = caixa.reduce((s, c) => s + c.valor, 0);
  const pendentes = recebimentos.filter(r => !r.recebido);
  const recebidos = recebimentos.filter(r => r.recebido);

  /* ── Novo Recebimento ── */
  function openNovoRecv() {
    formRecv.resetFields();
    formRecv.setFieldsValue({ vencimento: hoje(), catId: categorias[0]?.id });
    setModalRecv(true);
  }

  async function salvarRecv() {
    const values = await formRecv.validateFields();
    setSalvando(true);
    try {
      await addRecv({
        id: uid(), catId: values.catId,
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
    const principal = parseVal(values.valor || '0');
    const juros = parseVal(values.juros || '0');
    const total = principal + juros;
    setSalvando(true);
    try {
      const r = await marcarRecebido(selectedRecvId, values.data);
      if (r) {
        const descCaixa = juros > 0
          ? `${r.descricao} (principal ${fmtBRL(principal)} + juros ${fmtBRL(juros)})`
          : r.descricao;
        await addCaixa({ id: uid(), valor: total, origem: descCaixa, data: values.data });
        await addMov({
          id: uid(), data: values.data,
          descricao: r.descricao + (juros > 0 ? ` + juros ${fmtBRL(juros)}` : ''),
          tipo: 'recebimento', valor: total,
        });
      }
      setModalConfirmar(false);
      message.success(`${fmtBRL(total)} enviado ao Caixa!`);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  /* ── Alocar do Caixa ── */
  function openAlocar(caixaId: string) {
    const c = caixa.find(x => x.id === caixaId);
    if (!c) return;
    setSelectedCaixaId(caixaId);
    formAlocar.resetFields();
    formAlocar.setFieldsValue({ valor: c.valor.toFixed(2).replace('.', ','), catId: categorias[0]?.id, ativoId: categorias[0]?.assets[0]?.id });
    updateAtivoOptions(categorias[0]?.id ?? '');
    setModalAlocar(true);
  }

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

  async function confirmarAlocar() {
    const values = await formAlocar.validateFields();
    const val = parseVal(values.valor || '0');
    if (val <= 0) { message.error('Valor inválido'); return; }
    setSalvando(true);
    try {
      const c = caixa.find(x => x.id === selectedCaixaId);
      const cat = categorias.find(x => x.id === values.catId);
      if (!c || !cat) return;

      let nextCats;
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
      message.success(`${fmtBRL(val)} alocado!`);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  return (
    <div style={{ padding: '32px 28px 72px', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Text style={{ fontSize: 11.5, fontWeight: 500, color: '#999', letterSpacing: '.07em', textTransform: 'uppercase' }}>Agenda</Text>
          <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 26, color: '#1a1a1a', marginTop: 2 }}>
            Recebimentos & Caixa
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNovoRecv}>
          Novo Recebimento
        </Button>
      </div>

      {/* ── Caixa ── */}
      {caixa.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#2D6A4F' }}>
              💵 Caixa Disponível
            </Text>
            <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 15, fontWeight: 700, color: '#2D6A4F' }}>
              {fmtBRL(caixaTotal)}
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {caixa.map(c => (
              <div
                key={c.id}
                style={{
                  background: '#EAF3EE', border: '1.5px solid #C5DFD1', borderRadius: 10,
                  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.origem}</div>
                  <div style={{ fontSize: 11.5, color: '#5a9b7a', marginTop: 2 }}>{fmtDate(c.data)}</div>
                </div>
                <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 700, color: '#2D6A4F', whiteSpace: 'nowrap' }}>
                  {fmtBRL(c.valor)}
                </Text>
                <Button
                  type="primary"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  style={{ background: '#2D6A4F', borderColor: '#2D6A4F' }}
                  onClick={() => openAlocar(c.id)}
                >
                  Alocar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pendentes ── */}
      {pendentes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 12 }}>
            📅 Pendentes ({pendentes.length})
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendentes.sort((a, b) => a.vencimento.localeCompare(b.vencimento)).map(r => {
              const cat = categorias.find(c => c.id === r.catId);
              const vencido = r.vencimento < hoje();
              return (
                <div
                  key={r.id}
                  style={{
                    background: '#fff', border: `1.5px solid ${vencido ? '#FFCCC7' : '#F0D89A'}`,
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: cat?.color || '#E9A23B', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.descricao}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 2 }}>
                      {cat?.name || '—'} ·{' '}
                      <span style={{ color: vencido ? '#cf4444' : '#B07D18', fontWeight: 500 }}>
                        {vencido ? 'vencido em ' : 'vence '}{fmtDate(r.vencimento)}
                      </span>
                    </div>
                  </div>
                  <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {fmtBRL(r.valor)}
                  </Text>
                  <Button size="small" icon={<CheckOutlined />} onClick={() => openConfirmar(r.id)}>
                    Recebido
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recebidos ── */}
      {recebidos.length > 0 && (
        <div>
          <Text style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#bbb', display: 'block', marginBottom: 12 }}>
            ✓ Recebidos ({recebidos.length})
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {recebidos.sort((a, b) => (b.dataRecebimento || '').localeCompare(a.dataRecebimento || '')).map(r => {
              const cat = categorias.find(c => c.id === r.catId);
              return (
                <div
                  key={r.id}
                  style={{
                    background: '#fafaf8', border: '1px solid #ede9e2', borderRadius: 10,
                    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: .65,
                  }}
                >
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#2D6A4F', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descricao}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                      {cat?.name || '—'} · <span style={{ color: '#2D6A4F' }}>✓ {fmtDate(r.dataRecebimento)}</span>
                    </div>
                  </div>
                  <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>
                    {fmtBRL(r.valor)}
                  </Text>
                  <Popconfirm title="Remover?" onConfirm={() => removeRecv(r.id)} okText="Sim" cancelText="Não" okType="danger">
                    <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recebimentos.length === 0 && caixa.length === 0 && (
        <div style={{ textAlign: 'center', color: '#ccc', fontSize: 13, paddingTop: 60 }}>
          Nenhum recebimento cadastrado ainda.<br />
          <Button type="link" onClick={openNovoRecv}>Adicionar o primeiro</Button>
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
          <Form.Item name="catId" label="Categoria" rules={[{ required: true }]}>
            <Select options={categorias.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
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
              <Form.Item name="vencimento" label="Data Prevista" rules={[{ required: true }]}>
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
        okText="→ Enviar ao Caixa"
        cancelText="Cancelar"
        confirmLoading={salvando}
        destroyOnHidden
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          {recebimentos.find(r => r.id === selectedRecvId)?.descricao}
        </Text>
        <Form form={formConfirmar} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="valor" label="Principal (R$)" rules={[{ required: true }]}>
                <Input style={{ fontFamily: '"DM Mono", monospace' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="juros" label="Juros / Extra (R$)">
                <Input placeholder="0,00" style={{ fontFamily: '"DM Mono", monospace' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="data" label="Data" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        <Text type="secondary" style={{ fontSize: 12 }}>O valor vai para o Caixa Disponível — você decide onde alocar.</Text>
      </Modal>

      {/* MODAL: Alocar */}
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
            <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 16, fontWeight: 700, color: '#2D6A4F' }}>
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
              <Form.Item name="catId" label="Categoria" rules={[{ required: true }]}>
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
            <Form.Item name="novoNome" label="Nome do Novo Ativo" rules={[{ required: true }]}>
              <Input placeholder="Ex: Tesouro Selic 2028" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
