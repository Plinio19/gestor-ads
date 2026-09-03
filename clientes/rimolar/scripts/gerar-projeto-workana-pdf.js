const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const mdPath = path.resolve(__dirname, '..', 'logs', 'projeto-workana-merchant-center-2026-08-28.md');
const outPath = path.resolve(__dirname, '..', 'logs', 'Projeto-Workana-Merchant-Center-2026-08-28.pdf');

const md = fs.readFileSync(mdPath, 'utf8');
const lines = md.split('\n');

const doc = new PDFDocument({ size: 'A4', margin: 55 });
doc.pipe(fs.createWriteStream(outPath));

const CONTENT_W = 485;
const ink = '#1A1A1A';
const gray = '#555555';
const line = '#DDDDDD';

function renderInline(text) {
  // Bold **text** / `code` support. Assumes cursor already positioned; writes continued segments.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isBold = part.startsWith('**') && part.endsWith('**');
    const isCode = part.startsWith('`') && part.endsWith('`');
    const clean = isBold ? part.slice(2, -2) : isCode ? part.slice(1, -1) : part;
    doc.font(isBold ? 'Helvetica-Bold' : isCode ? 'Courier' : 'Helvetica');
    doc.fillColor(isCode ? '#6B2FBF' : ink);
    const isLast = i === parts.length - 1;
    doc.text(clean, { continued: !isLast });
  }
}

function ensureSpace(h) {
  if (doc.y + h > doc.page.height - 55) doc.addPage();
}

for (let raw of lines) {
  const l = raw.trimEnd();
  if (l === '---') {
    ensureSpace(20);
    doc.moveDown(0.3);
    const y = doc.y;
    doc.moveTo(55, y).lineTo(55 + CONTENT_W, y).strokeColor(line).lineWidth(1).stroke();
    doc.moveDown(0.5);
    continue;
  }
  if (l.startsWith('# ')) {
    ensureSpace(40);
    doc.font('Helvetica-Bold').fontSize(17).fillColor('#6B2FBF').text(l.slice(2), 55, doc.y, { width: CONTENT_W });
    doc.moveDown(0.6);
    continue;
  }
  if (l.startsWith('## ')) {
    ensureSpace(30);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#6B2FBF').text(l.slice(3), 55, doc.y, { width: CONTENT_W });
    doc.moveDown(0.3);
    continue;
  }
  if (l.startsWith('- ')) {
    ensureSpace(16);
    doc.x = 65;
    doc.font('Helvetica').fontSize(10).fillColor(ink);
    doc.text('•  ', { continued: true, width: CONTENT_W - 10 });
    renderInline(l.slice(2));
    doc.moveDown(0.15);
    continue;
  }
  const numMatch = l.match(/^(\d+)\.\s+(.*)/);
  if (numMatch) {
    ensureSpace(16);
    doc.x = 60;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ink);
    doc.text(`${numMatch[1]}. `, { continued: true });
    renderInline(numMatch[2]);
    doc.moveDown(0.15);
    continue;
  }
  if (l === '') {
    doc.moveDown(0.35);
    continue;
  }
  ensureSpace(14);
  doc.x = 55;
  doc.fontSize(10).fillColor(ink);
  renderInline(l);
  doc.moveDown(0.15);
}

doc.end();
console.log('PDF gerado em:', outPath);
