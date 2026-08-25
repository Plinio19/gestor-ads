import { useState } from 'react';
import {
  Typography, Button, Table, Tag, Space, Drawer, Form, Input,
  Select, Popconfirm, message, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Tarefa, TipoRecorrencia } from '../types';
import { useTarefasStore } from '../stores/useTarefasStore';
import { useFuncionariosStore } from '../stores/useFuncionariosStore';
import {
  uid, agora, hoje, fmtDate, diasAte,
  COR_PRIORIDADE, LABEL_PRIORIDADE, LABEL_STATUS, LABEL_RECORRENCIA, DIAS_SEMANA,
} from '../utils';

const { Title, Text } = Typography;

const CATEGORIAS = ['Financeiro', 'Administrativo', 'Operacional', 'Comercial', 'RH', 'Marketing', 'TI', 'Outro'];

export default function TarefasPage() {
  const { tarefas, upsert, concluir, reabrir, remove } = useTarefasStore();
  const { funcionarios } = useFuncionariosStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState<Tarefa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('ativas');
  const [filtroResp, setFiltroResp] = useState<string>('todos');
  const [form] = Form.useForm();
  const [recorrenciaTipo, setRecorrenciaTipo] = useState<TipoRecorrencia>('unica');

  function abrirNovo() {
    setEditando(null);
    form.resetFields();
    form.setFieldsValue({ prioridade: 'normal', status: 'pendente', prazo: hoje(), recorrenciaTipo: 'unica' });
    setRecorrenciaTipo('unica');
    setDrawerOpen(true);
  }

  function abrirEdicao(t: Tarefa) {
    setEditando(t);
    form.setFieldsValue({
      ...t,
      recorrenciaTipo: t.recorrencia.tipo,
      recorrenciaDiaSemana: t.recorrencia.diaSemana,
      recorrenciaDiaMes: t.recorrencia.diaMes,
      recorrenciaHorario: t.recorrencia.horario,
    });
    setRecorrenciaTipo(t.recorrencia.tipo);
    setDrawerOpen(true);
  }

  async function salvar() {
    const values = await form.validateFields();
    setSalvando(true);
    try {
      const tarefa: Tarefa = {
        id: editando?.id ?? uid(),
        titulo: values.titulo,
        descricao: values.descricao,
        responsavelId: values.responsavelId,
        prazo: values.prazo,
        prioridade: values.prioridade,
        status: values.status ?? 'pendente',
        categoria: values.categoria,
        observacoes: values.observacoes,
        criadaEm: editando?.criadaEm ?? agora(),
        concluidaEm: editando?.concluidaEm,
        recorrencia: {
          tipo: values.recorrenciaTipo,
          diaSemana: values.recorrenciaDiaSemana,
          diaMes: values.recorrenciaDiaMes,
          horario: values.recorrenciaHorario,
        },
      };
      await upsert(tarefa);
      message.success('Salvo!');
      setDrawerOpen(false);
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  const h = hoje();
  const filtradas = tarefas.filter(t => {
    if (filtroResp !== 'todos' && t.responsavelId !== filtroResp) return false;
    if (filtroStatus === 'ativas') return t.status !== 'concluida';
    if (filtroStatus === 'concluidas') return t.status === 'concluida';
    if (filtroStatus === 'atrasadas') return t.status !== 'concluida' && t.prazo < h;
    if (filtroStatus === 'hoje') return t.status !== 'concluida' && t.prazo === h;
    return true;
  });

  const columns = [
    {
      title: 'Tarefa', key: 'titulo', width: '35%',
      render: (_: unknown, t: Tarefa) => {
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ width: 3, height: 36, borderRadius: 2, background: COR_PRIORIDADE[t.prioridade], flexShrink: 0, marginTop: 2 }} />
            <div>
              <Text strong style={{ fontSize: 13, display: 'block', textDecoration: t.status === 'concluida' ? 'line-through' : 'none', color: t.status === 'concluida' ? '#aaa' : undefined }}>
                {t.titulo}
              </Text>
              {t.descricao && <Text type="secondary" style={{ fontSize: 11 }}>{t.descricao}</Text>}
              {t.categoria && <Tag style={{ fontSize: 10, marginTop: 2 }}>{t.categoria}</Tag>}
              {t.recorrencia.tipo !== 'unica' && (
                <Tag color="purple" style={{ fontSize: 10, marginTop: 2 }}>🔁 {LABEL_RECORRENCIA[t.recorrencia.tipo]}</Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Responsável', key: 'responsavel',
      render: (_: unknown, t: Tarefa) => {
        const f = funcionarios.find(x => x.id === t.responsavelId);
        return f ? <Tag style={{ background: f.cor + '22', borderColor: f.cor, color: '#333' }}>{f.nome}</Tag> : '—';
      },
    },
    {
      title: 'Prazo', key: 'prazo',
      render: (_: unknown, t: Tarefa) => {
        const dias = diasAte(t.prazo);
        const cor = dias < 0 ? '#f5222d' : dias === 0 ? '#fa8c16' : '#666';
        const label = dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'Hoje' : `${dias}d`;
        return (
          <div>
            <Text style={{ fontSize: 12, color: cor, fontWeight: dias <= 0 ? 600 : 400 }}>{label}</Text>
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{fmtDate(t.prazo)}</Text>
          </div>
        );
      },
    },
    {
      title: 'Prioridade', key: 'prioridade',
      render: (_: unknown, t: Tarefa) => (
        <Tag color={COR_PRIORIDADE[t.prioridade]} style={{ fontSize: 11 }}>{LABEL_PRIORIDADE[t.prioridade]}</Tag>
      ),
    },
    {
      title: 'Status', key: 'status',
      render: (_: unknown, t: Tarefa) => {
        const atrasada = t.status !== 'concluida' && t.prazo < h;
        return <Tag color={t.status === 'concluida' ? 'green' : atrasada ? 'red' : t.status === 'em_andamento' ? 'blue' : 'default'}>{atrasada && t.status !== 'concluida' ? 'Atrasada' : LABEL_STATUS[t.status]}</Tag>;
      },
    },
    {
      title: '', key: 'acoes', width: 120,
      render: (_: unknown, t: Tarefa) => (
        <Space>
          {t.status !== 'concluida'
            ? <Tooltip title="Concluir"><Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => concluir(t.id)} /></Tooltip>
            : <Tooltip title="Reabrir"><Button size="small" icon={<ReloadOutlined />} onClick={() => reabrir(t.id)} /></Tooltip>
          }
          <Tooltip title="Editar"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => abrirEdicao(t)} /></Tooltip>
          <Popconfirm title="Remover tarefa?" onConfirm={() => remove(t.id)} okText="Sim" cancelText="Não" okType="danger">
            <Tooltip title="Remover"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Tarefas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovo}>Nova tarefa</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Select value={filtroStatus} onChange={setFiltroStatus} style={{ width: 160 }}>
          <Select.Option value="ativas">Ativas</Select.Option>
          <Select.Option value="hoje">Para hoje</Select.Option>
          <Select.Option value="atrasadas">Atrasadas</Select.Option>
          <Select.Option value="concluidas">Concluídas</Select.Option>
          <Select.Option value="todas">Todas</Select.Option>
        </Select>
        <Select value={filtroResp} onChange={setFiltroResp} style={{ width: 180 }}>
          <Select.Option value="todos">Todos os responsáveis</Select.Option>
          {funcionarios.map(f => <Select.Option key={f.id} value={f.id}>{f.nome}</Select.Option>)}
        </Select>
      </div>

      <Table
        dataSource={filtradas}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        style={{ background: '#fff', borderRadius: 12, overflow: 'hidden' }}
        bordered={false}
      />

      <Drawer
        title={editando ? 'Editar tarefa' : 'Nova tarefa'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        footer={
          <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="primary" loading={salvando} onClick={salvar}>Salvar</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="titulo" label="Título" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input placeholder="O que precisa ser feito?" />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea rows={2} placeholder="Detalhes..." />
          </Form.Item>
          <Form.Item name="responsavelId" label="Responsável" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Select placeholder="Selecionar funcionário">
              {funcionarios.filter(f => f.ativo).map(f => (
                <Select.Option key={f.id} value={f.id}>{f.nome} — {f.cargo}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="categoria" label="Categoria">
            <Select placeholder="Categoria" allowClear>
              {CATEGORIAS.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="prioridade" label="Prioridade" style={{ flex: 1 }}>
              <Select>
                {Object.entries(LABEL_PRIORIDADE).map(([k, v]) => (
                  <Select.Option key={k} value={k}><Tag color={COR_PRIORIDADE[k]}>{v}</Tag></Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="prazo" label="Prazo" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
          </div>

          {/* Recorrência */}
          <Form.Item name="recorrenciaTipo" label="Recorrência">
            <Select onChange={(v: TipoRecorrencia) => setRecorrenciaTipo(v)}>
              {Object.entries(LABEL_RECORRENCIA).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {recorrenciaTipo === 'semanal' && (
            <Form.Item name="recorrenciaDiaSemana" label="Dia da semana" rules={[{ required: true }]}>
              <Select>
                {DIAS_SEMANA.map((d, i) => <Select.Option key={i} value={i}>{d}</Select.Option>)}
              </Select>
            </Form.Item>
          )}
          {recorrenciaTipo === 'mensal' && (
            <Form.Item name="recorrenciaDiaMes" label="Dia do mês (1-31)" rules={[{ required: true }]}>
              <Input type="number" min={1} max={31} />
            </Form.Item>
          )}
          {recorrenciaTipo !== 'unica' && (
            <Form.Item name="recorrenciaHorario" label="Horário de alerta (opcional)">
              <Input type="time" placeholder="08:00" />
            </Form.Item>
          )}
          <Form.Item name="observacoes" label="Observações">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
