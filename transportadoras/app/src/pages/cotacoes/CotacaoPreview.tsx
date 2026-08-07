import { useRef, useEffect } from 'react';
import { Modal, Button, Space, Typography, Table } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import type { Cotacao } from '../../types';

const { Text } = Typography;

interface Props {
  cotacao: Cotacao | null;
  open: boolean;
  onClose: () => void;
}

const WL_LBL = 140;
const WL_VAL = 380;
const W = WL_LBL + WL_VAL;
const H_HDR = 38;
const H_ROW = 26;
const SC = 2;

function drawCanvas(canvas: HTMLCanvasElement, c: Cotacao) {
  const cx = canvas.getContext('2d');
  if (!cx) return;

  const pesExib  = c.pes ? c.pes + ' KG' : '';
  const vnfExib  = c.vnf ? 'R$ ' + c.vnf : '';

  const rows: Array<{ s?: string; l?: string; v?: string }> = [
    { s: 'DADOS DO REMETENTE' },
    { l: 'CNPJ', v: c.cnpjR },
    { l: 'CEP',  v: c.cepR  },
    { s: 'DADOS DO DESTINATÁRIO' },
    { l: 'CNPJ', v: c.cnpjD },
    { l: 'CEP',  v: c.cepD  },
    { s: 'DADOS DA NOTA FISCAL' },
    { l: 'VALOR',    v: vnfExib   },
    { l: 'VOLUME',   v: c.vol     },
    { l: 'PESO',     v: pesExib   },
    { l: 'MEDIDAS',  v: c.med     },
    { l: 'TOMADOR',  v: c.tomador },
    { l: 'MATERIAL', v: c.mat     },
    { l: 'COLETA',   v: c.col     },
  ];

  const H = H_HDR + rows.length * H_ROW;
  canvas.width        = W * SC;
  canvas.height       = H * SC;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  cx.scale(SC, SC);
  cx.fillStyle = '#ffffff';
  cx.fillRect(0, 0, W, H);

  const C_GRN = '#1E7E34';
  const C_SEC = '#595959';
  const C_LAB = '#F2F2F2';
  const C_BRD = '#AAAAAA';

  const cell = (
    x: number, y: number, w: number, h: number,
    bg: string, texto: string,
    opts: { b?: boolean; sz?: number; a?: 'left' | 'center' | 'right'; c?: string } = {},
  ) => {
    cx.fillStyle = bg;
    cx.fillRect(x, y, w, h);
    cx.strokeStyle = C_BRD;
    cx.lineWidth = 0.5;
    cx.strokeRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5);
    if (!texto) return;
    cx.save();
    cx.beginPath();
    cx.rect(x + 3, y + 2, w - 6, h - 4);
    cx.clip();
    cx.font = `${opts.b ? 'bold ' : ''}${opts.sz ?? 10}px Calibri,Arial,sans-serif`;
    cx.fillStyle = opts.c ?? '#111';
    cx.textBaseline = 'middle';
    cx.textAlign = opts.a ?? 'left';
    const tx = opts.a === 'center' ? x + w / 2 : opts.a === 'right' ? x + w - 6 : x + 6;
    cx.fillText(String(texto), tx, y + h / 2);
    cx.restore();
  };

  cell(0, 0, W, H_HDR, C_GRN,
    `COTAÇÃO DE FRETE DO PEDIDO Nº ${c.pedido || '____'}`,
    { b: true, sz: 13, a: 'center', c: '#FFFFFF' },
  );

  rows.forEach((row, i) => {
    const ry = H_HDR + i * H_ROW;
    if (row.s) {
      cell(0, ry, W, H_ROW, C_SEC, row.s, { b: true, sz: 9.5, a: 'center', c: '#FFFFFF' });
    } else {
      cell(0, ry, WL_LBL, H_ROW, C_LAB, row.l ?? '', { b: true, sz: 9.5 });
      cell(WL_LBL, ry, WL_VAL, H_ROW, '#FFFFFF', row.v ?? '', { sz: 10 });
    }
  });

  cx.strokeStyle = '#555';
  cx.lineWidth = 1.2;
  cx.strokeRect(0.6, 0.6, W - 1.2, H - 1.2);
}

