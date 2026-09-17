import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Tabs, Table, Button, Tag, Space,
  Modal, Form, Input, InputNumber, Select, DatePicker, Popconfirm,
  message, Typography, Divider, Badge, Progress,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, ClockCircleOutlined,
  DeleteOutlined, EditOutlined, DollarOutlined, ArrowUpOutlined,
  ArrowDownOutlined, CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ContaReceber, ContaPagar, ParcelaFinanceiro } from '../types';
import { useContasReceberStore } from '../stores/useContasReceberStore';
import { useContasPagarStore } from '../stores/useContasPagarStore';

const { Text, Title } = Typography;

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function hoje() { return dayjs().format('YYYY-MM-DD'); }

function fmtBRL(v?: number) {
  if (!v) return 'R$ 0,00';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const TIPO_RECEBER_OPTS = [
  { value: 'comissao_venda',   label: 'Comissão de Venda' },
  { value: 'comissao_aluguel', label: 'Comissão de Aluguel' },
  { value: 'honorarios',       label: 'Honorários' },
  { value: 'outros',           label: 'Outros' },
];

const CAT_PAGAR_OPTS = [
  { value: 'marketing',          label: 'Marketing / Publicidade' },
  { value: 'escritorio',         label: 'Escritório / Operacional' },
  { value: 'impostos',           label: 'Impostos / Taxas' },
  { value: 'comissao_corretor',  label: 'Comissão Corretor' },
  { value: 'outros',             label: 'Outros' },
];

function statusParcelasTag(conta: ContaReceber) {
  const total = conta.parcelas.length;
  const pagas = conta.parcelas.filter(p => p.pago).length;
  if (pagas === total && total > 0) return <Tag color="success" icon={<CheckCircleOutlined />}>Recebido</Tag>;
  if (pagas > 0) return <Tag color="processing">Parcial ({pagas}/{total})</Tag>;
  return <Tag color="warning" icon={<ClockCircleOutlined />}>Pendente</Tag>;
}

function calcSaldoMes(
  contas: ContaReceber[],
  contasPagar: ContaPagar[],
  mes: string,
) {
  const entradas = contas.flatMap(c => c.parcelas)
    .filter(p => p.pago && p.dataPagamento?.startsWith(mes))
    .reduce((s, p) => s + p.valor, 0);
  const saidas = contasPagar
    .filter(c => c.pago && c.dataPagamento?.startsWith(mes))
    .reduce((s, c) => s + c.valor, 0);
  return { entradas, saidas };
}

// ─── Modal de Conta a Receber ───────────────────────────────────────────────
interface ModalReceberProps {
  open: boolean;
  inicial?: ContaReceber | null;
  onClose: () => void;
  onSave: (c: ContaReceber) => void;
}

function ModalContaReceber({ open, inicial, onClose, onSave }: ModalReceberProps) {
  const [form] = Form.useForm();
  const [parcelas, setParcelas] = useState<ParcelaFinanceiro[]>([]);
  const [qtdParcelas, setQtdParcelas] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (inicial) {
      form.setFieldsValue({
        ...inicial,
        // não setar parcelas no form
      });
      setParcelas(inicial.parcelas);
      setQtdParcelas(inicial.parcelas.length || 1);
    } else {
      form.resetFields();
      setParcelas([]);
      setQtdParcelas(1);
    }
  }, [open, inicial]);

  function gerarParcelas() {
    const valorTotal = Number(form.getFieldValue('valorTotal') || 0);
    const vencBase = form.getFieldValue('primeiroVencimento');
    if (!valorTotal) { message.warning('Informe o valor total primeiro.'); return; }
    const base = vencBase ? dayjs(vencBase) : dayjs();
    const valorParcela = +(valorTotal / qtdParcelas).toFixed(2);
    const novas: ParcelaFinanceiro[] = Array.from({ length: qtdParcelas }, (_, i) => ({
      id: uid(),
      valor: i === qtdParcelas - 1
        ? +(valorTotal - valorParcela * (qtdParcelas - 1)).toFixed(2)
        : valorParcela,
      vencimento: base.add(i, 'month').format('YYYY-MM-DD'),
      pago: false,
    }));
    setParcelas(novas);
  }

  async function salvar() {
    let vals: Record<string, unknown>;
    try { vals = await form.validateFields(); } catch { return; }
    if (parcelas.length === 0) { message.warning('Gere as parcelas antes de salvar.'); return; }
    setSaving(true);
    try {
      const conta: ContaReceber = {
        id: inicial?.id || uid(),
        descricao: String(vals.descricao),
        clienteNome: String(vals.clienteNome),
        tipo: vals.tipo as ContaReceber['tipo'],
        imovelId: inicial?.imovelId,
        imovelCodigo: inicial?.imovelCodigo,
        valorTotal: Number(vals.valorTotal),
        parcelas,
        observacoes: vals.observacoes as string | undefined,
        criadoEm: inicial?.criadoEm || hoje(),
        atualizadoEm: hoje(),
      };
      onSave(conta);
    } finally { setSaving(false); }
  }

  function toggleParcela(id: string) {
    setParcelas(prev => prev.map(p =>
      p.id === id
        ? { ...p, pago: !p.pago, dataPagamento: !p.pago ? hoje() : undefined }
        : p,
    ));
  }

  return (
    <Modal
      title={inicial ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
      open={open} onCancel={onClose} onOk={salvar} okText="Salvar"
      confirmLoading={saving} width={600}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Row gutter={12}>
          <Col span={16}>
            <Form.Item name="descricao" label="Descrição" rules={[{ required: true }]}>
              <Input placeholder="Ex: Comissão venda imóvel 237610" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]} initialValue="comissao_venda">
              <Select options={TIPO_RECEBER_OPTS} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="clienteNome" label="Cliente / Parte" rules={[{ required: true }]}>
              <Input placeholder="Nome do cliente" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="valorTotal" label="Valor Total (R$)" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }} min={0} precision={2}
                formatter={v => v ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                parser={v => (v ? Number(String(v).replace(/\./g, '').replace(',', '.')) : 0) as any}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="observacoes" label="Observações">
          <Input.TextArea rows={2} />
        </Form.Item>

        <Divider style={{ margin: '8px 0' }}>Parcelas</Divider>
        <Row gutter={12} align="bottom">
          <Col span={8}>
            <Form.Item label="Quantidade de parcelas" style={{ marginBottom: 8 }}>
              <InputNumber min={1} max={60} value={qtdParcelas} onChange={v => setQtdParcelas(Number(v) || 1)} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="primeiroVencimento" label="1º Vencimento" style={{ marginBottom: 8 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item style={{ marginBottom: 8 }}>
              <Button block onClick={gerarParcelas}>Gerar</Button>
            </Form.Item>
          </Col>
        </Row>

        {parcelas.length > 0 && (
          <Table
            size="small" pagination={false}
            dataSource={parcelas} rowKey="id"
            columns={[
              { title: 'Parcela', render: (_, __, i) => `${i + 1}/${parcelas.length}`, width: 70 },
              { title: 'Valor', dataIndex: 'valor', render: v => fmtBRL(v) },
              { title: 'Vencimento', dataIndex: 'vencimento', render: v => dayjs(v).format('DD/MM/YYYY') },
              {
                title: 'Status', dataIndex: 'pago',
                render: (pago, rec) => (
                  <Button
                    size="small" type={pago ? 'primary' : 'default'}
                    icon={pago ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    onClick={() => toggleParcela(rec.id)}
                  >
                    {pago ? 'Recebido' : 'Pendente'}
                  </Button>
                ),
              },
            ]}
          />
        )}
      </Form>
    </Modal>
  );
}

// ─── Modal de Conta a Pagar ─────────────────────────────────────────────────
interface ModalPagarProps {
  open: boolean;
  inicial?: ContaPagar | null;
  onClose: () => void;
  onSave: (c: ContaPagar) => void;
}

function ModalContaPagar({ open, inicial, onClose, onSave }: ModalPagarProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (inicial) {
      form.setFieldsValue({ ...inicial, vencimento: dayjs(inicial.vencimento) });
    } else {
      form.resetFields();
    }
  }, [open, inicial]);

  async function salvar() {
    let vals: Record<string, unknown>;
    try { vals = await form.validateFields(); } catch { return; }
    setSaving(true);
    try {
      const conta: ContaPagar = {
        id: inicial?.id || uid(),
        descricao: String(vals.descricao),
        categoria: vals.categoria as ContaPagar['categoria'],
        valor: Number(vals.valor),
        vencimento: (vals.vencimento as dayjs.Dayjs).format('YYYY-MM-DD'),
        pago: inicial?.pago || false,
        dataPagamento: inicial?.dataPagamento,
        observacoes: vals.observacoes as string | undefined,
        criadoEm: inicial?.criadoEm || hoje(),
      };
      onSave(conta);
    } finally { setSaving(false); }
  }

  return (
    <Modal
      title={inicial ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
      open={open} onCancel={onClose} onOk={salvar} okText="Salvar"
      confirmLoading={saving}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item name="descricao" label="Descrição" rules={[{ required: true }]}>
          <Input placeholder="Ex: Anúncio portal imóveis - setembro" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="categoria" label="Categoria" rules={[{ required: true }]} initialValue="outros">
              <Select options={CAT_PAGAR_OPTS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="valor" label="Valor (R$)" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }} min={0} precision={2}
                formatter={v => v ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                parser={v => (v ? Number(String(v).replace(/\./g, '').replace(',', '.')) : 0) as any}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="vencimento" label="Vencimento" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="observacoes" label="Observações">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function FinanceiroPage() {
  const { contas: receber, loading: loadingR, fetch: fetchR, upsert: upsertR, remove: removeR } = useContasReceberStore();
  const { contas: pagar, loading: loadingP, fetch: fetchP, upsert: upsertP, remove: removeP } = useContasPagarStore();

  const [modalReceber, setModalReceber] = useState<{ open: boolean; conta: ContaReceber | null }>({ open: false, conta: null });
  const [modalPagar, setModalPagar] = useState<{ open: boolean; conta: ContaPagar | null }>({ open: false, conta: null });
  const [mesFechamento, setMesFechamento] = useState(dayjs().format('YYYY-MM'));

  useEffect(() => { fetchR(); fetchP(); }, []);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const mesAtual = dayjs().format('YYYY-MM');
  const { entradas: entradasMes, saidas: saidasMes } = calcSaldoMes(receber, pagar, mesAtual);

  const totalAReceber = receber
    .flatMap(c => c.parcelas)
    .filter(p => !p.pago)
    .reduce((s, p) => s + p.valor, 0);

  const totalAPagar = pagar
    .filter(c => !c.pago)
    .reduce((s, c) => s + c.valor, 0);

  const saldoAtual = receber
    .flatMap(c => c.parcelas)
    .filter(p => p.pago)
    .reduce((s, p) => s + p.valor, 0)
    - pagar.filter(c => c.pago).reduce((s, c) => s + c.valor, 0);

  // ── Fluxo próximos 30 dias ────────────────────────────────────────────────
  const hoje30 = dayjs().add(30, 'day');
  const entradas30 = receber
    .flatMap(c => c.parcelas.map(p => ({ ...p })))
    .filter(p => !p.pago && dayjs(p.vencimento).isBefore(hoje30))
    .reduce((s, p) => s + p.valor, 0);
  const saidas30 = pagar
    .filter(c => !c.pago && dayjs(c.vencimento).isBefore(hoje30))
    .reduce((s, c) => s + c.valor, 0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function salvarReceber(conta: ContaReceber) {
    try {
      await upsertR(conta);
      message.success('Salvo!');
      setModalReceber({ open: false, conta: null });
    } catch { message.error('Erro ao salvar.'); }
  }

  async function salvarPagar(conta: ContaPagar) {
    try {
      await upsertP(conta);
      message.success('Salvo!');
      setModalPagar({ open: false, conta: null });
    } catch { message.error('Erro ao salvar.'); }
  }

  async function marcarParcelaPaga(contaId: string, parcelaId: string) {
    const conta = receber.find(c => c.id === contaId);
    if (!conta) return;
    const atualizada: ContaReceber = {
      ...conta,
      parcelas: conta.parcelas.map(p =>
        p.id === parcelaId
          ? { ...p, pago: !p.pago, dataPagamento: !p.pago ? hoje() : undefined }
          : p,
      ),
    };
    try { await upsertR(atualizada); message.success('Parcela atualizada!'); }
    catch { message.error('Erro.'); }
  }

  async function marcarContaPaga(contaId: string) {
    const conta = pagar.find(c => c.id === contaId);
    if (!conta) return;
    const atualizada: ContaPagar = {
      ...conta,
      pago: !conta.pago,
      dataPagamento: !conta.pago ? hoje() : undefined,
    };
    try { await upsertP(atualizada); message.success('Conta atualizada!'); }
    catch { message.error('Erro.'); }
  }

  // ── Colunas Contas a Receber ───────────────────────────────────────────────
  const colsReceber = [
    {
      title: 'Descrição', dataIndex: 'descricao',
      render: (v: string, rec: ContaReceber) => (
        <Space direction="vertical" size={0}>
          <Text strong>{v}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{rec.clienteNome}</Text>
          {rec.imovelCodigo && <Tag style={{ fontSize: 11 }}>Imóvel {rec.imovelCodigo}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Tipo', dataIndex: 'tipo',
      render: (v: string) => TIPO_RECEBER_OPTS.find(o => o.value === v)?.label || v,
      width: 160,
    },
    {
      title: 'Valor Total', dataIndex: 'valorTotal',
      render: (v: number) => <Text style={{ color: '#52c41a', fontWeight: 600 }}>{fmtBRL(v)}</Text>,
      width: 140,
    },
    {
      title: 'Status', render: (_: unknown, rec: ContaReceber) => statusParcelasTag(rec), width: 130,
    },
    {
      title: 'Ações', width: 90,
      render: (_: unknown, rec: ContaReceber) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => setModalReceber({ open: true, conta: rec })} />
          <Popconfirm title="Excluir conta?" onConfirm={() => removeR(rec.id)} okText="Sim">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Colunas Contas a Pagar ─────────────────────────────────────────────────
  const colsPagar = [
    {
      title: 'Descrição', dataIndex: 'descricao',
      render: (v: string, rec: ContaPagar) => (
        <Space direction="vertical" size={0}>
          <Text strong>{v}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {CAT_PAGAR_OPTS.find(o => o.value === rec.categoria)?.label}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Valor', dataIndex: 'valor',
      render: (v: number) => <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>{fmtBRL(v)}</Text>,
      width: 140,
    },
    {
      title: 'Vencimento', dataIndex: 'vencimento',
      render: (v: string) => {
        const d = dayjs(v);
        const venceu = !d.isAfter(dayjs()) ;
        return <Text type={venceu ? 'danger' : 'secondary'}>{d.format('DD/MM/YYYY')}</Text>;
      },
      width: 130,
    },
    {
      title: 'Status', dataIndex: 'pago',
      render: (pago: boolean, rec: ContaPagar) => (
        <Button
          size="small" type={pago ? 'primary' : 'default'}
          icon={pago ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          onClick={() => marcarContaPaga(rec.id)}
        >
          {pago ? 'Pago' : 'Pendente'}
        </Button>
      ),
      width: 130,
    },
    {
      title: 'Ações', width: 90,
      render: (_: unknown, rec: ContaPagar) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => setModalPagar({ open: true, conta: rec })} />
          <Popconfirm title="Excluir conta?" onConfirm={() => removeP(rec.id)} okText="Sim">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Fechamento mensal ─────────────────────────────────────────────────────
  const { entradas: entFech, saidas: saiFech } = calcSaldoMes(receber, pagar, mesFechamento);
  const aReceberFech = receber
    .flatMap(c => c.parcelas)
    .filter(p => !p.pago && p.vencimento.startsWith(mesFechamento))
    .reduce((s, p) => s + p.valor, 0);
  const aPagarFech = pagar
    .filter(c => !c.pago && c.vencimento.startsWith(mesFechamento))
    .reduce((s, c) => s + c.valor, 0);

  return (
    <div style={{ padding: 20 }}>
      <Tabs
        items={[
          // ── ABA DASHBOARD ──────────────────────────────────────────────────
          {
            key: 'dashboard',
            label: <span><DollarOutlined /> Dashboard</span>,
            children: (
              <div>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Saldo Acumulado"
                        value={saldoAtual}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: saldoAtual >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 22 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title={<span><ArrowUpOutlined style={{ color: '#52c41a' }} /> Entradas do Mês</span>}
                        value={entradasMes}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: '#52c41a', fontSize: 22 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title={<span><ArrowDownOutlined style={{ color: '#ff4d4f' }} /> Saídas do Mês</span>}
                        value={saidasMes}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: '#ff4d4f', fontSize: 22 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title={<span><CalendarOutlined /> Próx. 30 dias (saldo)</span>}
                        value={entradas30 - saidas30}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: entradas30 - saidas30 >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 22 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} sm={12}>
                    <Card title={<span><ClockCircleOutlined style={{ color: '#faad14' }} /> A Receber</span>}>
                      <Title level={3} style={{ color: '#52c41a', margin: 0 }}>{fmtBRL(totalAReceber)}</Title>
                      <Text type="secondary">Em {receber.flatMap(c => c.parcelas).filter(p => !p.pago).length} parcela(s) pendente(s)</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card title={<span><ClockCircleOutlined style={{ color: '#ff4d4f' }} /> A Pagar</span>}>
                      <Title level={3} style={{ color: '#ff4d4f', margin: 0 }}>{fmtBRL(totalAPagar)}</Title>
                      <Text type="secondary">Em {pagar.filter(c => !c.pago).length} conta(s) pendente(s)</Text>
                    </Card>
                  </Col>
                </Row>

                <Card title="Próximos 30 dias" style={{ marginTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text style={{ color: '#52c41a' }}>Entradas previstas:</Text>
                      <Title level={4} style={{ color: '#52c41a', margin: '4px 0' }}>{fmtBRL(entradas30)}</Title>
                    </Col>
                    <Col span={12}>
                      <Text style={{ color: '#ff4d4f' }}>Saídas previstas:</Text>
                      <Title level={4} style={{ color: '#ff4d4f', margin: '4px 0' }}>{fmtBRL(saidas30)}</Title>
                    </Col>
                  </Row>
                  {(entradas30 + saidas30) > 0 && (
                    <Progress
                      percent={Math.round((entradas30 / (entradas30 + saidas30)) * 100)}
                      strokeColor="#52c41a"
                      trailColor="#ff4d4f"
                      showInfo={false}
                      style={{ marginTop: 12 }}
                    />
                  )}
                </Card>
              </div>
            ),
          },

          // ── ABA CONTAS A RECEBER ───────────────────────────────────────────
          {
            key: 'receber',
            label: (
              <span>
                <ArrowUpOutlined style={{ color: '#52c41a' }} />
                A Receber
                {totalAReceber > 0 && <Badge count={receber.flatMap(c => c.parcelas).filter(p => !p.pago).length} style={{ marginLeft: 6 }} />}
              </span>
            ),
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text type="secondary">{receber.length} registro(s) — Total a receber: <Text strong style={{ color: '#52c41a' }}>{fmtBRL(totalAReceber)}</Text></Text>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalReceber({ open: true, conta: null })}>
                    Nova Conta
                  </Button>
                </div>
                <Table
                  dataSource={receber}
                  columns={colsReceber}
                  rowKey="id"
                  loading={loadingR}
                  size="middle"
                  expandable={{
                    expandedRowRender: (rec: ContaReceber) => (
                      <Table
                        size="small"
                        dataSource={rec.parcelas}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          { title: 'Parcela', render: (_, __, i) => `${i + 1}/${rec.parcelas.length}`, width: 80 },
                          { title: 'Valor', dataIndex: 'valor', render: (v: number) => fmtBRL(v), width: 140 },
                          {
                            title: 'Vencimento', dataIndex: 'vencimento',
                            render: (v: string) => dayjs(v).format('DD/MM/YYYY'), width: 130,
                          },
                          {
                            title: 'Pagamento', dataIndex: 'dataPagamento',
                            render: (v?: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—', width: 130,
                          },
                          {
                            title: 'Status', dataIndex: 'pago', width: 140,
                            render: (pago: boolean, p: ParcelaFinanceiro) => (
                              <Button
                                size="small"
                                type={pago ? 'primary' : 'default'}
                                icon={pago ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                                onClick={() => marcarParcelaPaga(rec.id, p.id)}
                              >
                                {pago ? 'Recebido' : 'Pendente'}
                              </Button>
                            ),
                          },
                        ]}
                      />
                    ),
                  }}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            ),
          },

          // ── ABA CONTAS A PAGAR ─────────────────────────────────────────────
          {
            key: 'pagar',
            label: (
              <span>
                <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                A Pagar
                {totalAPagar > 0 && <Badge count={pagar.filter(c => !c.pago).length} style={{ marginLeft: 6 }} color="red" />}
              </span>
            ),
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text type="secondary">{pagar.length} registro(s) — Total a pagar: <Text strong style={{ color: '#ff4d4f' }}>{fmtBRL(totalAPagar)}</Text></Text>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalPagar({ open: true, conta: null })} danger>
                    Nova Conta
                  </Button>
                </div>
                <Table
                  dataSource={pagar}
                  columns={colsPagar}
                  rowKey="id"
                  loading={loadingP}
                  size="middle"
                  pagination={{ pageSize: 10 }}
                />
              </div>
            ),
          },

          // ── ABA FECHAMENTO MENSAL ──────────────────────────────────────────
          {
            key: 'fechamento',
            label: <span><CalendarOutlined /> Fechamento Mensal</span>,
            children: (
              <div>
                <Row align="middle" gutter={12} style={{ marginBottom: 20 }}>
                  <Col>
                    <Text strong>Mês de referência:</Text>
                  </Col>
                  <Col>
                    <DatePicker
                      picker="month"
                      value={dayjs(mesFechamento)}
                      format="MM/YYYY"
                      onChange={d => d && setMesFechamento(d.format('YYYY-MM'))}
                    />
                  </Col>
                </Row>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={8}>
                    <Card style={{ borderLeft: '4px solid #52c41a' }}>
                      <Statistic
                        title="✅ Entrou"
                        value={entFech}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: '#52c41a', fontSize: 24 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>Recebido no mês</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card style={{ borderLeft: '4px solid #ff4d4f' }}>
                      <Statistic
                        title="❌ Saiu"
                        value={saiFech}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>Pago no mês</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={8}>
                    <Card style={{ borderLeft: `4px solid ${entFech - saiFech >= 0 ? '#52c41a' : '#ff4d4f'}` }}>
                      <Statistic
                        title="💰 Saldo"
                        value={entFech - saiFech}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: entFech - saiFech >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 24 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                    </Card>
                  </Col>
                </Row>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} sm={12}>
                    <Card style={{ borderLeft: '4px solid #faad14' }}>
                      <Statistic
                        title="📥 A Receber no Mês"
                        value={aReceberFech}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: '#faad14', fontSize: 20 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>Parcelas pendentes com vencimento no mês</Text>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card style={{ borderLeft: '4px solid #fa541c' }}>
                      <Statistic
                        title="📤 A Pagar no Mês"
                        value={aPagarFech}
                        precision={2}
                        prefix="R$"
                        valueStyle={{ color: '#fa541c', fontSize: 20 }}
                        formatter={v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>Contas pendentes com vencimento no mês</Text>
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
        ]}
      />

      <ModalContaReceber
        open={modalReceber.open}
        inicial={modalReceber.conta}
        onClose={() => setModalReceber({ open: false, conta: null })}
        onSave={salvarReceber}
      />
      <ModalContaPagar
        open={modalPagar.open}
        inicial={modalPagar.conta}
        onClose={() => setModalPagar({ open: false, conta: null })}
        onSave={salvarPagar}
      />
    </div>
  );
}
