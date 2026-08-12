import { useEffect, useState } from 'react';
import {
  Drawer, Form, Input, Button, Space, Row, Col, Select, InputNumber,
  Typography, message,
} from 'antd';
import type { Negocio, Etapa } from '../../types';
import { useNegociosStore } from '../../stores/useNegociosStore';
import { useClientesStore } from '../../stores/useClientesStore';
import { uid, hoje, ETAPAS, ORIGENS } from '../../utils';

const { Text } = Typography;

interface Props {
  negocio: Negocio | null;
  etapaInicial?: Etapa;
  open: boolean;
  onClose: () => void;
}

export default function NegocioForm({ negocio, etapaInicial, open, onClose }: Props) {
  const [form] = Form.useForm();
  const { upsert } = useNegociosStore();
  const { clientes, fetch: fetchClientes, loaded } = useClientesStore();
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { if (!loaded) fetchClientes(); }, [loaded, fetchClientes]);

  useEffect(() => {
    if (!open) return;
    if (negocio) {
      form.setFieldsValue(negocio);
    } else {
      form.resetFields();
      form.setFieldsValue({
        etapa: etapaInicial ?? 'lead',
        dataAbertura: hoje(),
        probabilidade: '50',
      });
    }
  }, [open, negocio, etapaInicial]);

  async function handleSubmit(values: Partial<Negocio>) {
    setSalvando(true);
    try {
      const data: Negocio = {
        ...values as Negocio,
        id: negocio?.id ?? uid(),
        criadoEm: negocio?.criadoEm ?? hoje(),
        valor: String(values.valor ?? ''),
        probabilidade: String(values.probabilidade ?? ''),
      };
      await upsert(data);
      message.success(`Negócio ${negocio ? 'atualizado' : 'criado'}!`);
      onClose();
    } catch (e) {
      message.error('Erro: ' + String(e));
    } finally {
      setSalvando(false);
    }
  }

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
          <Input placeholder="Ex: Venda de Xileno – Lab UFPR" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={14}>
            <Form.Item name="clienteId" label="Cliente" rules={[{ required: true, message: 'Selecione o cliente' }]}>
              <Select
                placeholder="Selecione..."
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
            rows={3}
            placeholder="Detalhes do produto, contexto da oportunidade, próximos passos..."
          />
        </Form.Item>
      </Form>

      {negocio && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Criado em {negocio.criadoEm} · ID: {negocio.id}
          </Text>
        </div>
      )}
    </Drawer>
  );
}
