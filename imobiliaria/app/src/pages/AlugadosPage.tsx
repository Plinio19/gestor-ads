import { useEffect, useState } from 'react';
import {
  Table, Tag, Modal, Form, Input, DatePicker,
  message, Typography, Tooltip, Button, Divider, Row, Col, Empty,
} from 'antd';
import {
  EditOutlined, FileTextOutlined, LinkOutlined, PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Imovel, Contrato } from '../types';
import { useImoveisStore } from '../stores/useImoveisStore';
import { useContratosStore } from '../stores/useContratosStore';

const { Text, Title } = Typography;

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
function fmtBRL(v?: number) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return dayjs(d).format('DD/MM/YYYY');
}

export default function AlugadosPage() {
  const { imoveis, fetch: fetchImoveis } = useImoveisStore();
  const { contratos, fetch: fetchContratos, upsert } = useContratosStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [imovelSel, setImovelSel] = useState<Imovel | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    void fetchImoveis();
    void fetchContratos();
  }, [fetchImoveis, fetchContratos]);

  const alugados = imoveis.filter(i => i.status === 'alugado');

  const abrirContrato = (imovel: Imovel) => {
    setImovelSel(imovel);
    const contrato = contratos.find(c => c.imovelId === imovel.id);
    form.setFieldsValue({
      nomeInquilino: contrato?.nomeInquilino ?? '',
      contatoInquilino: contrato?.contatoInquilino ?? '',
      dataAssinatura: contrato?.dataAssinatura ? dayjs(contrato.dataAssinatura) : null,
      linkContrato: contrato?.linkContrato ?? '',
      observacoes: contrato?.observacoes ?? '',
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!imovelSel) return;
    try {
      const vals = await form.validateFields();
      setSalvando(true);
      const existente = contratos.find(c => c.imovelId === imovelSel.id);
      const contrato: Contrato = {
        id: existente?.id ?? uid(),
        imovelId: imovelSel.id,
        nomeInquilino: vals.nomeInquilino as string,
        contatoInquilino: vals.contatoInquilino as string,
        dataAssinatura: (vals.dataAssinatura as dayjs.Dayjs).format('YYYY-MM-DD'),
        linkContrato: vals.linkContrato as string | undefined,
        observacoes: vals.observacoes as string | undefined,
        criadoEm: existente?.criadoEm ?? new Date().toISOString(),
      };
      await upsert(contrato);
      message.success('Contrato salvo!');
      setModalOpen(false);
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Erro ao salvar: ' + String(e));
    } finally {
      setSalvando(false);
    }
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      width: 90,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Imóvel',
      key: 'imovel',
      render: (_: unknown, r: Imovel) => (
        <div>
          <div>{r.endereco}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.bairro} · {r.cidade}/{r.estado}</Text>
        </div>
      ),
    },
    {
      title: 'Proprietário',
      key: 'prop',
      width: 180,
      render: (_: unknown, r: Imovel) => (
        <div>
          <div>{r.nomeProprietario}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {r.contatoProprietario1}
          </Text>
        </div>
      ),
    },
    {
      title: 'Inquilino',
      key: 'inquilino',
      width: 180,
      render: (_: unknown, r: Imovel) => {
        const c = contratos.find(x => x.imovelId === r.id);
        return c ? (
          <div>
            <div>{c.nomeInquilino}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined /> {c.contatoInquilino}
            </Text>
          </div>
        ) : <Tag color="warning">Pendente</Tag>;
      },
    },
    {
      title: 'Assinatura',
      key: 'assinatura',
      width: 110,
      render: (_: unknown, r: Imovel) => {
        const c = contratos.find(x => x.imovelId === r.id);
        return <Text>{c ? fmtDate(c.dataAssinatura) : '—'}</Text>;
      },
    },
    {
      title: 'Aluguel',
      dataIndex: 'valorAluguel',
      width: 120,
      render: (v: number) => <Text>{fmtBRL(v)}</Text>,
    },
    {
      title: 'Cond.',
      dataIndex: 'valorCondominio',
      width: 110,
      render: (v: number) => <Text type="secondary">{fmtBRL(v)}</Text>,
    },
    {
      title: 'IPTU (anual)',
      dataIndex: 'valorIptu',
      width: 120,
      render: (v: number) => <Text type="secondary">{fmtBRL(v)}</Text>,
    },
    {
      title: 'Contrato',
      key: 'contrato',
      width: 90,
      render: (_: unknown, r: Imovel) => {
        const c = contratos.find(x => x.imovelId === r.id);
        return c?.linkContrato ? (
          <Tooltip title="Abrir contrato">
            <a href={c.linkContrato} target="_blank" rel="noopener noreferrer">
              <FileTextOutlined style={{ fontSize: 18, color: '#1677ff' }} />
            </a>
          </Tooltip>
        ) : '—';
      },
    },
    {
      title: '',
      key: 'acoes',
      width: 60,
      render: (_: unknown, r: Imovel) => (
        <Tooltip title="Editar dados do contrato">
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirContrato(r)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <FileTextOutlined style={{ fontSize: 22, color: '#cf1322' }} />
        <Title level={4} style={{ margin: 0 }}>Imóveis Alugados</Title>
        <Tag color="red">{alugados.length} imóvel{alugados.length !== 1 ? 's' : ''}</Tag>
      </div>

      {alugados.length === 0 ? (
        <Empty description="Nenhum imóvel com status 'Alugado'" />
      ) : (
        <Table
          rowKey="id"
          dataSource={alugados}
          columns={columns}
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1000 }}
          size="small"
        />
      )}

      <Modal
        title={imovelSel ? `Contrato — ${imovelSel.codigo} · ${imovelSel.endereco}` : 'Contrato'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={salvar}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={salvando}
        width={600}
        destroyOnHidden
      >
        {imovelSel && (
          <div style={{ marginBottom: 16, background: '#f5f5f5', borderRadius: 8, padding: '10px 14px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Proprietário</Text>
                <div><Text strong>{imovelSel.nomeProprietario}</Text></div>
                <Text type="secondary">{imovelSel.contatoProprietario1}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Valores</Text>
                <div>Aluguel: <Text strong>{fmtBRL(imovelSel.valorAluguel)}</Text></div>
                <div>Cond.: {fmtBRL(imovelSel.valorCondominio)} · IPTU: {fmtBRL(imovelSel.valorIptu)}</div>
              </Col>
            </Row>
          </div>
        )}
        <Divider orientationMargin={0}>Inquilino</Divider>
        <Form form={form} layout="vertical">
          <Form.Item name="nomeInquilino" label="Nome do inquilino" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contatoInquilino" label="Telefone / WhatsApp do inquilino" rules={[{ required: true }]}>
            <Input placeholder="(00) 00000-0000" />
          </Form.Item>
          <Form.Item name="dataAssinatura" label="Data de assinatura do contrato" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="linkContrato" label={<>Link do contrato <Text type="secondary">(Google Drive / OneDrive)</Text></>}>
            <Input prefix={<LinkOutlined />} placeholder="https://drive.google.com/..." />
          </Form.Item>
          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
