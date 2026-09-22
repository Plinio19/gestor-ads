import { useEffect, useState } from 'react';
import {
  Typography, Select, Empty, Tag, Button, Modal, Form, Input, Row, Col, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Asset, Categoria } from '../types';
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

export default function ExtratoPage() {
  const { categorias, fetch: fetchCats, save: saveCats } = useCategoriasStore();
  const { add: addCaixa, fetch: fetchCaixa } = useCaixaStore();
  const { movimentacoes, loading, fetch, add: addMov } = useMovimentacoesStore();

  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoLanc, setTipoLanc] = useState<'resgate' | 'aporte'>('resgate');
  const [ativoOpts, setAtivoOpts] = useState<{ value: string; label: string }[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => { fetch(); fetchCats(); fetchCaixa(); }, []);

  /* ── filtro ── */
  const filtradas = filtroTipo === 'todos'
    ? [...movimentacoes].reverse()
    : [...movimentacoes].reverse().filter(m => m.tipo === filtroTipo);

  const totalFiltradas = filtradas.reduce((s, m) => s + m.valor, 0);

  /* ── abrir modal ── */
  function abrirModal(tipo: 'resgate' | 'aporte') {
    setTipoLanc(tipo);
    form.resetFields();
    form.setFieldsValue({
      data: hoje(),
      catId: categorias[0]?.id,
      ativoId: categorias[0]?.assets[0]?.id,
    });
    atualizarAtivoOpts(categorias[0]?.id ?? '');
    setModalOpen(true);
  }

  function atualizarAtivoOpts(catId: string) {
    const cat = categorias.find(c => c.id === catId);
    const opts = (cat?.assets ?? []).map((a: Asset) => ({
      value: a.id,
      label: `${a.name}${tipoLanc === 'resgate' ? ` — ${fmtBRL(a.value)}` : ''}`,
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

      // Atualiza o ativo na carteira
      const nextCats = categorias.map(c => c.id === cat.id
        ? { ...c, assets: c.assets.map(a => a.id === ativo.id ? { ...a, value: novoValor } : a) }
        : c);
      await saveCats(nextCats, descricao);

      // Resgate → vai para o Caixa
      if (tipoLanc === 'resgate') {
        await addCaixa({ id: uid(), valor: val, origem: descricao, data: values.data });
      }

      // Registra movimentação
      await addMov({
        id: uid(),
        data: values.data,
        descricao,
        tipo: tipoLanc,
        origemCat: cat.name,
        origemAtivo: ativo.name,
        valor: val,
      });

      setModalOpen(false);
      message.success(
        tipoLanc === 'resgate'
          ? `${fmtBRL(val)} resgatado de ${ativo.name} → Caixa`
          : `${fmtBRL(val)} aportado em ${ativo.name}`,
      );
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  /* ── ativo selecionado (para mostrar saldo) ── */
  const catIdWatch: string = Form.useWatch('catId', form) ?? '';
  const ativoIdWatch: string = Form.useWatch('ativoId', form) ?? '';
  const ativoSelecionado = categorias.find(c => c.id === catIdWatch)?.assets.find(a => a.id === ativoIdWatch);

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            value={filtroTipo}
            onChange={setFiltroTipo}
            style={{ width: 170 }}
            options={[
              { value: 'todos',        label: 'Todos os tipos' },
              { value: 'resgate',      label: 'Resgates' },
              { value: 'aporte',       label: 'Aportes' },
              { value: 'recebimento',  label: 'Recebimentos' },
              { value: 'transferencia',label: 'Transferências' },
            ]}
          />
          <Button
            icon={<PlusOutlined />}
            style={{ background: '#CF4444', borderColor: '#CF4444', color: '#fff' }}
            onClick={() => abrirModal('resgate')}
          >
            Resgate
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => abrirModal('aporte')}
          >
            Aporte
          </Button>
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
                <div style={{ background: '#fff', border: '1px solid #ede9e2', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: t.color }}>
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
                  <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>
                    {fmtBRL(m.valor)}
                  </Text>
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

          {/* Saldo atual do ativo selecionado */}
          {ativoSelecionado && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: tipoLanc === 'resgate' ? '#FFF0F0' : '#EAF3EE',
              borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 12, color: '#888' }}>Saldo atual de <strong>{ativoSelecionado.name}</strong></Text>
              <Text style={{ fontFamily: '"DM Mono", monospace', fontSize: 15, fontWeight: 700, color: tipoLanc === 'resgate' ? '#CF4444' : '#2D6A4F' }}>
                {fmtBRL(ativoSelecionado.value)}
              </Text>
            </div>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="valor" label="Valor (R$)" rules={[{ required: true, message: 'Obrigatório' }]}>
                <Input
                  placeholder="0,00"
                  style={{ fontFamily: '"DM Mono", monospace' }}
                  autoComplete="off"
                />
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

          {tipoLanc === 'resgate' && (
            <div style={{ padding: '10px 14px', background: '#f9f9f7', borderRadius: 8, border: '1px solid #ede9e2' }}>
              <Text style={{ fontSize: 12, color: '#aaa' }}>
                O valor será <strong>deduzido do ativo</strong> e enviado ao <strong>Caixa Disponível</strong> para realocar quando quiser.
              </Text>
            </div>
          )}
          {tipoLanc === 'aporte' && (
            <div style={{ padding: '10px 14px', background: '#f9f9f7', borderRadius: 8, border: '1px solid #ede9e2' }}>
              <Text style={{ fontSize: 12, color: '#aaa' }}>
                O valor será <strong>adicionado ao ativo</strong>. Use a Agenda para alocar dinheiro do Caixa.
              </Text>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
