import { useEffect, useState } from 'react';
import {
  Button, Table, Tag, Space, Form, Input, DatePicker, Drawer,
  Tooltip, Popconfirm, message, Typography, Alert, Modal,
  Empty, Select,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import type { RastreioNF } from '../../types';
import { useRastreioStore } from '../../stores/useRastreioStore';
import { useTransportadorasStore } from '../../stores/useTransportadorasStore';

const { Text, Title } = Typography;

function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return dayjs(d).format('DD/MM/YYYY');
}

function isVencida(nf: RastreioNF): boolean {
  if (nf.entregue) return false;
  return dayjs(nf.previsaoEntrega).isBefore(dayjs().startOf('day'));
}

export default function RastreioPage() {
  const { nfs, loading, fetch, upsert, remove, marcarEntregue } = useRastreioStore();
  const { transportadoras, fetch: fetchTrans, loaded: transLoaded } = useTransportadorasStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<RastreioNF | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  const [entregaModal, setEntregaModal] = useState<RastreioNF | null>(null);
  const [dataEntregaVal, setDataEntregaVal] = useState<Dayjs | null>(null);
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);

  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'entregues'>('todas');

  useEffect(() => { void fetch(); }, [fetch]);
  useEffect(() => { if (!transLoaded) void fetchTrans(); }, [fetchTrans, transLoaded]);

  const alertas = nfs.filter(isVencida);

  const nfsFiltradas = nfs.filter(nf => {
    if (filtro === 'pendentes') return !nf.entregue;
    if (filtro === 'entregues') return nf.entregue;
    return true;
  }).sort((a, b) => {
    // não entregues + vencidas primeiro
    const av = isVencida(a) ? 0 : a.entregue ? 2 : 1;
    const bv = isVencida(b) ? 0 : b.entregue ? 2 : 1;
    return av - bv;
  });

  const abrirNovo = () => {
    setEditando(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const abrirEditar = (nf: RastreioNF) => {
    setEditando(nf);
    form.setFieldsValue({
      ...nf,
      dataEmissao:     dayjs(nf.dataEmissao),
      dataVencimento:  dayjs(nf.dataVencimento),
      dataColeta:      nf.dataColeta ? dayjs(nf.dataColeta) : null,
      previsaoEntrega: dayjs(nf.previsaoEntrega),
    });
    setDrawerOpen(true);
  };

  const salvar = async () => {
    try {
      const vals = await form.validateFields();
      setSalvando(true);
      const nf: RastreioNF = {
        id: editando?.id ?? uid(),
        notaFiscal:     vals.notaFiscal as string,
        transportadora: vals.transportadora as string,
        dataEmissao:    (vals.dataEmissao as Dayjs).format('YYYY-MM-DD'),
        dataVencimento: (vals.dataVencimento as Dayjs).format('YYYY-MM-DD'),
        dataColeta:     vals.dataColeta ? (vals.dataColeta as Dayjs).format('YYYY-MM-DD') : null,
        previsaoEntrega:(vals.previsaoEntrega as Dayjs).format('YYYY-MM-DD'),
        entregue:       editando?.entregue ?? false,
        dataEntrega:    editando?.dataEntrega ?? null,
        obs:            vals.obs as string | undefined,
        criadoEm:       editando?.criadoEm ?? new Date().toISOString(),
      };
      await upsert(nf);
      message.success(editando ? 'NF atualizada!' : 'NF cadastrada!');
      setDrawerOpen(false);
    } catch (e) {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error('Erro ao salvar: ' + String(e));
    } finally {
      setSalvando(false);
    }
  };

  const confirmarEntrega = async () => {
    if (!entregaModal || !dataEntregaVal) return;
    setSalvandoEntrega(true);
    try {
      await marcarEntregue(entregaModal.id, dataEntregaVal.format('YYYY-MM-DD'));
      message.success(`NF ${entregaModal.notaFiscal} marcada como entregue!`);
      setEntregaModal(null);
      setDataEntregaVal(null);
    } catch (e) {
      message.error('Erro: ' + String(e));
    } finally {
      setSalvandoEntrega(false);
    }
  };

  const transOptions = transportadoras
    .filter(t => t.status === 'ativo')
    .map(t => ({ value: t.nome, label: t.nome }));

  const columns = [
    {
      title: 'NF',
      dataIndex: 'notaFiscal',
      width: 110,
      render: (v: string, r: RastreioNF) => (
        <Space>
          {isVencida(r) && <WarningOutlined style={{ color: '#ff4d4f' }} />}
          <Text strong>{v}</Text>
        </Space>
      ),
    },
    {
      title: 'Transportadora',
      dataIndex: 'transportadora',
      width: 160,
    },
    {
      title: 'Emissão',
      dataIndex: 'dataEmissao',
      width: 110,
      render: (v: string) => fmtDate(v),
    },
    {
      title: 'Vencimento',
      dataIndex: 'dataVencimento',
      width: 110,
      render: (v: string) => fmtDate(v),
    },
    {
      title: 'Coleta',
      dataIndex: 'dataColeta',
      width: 110,
      render: (v: string | null) => fmtDate(v),
    },
    {
      title: 'Prev. Entrega',
      dataIndex: 'previsaoEntrega',
      width: 120,
      render: (v: string, r: RastreioNF) => {
        const vencida = isVencida(r);
        return (
          <Text type={vencida ? 'danger' : undefined} strong={vencida}>
            {fmtDate(v)}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_: unknown, r: RastreioNF) => {
        if (r.entregue) return <Tag color="success">Entregue {fmtDate(r.dataEntrega)}</Tag>;
        if (isVencida(r)) return <Tag color="error">Verificar entrega</Tag>;
        return <Tag color="processing">Em trânsito</Tag>;
      },
    },
    {
      title: '',
      key: 'acoes',
      width: 120,
      render: (_: unknown, r: RastreioNF) => (
        <Space>
          {!r.entregue && (
            <Tooltip title="Marcar como entregue">
              <Button
                size="small"
                type="primary"
                ghost
                icon={<CheckCircleOutlined />}
                onClick={() => { setEntregaModal(r); setDataEntregaVal(dayjs()); }}
              />
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
          </Tooltip>
          <Popconfirm title="Remover esta NF?" onConfirm={() => remove(r.id)} okText="Sim" cancelText="Não">
            <Tooltip title="Excluir">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <Title level={4} style={{ margin: 0 }}>Rastreio de NFs</Title>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Select
            value={filtro}
            onChange={setFiltro}
            style={{ width: 140 }}
            options={[
              { value: 'todas',    label: 'Todas' },
              { value: 'pendentes', label: 'Pendentes' },
              { value: 'entregues', label: 'Entregues' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovo}>
            Nova NF
          </Button>
        </div>
      </div>

      {alertas.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          message={
            <Text strong>
              {alertas.length === 1
                ? '1 NF com previsão de entrega vencida — verifique se foi entregue'
                : `${alertas.length} NFs com previsão de entrega vencida — verifique se foram entregues`}
            </Text>
          }
          description={
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alertas.map(nf => (
                <div key={nf.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text>
                    NF <Text strong>{nf.notaFiscal}</Text> — {nf.transportadora}
                    {' · '}previsão <Text type="danger">{fmtDate(nf.previsaoEntrega)}</Text>
                  </Text>
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => { setEntregaModal(nf); setDataEntregaVal(dayjs()); }}
                  >
                    Marcar entregue
                  </Button>
                </div>
              ))}
            </div>
          }
        />
      )}

      {nfsFiltradas.length === 0 && !loading ? (
        <Empty description="Nenhuma NF cadastrada" />
      ) : (
        <Table
          rowKey="id"
          dataSource={nfsFiltradas}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 900 }}
          size="small"
          rowClassName={(r) => isVencida(r) ? 'row-alerta' : ''}
        />
      )}

      {/* Drawer: cadastrar / editar NF */}
      <Drawer
        title={editando ? `Editar NF ${editando.notaFiscal}` : 'Nova NF'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        footer={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" loading={salvando} onClick={salvar}>Salvar</Button>
          </Space>
        }
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="notaFiscal" label="Nota Fiscal" rules={[{ required: true, message: 'Informe o número da NF' }]}>
            <Input placeholder="Ex: 12345" />
          </Form.Item>

          <Form.Item name="transportadora" label="Transportadora" rules={[{ required: true, message: 'Selecione a transportadora' }]}>
            <Select
              showSearch
              placeholder="Selecione ou digite"
              options={transOptions}
              optionFilterProp="label"
              notFoundContent={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Nenhuma transportadora ativa — cadastre em Transportadoras
                </Text>
              }
            />
          </Form.Item>

          <Form.Item name="dataEmissao" label="Data de Emissão" rules={[{ required: true, message: 'Informe a data de emissão' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="dataVencimento" label="Vencimento" rules={[{ required: true, message: 'Informe o vencimento' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="dataColeta" label="Data de Coleta">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="previsaoEntrega" label="Previsão de Entrega" rules={[{ required: true, message: 'Informe a previsão de entrega' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="obs" label="Observações">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Modal: marcar como entregue */}
      <Modal
        title={`Confirmar entrega — NF ${entregaModal?.notaFiscal}`}
        open={!!entregaModal}
        onCancel={() => { setEntregaModal(null); setDataEntregaVal(null); }}
        onOk={confirmarEntrega}
        confirmLoading={salvandoEntrega}
        okText="Confirmar entrega"
        cancelText="Cancelar"
      >
        <div style={{ marginBottom: 12 }}>
          <Text>Informe a data real de entrega da NF <Text strong>{entregaModal?.notaFiscal}</Text>:</Text>
        </div>
        <DatePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          value={dataEntregaVal}
          onChange={setDataEntregaVal}
          disabledDate={d => d.isAfter(dayjs())}
        />
      </Modal>

      <style>{`
        .row-alerta td { background: #fff1f0 !important; }
        @media (prefers-color-scheme: dark) {
          .row-alerta td { background: #2a1215 !important; }
        }
      `}</style>
    </div>
  );
}

export function rastreioAlertCount(nfs: RastreioNF[]): number {
  const today = dayjs().startOf('day');
  return nfs.filter(nf => !nf.entregue && dayjs(nf.previsaoEntrega).isBefore(today)).length;
}
