import { useNavigate } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Tag, Empty, Popconfirm, Tooltip, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FilePdfOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { Processo } from '../types';
import { useProcessosStore } from '../stores/useProcessosStore';
import { useFuncionariosStore } from '../stores/useFuncionariosStore';
import { uid, agora, fmtDate } from '../utils';

const { Title, Text } = Typography;

export default function ProcessosPage() {
  const navigate = useNavigate();
  const { processos, upsert, remove } = useProcessosStore();
  const { funcionarios } = useFuncionariosStore();
  const [busca, setBusca] = useState('');

  async function novoProcesso() {
    const p: Processo = {
      id: uid(),
      titulo: 'Novo Processo',
      descricao: '',
      versao: '1.0',
      criadoEm: agora(),
      atualizadoEm: agora(),
      etapas: [],
      ativo: true,
    };
    await upsert(p);
    navigate(`/processos/${p.id}`);
  }

  const filtrados = processos.filter(p =>
    p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    (p.descricao ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Processos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={novoProcesso}>Novo processo</Button>
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder="Buscar processo..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ maxWidth: 360, marginBottom: 20 }}
        allowClear
      />

      {filtrados.length === 0 ? (
        <Empty description="Nenhum processo cadastrado">
          <Button type="primary" onClick={novoProcesso}>Criar primeiro processo</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {filtrados.map(p => {
            const resp = funcionarios.find(f => f.id === p.responsavelId);
            return (
              <Col key={p.id} xs={24} sm={12} lg={8}>
                <Card
                  bordered={false}
                  style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', height: '100%' }}
                  actions={[
                    <Tooltip key="pdf" title="Exportar PDF">
                      <FilePdfOutlined onClick={() => { navigate(`/processos/${p.id}`); }} />
                    </Tooltip>,
                    <Tooltip key="edit" title="Editar">
                      <EditOutlined onClick={() => navigate(`/processos/${p.id}`)} />
                    </Tooltip>,
                    <Popconfirm key="del" title="Remover processo?" onConfirm={() => remove(p.id)} okText="Sim" cancelText="Não" okType="danger">
                      <Tooltip title="Remover"><DeleteOutlined style={{ color: '#f5222d' }} /></Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={p.ativo ? 'green' : 'default'} style={{ fontSize: 10 }}>{p.ativo ? 'Ativo' : 'Inativo'}</Tag>
                    {p.categoria && <Tag style={{ fontSize: 10 }}>{p.categoria}</Tag>}
                    <Tag style={{ fontSize: 10 }}>v{p.versao}</Tag>
                  </div>
                  <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 6 }}>{p.titulo}</Text>
                  {p.descricao && <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{p.descricao}</Text>}
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
                    {p.etapas.length} etapa{p.etapas.length !== 1 ? 's' : ''}
                    {resp && ` · ${resp.nome}`}
                    {` · ${fmtDate(p.atualizadoEm)}`}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
