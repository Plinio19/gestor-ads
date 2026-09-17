import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button, Table, Tag, Space, Form, Input, Select,
  InputNumber, Switch, Drawer, Row, Col, Tooltip, Popconfirm,
  message, Badge, Divider, Typography, Empty, Popover, Modal, DatePicker,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined,
  SearchOutlined, FilterOutlined, LinkOutlined, MinusCircleOutlined, PictureOutlined,
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import type { Imovel, ContaReceber, ParcelaFinanceiro } from '../types';
import { useImoveisStore } from '../stores/useImoveisStore';
import { useContasReceberStore } from '../stores/useContasReceberStore';

const { Text, Title } = Typography;

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
function fmtBRL(v?: number) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const currencyFormatter = (val?: number | string) => {
  if (val === undefined || val === null || val === '') return '';
  const n = Number(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(n)) return String(val);
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const currencyParser = (val?: string) =>
  val ? val.replace(/\./g, '').replace(',', '.') : '';

const IMOVEL_VAZIO: Partial<Imovel> = {
  quartos: 0, banheiros: 1, vagasGaragem: 0,
  mobiliado: false, quintal: false, lavanderia: false, aceitaPet: false,
  status: 'disponivel', finalidade: 'locacao', linksFotos: [],
};

export default function ImoveisPage() {
  const { imoveis, loading, fetch, upsert, remove } = useImoveisStore();
  const { upsert: upsertConta, fetch: fetchContas } = useContasReceberStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Imovel | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroFinalidade, setFiltroFinalidade] = useState<string>('todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('todas');
  const [form] = Form.useForm();
  const [modalComissao, setModalComissao] = useState<{ open: boolean; imovel: Imovel | null }>({ open: false, imovel: null });
  const [formComissao] = Form.useForm();
  const [parcelasComissao, setParcelasComissao] = useState<ParcelaFinanceiro[]>([]);
  const [qtdParcelasComissao, setQtdParcelasComissao] = useState(1);
  const [salvandoComissao, setSalvandoComissao] = useState(false);

  useEffect(() => { void fetch(); void fetchContas(); }, [fetch, fetchContas]);

  function abrirModalComissao(imovel: Imovel) {
    formComissao.resetFields();
    const comissao = (imovel.valorVenda || 0) * 0.06;
    formComissao.setFieldsValue({
      clienteNome: imovel.nomeProprietario || '',
      valorTotal: comissao,
      primeiroVencimento: dayjs(),
    });
    setQtdParcelasComissao(1);
    setParcelasComissao([]);
    setModalComissao({ open: true, imovel });
  }

  function gerarParcelasComissao() {
    const valorTotal = Number(formComissao.getFieldValue('valorTotal') || 0);
    const vencBase = formComissao.getFieldValue('primeiroVencimento');
    if (!valorTotal) { message.warning('Informe o valor total.'); return; }
    const base = vencBase ? dayjs(vencBase) : dayjs();
    const valorParcela = +(valorTotal / qtdParcelasComissao).toFixed(2);
    const novas: ParcelaFinanceiro[] = Array.from({ length: qtdParcelasComissao }, (_, i) => ({
      id: uid(),
      valor: i === qtdParcelasComissao - 1
        ? +(valorTotal - valorParcela * (qtdParcelasComissao - 1)).toFixed(2)
        : valorParcela,
      vencimento: base.add(i, 'month').format('YYYY-MM-DD'),
      pago: false,
    }));
    setParcelasComissao(novas);
  }

  async function salvarComissao() {
    if (!modalComissao.imovel) return;
    let vals: Record<string, unknown>;
    try { vals = await formComissao.validateFields(); } catch { return; }
    if (parcelasComissao.length === 0) { message.warning('Gere as parcelas antes de salvar.'); return; }
    setSalvandoComissao(true);
    try {
      const im = modalComissao.imovel;
      const conta: ContaReceber = {
        id: uid(),
        descricao: `Comissão venda — Imóvel ${im.codigo}`,
        clienteNome: String(vals.clienteNome || ''),
        tipo: 'comissao_venda',
        imovelId: im.id,
        imovelCodigo: im.codigo,
        valorTotal: Number(vals.valorTotal),
        parcelas: parcelasComissao,
        observacoes: vals.observacoes as string | undefined,
        criadoEm: new Date().toISOString().slice(0, 10),
      };
      await upsertConta(conta);
      message.success('Comissão lançada em Contas a Receber!');
      setModalComissao({ open: false, imovel: null });
    } catch { message.error('Erro ao salvar.'); }
    finally { setSalvandoComissao(false); }
  }

  const abrirNovo = () => {
    setEditando(null);
    form.resetFields();
    form.setFieldsValue({ ...IMOVEL_VAZIO, linksFotos: [''] });
    setDrawerOpen(true);
  };

  const abrirEditar = (imovel: Imovel) => {
    setEditando(imovel);
    form.setFieldsValue({
      ...imovel,
      linksFotos: imovel.linksFotos.length ? imovel.linksFotos : [''],
    });
    setDrawerOpen(true);
  };

  const salvar = async () => {
    try {
      const vals = await form.validateFields();
      setSalvando(true);
      const fotos = (vals.linksFotos as string[] | undefined)?.filter(Boolean) ?? [];
      const imovel: Imovel = {
        ...IMOVEL_VAZIO as Imovel,
        ...editando,
        ...vals,
        linksFotos: fotos,
        id: editando?.id ?? uid(),
        criadoEm: editando?.criadoEm ?? new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      await upsert(imovel);
      message.success(editando ? 'Imóvel atualizado!' : 'Imóvel cadastrado!');
      setDrawerOpen(false);
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Erro ao salvar: ' + String(e));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    try {
      await remove(id);
      message.success('Imóvel removido.');
    } catch (e) {
      message.error('Erro ao remover: ' + String(e));
    }
  };

  const imovelFiltrado = imoveis.filter(im => {
    const q = busca.toLowerCase();
    const matchBusca = !busca || [im.codigo, im.endereco, im.bairro, im.cidade, im.nomeProprietario]
      .some(v => v?.toLowerCase().includes(q));
    const matchStatus = filtroStatus === 'todos' || im.status === filtroStatus;
    const matchFinalidade = filtroFinalidade === 'todos' || im.finalidade === filtroFinalidade;
    const matchCidade = filtroCidade === 'todas' || im.cidade?.toLowerCase() === filtroCidade;
    return matchBusca && matchStatus && matchFinalidade && matchCidade;
  });

  const disponiveis = imoveis.filter(i => i.status === 'disponivel').length;
  const alugados = imoveis.filter(i => i.status === 'alugado').length;

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      width: 90,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Endereço',
      key: 'endereco',
      render: (_: unknown, r: Imovel) => (
        <div>
          <div>{r.endereco}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.bairro} · {r.cidade}/{r.estado}</Text>
        </div>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'finalidade',
      width: 100,
      render: (v: string) => ({
        locacao: <Tag color="blue">Locação</Tag>,
        venda: <Tag color="green">Venda</Tag>,
        ambos: <Tag color="purple">Ambos</Tag>,
      }[v]),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => v === 'disponivel'
        ? <Badge status="success" text="Disponível" />
        : <Badge status="error" text="Alugado" />,
    },
    {
      title: 'Aluguel',
      dataIndex: 'valorAluguel',
      width: 120,
      render: (v: number) => <Text>{fmtBRL(v)}</Text>,
    },
    {
      title: 'Venda',
      dataIndex: 'valorVenda',
      width: 130,
      render: (v: number) => <Text>{fmtBRL(v)}</Text>,
    },
    {
      title: 'Comissão 6%',
      dataIndex: 'valorVenda',
      key: 'comissao',
      width: 130,
      render: (v: number) => v ? <Text type="warning">{fmtBRL(v * 0.06)}</Text> : <Text>—</Text>,
    },
    {
      title: 'Total c/ Comissão',
      dataIndex: 'valorVenda',
      key: 'totalComissao',
      width: 150,
      render: (v: number) => v ? <Text strong>{fmtBRL(v * 1.06)}</Text> : <Text>—</Text>,
    },
    {
      title: 'Proprietário',
      key: 'prop',
      width: 170,
      render: (_: unknown, r: Imovel) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.nomeProprietario}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.contatoProprietario1}</Text>
        </div>
      ),
    },
    {
      title: '',
      key: 'acoes',
      width: 110,
      render: (_: unknown, r: Imovel) => (
        <Space>
          {r.linksFotos.length === 1 ? (
            <Tooltip title="Ver foto">
              <Button size="small" icon={<PictureOutlined />} onClick={() => window.open(r.linksFotos[0], '_blank')} />
            </Tooltip>
          ) : r.linksFotos.length > 1 ? (
            <Popover
              trigger="click"
              title={`Fotos (${r.linksFotos.length})`}
              content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                  {r.linksFotos.map((link, i) => (
                    <Button key={i} type="link" size="small" icon={<LinkOutlined />}
                      onClick={() => window.open(link, '_blank')} style={{ textAlign: 'left', padding: '0 4px' }}>
                      Foto {i + 1}
                    </Button>
                  ))}
                </div>
              }
            >
              <Tooltip title={`Ver ${r.linksFotos.length} fotos`}>
                <Button size="small" icon={<PictureOutlined />} />
              </Tooltip>
            </Popover>
          ) : null}
          {r.valorVenda ? (
            <Tooltip title="Lançar comissão em Financeiro">
              <Button size="small" icon={<DollarOutlined />} style={{ color: '#52c41a', borderColor: '#52c41a' }} onClick={() => abrirModalComissao(r)} />
            </Tooltip>
          ) : null}
          <Tooltip title="Editar"><Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} /></Tooltip>
          <Popconfirm title="Remover este imóvel?" onConfirm={() => excluir(r.id)} okText="Sim" cancelText="Não">
            <Tooltip title="Excluir"><Button size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <HomeOutlined style={{ fontSize: 22, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>Imóveis</Title>
        <div style={{ marginLeft: 8, display: 'flex', gap: 8 }}>
          <Badge count={disponiveis} color="green" showZero>
            <Tag style={{ cursor: 'default' }}>Disponíveis</Tag>
          </Badge>
          <Badge count={alugados} color="red" showZero>
            <Tag style={{ cursor: 'default' }}>Alugados</Tag>
          </Badge>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovo}>Novo Imóvel</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          placeholder="Buscar por código, endereço, bairro, proprietário..."
          prefix={<SearchOutlined />}
          style={{ width: 320 }}
          value={busca}
          onChange={e => setBusca(e.target.value)}
          allowClear
        />
        <Select
          style={{ width: 150 }}
          value={filtroStatus}
          onChange={setFiltroStatus}
          prefix={<FilterOutlined />}
          options={[
            { value: 'todos', label: 'Todos os status' },
            { value: 'disponivel', label: 'Disponível' },
            { value: 'alugado', label: 'Alugado' },
          ]}
        />
        <Select
          style={{ width: 160 }}
          value={filtroFinalidade}
          onChange={setFiltroFinalidade}
          options={[
            { value: 'todos', label: 'Todas as finalidades' },
            { value: 'locacao', label: 'Locação' },
            { value: 'venda', label: 'Venda' },
            { value: 'ambos', label: 'Ambos' },
          ]}
        />
        <Select
          style={{ width: 150 }}
          value={filtroCidade}
          onChange={setFiltroCidade}
          showSearch
          options={[
            { value: 'todas', label: 'Todas as cidades' },
            { value: 'itanhaém', label: 'Itanhaém' },
            { value: 'peruíbe', label: 'Peruíbe' },
            { value: 'mongaguá', label: 'Mongaguá' },
            { value: 'praia grande', label: 'Praia Grande' },
            { value: 'santos', label: 'Santos' },
            { value: 'são vicente', label: 'São Vicente' },
          ]}
        />
      </div>

      {imovelFiltrado.length === 0 && !loading ? (
        <Empty description="Nenhum imóvel encontrado" />
      ) : (
        <Table
          rowKey="id"
          dataSource={imovelFiltrado}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 900 }}
          size="small"
        />
      )}

      <Drawer
        title={editando ? `Editar imóvel — ${editando.codigo}` : 'Novo Imóvel'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        footer={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" loading={salvando} onClick={salvar}>Salvar</Button>
          </Space>
        }
        destroyOnHidden
      >
        <Form form={form} layout="vertical" size="middle">
          <Divider orientationMargin={0}>Identificação</Divider>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="codigo" label="Código do Imóvel" rules={[{ required: true }]}>
                <Input placeholder="Ex: IM-001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="finalidade" label="Finalidade" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'locacao', label: 'Locação' },
                  { value: 'venda', label: 'Venda' },
                  { value: 'ambos', label: 'Locação e Venda' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'disponivel', label: 'Disponível' },
                  { value: 'alugado', label: 'Alugado' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientationMargin={0}>Localização</Divider>
          <Form.Item name="endereco" label="Endereço completo" rules={[{ required: true }]}>
            <Input placeholder="Rua, número, complemento" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="bairro" label="Bairro" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="cidade" label="Cidade" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="estado" label="Estado" rules={[{ required: true }]}>
                <Select options={ESTADOS.map(e => ({ value: e, label: e }))} showSearch />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientationMargin={0}>Dados do Imóvel</Divider>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="area" label="Área (m²)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="quartos" label="Quartos" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="banheiros" label="Banheiros" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="vagasGaragem" label="Vagas garagem" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="matricula" label="Número de matrícula">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cadastroMunicipal" label="Cadastro municipal">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col><Form.Item name="mobiliado" label="Mobiliado" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col><Form.Item name="quintal" label="Quintal" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col><Form.Item name="lavanderia" label="Lavanderia" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col><Form.Item name="aceitaPet" label="Aceita pet" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>

          <Divider orientationMargin={0}>Valores</Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="valorAluguel" label="Valor do aluguel">
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} precision={2} formatter={currencyFormatter} parser={currencyParser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valorVenda" label="Valor de venda">
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} precision={2} formatter={currencyFormatter} parser={currencyParser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valorCondominio" label="Valor do condomínio">
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} precision={2} formatter={currencyFormatter} parser={currencyParser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valorIptu" label="Valor do IPTU (anual)">
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} precision={2} formatter={currencyFormatter} parser={currencyParser} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientationMargin={0}>Proprietário</Divider>
          <Form.Item name="nomeProprietario" label="Nome do proprietário" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="contatoProprietario1" label="Telefone / WhatsApp 1" rules={[{ required: true }]}>
                <Input placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contatoProprietario2" label="Telefone 2 (opcional)">
                <Input placeholder="(00) 00000-0000" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientationMargin={0}>Fotos <Text type="secondary" style={{ fontWeight: 400 }}>(links Google Drive / OneDrive)</Text></Divider>
          <Form.List name="linksFotos">
            {(fields, { add, remove: removeField }) => (
              <>
                {fields.map(field => (
                  <Form.Item key={field.key} style={{ marginBottom: 8 }}>
                    <Space.Compact style={{ width: '100%' }}>
                      <Form.Item name={field.name} noStyle>
                        <Input prefix={<LinkOutlined />} placeholder="https://drive.google.com/..." />
                      </Form.Item>
                      <Button icon={<MinusCircleOutlined />} onClick={() => removeField(field.name)} />
                    </Space.Compact>
                  </Form.Item>
                ))}
                <Button type="dashed" onClick={() => add('')} icon={<PlusOutlined />} block>
                  Adicionar link de foto
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientationMargin={0}>Observações</Divider>
          <Form.Item name="observacoes">
            <Input.TextArea rows={3} placeholder="Notas adicionais sobre o imóvel..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Modal de Comissão → Financeiro */}
      <Modal
        title={<span><DollarOutlined style={{ color: '#52c41a' }} /> Lançar Comissão — Imóvel {modalComissao.imovel?.codigo}</span>}
        open={modalComissao.open}
        onCancel={() => setModalComissao({ open: false, imovel: null })}
        onOk={salvarComissao}
        okText="Lançar em Contas a Receber"
        confirmLoading={salvandoComissao}
        width={580}
      >
        {modalComissao.imovel && (
          <div>
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
              <Text type="secondary">Venda: </Text>
              <Text strong>{fmtBRL(modalComissao.imovel.valorVenda)}</Text>
              <Text type="secondary" style={{ marginLeft: 16 }}>Comissão 6%: </Text>
              <Text strong style={{ color: '#52c41a' }}>{fmtBRL((modalComissao.imovel.valorVenda || 0) * 0.06)}</Text>
            </div>
            <Form form={formComissao} layout="vertical">
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="clienteNome" label="Comprador / Cliente" rules={[{ required: true }]}>
                    <Input placeholder="Nome do comprador" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="valorTotal" label="Valor da Comissão (R$)" rules={[{ required: true }]}>
                    <InputNumber
                      style={{ width: '100%' }} min={0} precision={2}
                      formatter={currencyFormatter} parser={currencyParser}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="observacoes" label="Observações">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Divider style={{ margin: '8px 0' }}>Parcelas</Divider>
              <Row gutter={12} align="bottom">
                <Col span={7}>
                  <Form.Item label="Nº parcelas" style={{ marginBottom: 8 }}>
                    <InputNumber min={1} max={60} value={qtdParcelasComissao} onChange={v => setQtdParcelasComissao(Number(v) || 1)} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item name="primeiroVencimento" label="1º Vencimento" style={{ marginBottom: 8 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={7}>
                  <Form.Item style={{ marginBottom: 8 }}>
                    <Button block onClick={gerarParcelasComissao}>Gerar</Button>
                  </Form.Item>
                </Col>
              </Row>
              {parcelasComissao.length > 0 && (
                <Table
                  size="small" pagination={false} dataSource={parcelasComissao} rowKey="id"
                  columns={[
                    { title: '#', render: (_, __, i) => `${i + 1}/${parcelasComissao.length}`, width: 60 },
                    { title: 'Valor', dataIndex: 'valor', render: (v: number) => fmtBRL(v) },
                    { title: 'Vencimento', dataIndex: 'vencimento', render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
                    {
                      title: 'Status', dataIndex: 'pago', width: 110,
                      render: (pago: boolean, rec: ParcelaFinanceiro) => (
                        <Button
                          size="small" type={pago ? 'primary' : 'default'}
                          icon={pago ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                          onClick={() => setParcelasComissao(prev =>
                            prev.map(p => p.id === rec.id
                              ? { ...p, pago: !p.pago, dataPagamento: !p.pago ? new Date().toISOString().slice(0, 10) : undefined }
                              : p)
                          )}
                        >
                          {pago ? 'Recebido' : 'Pendente'}
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
