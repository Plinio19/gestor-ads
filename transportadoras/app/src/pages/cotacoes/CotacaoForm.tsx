import { useEffect } from 'react';
import {
  Drawer, Form, Input, Button, Space, Row, Col, Divider, Typography, message,
} from 'antd';
import type { Cotacao, TransRow } from '../../types';
import { useCotacoesStore } from '../../stores/useCotacoesStore';
import { uid, hoje } from '../../utils';

const { Text } = Typography;

interface Props {
  cotacao: Cotacao | null;
  open: boolean;
  onClose: () => void;
}

const EMPTY_ROW: TransRow = { trans: '', valor: '', cotacao: '', prazo: '' };
const NUM_ROWS = 5;

function buildEmptyRows(): TransRow[] {
  return Array.from({ length: NUM_ROWS }, () => ({ ...EMPTY_ROW }));
}

export default function CotacaoForm({ cotacao, open, onClose }: Props) {
  const [form] = Form.useForm();
  const { upsert } = useCotacoesStore();

  useEffect(() => {
    if (!open) return;
    if (cotacao) {
      const rows = [...(cotacao.transRows || [])];
      while (rows.length < NUM_ROWS) rows.push({ ...EMPTY_ROW });
      form.setFieldsValue({ ...cotacao, transRows: rows });
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

  async function handleSubmit(values: Cotacao) {
    try {
      const transRows = (values.transRows || []).filter(r => r.trans.trim() || r.valor.trim());
      const data: Cotacao = {
        ...values,
        id: cotacao?.id ?? uid(),
        transRows,
      };
      await upsert(data);
      message.success(`Cotação ${cotacao ? 'atualizada' : 'salva'} com sucesso!`);
      onClose();
    } catch (e) {
      message.error('Erro ao salvar: ' + String(e));
    }
  }

  return (
    <Drawer
      title={cotacao ? 'Editar Cotação' : 'Nova Cotação'}
      open={open}
      onClose={onClose}
      width={760}
      destroyOnHidden
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" onClick={() => form.submit()}>
            {cotacao ? 'Salvar alterações' : 'Salvar cotação'}
          </Button>
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
            <Form.Item name="cepD" label="CEP Destinatário">
              <Input placeholder="00000-000" />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0 16px' }}>Carga</Divider>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="vnf" label="Valor NF (R$)">
              <Input placeholder="Ex: 16854" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="pes" label="Peso (KG)">
              <Input placeholder="Ex: 573 KG" />
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
  );
}
