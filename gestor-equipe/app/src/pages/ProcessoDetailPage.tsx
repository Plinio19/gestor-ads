import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Input, Select, Space, Form, Card, Divider,
  message, Spin, Tooltip, Popconfirm, Upload, Typography,
} from 'antd';
import {
  ArrowLeftOutlined, FilePdfOutlined, PlusOutlined, DeleteOutlined,
  UpOutlined, DownOutlined, VideoCameraOutlined, PictureOutlined,
} from '@ant-design/icons';
import type { Processo, ProcessoEtapa } from '../types';
import { useProcessosStore } from '../stores/useProcessosStore';
import { useFuncionariosStore } from '../stores/useFuncionariosStore';
import { uid, agora, fmtDate } from '../utils';

const { Text } = Typography;

const CATEGORIAS = ['Financeiro', 'Administrativo', 'Operacional', 'Comercial', 'RH', 'Marketing', 'TI', 'Outro'];

export default function ProcessoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { processos, upsert } = useProcessosStore();
  const { funcionarios } = useFuncionariosStore();
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const p = processos.find(x => x.id === id);
    if (p) setProcesso(JSON.parse(JSON.stringify(p)));
  }, [id, processos]);

  if (!processo) return <Spin />;

  function update(changes: Partial<Processo>) {
    setProcesso(prev => prev ? { ...prev, ...changes } : prev);
  }

  function updateEtapa(etapaId: string, changes: Partial<ProcessoEtapa>) {
    update({ etapas: processo!.etapas.map(e => e.id === etapaId ? { ...e, ...changes } : e) });
  }

  function addEtapa() {
    const nova: ProcessoEtapa = {
      id: uid(), ordem: (processo!.etapas.length + 1),
      titulo: `Etapa ${processo!.etapas.length + 1}`,
      descricao: '', fotos: [],
    };
    update({ etapas: [...processo!.etapas, nova] });
  }

  function removeEtapa(etapaId: string) {
    const next = processo!.etapas
      .filter(e => e.id !== etapaId)
      .map((e, i) => ({ ...e, ordem: i + 1 }));
    update({ etapas: next });
  }

  function moverEtapa(etapaId: string, dir: -1 | 1) {
    const arr = [...processo!.etapas];
    const idx = arr.findIndex(e => e.id === etapaId);
    if (idx + dir < 0 || idx + dir >= arr.length) return;
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    update({ etapas: arr.map((e, i) => ({ ...e, ordem: i + 1 })) });
  }

  async function addFoto(etapaId: string, file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      const etapa = processo!.etapas.find(x => x.id === etapaId);
      if (etapa) updateEtapa(etapaId, { fotos: [...etapa.fotos, base64] });
    };
    reader.readAsDataURL(file);
  }

  function removeFoto(etapaId: string, idx: number) {
    const etapa = processo!.etapas.find(x => x.id === etapaId);
    if (!etapa) return;
    const fotos = etapa.fotos.filter((_, i) => i !== idx);
    updateEtapa(etapaId, { fotos });
  }

  async function salvar() {
    setSalvando(true);
    try {
      await upsert({ ...processo!, atualizadoEm: agora() });
      message.success('Processo salvo!');
    } catch (e) { message.error(String(e)); }
    finally { setSalvando(false); }
  }

  function exportarPDF() {
    if (!processo) return;
    const printWin = window.open('', '_blank');
    if (!printWin) { message.error('Permita pop-ups para exportar o PDF'); return; }
    const resp = funcionarios.find(f => f.id === processo.responsavelId);
    const html = `
<!DOCTYPE html><html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${processo.titulo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #333; padding: 32px; }
  h1 { font-size: 22px; color: #1677ff; margin-bottom: 6px; }
  .meta { color: #888; font-size: 12px; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 12px; }
  .descricao { font-size: 13px; color: #555; margin-bottom: 24px; }
  .etapa { margin-bottom: 32px; page-break-inside: avoid; }
  .etapa-header { background: #f5f7fa; border-left: 4px solid #1677ff; padding: 8px 14px; font-size: 14px; font-weight: bold; margin-bottom: 10px; }
  .etapa-descricao { font-size: 13px; color: #444; margin-bottom: 12px; line-height: 1.6; white-space: pre-wrap; }
  .etapa-meta { font-size: 11px; color: #888; margin-bottom: 10px; }
  .fotos { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .fotos img { max-width: 200px; max-height: 160px; object-fit: cover; border-radius: 6px; border: 1px solid #e0e0e0; }
  .video-link { font-size: 12px; color: #1677ff; }
  .obs { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #7c5d00; margin-top: 24px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>${processo.titulo}</h1>
<div class="meta">
  Versão ${processo.versao} · Criado em ${fmtDate(processo.criadoEm)} · Atualizado em ${fmtDate(processo.atualizadoEm)}
  ${resp ? ` · Responsável: ${resp.nome} (${resp.cargo})` : ''}
  ${processo.categoria ? ` · ${processo.categoria}` : ''}
</div>
${processo.descricao ? `<div class="descricao">${processo.descricao}</div>` : ''}
${processo.etapas.map(e => `
<div class="etapa">
  <div class="etapa-header">Etapa ${e.ordem} — ${e.titulo}</div>
  ${e.responsavel || e.tempo ? `<div class="etapa-meta">${e.responsavel ? `👤 ${e.responsavel}` : ''}${e.tempo ? ` · ⏱ ${e.tempo}` : ''}</div>` : ''}
  <div class="etapa-descricao">${e.descricao || ''}</div>
  ${e.fotos.length > 0 ? `<div class="fotos">${e.fotos.map(f => `<img src="${f}" />`).join('')}</div>` : ''}
  ${e.videoUrl ? `<div class="video-link">🎥 Vídeo: ${e.videoUrl}</div>` : ''}
</div>`).join('')}
${processo.observacoes ? `<div class="obs"><strong>Observações gerais:</strong><br>${processo.observacoes}</div>` : ''}
</body></html>`;
    printWin.document.write(html);
    printWin.document.close();
    printWin.print();
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/processos')}>Voltar</Button>
        <Input
          value={processo.titulo}
          onChange={e => update({ titulo: e.target.value })}
          style={{ flex: 1, fontWeight: 600, fontSize: 16, minWidth: 200 }}
          variant="borderless"
        />
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={exportarPDF}>Exportar PDF</Button>
          <Button type="primary" loading={salvando} onClick={salvar}>Salvar</Button>
        </Space>
      </div>

      {/* Metadados */}
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Form.Item label="Descrição" style={{ flex: 2, minWidth: 200, margin: 0 }}>
            <Input.TextArea
              rows={2}
              value={processo.descricao}
              onChange={e => update({ descricao: e.target.value })}
              placeholder="Descrição geral do processo..."
            />
          </Form.Item>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 160 }}>
            <Form.Item label="Responsável" style={{ margin: 0 }}>
              <Select value={processo.responsavelId} onChange={v => update({ responsavelId: v })} placeholder="Selecionar" allowClear style={{ width: '100%' }}>
                {funcionarios.map(f => <Select.Option key={f.id} value={f.id}>{f.nome}</Select.Option>)}
              </Select>
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item label="Versão" style={{ margin: 0, flex: 1 }}>
                <Input value={processo.versao} onChange={e => update({ versao: e.target.value })} placeholder="1.0" />
              </Form.Item>
              <Form.Item label="Categoria" style={{ margin: 0, flex: 1 }}>
                <Select value={processo.categoria} onChange={v => update({ categoria: v })} placeholder="Cat." allowClear style={{ width: '100%' }}>
                  {CATEGORIAS.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                </Select>
              </Form.Item>
            </div>
          </div>
        </div>
      </Card>

      {/* Etapas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>Etapas do Processo</Text>
        <Button icon={<PlusOutlined />} onClick={addEtapa}>+ Etapa</Button>
      </div>

      {processo.etapas.length === 0 && (
        <Card bordered={false} style={{ textAlign: 'center', borderRadius: 12, color: '#bbb' }}>
          Clique em "+ Etapa" para adicionar a primeira etapa
        </Card>
      )}

      {processo.etapas.map((etapa, idx) => (
        <Card
          key={etapa.id}
          bordered={false}
          style={{ borderRadius: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderLeft: '3px solid #1677ff' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text strong style={{ fontSize: 13 }}>Etapa {etapa.ordem}</Text>
              <Input
                value={etapa.titulo}
                onChange={e => updateEtapa(etapa.id, { titulo: e.target.value })}
                style={{ fontSize: 13, flex: 1 }}
                variant="borderless"
                placeholder="Título da etapa"
              />
              <Space>
                <Tooltip title="Mover acima"><Button type="text" size="small" icon={<UpOutlined />} onClick={() => moverEtapa(etapa.id, -1)} disabled={idx === 0} /></Tooltip>
                <Tooltip title="Mover abaixo"><Button type="text" size="small" icon={<DownOutlined />} onClick={() => moverEtapa(etapa.id, 1)} disabled={idx === processo.etapas.length - 1} /></Tooltip>
                <Popconfirm title="Remover etapa?" onConfirm={() => removeEtapa(etapa.id)} okText="Sim" cancelText="Não" okType="danger">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
          }
        >
          <Input.TextArea
            rows={3}
            value={etapa.descricao}
            onChange={e => updateEtapa(etapa.id, { descricao: e.target.value })}
            placeholder="Descreva detalhadamente esta etapa..."
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              prefix={<span style={{ fontSize: 11, color: '#888' }}>👤</span>}
              value={etapa.responsavel}
              onChange={e => updateEtapa(etapa.id, { responsavel: e.target.value })}
              placeholder="Quem executa?"
              style={{ flex: 1 }}
            />
            <Input
              prefix={<span style={{ fontSize: 11, color: '#888' }}>⏱</span>}
              value={etapa.tempo}
              onChange={e => updateEtapa(etapa.id, { tempo: e.target.value })}
              placeholder="Tempo estimado"
              style={{ flex: 1 }}
            />
          </div>
          <Input
            prefix={<VideoCameraOutlined style={{ color: '#888' }} />}
            value={etapa.videoUrl}
            onChange={e => updateEtapa(etapa.id, { videoUrl: e.target.value })}
            placeholder="Link do vídeo (YouTube, Drive...)"
            style={{ marginBottom: 12 }}
          />
          {/* Fotos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {etapa.fotos.map((foto, fi) => (
              <div key={fi} style={{ position: 'relative' }}>
                <img src={foto} alt="" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0e0e0' }} />
                <Button
                  size="small"
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  style={{ position: 'absolute', top: 2, right: 2, padding: '0 4px', fontSize: 10 }}
                  onClick={() => removeFoto(etapa.id, fi)}
                />
              </div>
            ))}
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={file => { addFoto(etapa.id, file); return false; }}
            >
              <div style={{
                width: 100, height: 80, border: '1px dashed #d9d9d9', borderRadius: 6,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#aaa', fontSize: 11,
              }}>
                <PictureOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                + Foto
              </div>
            </Upload>
          </div>
        </Card>
      ))}

      {/* Observações gerais */}
      {processo.etapas.length > 0 && (
        <>
          <Divider />
          <Form.Item label="Observações gerais">
            <Input.TextArea
              rows={3}
              value={processo.observacoes}
              onChange={e => update({ observacoes: e.target.value })}
              placeholder="Notas adicionais, avisos, cuidados especiais..."
            />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button icon={<FilePdfOutlined />} onClick={exportarPDF}>Exportar PDF</Button>
              <Button type="primary" loading={salvando} onClick={salvar}>Salvar processo</Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
}
