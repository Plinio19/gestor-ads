/**
 * Relatório mensal em PDF — Halogenn Química
 * Puxa o mês anterior completo e salva PDF em C:\Users\User\Downloads\
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
function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt   = d => d.toISOString().slice(0, 10);
  const label = start.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  return { start: fmt(start), end: fmt(end), label };
}

// -------- PDF builder --------
function buildPDF(data, outputPath) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(fs.createWriteStream(outputPath));

  const W    = doc.page.width - 100;
  const BLUE  = '#1a56db';
  const GRAY  = '#6b7280';
  const LIGHT = '#f3f4f6';
  const RED   = '#dc2626';

  // ---- HEADER ----
  doc.rect(0, 0, doc.page.width, 80).fill(BLUE);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
    .text('Halogenn Química — Relatório Mensal', 50, 22);
  doc.fontSize(11).font('Helvetica')
    .text(`Google Ads · ${data.monthLabel}`, 50, 50);
  doc.fillColor('black');

  let y = 105;

  // ---- RESUMO GERAL ----
  doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
    .text(`Resumo — ${data.monthLabel}`, 50, y);
  y += 20;

  const summary = [
    ['Impressões',   data.totals.impressions.toLocaleString('pt-BR')],
    ['Cliques',      data.totals.clicks.toLocaleString('pt-BR')],
    ['CTR Médio',    pct(data.totals.impressions > 0 ? data.totals.clicks / data.totals.impressions : 0)],
    ['Custo Total',  brl(data.totals.cost)],
    ['CPC Médio',    brl(data.totals.clicks > 0 ? data.totals.cost / data.totals.clicks : 0)],
    ['Conversões',   String(data.totals.conversions)],
    ['CPL (Custo/Conv)', data.totals.conversions > 0 ? brl(data.totals.cost / data.totals.conversions) : '—'],
    ['Orçamento usado',  brl(data.totals.cost) + ' / R$ 2.000,00'],
    ['% do limite',  pct(data.totals.cost / (2000 * 1e6))],
  ];

  const colW = W / 3;
  summary.forEach(([label, val], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx  = 50 + col * colW;
    const by  = y + row * 60;
    doc.rect(bx, by, colW - 8, 52).fill(LIGHT);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(label, bx + 8, by + 8);
    doc.fillColor('black').fontSize(14).font('Helvetica-Bold').text(val, bx + 8, by + 24, { width: colW - 20 });
  });

  y += Math.ceil(summary.length / 3) * 60 + 24;

  // ---- POR CAMPANHA ----
  doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
    .text('Performance por Campanha', 50, y);
  y += 16;

  const cols = ['Campanha', 'Impr.', 'Cliques', 'CTR', 'Custo', 'CPC Méd.', 'Conv.', 'CPL'];
  const cw   = [160, 50, 55, 50, 65, 65, 40, 50];

  doc.rect(50, y, W, 18).fill(BLUE);
  let x = 50;
  cols.forEach((c, i) => {
    doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold').text(c, x + 4, y + 4, { width: cw[i] - 4 });
    x += cw[i];
  });
  y += 18;

  data.campaigns.forEach((c, idx) => {
    const bg = idx % 2 === 0 ? 'white' : LIGHT;
    doc.rect(50, y, W, 18).fill(bg);
    const cpl = c.conversions > 0 ? brl((c.cost / c.conversions)) : '—';
    const row = [
      c.name.replace('[Busca] - ', ''),
      c.impressions.toLocaleString('pt-BR'),
      c.clicks.toLocaleString('pt-BR'),
      pct(c.impressions > 0 ? c.clicks / c.impressions : 0),
      brl(c.cost),
      brl(c.clicks > 0 ? c.cost / c.clicks : 0),
      String(c.conversions),
      cpl,
    ];
    x = 50;
    row.forEach((v, i) => {
      doc.fillColor('black').fontSize(8).font('Helvetica')
        .text(v, x + 4, y + 4, { width: cw[i] - 4 });
      x += cw[i];
    });
    y += 18;
  });

  y += 24;

  // ---- TOP KEYWORDS ----
  if (data.keywords && data.keywords.length > 0) {
    if (y > 620) { doc.addPage(); y = 50; }

    doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
      .text('Top Keywords (por cliques)', 50, y);
    y += 16;

    const kcols = ['Keyword', 'Grupo de Anúncios', 'Match', 'Cliques', 'Impr.', 'CTR', 'Custo'];
    const kcw   = [150, 130, 50, 45, 45, 45, 70];

    doc.rect(50, y, W, 18).fill(BLUE);
    x = 50;
    kcols.forEach((c, i) => {
      doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold').text(c, x + 4, y + 4, { width: kcw[i] - 4 });
      x += kcw[i];
    });
    y += 18;

    data.keywords.slice(0, 15).forEach((k, idx) => {
      const bg = idx % 2 === 0 ? 'white' : LIGHT;
      doc.rect(50, y, W, 18).fill(bg);
      const MATCH = { EXACT: 'Exata', PHRASE: 'Frase', BROAD: 'Ampla' };
      const row = [
        k.text,
        k.ad_group,
        MATCH[k.match_type] || k.match_type,
        k.clicks.toLocaleString('pt-BR'),
        k.impressions.toLocaleString('pt-BR'),
        pct(k.impressions > 0 ? k.clicks / k.impressions : 0),
        brl(k.cost),
      ];
      x = 50;
      row.forEach((v, i) => {
        doc.fillColor('black').fontSize(8).font('Helvetica')
          .text(v, x + 4, y + 4, { width: kcw[i] - 4 });
        x += kcw[i];
      });
      y += 18;
    });
    y += 24;
  }

  // ---- TOP TERMOS DE BUSCA ----
  if (data.searchTerms && data.searchTerms.length > 0) {
    if (y > 580) { doc.addPage(); y = 50; }

    doc.fontSize(13).font('Helvetica-Bold').fillColor(BLUE)
      .text('Top Termos de Busca (por cliques)', 50, y);
    y += 16;

    const scols = ['Termo', 'Campanha', 'Cliques', 'Impr.', 'Custo', 'Conv.'];
    const scw   = [200, 130, 50, 50, 65, 40];

    doc.rect(50, y, W, 18).fill(BLUE);
    x = 50;
    scols.forEach((c, i) => {
      doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold').text(c, x + 4, y + 4, { width: scw[i] - 4 });
      x += scw[i];
    });
    y += 18;

    data.searchTerms.slice(0, 15).forEach((t, idx) => {
      const bg = idx % 2 === 0 ? 'white' : LIGHT;
      doc.rect(50, y, W, 18).fill(bg);
      const row = [
        t.term,
        t.campaign,
        t.clicks.toLocaleString('pt-BR'),
        t.impressions.toLocaleString('pt-BR'),
        brl(t.cost),
        String(t.conversions),
      ];
      x = 50;
      row.forEach((v, i) => {
        doc.fillColor('black').fontSize(8).font('Helvetica')
          .text(v, x + 4, y + 4, { width: scw[i] - 4 });
        x += scw[i];
      });
      y += 18;
    });
    y += 24;
  }

  // ---- ALERTAS / OBSERVAÇÕES ----
  const obs = [];
  if (data.totals.conversions === 0)
    obs.push('Nenhuma conversão registrada no mês — verificar tag de conversão.');
  if (data.totals.cost / (2000 * 1e6) > 0.9)
    obs.push(`Gasto próximo do limite mensal (${pct(data.totals.cost / (2000 * 1e6))} de R$2.000)`);
  for (const c of data.campaigns) {
    if (c.impressions > 200 && c.clicks / c.impressions < 0.02)
      obs.push(`CTR baixo em "${c.name}": ${pct(c.clicks / c.impressions)} — revisar anúncios`);
  }

  if (obs.length > 0) {
    if (y > 680) { doc.addPage(); y = 50; }
    doc.rect(50, y, W, 18 + obs.length * 18).fill('#fef2f2').stroke('#fca5a5');
    doc.fillColor(RED).fontSize(11).font('Helvetica-Bold').text('Observações', 60, y + 5);
    y += 20;
    doc.font('Helvetica').fontSize(10).fillColor(RED);
    for (const o of obs) {
      doc.text(`• ${o}`, 60, y);
      y += 16;
    }
    doc.fillColor('black');
    y += 10;
  }

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
  const { start, end, label } = getMonthRange();
  console.log(`Consultando Google Ads API — ${label}...`);

  const [campaigns, keywords, searchTerms] = await Promise.all([
    customer.query(`
      SELECT campaign.name,
             metrics.impressions, metrics.clicks, metrics.cost_micros,
             metrics.conversions
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status != REMOVED
      ORDER BY metrics.cost_micros DESC
    `),
    customer.query(`
      SELECT ad_group_criterion.keyword.text,
             ad_group_criterion.keyword.match_type,
             ad_group.name,
             metrics.impressions, metrics.clicks, metrics.cost_micros
      FROM ad_group_criterion
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND ad_group_criterion.type = KEYWORD
        AND metrics.clicks > 0
      ORDER BY metrics.clicks DESC
      LIMIT 15
    `).catch(() => []),
    customer.query(`
      SELECT search_term_view.search_term, campaign.name,
             metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
      FROM search_term_view
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND metrics.clicks > 0
      ORDER BY metrics.clicks DESC
      LIMIT 15
    `).catch(() => []),
  ]);

  const totals = { impressions: 0, clicks: 0, cost: 0, conversions: 0 };

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
      cost:        m.cost_micros || 0,
      conversions: m.conversions || 0,
    };
  });

  const kwData = keywords.map(k => ({
    text:        k.ad_group_criterion.keyword.text,
    match_type:  k.ad_group_criterion.keyword.match_type,
    ad_group:    k.ad_group.name,
    impressions: k.metrics.impressions || 0,
    clicks:      k.metrics.clicks || 0,
    cost:        k.metrics.cost_micros || 0,
  }));

  const stData = searchTerms.map(t => ({
    term:        t.search_term_view.search_term,
    campaign:    t.campaign.name.replace('[Busca] - ', ''),
    impressions: t.metrics.impressions || 0,
    clicks:      t.metrics.clicks || 0,
    cost:        t.metrics.cost_micros || 0,
    conversions: t.metrics.conversions || 0,
  }));

  // nome do arquivo: mês de referência (anterior)
  const refDate = new Date();
  refDate.setMonth(refDate.getMonth() - 1);
  const monthStr = refDate.toISOString().slice(0, 7); // ex: 2026-04
  const filename  = `Halogenn_Mensal_${monthStr}.pdf`;
  const outputPath = path.join('C:/Users/User/Downloads', filename);

  console.log(`Gerando PDF: ${filename}`);

  buildPDF({
    monthLabel:  label,
    campaigns:   campData,
    keywords:    kwData,
    searchTerms: stData,
    totals,
  }, outputPath);

  console.log(`\n✅ PDF salvo em: ${outputPath}`);
}

main().catch(e => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
