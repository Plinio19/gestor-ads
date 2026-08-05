import { useEffect, useState, useRef } from 'react';
import {
  Drawer, Form, Input, Select, Button, Space, Checkbox, Row, Col,
  Divider, Typography, Tag, Popconfirm, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, FilePdfOutlined, UploadOutlined,
} from '@ant-design/icons';
import type { Transportadora, Licenca } from '../../types';
import { useTransportadorasStore } from '../../stores/useTransportadorasStore';
import { dataService } from '../../services/GitHubDataService';
import { uid, hoje, formatarData, statusLicenca, diasParaVencer, ESTADOS_BR } from '../../utils';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  transportadora: Transportadora | null;
  open: boolean;
  onClose: () => void;
}

interface LicencaLocal extends Licenca {
  arquivoPendente?: File;
}

const QUIMICO_OPTIONS = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
  { value: 'consultar', label: 'Consultar' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' },
];

function LicencaTag({ lic }: { lic: LicencaLocal }) {
  const s = statusLicenca(lic.vencimento);
  const dias = lic.vencimento ? diasParaVencer(lic.vencimento) : null;
  const colorMap = { ok: 'green', vencendo: 'orange', vencida: 'red', sem: 'default' } as const;
  const label = s === 'sem' ? 'Sem data'
    : s === 'vencida' ? `Venceu ${formatarData(lic.vencimento)}`
    : `Vence em ${dias}d (${formatarData(lic.vencimento)})`;
  return <Tag color={colorMap[s]} style={{ fontSize: 11 }}>{label}</Tag>;
}

