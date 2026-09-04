import { useEffect, useState } from 'react';
import {
  Button, Table, Tag, Space, Form, Input, Select,
  InputNumber, Switch, Drawer, Row, Col, Tooltip, Popconfirm,
  message, Badge, Divider, Typography, Empty,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined,
  SearchOutlined, FilterOutlined, LinkOutlined, MinusCircleOutlined,
} from '@ant-design/icons';
import type { Imovel } from '../types';
import { useImoveisStore } from '../stores/useImoveisStore';

const { Text, Title } = Typography;

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
function fmtBRL(v?: number) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const IMOVEL_VAZIO: Partial<Imovel> = {
  quartos: 0, banheiros: 1, vagasGaragem: 0,
  mobiliado: false, quintal: false, lavanderia: false, aceitaPet: false,
  status: 'disponivel', finalidade: 'locacao', linksFotos: [],
};

export default function ImoveisPage() {
  const { imoveis, loading, fetch, upsert, remove } = useImoveisStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Imovel | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroFinalidade, setFiltroFinalidade] = useState<string>('todos');
  const [form] = Form.useForm();

  useEffect(() => { void fetch(); }, [fetch]);

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
    return matchBusca && matchStatus && matchFinalidade;
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
      title: 'Detalhes',
      key: 'detalhes',
      width: 160,
      render: (_: unknown, r: Imovel) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {r.quartos}q · {r.banheiros}bh · {r.vagasGaragem}vg
          {r.area ? ` · ${r.area}m²` : ''}
        </Text>
      ),
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
      width: 80,
      render: (_: unknown, r: Imovel) => (
        <Space>
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
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} decimalSeparator="," formatter={v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valorVenda" label="Valor de venda">
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} decimalSeparator="," formatter={v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valorCondominio" label="Valor do condomínio">
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} decimalSeparator="," formatter={v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valorIptu" label="Valor do IPTU (anual)">
                <InputNumber style={{ width: '100%' }} prefix="R$" min={0} decimalSeparator="," formatter={v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} />
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
    </div>
  );
}