export default function CotacaoPreview({ cotacao, open, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && cotacao && canvasRef.current) {
      setTimeout(() => {
        if (canvasRef.current && cotacao) drawCanvas(canvasRef.current, cotacao);
      }, 50);
    }
  }, [open, cotacao]);

  function baixarPNG() {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `cotacao_pedido_${cotacao?.pedido ?? 'sem_numero'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  function imprimir() {
    if (!cotacao) return;
    const vnfExib = cotacao.vnf ? 'R$ ' + cotacao.vnf : '';
    const pesExib = cotacao.pes ? cotacao.pes + ' KG' : '';

    const rows: Array<{ s?: string; l?: string; v?: string }> = [
      { s: 'DADOS DO REMETENTE' },
      { l: 'CNPJ', v: cotacao.cnpjR },
      { l: 'CEP',  v: cotacao.cepR  },
      { s: 'DADOS DO DESTINATÁRIO' },
      { l: 'CNPJ', v: cotacao.cnpjD },
      { l: 'CEP',  v: cotacao.cepD  },
      { s: 'DADOS DA NOTA FISCAL' },
      { l: 'VALOR',    v: vnfExib        },
      { l: 'VOLUME',   v: cotacao.vol    },
      { l: 'PESO',     v: pesExib        },
      { l: 'MEDIDAS',  v: cotacao.med    },
      { l: 'TOMADOR',  v: cotacao.tomador},
      { l: 'MATERIAL', v: cotacao.mat    },
      { l: 'COLETA',   v: cotacao.col    },
    ];

    const thG  = `style="background:#1E7E34;color:#fff;font-weight:700;padding:8px 12px;font-size:12pt;text-align:center;"`;
    const thGn = `style="background:#1E7E34;color:#fff;font-weight:700;padding:5px 8px;font-size:9pt;text-align:center;"`;
    const thS  = `style="background:#595959;color:#fff;font-weight:700;padding:5px 10px;font-size:9.5pt;text-align:center;" colspan="2"`;
    const tdL  = `style="background:#f2f2f2;font-weight:700;padding:5px 10px;font-size:9.5pt;white-space:nowrap;border:1px solid #aaa;"`;
    const tdV  = `style="padding:5px 10px;font-size:9.5pt;border:1px solid #aaa;"`;
    const tdC  = `style="padding:5px 8px;font-size:9pt;border:1px solid #aaa;"`;
    const tdCc = `style="padding:5px 8px;font-size:9pt;border:1px solid #aaa;text-align:center;"`;

    const esc = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const shipRows = rows.map(r =>
      r.s
        ? `<tr><td ${thS}>${esc(r.s)}</td></tr>`
        : `<tr><td ${tdL}>${esc(r.l ?? '')}</td><td ${tdV}>${esc(r.v ?? '')}</td></tr>`,
    ).join('');

    const transRows = (cotacao.transRows || []).filter(r => r.trans);
    const transHtml = transRows.length
      ? transRows.map(r =>
          `<tr>
            <td ${tdC}>${esc(r.trans)}</td>
            <td ${tdCc}>${r.valor ? 'R$ ' + r.valor : ''}</td>
            <td ${tdCc}>${esc(r.cotacao)}</td>
            <td ${tdCc}>${esc(r.prazo)}</td>
          </tr>`,
        ).join('')
      : `<tr><td colspan="4" ${tdCc}>—</td></tr>`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        @page{margin:15mm;size:A4 portrait}
        body{font-family:Calibri,Arial,sans-serif}
        table{border-collapse:collapse;width:100%}
        td,th{border:1px solid #aaa}
        .pb{page-break-before:always;margin-top:20px}
      </style>
      </head><body>
      <table style="width:60%">
        <thead><tr><th colspan="2" ${thG}>COTAÇÃO DE FRETE DO PEDIDO Nº ${esc(cotacao.pedido || '____')}</th></tr></thead>
        <tbody>${shipRows}</tbody>
      </table>
      <div class="pb"></div>
      <table>
        <thead>
          <tr><th colspan="4" ${thG}>COMPARATIVO DE TRANSPORTADORAS — PEDIDO Nº ${esc(cotacao.pedido || '____')}</th></tr>
          <tr>
            <th ${thGn} style="width:35%">TRANSPORTADORA</th>
            <th ${thGn} style="width:20%">VALOR</th>
            <th ${thGn} style="width:20%">COTAÇÃO</th>
            <th ${thGn} style="width:25%">PRAZO</th>
          </tr>
        </thead>
        <tbody>${transHtml}</tbody>
      </table>
    </body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  if (!cotacao) return null;

  const transComDados = (cotacao.transRows || []).filter(r => r.trans || r.valor);

  return (
    <Modal
      title={`Cotação — Pedido nº ${cotacao.pedido || '—'}`}
      open={open}
      onCancel={onClose}
      width={620}
      footer={
        <Space>
          <Button onClick={onClose}>Fechar</Button>
          <Button icon={<PrinterOutlined />} onClick={imprimir}>Imprimir / PDF</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={baixarPNG}>
            Baixar PNG
          </Button>
        </Space>
      }
    >
      {/* Canvas */}
      <div style={{
        background: '#e8edf2',
        borderRadius: 8,
        padding: 12,
        overflowX: 'auto',
        marginBottom: 16,
      }}>
        <canvas ref={canvasRef} style={{ display: 'block', boxShadow: '0 2px 12px rgba(0,0,0,.18)' }} />
      </div>

      {/* Comparativo abaixo */}
      {transComDados.length > 0 && (
        <div>
          <Text strong style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8 }}>
            Comparativo de transportadoras (interno — não aparece na imagem)
          </Text>
          <Table
            size="small"
            dataSource={transComDados}
            rowKey={(_, i) => String(i)}
            pagination={false}
            columns={[
              { title: 'Transportadora', dataIndex: 'trans' },
              { title: 'Valor', dataIndex: 'valor', render: v => v ? `R$ ${v}` : '—' },
              { title: 'Cotação', dataIndex: 'cotacao', render: v => v || '—' },
              { title: 'Prazo', dataIndex: 'prazo', render: v => v || '—' },
            ]}
          />
        </div>
      )}
    </Modal>
  );
}