export default function TransportadoraForm({ transportadora, open, onClose }: Props) {
  const [form] = Form.useForm();
  const { upsert } = useTransportadorasStore();
  const [loading, setLoading] = useState(false);
  const [licencas, setLicencas] = useState<LicencaLocal[]>([]);
  const [novaLicTipo, setNovaLicTipo] = useState('');
  const [novaLicVenc, setNovaLicVenc] = useState('');
  const [novaLicFile, setNovaLicFile] = useState<File | null>(null);
  const [showNovaLic, setShowNovaLic] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (transportadora) {
      form.setFieldsValue({
        nome: transportadora.nome,
        quimico: transportadora.quimico ?? 'consultar',
        status: transportadora.status ?? 'ativo',
        telefone: transportadora.telefone,
        email: transportadora.email,
        site: transportadora.site,
        contato: transportadora.contato,
        obs: transportadora.obs,
        estados: transportadora.estados,
      });
      setLicencas((transportadora.licencas || []).map(l => ({ ...l })));
    } else {
      form.resetFields();
      form.setFieldsValue({ quimico: 'consultar', status: 'ativo', estados: [] });
      setLicencas([]);
    }
    setShowNovaLic(false);
    setNovaLicTipo('');
    setNovaLicVenc('');
    setNovaLicFile(null);
  }, [open, transportadora]);

  function adicionarLicenca() {
    if (!novaLicTipo.trim()) { message.warning('Informe o tipo da licença.'); return; }
    const nova: LicencaLocal = {
      id: uid(),
      tipo: novaLicTipo.trim(),
      vencimento: novaLicVenc || null,
      arquivoPendente: novaLicFile ?? undefined,
      nomeArquivo: novaLicFile?.name,
    };
    setLicencas(prev => [...prev, nova]);
    setNovaLicTipo('');
    setNovaLicVenc('');
    setNovaLicFile(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowNovaLic(false);
  }

  function removerLicenca(id: string) {
    setLicencas(prev => prev.filter(l => l.id !== id));
  }

  async function handleSubmit(values: Record<string, unknown>) {
    setLoading(true);
    try {
      const novaId = transportadora?.id ?? uid();
      const licencasSalvas: Licenca[] = [];

      for (const lic of licencas) {
        const licSalva: Licenca = { id: lic.id, tipo: lic.tipo, vencimento: lic.vencimento };

        if (lic.arquivoPendente) {
          if (dataService.isConfigured()) {
            try {
              const nomeArquivo = `${novaId}_${Date.now()}_${lic.arquivoPendente.name.replace(/\s+/g, '_')}`;
              const path = `transportadoras/licencas/${nomeArquivo}`;
              const b64 = await fileToB64(lic.arquivoPendente);
              await dataService.uploadFile(path, b64, `Upload licença: ${lic.arquivoPendente.name}`);
              licSalva.arquivo = path;
              licSalva.nomeArquivo = lic.arquivoPendente.name;
            } catch (e) {
              message.error(`Erro ao enviar PDF "${lic.nomeArquivo}": ${String(e)}`);
            }
          } else {
            licSalva.nomeArquivo = lic.arquivoPendente.name;
          }
        } else if (lic.arquivo) {
          licSalva.arquivo = lic.arquivo;
          licSalva.nomeArquivo = lic.nomeArquivo;
        }

        licencasSalvas.push(licSalva);
      }

      const data: Transportadora = {
        id: novaId,
        nome: String(values.nome),
        quimico: (values.quimico as Transportadora['quimico']) ?? 'consultar',
        status: (values.status as Transportadora['status']) ?? 'ativo',
        telefone: String(values.telefone ?? ''),
        email: String(values.email ?? ''),
        site: String(values.site ?? ''),
        contato: String(values.contato ?? ''),
        obs: String(values.obs ?? ''),
        estados: (values.estados as string[]) ?? [],
        licencas: licencasSalvas,
      };

      await upsert(data);
      message.success(`Transportadora ${transportadora ? 'atualizada' : 'salva'} com sucesso!`);
      onClose();
    } catch (e) {
      message.error('Erro ao salvar: ' + String(e));
    }
    setLoading(false);
  }

  return (
    <Drawer
      title={transportadora ? 'Editar Transportadora' : 'Nova Transportadora'}
      open={open}
      onClose={onClose}
      width={680}
      destroyOnHidden
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={loading} onClick={() => form.submit()}>
            {transportadora ? 'Salvar alterações' : 'Salvar'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={12}>
          <Col span={16}>
            <Form.Item name="nome" label="Nome *" rules={[{ required: true, message: 'Nome obrigatório' }]}>
              <Input placeholder="Ex: Braspress, JadLog..." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Status">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="quimico" label="Transporta Químico">
              <Select options={QUIMICO_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="contato" label="Nome do Contato">
              <Input placeholder="Pessoa responsável" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="telefone" label="Telefone / WhatsApp">
              <Input placeholder="(11) 9 0000-0000" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="E-mail">
              <Input placeholder="contato@transp.com.br" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="site" label="Site">
          <Input placeholder="www.transportadora.com.br" />
        </Form.Item>

        <Form.Item name="obs" label="Observações">
          <TextArea rows={2} placeholder="Prazo médio, modalidades, tabela de preços..." />
        </Form.Item>

        <Form.Item name="estados" label="Estados Atendidos *">
          <Checkbox.Group style={{ width: '100%' }}>
            <Row gutter={[4, 4]}>
              {ESTADOS_BR.map(e => (
                <Col key={e} style={{ width: '14.28%' }}>
                  <Checkbox value={e}>{e}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>

        <Space style={{ marginBottom: 4 }}>
          <Button
            size="small"
            onClick={() => form.setFieldValue('estados', ESTADOS_BR)}
          >
            Todos
          </Button>
          <Button
            size="small"
            onClick={() => form.setFieldValue('estados', [])}
          >
            Limpar
          </Button>
        </Space>
      </Form>

      <Divider style={{ margin: '16px 0' }} />

      {/* Licenças */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Licenças e Documentos</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={() => setShowNovaLic(v => !v)}>
          Adicionar
        </Button>
      </div>

      {licencas.length === 0 && !showNovaLic && (
        <Text type="secondary" style={{ fontSize: 12 }}>Nenhuma licença cadastrada.</Text>
      )}

      <Space direction="vertical" style={{ width: '100%' }} size={6}>
        {licencas.map(lic => (
          <div
            key={lic.id}
            style={{
              background: '#f8faff',
              border: '1px solid #e8f0fe',
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 13 }}>{lic.tipo}</Text>
              <div style={{ marginTop: 4 }}>
                <LicencaTag lic={lic} />
                {lic.arquivo && (
                  <a
                    href={dataService.rawUrl(lic.arquivo)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 8, fontSize: 12 }}
                  >
                    <FilePdfOutlined /> Ver PDF
                  </a>
                )}
                {lic.arquivoPendente && (
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    📎 {lic.nomeArquivo} (será enviado ao salvar)
                  </Text>
                )}
              </div>
            </div>
            <Popconfirm
              title="Remover licença?"
              onConfirm={() => removerLicenca(lic.id)}
              okText="Remover"
              okType="danger"
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </div>
        ))}
      </Space>

      {showNovaLic && (
        <div style={{
          marginTop: 12,
          background: '#f0f7ff',
          border: '1px dashed #1677ff',
          borderRadius: 8,
          padding: 14,
        }}>
          <Text strong style={{ fontSize: 12, color: '#1677ff' }}>Nova Licença</Text>
          <Row gutter={10} style={{ marginTop: 10 }}>
            <Col span={14}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Tipo de Licença</div>
              <Input
                value={novaLicTipo}
                onChange={e => setNovaLicTipo(e.target.value)}
                placeholder="Ex: ANTT, IBAMA, Alvará..."
                size="small"
              />
            </Col>
            <Col span={10}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>Vencimento</div>
              <Input
                type="date"
                value={novaLicVenc}
                onChange={e => setNovaLicVenc(e.target.value)}
                size="small"
                min={hoje()}
              />
            </Col>
          </Row>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>PDF (opcional)</div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.PDF"
              style={{ display: 'none' }}
              onChange={e => setNovaLicFile(e.target.files?.[0] ?? null)}
            />
            <Button
              size="small"
              icon={<UploadOutlined />}
              onClick={() => fileRef.current?.click()}
            >
              {novaLicFile ? novaLicFile.name : 'Selecionar PDF'}
            </Button>
            {novaLicFile && (
              <Button
                size="small"
                type="text"
                danger
                onClick={() => {
                  setNovaLicFile(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
                style={{ marginLeft: 8 }}
              >
                ✕
              </Button>
            )}
          </div>
          <Space style={{ marginTop: 12 }}>
            <Button size="small" onClick={() => { setShowNovaLic(false); setNovaLicTipo(''); setNovaLicVenc(''); setNovaLicFile(null); }}>
              Cancelar
            </Button>
            <Button size="small" type="primary" onClick={adicionarLicenca}>
              ✓ Adicionar
            </Button>
          </Space>
        </div>
      )}
    </Drawer>
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
