import { useEffect, useState } from 'react';
import {
  Table, Button, Space, Input, Select, Typography, Row, Col, Drawer, Form,
  Popconfirm, message, Tooltip, Tag, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  FilePdfOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useRef } from 'react';
import type { Documento } from '../../types';
import { useDocumentosStore } from '../../stores/useDocumentosStore';
import { useTransportadorasStore } from '../../stores/useTransportadorasStore';
import { dataService } from '../../services/GitHubDataService';
import { uid, hoje, formatarData } from '../../utils';

const { Title, Text, Link } = Typography;

const TIPOS_DOC = ['NF', 'Pedido', 'CTe', 'DANFE', 'Boleto', 'Contrato', 'Outro'];

export default function DocumentosPage() {
  const { documentos, loading, fetch, upsert, remove } = useDocumentosStore();
  const { transportadoras, fetch: fetchTrans } = useTransportadorasStore();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Documento | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [arquivoPendente, setArquivoPendente] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch(); fetchTrans(); }, []);

  function abrirNovo() {
    setEditando(null);
    form.resetFields();
    form.setFieldsValue({ data: hoje(), tipo: 'NF' });
    setArquivoPendente(null);
    setDrawerOpen(true);
  }

  function abrirEditar(doc: Documento) {
    setEditando(doc);
    form.setFieldsValue(doc);
    setArquivoPendente(null);
    setDrawerOpen(true);
  }

  async function salvar(values: Record<string, unknown>) {
    setSaving(true);
    try {
      const docId = editando?.id ?? uid();
      let arquivo = editando?.arquivo;
      let nomeArquivo = editando?.nomeArquivo;

      if (arquivoPendente) {
        if (dataService.isConfigured()) {
          try {
            const nomeArq = `${docId}_${Date.now()}_${arquivoPendente.name.replace(/\s+/g, '_')}`;
            const path = `transportadoras/documentos/${nomeArq}`;
            const b64 = await fileToB64(arquivoPendente);
            await dataService.uploadFile(path, b64, `Upload documento: ${arquivoPendente.name}`);
            arquivo = path;
            nomeArquivo = arquivoPendente.name;
          } catch (e) {
            message.error('Erro ao enviar arquivo: ' + String(e));
          }
        } else {
          nomeArquivo = arquivoPendente.name;
        }
      }

      const doc: Documento = {
        id: docId,
        tipo: String(values.tipo ?? ''),
        numero: String(values.numero ?? ''),
        data: String(values.data ?? hoje()),
        transportadora: String(values.transportadora ?? ''),
        arquivo,
        nomeArquivo,
        obs: String(values.obs ?? ''),
      };

      await upsert(doc);
      message.success(`Documento ${editando ? 'atualizado' : 'salvo'}!`);
      setDrawerOpen(false);
    } catch (e) {
      message.error('Erro ao salvar: ' + String(e));
    }
    setSaving(false);
  }

  async function excluir(id: string) {
    try {
      await remove(id);
      message.success('Documento removido.');
    } catch (e) {
      message.error('Erro ao remover: ' + String(e));
    }
  }

  const filtrados = documentos.filter(d => {
    if (filtroTipo && d.tipo !== filtroTipo) return false;
    if (busca) {
      const h = [d.tipo, d.numero, d.transportadora, d.obs].join(' ').toLowerCase();
      if (!h.includes(busca.toLowerCase())) return false;
    }
    return true;
  });

  const columns: ColumnsType<Documento> = [
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      width: 90,
      render: (t: string) => <Tag style={{ fontSize: 11 }}>{t}</Tag>,
    },
    {
      title: 'Número',
      dataIndex: 'numero',
      width: 120,
      render: (n: string) => <Text strong>{n || '—'}</Text>,
    },
    {
      title: 'Data',
      dataIndex: 'data',
      width: 100,
      sorter: (a, b) => (a.data || '').localeCompare(b.data || ''),
      defaultSortOrder: 'descend',
      render: (d: string) => formatarData(d),
    },
    {
      title: 'Transportadora',
      dataIndex: 'transportadora',
      sorter: (a, b) => (a.transportadora || '').localeCompare(b.transportadora || ''),
    },
    {
      title: 'Arquivo',
      key: 'arquivo',
      width: 120,
      render: (_, record) => {
        if (record.arquivo) {
          return (
            <Link href={dataService.rawUrl(record.arquivo)} target="_blank" style={{ fontSize: 12 }}>
              <FilePdfOutlined /> {record.nomeArquivo ?? 'Ver PDF'}
            </Link>
          );
        }
        if (record.nomeArquivo) {
          return <Text type="secondary" style={{ fontSize: 12 }}>📎 {record.nomeArquivo}</Text>;
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
      },
    },
    {
      title: 'Observações',
      dataIndex: 'obs',
      ellipsis: true,
      render: (obs: string) => <Text type="secondary" style={{ fontSize: 12 }}>{obs}</Text>,
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 90,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />} onClick={() => abrirEditar(record)} />
          </Tooltip>
          <Popconfirm
            title="Excluir documento?"
            onConfirm={() => excluir(record.id)}
            okText="Excluir"
            okType="danger"
          >
            <Tooltip title="Excluir">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Documentos <Text type="secondary" style={{ fontSize: 14, fontWeight: 400 }}>({documentos.length})</Text>
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovo}>
            Novo Documento
          </Button>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={14}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar por número, transportadora..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={10}>
          <Select
            style={{ width: '100%' }}
            placeholder="Filtrar por tipo"
            value={filtroTipo}
            onChange={setFiltroTipo}
            options={[
              { value: '', label: 'Todos os tipos' },
              ...TIPOS_DOC.map(t => ({ value: t, label: t })),
            ]}
          />
        </Col>
      </Row>

      <Table
        dataSource={filtrados}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="middle"
        pagination={{ pageSize: 20, showTotal: t => `${t} documento(s)` }}
        locale={{ emptyText: 'Nenhum documento cadastrado.' }}
      />

      <Drawer
        title={editando ? 'Editar Documento' : 'Novo Documento'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        destroyOnHidden
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {editando ? 'Salvar alterações' : 'Salvar'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={salvar}>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
                <Select
                  options={TIPOS_DOC.map(t => ({ value: t, label: t }))}
                  placeholder="Selecione o tipo"
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="numero" label="Número">
                <Input placeholder="Ex: 12345" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="data" label="Data">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="transportadora" label="Transportadora">
                <Select
                  showSearch
                  placeholder="Selecione ou digite"
                  options={[
                    ...transportadoras.map(t => ({ value: t.nome, label: t.nome })),
                  ]}
                  filterOption={(input, opt) =>
                    (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="obs" label="Observações">
            <Input.TextArea rows={2} placeholder="Informações adicionais..." />
          </Form.Item>

          <Divider style={{ margin: '8px 0 16px' }}>Arquivo PDF (opcional)</Divider>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.PDF"
            style={{ display: 'none' }}
            onChange={e => setArquivoPendente(e.target.files?.[0] ?? null)}
          />

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              icon={<UploadOutlined />}
              onClick={() => fileRef.current?.click()}
            >
              {arquivoPendente ? arquivoPendente.name : (editando?.nomeArquivo ? `Atual: ${editando.nomeArquivo}` : 'Selecionar PDF')}
            </Button>
            {editando?.arquivo && !arquivoPendente && (
              <Link href={dataService.rawUrl(editando.arquivo)} target="_blank" style={{ fontSize: 12 }}>
                <FilePdfOutlined /> Ver arquivo atual
              </Link>
            )}
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}

function fileToB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve((e.target?.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
