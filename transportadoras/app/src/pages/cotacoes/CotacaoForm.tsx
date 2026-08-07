import { useEffect, useRef, useState } from 'react';
import {
  Drawer, Form, Input, Button, Space, Row, Col, Divider, Typography, message,
  Alert, Checkbox, Spin, Tag,
} from 'antd';
import { EyeOutlined, LoadingOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { Cotacao, TransRow, Transportadora } from '../../types';
import { useCotacoesStore } from '../../stores/useCotacoesStore';
import { useTransportadorasStore } from '../../stores/useTransportadorasStore';
import { uid, hoje } from '../../utils';
import CotacaoPreview from './CotacaoPreview';

const { Text } = Typography;

interface Props {
  cotacao: Cotacao | null;
  open: boolean;
  onClose: () => void;
}

interface UfInfo {
  uf: string;
  cidade: string;
  error?: string;
}

const EMPTY_ROW: TransRow = { trans: '', valor: '', cotacao: '', prazo: '' };
const NUM_ROWS = 5;

function buildEmptyRows(): TransRow[] {
  return Array.from({ length: NUM_ROWS }, () => ({ ...EMPTY_ROW }));
}

function maskCep(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
}

export default function CotacaoForm({ cotacao, open, onClose }: Props) {
  const [form] = Form.useForm();
  const { upsert } = useCotacoesStore();
  const { transportadoras, fetch: fetchTrans, loaded } = useTransportadorasStore();

  const [ufInfo, setUfInfo] = useState<UfInfo | null>(null);
  const [ufLoading, setUfLoading] = useState(false);
  const [transDisponiveis, setTransDisponiveis] = useState<Transportadora[]>([]);
  const [selectedTrans, setSelectedTrans] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Cotacao | null>(null);

  const cepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Garante que transportadoras estejam carregadas
  useEffect(() => {
    if (!loaded) fetchTrans();
  }, [loaded, fetchTrans]);

  useEffect(() => {
    if (!open) {
      setUfInfo(null);
      setTransDisponiveis([]);
      setSelectedTrans([]);
      return;
    }
    if (cotacao) {
      const rows = [...(cotacao.transRows || [])];
      while (rows.length < NUM_ROWS) rows.push({ ...EMPTY_ROW });
      form.setFieldsValue({ ...cotacao, transRows: rows });
      if (cotacao.cepD) resolverCep(cotacao.cepD);
    } else {
      form.resetFields();
      form.setFieldsValue({
        data: hoje(),
        tomador: 'REMETENTE',
        col: 'NÃO',
        transRows: buildEmptyRows(),
      });
    }
  }, [open, cotacao]);

  async function resolverCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, '');
    if (digits.length !== 8) { setUfInfo(null); setTransDisponiveis([]); return; }
    setUfLoading(true);
    setUfInfo(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setUfInfo({ uf: '', cidade: '', error: 'CEP não encontrado' });
        setTransDisponiveis([]);
      } else {
        const info: UfInfo = { uf: data.uf, cidade: data.localidade };
        setUfInfo(info);
        const disp = transportadoras.filter(
          t => t.status === 'ativo' &&
               (t.estados.length === 0 || t.estados.includes(data.uf)),
        );
        setTransDisponiveis(disp);
      }
    } catch {
      setUfInfo({ uf: '', cidade: '', error: 'Erro ao consultar ViaCEP' });
    } finally {
      setUfLoading(false);
    }
  }

  function onCepDChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskCep(e.target.value);
    form.setFieldValue('cepD', masked);
    if (cepTimer.current) clearTimeout(cepTimer.current);
    cepTimer.current = setTimeout(() => resolverCep(masked), 450);
  }

  function adicionarSelecionadas() {
    if (!selectedTrans.length) return;
    const current: TransRow[] = form.getFieldValue('transRows') || buildEmptyRows();
    const nomes = selectedTrans
      .map(id => transportadoras.find(t => t.id === id)?.nome ?? id);

    // Preenche slots vazios primeiro
    let nextSlot = 0;
    const next = [...current];
    for (const nome of nomes) {
      while (nextSlot < next.length && next[nextSlot].trans.trim()) nextSlot++;
      if (nextSlot < next.length) {
        next[nextSlot] = { ...next[nextSlot], trans: nome };
        nextSlot++;
      }
    }
    form.setFieldValue('transRows', next);
    setSelectedTrans([]);
    message.success(`${nomes.length} transportadora(s) adicionada(s)`);
  }

  function abrirPreview() {
    const vals = form.getFieldsValue(true) as Cotacao;
    const transRows = (vals.transRows || []).filter(r => r.trans || r.valor);
    setPreviewData({
      ...vals,
      id: cotacao?.id ?? uid(),
      transRows,
    });
    setPreviewOpen(true);
  }

  async function handleSubmit(values: Cotacao) {
    try {
      const transRows = (values.transRows || []).filter(r => r.trans.trim() || r.valor.trim());
      const data: Cotacao = { ...values, id: cotacao?.id ?? uid(), transRows };
      await upsert(data);
      message.success(`Cotação ${cotacao ? 'atualizada' : 'salva'} com sucesso!`);
      onClose();
    } catch (e) {
      message.error('Erro ao salvar: ' + String(e));
    }
  }

  return (
    <>
      <Drawer
        title={cotacao ? 'Editar Cotação' : 'Nova Cotação'}
        open={open}
        onClose={onClose}
        width={800}
        destroyOnHidden
        footer={
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Button icon={<EyeOutlined />} onClick={abrirPreview}>
              Visualizar / Imagem
            </Button>
            <Space>
              <Button onClick={onClose}>Cancelar</Button>
              <Button type="primary" onClick={() => form.submit()}>
                {cotacao ? 'Salvar alterações' : 'Salvar cotação'}
              </Button>
            </Space>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Dados gerais */}
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="data" label="Data">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pedido" label="Nº Pedido">
                <Input placeholder="Ex: 2852" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tomador" label="Tomador do Frete">
                <Input placeholder="REMETENTE / DESTINATÁRIO" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="linhas" label="Linhas da NF">
                <Input placeholder="Ex: 5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="col" label="Coleta">
                <Input placeholder="SIM / NÃO" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 16px' }}>Remetente</Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="cnpjR" label="CNPJ Remetente">
                <Input placeholder="00.000.000/0001-00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cepR" label="CEP Remetente">
                <Input placeholder="00000-000" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 16px' }}>Destinatário</Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="cnpjD" label="CNPJ Destinatário">
                <Input placeholder="00.000.000/0001-00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cepD"
                label={
                  <Space size={4}>
                    <span>CEP Destinatário</span>
                    {ufLoading && <Spin indicator={<LoadingOutlined spin />} size="small" />}
                    {ufInfo && !ufInfo.error && (
                      <Tag
                        icon={<EnvironmentOutlined />}
                        color="geekblue"
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {ufInfo.cidade} — {ufInfo.uf}
                      </Tag>
                    )}
                    {ufInfo?.error && (
                      <Tag color="error" style={{ margin: 0, fontSize: 11 }}>
                        {ufInfo.error}
                      </Tag>
                    )}
                  </Space>
                }
              >
                <Input
                  placeholder="00000-000"
                  onChange={onCepDChange}
                  maxLength={9}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Painel de transportadoras disponíveis para o estado */}
          {transDisponiveis.length > 0 && (
            <Alert
              style={{ marginBottom: 16 }}
              type="info"
              message={
                <div>
                  <Text strong style={{ fontSize: 13 }}>
                    Transportadoras que atendem {ufInfo?.uf}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Checkbox.Group
                      value={selectedTrans}
                      onChange={v => setSelectedTrans(v as string[])}
                    >
                      <Row gutter={[8, 4]}>
                        {transDisponiveis.map(t => (
                          <Col key={t.id} span={12}>
                            <Checkbox value={t.id}>
                              <Text style={{ fontSize: 12 }}>{t.nome}</Text>
                              {t.quimico === 'sim' && (
                                <Tag color="orange" style={{ marginLeft: 4, fontSize: 10 }}>
                                  Quím.
                                </Tag>
                              )}
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </Checkbox.Group>
                  </div>
                  {selectedTrans.length > 0 && (
                    <Button
                      size="small"
                      type="primary"
                      style={{ marginTop: 8 }}
                      onClick={adicionarSelecionadas}
                    >
                      Adicionar {selectedTrans.length} selecionada(s) nas linhas abaixo
                    </Button>
                  )}
                </div>
              }
            />
          )}

          <Divider style={{ margin: '8px 0 16px' }}>Carga</Divider>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="vnf" label="Valor NF (R$)">
                <Input placeholder="Ex: 16854" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="pes" label="Peso (KG)">
                <Input placeholder="Ex: 573" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="vol" label="Volume / Qtd">
                <Input placeholder="Ex: 48 CAIXAS" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="med" label="Medidas (C x L x A cm)">
                <Input placeholder="Ex: 30 X 21 X 24" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mat" label="Material / ONU">
                <Input placeholder="Ex: QUIMICO ONU: 1830 RISCO: 8" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 16px' }}>Transportadoras Cotadas</Divider>

          <div style={{
            background: '#f8faff',
            borderRadius: 8,
            padding: '12px',
            marginBottom: 8,
          }}>
            <Row gutter={8} style={{ marginBottom: 6 }}>
              <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>Transportadora</Text></Col>
              <Col span={5}><Text type="secondary" style={{ fontSize: 12 }}>Valor (R$)</Text></Col>
              <Col span={5}><Text type="secondary" style={{ fontSize: 12 }}>Nº Cotação</Text></Col>
              <Col span={4}><Text type="secondary" style={{ fontSize: 12 }}>Prazo (dias)</Text></Col>
            </Row>
            {Array.from({ length: NUM_ROWS }).map((_, i) => (
              <Row key={i} gutter={8} style={{ marginBottom: 6 }}>
                <Col span={8}>
                  <Form.Item name={['transRows', i, 'trans']} style={{ margin: 0 }}>
                    <Input placeholder={`Transp. ${i + 1}`} size="small" />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item name={['transRows', i, 'valor']} style={{ margin: 0 }}>
                    <Input placeholder="0,00" size="small" />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item name={['transRows', i, 'cotacao']} style={{ margin: 0 }}>
                    <Input placeholder="—" size="small" />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name={['transRows', i, 'prazo']} style={{ margin: 0 }}>
                    <Input placeholder="—" size="small" />
                  </Form.Item>
                </Col>
              </Row>
            ))}
          </div>
        </Form>
      </Drawer>

      <CotacaoPreview
        cotacao={previewData}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
