/**
 * Relatório diário automático — Halogenn Química
 * Gera PDF com métricas do dia anterior e salva em C:\Users\User\Downloads\
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { GoogleAdsApi } = require('google-ads-api');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const client = new GoogleAdsApi({
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  developer_token: process.env.DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: process.env.CUSTOMER_ID,
  refresh_token: process.env.REFRESH_TOKEN,
  login_customer_id: '6017081450',
});

// -------- helpers --------
function brl(micros) {
  return 'R$ ' + (micros / 1e6).toFixed(2).replace('.', ',');
}
function pct(v) {
  return (v * 100).toFixed(2).replace('.', ',') + '%';
}
function fmtDate(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}
function statusLabel(n) {
  if (n >= 7) return '🟢 Ótimo';
  if (n >= 5) return '🟡 Bom';
  if (n >= 3) return '🟠 Regular';
  return '🔴 Baixo';
}

// -------- PDF builder --------
function buildPDF(data, outputPath) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(fs.createWriteStream(outputPath));

  const W = doc.page.width - 100; // usable width
  const BLUE = '#1a56db';
  const GRAY = '#6b7280';
  const LIGHT = '#f3f4f6';
  const RED   = '#dc2626';
  const GREEN = '#16a34a';

  // ---- HEADER ----
  doc.rect(0, 0, doc.page.width, 80).fill(BLUE);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
    .text('Halogenn Química — Relatório Diário', 50, 22);
  doc.fontSize(11).font('Helvetica')
    .text(`Google Ads · ${fmtDate(new Date())}`, 50, 50);
  doc.fillColor('black');

  let y = 105;

  // ---- ALERTA de anomalias ----
  const alerts = [];
  for (const c of data.campaigns) {
    if (c.ctr < 0.02 && c.impressions > 50)
      alerts.push(`CTR baixo em "${c.name}": ${pct(c.ctr)} (mín. 2%)`);
    if (c.avg_cpc > 8 && c.conversions === 0 && c.clicks > 10)
      alerts.push(`CPC alto sem conversão em "${c.name}": ${brl(c.avg_cpc * 1e6)}`);
  }
  if (data.totalCost > data.dailyBudget * 1.5)
    alerts.push(`Gasto total acima de 150% do orçamento diário!`);

  if (alerts.length > 0) {
    doc.rect(50, y, W, 18 + alerts.length * 18).fill('#fef2f2').stroke('#fca5a5');
    doc.fillColor(RED).fontSize(11).font('Helvetica-Bold')
      .text('⚠  ALERTAS', 60, y + 6);
    y += 22;
    doc.font('Helvetica').fontSize(10).fillColor(RED);
    for (const a of alerts) {
      doc.text(`• ${a}`, 60, y);
      y += 16;
    }
    y += 10;
    doc.fillColor('black');
  }

  // ---- RESUMO GERAL ----
  doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
    .text('Resumo Geral — Ontem', 50, y);
  y += 20;

  const summary = [
    ['Impressões',  data.totals.impressions.toLocaleString('pt-BR')],
    ['Cliques',     data.totals.clicks.toLocaleString('pt-BR')],
    ['CTR Médio',   pct(data.totals.ctr)],
    ['Custo Total', brl(data.totals.cost)],
    ['CPC Médio',   brl(data.totals.avg_cpc)],
    ['Conversões',  String(data.totals.conversions)],
  ];

  const colW = W / 3;
  summary.forEach(([label, val], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = 50 + col * colW;
    const by = y + row * 60;
    doc.rect(bx, by, colW - 8, 52).fill(LIGHT);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(label, bx + 8, by + 8);
    doc.fillColor('black').fontSize(16).font('Helvetica-Bold').text(val, bx + 8, by + 22);
  });

  y += Math.ceil(summary.length / 3) * 60 + 20;

  // ---- POR CAMPANHA ----
  doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
    .text('Performance por Campanha', 50, y);
  y += 16;

  const cols = ['Campanha', 'Impr.', 'Cliques', 'CTR', 'Custo', 'CPC Méd.', 'Conv.'];
  const cw   = [180, 55, 60, 55, 70, 70, 45];

  // header row
  doc.rect(50, y, W, 18).fill(BLUE);
  let x = 50;
  cols.forEach((c, i) => {
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(c, x + 4, y + 4, { width: cw[i] - 4 });
    x += cw[i];
  });
  y += 18;

  data.campaigns.forEach((c, idx) => {
    const bg = idx % 2 === 0 ? 'white' : LIGHT;
    doc.rect(50, y, W, 18).fill(bg);
    const row = [
      c.name.replace('[Busca] - ', ''),
      c.impressions.toLocaleString('pt-BR'),
      c.clicks.toLocaleString('pt-BR'),
      pct(c.ctr),
      brl(c.cost * 1e6),
      brl(c.avg_cpc * 1e6),
      String(c.conversions),
    ];
    x = 50;
    row.forEach((v, i) => {
      doc.fillColor('black').fontSize(8.5).font('Helvetica')
        .text(v, x + 4, y + 4, { width: cw[i] - 4 });
      x += cw[i];
    });
    y += 18;
  });

  y += 20;

  // ---- TOP 10 KEYWORDS ----
  if (data.keywords && data.keywords.length > 0) {
    doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
      .text('Top Keywords (por cliques)', 50, y);
    y += 16;

    const kcols = ['Keyword', 'Match', 'Cliques', 'Impr.', 'CTR', 'CPC'];
    const kcw   = [200, 60, 55, 55, 55, 60];

    doc.rect(50, y, W, 18).fill(BLUE);
    x = 50;
    kcols.forEach((c, i) => {
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(c, x + 4, y + 4, { width: kcw[i] });
      x += kcw[i];
    });
    y += 18;

    data.keywords.slice(0, 10).forEach((k, idx) => {
      const bg = idx % 2 === 0 ? 'white' : LIGHT;
      doc.rect(50, y, W, 18).fill(bg);
      const row = [
        k.text,
        k.match_type.replace('_', ' '),
        k.clicks.toLocaleString('pt-BR'),
        k.impressions.toLocaleString('pt-BR'),
        pct(k.ctr),
        brl(k.avg_cpc * 1e6),
      ];
      x = 50;
      row.forEach((v, i) => {
        doc.fillColor('black').fontSize(8.5).font('Helvetica')
          .text(v, x + 4, y + 4, { width: kcw[i] });
        x += kcw[i];
      });
      y += 18;
    });

    y += 20;
  }

  // ---- ORÇAMENTO ----
  if (y > 680) { doc.addPage(); y = 50; }

  doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
    .text('Orçamento e Projeção Mensal', 50, y);
  y += 16;

  const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const diaAtual  = new Date().getDate();
  const projecao  = data.totals.cost / 1e6 / diaAtual * diasNoMes;
  const budget    = data.dailyBudget;

  const budgetRows = [
    ['Gasto ontem',           brl(data.totals.cost)],
    ['Orçamento diário total', brl(budget)],
    ['% do orçamento usado',   pct(data.totals.cost / budget)],
    ['Projeção mês atual',     brl(projecao * 1e6)],
    ['Limite mensal',          'R$ 2.000,00'],
  ];

  budgetRows.forEach(([label, val], i) => {
    const bg = i % 2 === 0 ? 'white' : LIGHT;
    doc.rect(50, y, W, 18).fill(bg);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(label, 58, y + 4);
    const isOver = label.includes('Projeção') && projecao > 2000;
    doc.fillColor(isOver ? RED : 'black').font('Helvetica-Bold').text(val, 350, y + 4);
    y += 18;
  });

  y += 20;

  // ---- RODAPÉ ----
  doc.fontSize(9).fillColor(GRAY).font('Helvetica')
    .text(
      `Gerado automaticamente pelo Gestor de Tráfego IA — Halogenn Química · ${new Date().toLocaleString('pt-BR')}`,
      50, doc.page.height - 40, { align: 'center', width: W }
    );

  doc.end();
}

// -------- main --------
async function main() {
  console.log('Consultando Google Ads API...');

  const [campaigns, keywords] = await Promise.all([
    customer.query(`
      SELECT campaign.name, campaign.id,
             metrics.impressions, metrics.clicks, metrics.ctr,
             metrics.cost_micros, metrics.average_cpc, metrics.conversions
      FROM campaign
      WHERE campaign.status = ENABLED
        AND segments.date DURING YESTERDAY
      ORDER BY metrics.cost_micros DESC
    `),
    customer.query(`
      SELECT ad_group_criterion.keyword.text,
             ad_group_criterion.keyword.match_type,
             metrics.impressions, metrics.clicks, metrics.ctr,
             metrics.average_cpc
      FROM ad_group_criterion
      WHERE campaign.status = ENABLED
        AND ad_group_criterion.type = KEYWORD
        AND segments.date DURING YESTERDAY
        AND metrics.clicks > 0
      ORDER BY metrics.clicks DESC
      LIMIT 10
    `).catch(() => []),
  ]);

  const totals = {
    impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0, avg_cpc: 0,
  };

  const campData = campaigns.map(c => {
    const m = c.metrics;
    totals.impressions += m.impressions || 0;
    totals.clicks      += m.clicks || 0;
    totals.cost        += m.cost_micros || 0;
    totals.conversions += m.conversions || 0;
    return {
      name:        c.campaign.name,
      impressions: m.impressions || 0,
      clicks:      m.clicks || 0,
      ctr:         m.ctr || 0,
      cost:        (m.cost_micros || 0) / 1e6,
      avg_cpc:     (m.average_cpc || 0) / 1e6,
      conversions: m.conversions || 0,
    };
  });

  totals.ctr     = totals.clicks > 0 ? totals.clicks / totals.impressions : 0;
  totals.avg_cpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;

  const kwData = keywords.map(k => ({
    text:        k.ad_group_criterion.keyword.text,
    match_type:  k.ad_group_criterion.keyword.match_type,
    impressions: k.metrics.impressions || 0,
    clicks:      k.metrics.clicks || 0,
    ctr:         k.metrics.ctr || 0,
    avg_cpc:     (k.metrics.average_cpc || 0) / 1e6,
  }));

  const DAILY_BUDGET_MICROS = (30 + 10 + 13 + 3.3) * 1e6; // R$56,30/dia — nossas 4 campanhas ativas

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const filename = `Halogenn_GoogleAds_${dateStr}.pdf`;
  const outputPath = path.join('C:/Users/User/Downloads', filename);

  console.log(`Gerando PDF: ${filename}`);

  buildPDF({
    campaigns:   campData,
    keywords:    kwData,
    totals:      { ...totals, cost: totals.cost },
    dailyBudget: DAILY_BUDGET_MICROS,
  }, outputPath);

  console.log(`\n✅ PDF salvo em: ${outputPath}`);
}

main().catch(e => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
