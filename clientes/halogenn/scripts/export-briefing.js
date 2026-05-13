const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const briefing = fs.readFileSync(
  path.join(__dirname, '../BRIEFING.md'),
  'utf8'
);

const doc = new PDFDocument({ margin: 55, size: 'A4' });
const output = 'C:/Users/User/Downloads/Halogenn_Briefing_GoogleAds.pdf';
doc.pipe(fs.createWriteStream(output));

const W = doc.page.width - 110;
const BLUE  = '#1a56db';
const GRAY  = '#6b7280';
const LIGHT = '#f3f4f6';
const RED   = '#dc2626';
const GREEN = '#16a34a';

// ---- CAPA ----
doc.rect(0, 0, doc.page.width, 110).fill(BLUE);
doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
  .text('Halogenn Química', 55, 28);
doc.fontSize(16).font('Helvetica')
  .text('Briefing Completo — Gestor de Tráfego IA', 55, 60);
doc.fontSize(10)
  .text(`Google Ads · Versão 1.0 · Abril 2026`, 55, 85);
doc.fillColor('black');

let y = 130;

function checkPage(needed = 40) {
  if (y + needed > doc.page.height - 60) {
    doc.addPage();
    y = 55;
  }
}

function sectionTitle(text) {
  checkPage(50);
  // strip emoji prefix for cleaner look, keep text
  const clean = text.replace(/^#+\s*/, '').trim();
  doc.rect(55, y, W, 24).fill(BLUE);
  doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
    .text(clean, 63, y + 6);
  doc.fillColor('black');
  y += 32;
}

function subTitle(text) {
  checkPage(30);
  const clean = text.replace(/^#+\s*/, '').trim();
  doc.fillColor(BLUE).fontSize(11).font('Helvetica-Bold')
    .text(clean, 55, y);
  doc.fillColor('black');
  y += 16;
}

function bodyText(text) {
  checkPage(20);
  doc.fillColor('#111827').fontSize(9.5).font('Helvetica')
    .text(text, 60, y, { width: W - 10 });
  y += doc.heightOfString(text, { width: W - 10 }) + 4;
}

function bulletText(text) {
  checkPage(18);
  const clean = text.replace(/^[-*]\s*/, '').trim();
  doc.fillColor('#111827').fontSize(9.5).font('Helvetica')
    .text(`• ${clean}`, 68, y, { width: W - 20 });
  y += doc.heightOfString(`• ${clean}`, { width: W - 20 }) + 3;
}

function tableRow(cols, widths, isHeader = false) {
  checkPage(20);
  const bg = isHeader ? BLUE : null;
  if (bg) doc.rect(55, y, W, 18).fill(bg);
  let x = 55;
  cols.forEach((c, i) => {
    doc.fillColor(isHeader ? 'white' : '#111827')
      .fontSize(isHeader ? 9 : 9)
      .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .text(c, x + 4, y + 4, { width: widths[i] - 6 });
    x += widths[i];
  });
  if (!isHeader) {
    doc.rect(55, y, W, 18).stroke('#e5e7eb');
  }
  y += 18;
}

// ---- PARSE DO MARKDOWN ----
const lines = briefing.split('\n');
let inTable = false;
let tableWidths = [];
let rowIndex = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (!line) {
    if (!inTable) y += 4;
    continue;
  }

  // Separador horizontal
  if (/^---+$/.test(line)) {
    if (!inTable) { checkPage(10); y += 6; }
    continue;
  }

  // H1
  if (/^# /.test(line)) {
    sectionTitle(line);
    rowIndex = 0;
    continue;
  }

  // H2
  if (/^## /.test(line)) {
    y += 8;
    sectionTitle(line);
    rowIndex = 0;
    continue;
  }

  // H3
  if (/^### /.test(line)) {
    y += 4;
    subTitle(line);
    continue;
  }

  // Tabela
  if (/^\|/.test(line)) {
    const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());

    // linha separadora da tabela (---|---|...)
    if (cells.every(c => /^[-:]+$/.test(c))) {
      inTable = true;
      rowIndex = 1;
      continue;
    }

    if (!inTable) {
      // header
      const colCount = cells.length;
      tableWidths = cells.map(() => Math.floor(W / colCount));
      tableRow(cells, tableWidths, true);
      inTable = true;
      rowIndex = 0;
    } else {
      const bg = rowIndex % 2 === 0 ? LIGHT : 'white';
      doc.rect(55, y, W, 18).fill(bg);
      let x = 55;
      cells.forEach((c, i) => {
        const clean = c.replace(/\*\*/g, '').replace(/`/g, '');
        doc.fillColor('#111827').fontSize(9).font('Helvetica')
          .text(clean, x + 4, y + 4, { width: tableWidths[i] - 6 });
        x += tableWidths[i];
      });
      rowIndex++;
      y += 18;
    }
    continue;
  } else {
    inTable = false;
    tableWidths = [];
    rowIndex = 0;
  }

  // Bullet
  if (/^[-*]\s/.test(line)) {
    bulletText(line);
    continue;
  }

  // Sub-bullet (com indentação)
  if (/^\s{2,}[-*]\s/.test(lines[i])) {
    const clean = lines[i].replace(/^\s+[-*]\s*/, '').trim();
    checkPage(16);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
      .text(`  ◦ ${clean}`, 76, y, { width: W - 30 });
    y += doc.heightOfString(`  ◦ ${clean}`, { width: W - 30 }) + 3;
    continue;
  }

  // Blockquote / destaque
  if (/^>/.test(line)) {
    const clean = line.replace(/^>\s*/, '').replace(/\*\*/g, '');
    checkPage(28);
    doc.rect(55, y, 3, 20).fill(BLUE);
    doc.fillColor(BLUE).fontSize(10).font('Helvetica-Bold')
      .text(clean, 65, y + 4, { width: W - 15 });
    y += 24;
    continue;
  }

  // Texto normal (remove markdown inline)
  const clean = line
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^\d+\.\s/, '')
    .trim();

  if (clean) bodyText(clean);
}

// ---- RODAPÉ ----
doc.fontSize(8).fillColor(GRAY).font('Helvetica')
  .text(
    `Halogenn Química — Briefing Google Ads · Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    55, doc.page.height - 40, { align: 'center', width: W }
  );

doc.end();
console.log(`✅ PDF salvo em: ${output}`);
