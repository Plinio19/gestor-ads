import { useEffect, useState, useRef } from 'react';
import {
  Drawer, Form, Input, Button, Space, Row, Col, Select, InputNumber,
  Typography, message, Divider, Checkbox, Alert, Modal,
} from 'antd';
import { BellOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { Negocio, Etapa, Cliente } from '../../types';
import { useNegociosStore } from '../../stores/useNegociosStore';
import { useClientesStore } from '../../stores/useClientesStore';
import { useAtividadesStore } from '../../stores/useAtividadesStore';
import { uid, hoje, ETAPAS, ORIGENS, SEGMENTOS, ESTADOS_BR } from '../../utils';

const { Text } = Typography;

interface Props {
  negocio: Negocio | null;
  etapaInicial?: Etapa;
  open: boolean;
  onClose: () => void;
}

const INTERVALOS = [
  { value: 1,  label: '1 dia'    },
  { value: 2,  label: '2 dias'   },
  { value: 3,  label: '3 dias'   },
  { value: 5,  label: '5 dias'   },
  { value: 7,  label: '1 semana' },
  { value: 14, label: '2 semanas'},
  { value: 30, label: '1 mês'    },
];

function somarDias(base: string, dias: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function NovoClienteModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [form] = Form.useForm();
  const { upsert, fetch: refetch } = useClientesStore();
  const [salvando, setSalvando] = useState(false);
  const cnpjTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cnpjOk, setCnpjOk] = useState(false);

  useEffect(() => {
    if (open) { form.resetFields(); setCnpjOk(false); }
  }, [open]);

  function maskCNPJ(v: string) {
    return v.replace(/\D/g, '').slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  function handleCNPJChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCNPJ(e.target.value);
    form.setFieldValue('cnpj', masked);
    setCnpjOk(false);
    if (cnpjTimerRef.current) clearTimeout(cnpjTimerRef.current);
    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 14) return;
    cnpjTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if (!res.ok) return;
        const d = await res.json();
        form.setFieldsValue({
          razaoSocial: d.razao_social ?? '',
          nomeFantasia: d.nome_fantasia ?? d.razao_social ?? '',
          telefone: d.ddd_telefone_1 ? d.ddd_telefone_1.replace(/\D/g,'').replace(/(\d{2})(\d{4,5})(\d{4})/,'($1) $2-$3') : '',
          email: d.email ?? '',
          cidade: d.municipio ?? '',
          uf: d.uf ?? '',
        });
        setCnpjOk(true);
      } catch { /* ignora */ }
    }, 600);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setSalvando(true);
    try {
      const novoId = uid();
      const cliente: Cliente = {
        id: novoId,
        razaoSocial: values.razaoSocial ?? '',
        nomeFantasia: values.nomeFantasia ?? '',
        cnpj: values.cnpj ?? '',
        telefone: values.telefone ?? '',
        email: values.email ?? '',
        site: '',
        segmento: values.segmento ?? '',
        cidade: values.cidade ?? '',
        uf: values.uf ?? '',
        status: 'prospecto',
        obs: '',
        contatos: [],
        criadoEm: hoje(),
      };
      await upsert(cliente);
      await refetch(true);
      message.success(`Cliente "${values.nomeFantasia || values.razaoSocial}" cadastrado!`);
      onCreated(novoId);
      onClose();
    } catch (e) {
      message.error('Erro: ' + String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Cadastro Rápido de Cliente"
      onCancel={onClose}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={salvando} onClick={handleSave}>
            Salvar cliente
          </Button>
        </Space>
      }
      width={500}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="cnpj" label="CNPJ">
          <Input
            placeholder="00.000.000/0001-00"
            onChange={handleCNPJChange}
            suffix={cnpjOk ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
          />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="razaoSocial" label="Razão Social" rules={[{ required: true, message: 'Obrigatório' }]}>
              <Input placeholder="Nome jurídico" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="nomeFantasia" label="Nome Fantasia">
              <Input placeholder="Como é conhecido" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="telefone" label="Telefone">
              <Input placeholder="(00) 00000-0000" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="E-mail">
              <Input placeholder="contato@empresa.com" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="segmento" label="Segmento">
              <Select
                placeholder="Selecione..."
                allowClear
                options={SEGMENTOS.map(s => ({ value: s, label: s }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="cidade" label="Cidade">
              <Input placeholder="Ex: Curitiba" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="uf" label="UF">
              <Select
                placeholder="UF"
                options={ESTADOS_BR.map(s => ({ value: s, label: s }))}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default function NegocioForm({ negocio, etapaInicial, open, onClose }: Props) {
  const [form] = Form.useForm();
  const { upsert } = useNegociosStore();
  const { clientes, fetch: fetchClientes, loaded } = useClientesStore();
  const { upsert: upsertAtiv } = useAtividadesStore();
  const [salvando, setSalvando] = useState(false);
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);

  // Follow-up
  const [agendarFollowUp, setAgendarFollowUp] = useState(false);
  const [intervalo, setIntervalo] = useState<number>(3);
  const [etapaAtual, setEtapaAtual] = useState<Etapa>('lead');

  useEffect(() => { if (!loaded) fetchClientes(); }, [loaded, fetchClientes]);

  useEffect(() => {
    if (!open) return;
    if (negocio) {
      form.setFieldsValue(negocio);
      setEtapaAtual(negocio.etapa);
    } else {
      form.resetFields();
      const ep = etapaInicial ?? 'lead';
      form.setFieldsValue({
        etapa: ep,
        dataAbertura: hoje(),
        probabilidade: '50',
      });
      setEtapaAtual(ep);
    }
    // Pré-ativa o follow-up para proposta/negociação
    const ep = negocio?.etapa ?? etapaInicial ?? 'lead';
    setAgendarFollowUp(['proposta', 'negociacao'].includes(ep));
    setIntervalo(ep === 'proposta' ? 3 : 2);
  }, [open, negocio, etapaInicial]);

  async function handleSubmit(values: Partial<Negocio>) {
    setSalvando(true);
    try {
      const novoId = negocio?.id ?? uid();
      const data: Negocio = {
        ...values as Negocio,
        id: novoId,
        criadoEm: negocio?.criadoEm ?? hoje(),
        valor: String(values.valor ?? ''),
        probabilidade: String(values.probabilidade ?? ''),
      };
      await upsert(data);

      // Criar atividade de follow-up automaticamente
      if (agendarFollowUp && intervalo) {
        const dataFollowUp = somarDias(hoje(), intervalo);
        const clienteNome = clientes.find(c => c.id === data.clienteId)?.nomeFantasia
          || clientes.find(c => c.id === data.clienteId)?.razaoSocial
          || '';
        await upsertAtiv({
          id: uid(),
          tipo: 'tarefa',
          descricao: `Follow-up: ${data.titulo}${clienteNome ? ' — ' + clienteNome : ''}`,
          clienteId: data.clienteId,
          negocioId: novoId,
          data: dataFollowUp,
          concluida: false,
          obs: `Cobrança de orçamento a cada ${intervalo} dia(s). Próximo em: ${dataFollowUp}`,
          criadoEm: hoje(),
        });
        message.success(`Negócio salvo! Follow-up agendado para ${dataFollowUp.split('-').reverse().join('/')}.`);
      } else {
        message.success(`Negócio ${negocio ? 'atualizado' : 'criado'}!`);
      }
      onClose();
    } catch (e) {
      message.error('Erro: ' + String(e));
    } finally {
      setSalvando(false);
    }
  }

  const etapaVal = etapaAtual;
  const mostrarFollowUp = ['proposta', 'negociacao', 'qualificado'].includes(etapaVal);

  return (
    <Drawer
      title={negocio ? 'Editar Negócio' : 'Novo Negócio'}
      open={open}
      onClose={onClose}
      width={600}
      destroyOnHidden
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={salvando} onClick={() => form.submit()}>
            {negocio ? 'Salvar' : 'Criar negócio'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="titulo" label="Título do Negócio" rules={[{ required: true, message: 'Obrigatório' }]}>
          <Input placeholder="Ex: Fornecimento de Xileno – Lab UFPR" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={14}>
            <Form.Item
              name="clienteId"
              label={
                <Space size={6}>
                  <span>Cliente</span>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    style={{ padding: 0, height: 'auto', fontSize: 12 }}
                    onClick={() => setNovoClienteOpen(true)}
                  >
                    Novo
                  </Button>
                </Space>
              }
              rules={[{ required: true, message: 'Selecione o cliente' }]}
            >
              <Select
                placeholder="Selecione ou crie um novo →"
                showSearch
                optionFilterProp="label"
                options={clientes.map(c => ({
                  value: c.id,
                  label: c.nomeFantasia || c.razaoSocial,
                }))}
              />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="etapa" label="Etapa">
              <Select
                onChange={(v: Etapa) => {
                  setEtapaAtual(v);
                  setAgendarFollowUp(['proposta', 'negociacao'].includes(v));
                }}
                options={ETAPAS.map(e => ({
                  value: e.key,
                  label: <Space size={6}><span>{e.icone}</span><span>{e.label}</span></Space>,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="valor" label="Valor Estimado (R$)">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0,00"
                decimalSeparator=","
                precision={2}
                min={0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="probabilidade" label="Probabilidade (%)">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="50"
                min={0}
                max={100}
                suffix="%"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="dataAbertura" label="Data de Abertura">
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dataFechamento" label="Previsão de Fechamento">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="origem" label="Origem">
          <Select
            placeholder="Como chegou este lead?"
            allowClear
            options={ORIGENS.map(o => ({ value: o, label: o }))}
          />
        </Form.Item>

        <Form.Item name="descricao" label="Descrição / Observações">
          <Input.TextArea
            rows={2}
            placeholder="Detalhes do produto, contexto da oportunidade..."
          />
        </Form.Item>
      </Form>

      {/* Seção de Follow-up */}
      {mostrarFollowUp && (
        <>
          <Divider style={{ margin: '8px 0 16px' }} />
          <div style={{
            background: agendarFollowUp ? '#f0f5ff' : '#fafafa',
            border: `1px solid ${agendarFollowUp ? '#adc6ff' : '#e8e8e8'}`,
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <BellOutlined style={{ color: '#6C2BD9', fontSize: 16 }} />
              <Text strong style={{ fontSize: 14 }}>Agendar Follow-up</Text>
            </div>

            <Checkbox
              checked={agendarFollowUp}
              onChange={e => setAgendarFollowUp(e.target.checked)}
              style={{ marginBottom: agendarFollowUp ? 12 : 0 }}
            >
              Cobrar este orçamento automaticamente
            </Checkbox>

            {agendarFollowUp && (
              <>
                <Alert
                  type="info"
                  style={{ marginBottom: 12, fontSize: 12 }}
                  message="Uma tarefa de follow-up será criada automaticamente e aparecerá na Agenda do Dashboard no dia programado."
                  showIcon
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 13, whiteSpace: 'nowrap' }}>Cobrar daqui a</Text>
                  <Select
                    value={intervalo}
                    onChange={setIntervalo}
                    style={{ width: 130 }}
                    options={INTERVALOS}
                  />
                  <Text style={{ fontSize: 12, color: '#888' }}>
                    → {somarDias(hoje(), intervalo).split('-').reverse().join('/')}
                  </Text>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {negocio && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Criado em {negocio.criadoEm} · ID: {negocio.id}
          </Text>
        </div>
      )}

      <NovoClienteModal
        open={novoClienteOpen}
        onClose={() => setNovoClienteOpen(false)}
        onCreated={(id) => {
          form.setFieldValue('clienteId', id);
          setNovoClienteOpen(false);
        }}
      />
    </Drawer>
  );
}
