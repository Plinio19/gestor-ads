const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, 'Proposta-COT-2026-08-04-002-R1-Ana-Furtado.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 50 });
doc.pipe(fs.createWriteStream(outPath));

const purple = '#6B2FBF';
const gray = '#555555';
const CONTENT_W = 495;

function hr(gapBefore = 10, gapAfter = 10) {
  doc.moveDown(gapBefore / 10);
  const y = doc.y;
  doc.moveTo(50, y).lineTo(50 + CONTENT_W, y).strokeColor('#DDDDDD').lineWidth(1).stroke();
  doc.moveDown(gapAfter / 10);
}

function heading(text) {
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000').text(text, 50);
  doc.moveDown(0.4);
}

function field(label, value) {
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#222222')
    .text(`${label}: `, 50, doc.y, { continued: true, width: CONTENT_W });
  doc.font('Helvetica').fillColor('#222222').text(value);
  doc.moveDown(0.25);
}

// ── Header (sem logo — perdida na exclusão da pasta, pendente reenvio) ──
doc.font('Helvetica-Bold').fontSize(20).fillColor(purple).text('RIMOLAR QUÍMICA', 50, 50);
doc.font('Helvetica').fontSize(8.5).fillColor(gray);
doc.text('Expresslab Comercio e Importacao de Equipamentos LTDA — CNPJ: 61.682.943/0001-36 — IE: 720.137.639.111', 50);
doc.text('Avenida Fernando de Noronha, 522, Jardim Margarida, Vargem Grande Paulista - SP, CEP 06739-020', 50);
doc.text('vendas@rimolar.com.br  |  (11) 5125-0558', 50);
doc.moveDown(0.6);

doc.font('Helvetica-Bold').fontSize(15).fillColor(purple).text('PROPOSTA COMERCIAL / COTAÇÃO — REVISÃO 1', 50);
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(9).fillColor(gray);
doc.text('Número: COT-2026-08-04-002-R1  (revisa COT-2026-08-04-002)    |    Emissão: 07/08/2026    |    Validade: 12/08/2026 (5 dias)', 50);

hr(10, 8);

// ── Solicitante / Destinatário ────────────────────────────
heading('SOLICITANTE / DESTINATÁRIO');
field('Nome', 'Ana Lucia Furtado da Costa');
field('CPF', '296.052.453-53');
field('Endereço', 'Travessa Rubinei Rios, 98 — Parque Soledade — Caucaia/CE — CEP 61608-430');
field('Contato', 'Ana Furtado');
field('Telefone', '(85) 98875-4198');
field('WhatsApp', '(85) 99119-5353');
field('E-mail', 'anafurtadoc@gmail.com');

hr(10, 8);

// ── Item ──────────────────────────────────────────────────
heading('ITEM (revisado — quantidade ajustada)');

const colX = { cod: 50, desc: 135, qtd: 335, un: 370, unit: 400, total: 460 };
const colW = { desc: 195 };

doc.font('Helvetica-Bold').fontSize(8.5);
let rowY = doc.y;
doc.rect(50, rowY, CONTENT_W, 20).fill(purple);
doc.fillColor('#FFFFFF');
doc.text('Código', colX.cod + 5, rowY + 6);
doc.text('Descrição', colX.desc, rowY + 6);
doc.text('Qtde', colX.qtd, rowY + 6);
doc.text('Un.', colX.un, rowY + 6);
doc.text('Vlr.Unit.', colX.unit, rowY + 6);
doc.text('Vlr.Total', colX.total, rowY + 6);
rowY += 20;

const qtde = 2;
const vlrUnit = 57.50;
const subtotal = qtde * vlrUnit;
const descText = 'Arginina-L 98% PA — 100g';

doc.font('Helvetica').fontSize(9);
const descHeight = doc.heightOfString(descText, { width: colW.desc });
const rowHeight = Math.max(descHeight, 12) + 12;

doc.rect(50, rowY, CONTENT_W, rowHeight).fillAndStroke('#F7F3FC', '#DDDDDD');
doc.fillColor('#000000');
doc.text('A07855RA', colX.cod + 5, rowY + 6, { width: colX.desc - colX.cod - 10 });
doc.text(descText, colX.desc, rowY + 6, { width: colW.desc });
doc.text(String(qtde), colX.qtd, rowY + 6);
doc.text('Un', colX.un, rowY + 6);
doc.text(`R$ ${vlrUnit.toFixed(2)}`, colX.unit, rowY + 6);
doc.text(`R$ ${subtotal.toFixed(2)}`, colX.total, rowY + 6);

const frete = 40.0;
const totalGeral = subtotal + frete;

doc.y = rowY + rowHeight + 12;
doc.font('Helvetica').fontSize(9.5).fillColor('#000000')
  .text(`Subtotal produtos: R$ ${subtotal.toFixed(2)}`, 50, doc.y, { width: CONTENT_W, align: 'right' });
doc.moveDown(0.2);
doc.text(`Frete: R$ ${frete.toFixed(2)}`, 50, doc.y, { width: CONTENT_W, align: 'right' });
doc.moveDown(0.3);
doc.font('Helvetica-Bold').fontSize(11)
  .text(`TOTAL: R$ ${totalGeral.toFixed(2)}`, 50, doc.y, { width: CONTENT_W, align: 'right' });
doc.moveDown(1);

hr(6, 8);

// ── Condições comerciais ────────────────────────────────
heading('CONDIÇÕES COMERCIAIS');
field('Forma de pagamento', 'Pix ou Boleto');
field('Prazo de envio', 'Até 6 dias úteis após aprovação da cotação');
field('Frete', `R$ ${frete.toFixed(2)} (incluso no total acima)`);

hr(10, 8);

// ── Observações ──────────────────────────────────────────
heading('OBSERVAÇÕES');
doc.font('Helvetica').fontSize(8.5).fillColor('#333333').text(
  'Esta cotação substitui a COT-2026-08-04-002: quantidade ajustada de 1 para 2 unidades e frete de R$40,00 adicionado ao total. Proposta válida por 5 dias a partir da data de emissão. Confirmação desta cotação necessária para prosseguir com a emissão da Nota Fiscal/cobrança.',
  50, doc.y, { width: CONTENT_W }
);

doc.moveDown(2);
doc.font('Helvetica').fontSize(9).fillColor('#555555')
  .text('Dúvidas ou aprovação: vendas@rimolar.com.br | (11) 5125-0558', 50);

doc.end();
console.log('PDF gerado em:', outPath);
