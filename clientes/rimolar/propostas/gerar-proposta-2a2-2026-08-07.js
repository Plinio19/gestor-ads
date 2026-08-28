const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, 'Proposta-COT-2026-08-07-001-2A2.pdf');
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

// ── Header (sem logo — perdida na exclusão da pasta) ──────
doc.font('Helvetica-Bold').fontSize(20).fillColor(purple).text('RIMOLAR QUÍMICA', 50, 50);
doc.font('Helvetica').fontSize(8.5).fillColor(gray);
doc.text('Expresslab Comercio e Importacao de Equipamentos LTDA — CNPJ: 61.682.943/0001-36 — IE: 720.137.639.111', 50);
doc.text('Avenida Fernando de Noronha, 522, Jardim Margarida, Vargem Grande Paulista - SP, CEP 06739-020', 50);
doc.text('vendas@rimolar.com.br  |  (11) 5125-0558', 50);
doc.moveDown(0.6);

doc.font('Helvetica-Bold').fontSize(15).fillColor(purple).text('PROPOSTA COMERCIAL / COTAÇÃO', 50);
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(9).fillColor(gray);
doc.text('Número: COT-2026-08-07-001    |    Emissão: 07/08/2026    |    Validade: 12/08/2026 (5 dias)', 50);

hr(10, 8);

// ── Destinatário ────────────────────────────────────────
heading('DESTINATÁRIO');
field('Razão Social', '2A2 Comércio e Serviços Ltda.');
field('CNPJ', '03.176.698/000-99 (verificar — formato incompleto, faltando dígito)');
field('Inscrição Estadual', '050.976.544');
field('Endereço', 'Av. Sete de Setembro, nº 1420, Galeria Porto Fino, Loja 17');
field('Contato', 'Donilio Cal');
field('Telefone', '(71) 3033-3520');
field('WhatsApp', '(71) 99310-2081');
field('E-mail', '2a2comercial1999@gmail.com');

hr(10, 8);

// ── Item ──────────────────────────────────────────────────
heading('ITEM');

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

const qtde = 120;
const vlrUnit = 12.0;
const vlrTotal = qtde * vlrUnit;
const descText = 'Formol a 10% — embalagem 1000ml, com identificação do produto, marca do fabricante e validade';
const noteText = 'Código de referência interno Rimolar (não é registro regulatório)';

doc.font('Helvetica').fontSize(9);
const descHeight = doc.heightOfString(descText, { width: colW.desc });
const rowHeight = Math.max(descHeight, 12) + 10 + 12;

doc.rect(50, rowY, CONTENT_W, rowHeight).fillAndStroke('#F7F3FC', '#DDDDDD');
doc.fillColor('#000000');
doc.text('RIM-FORM10-1L', colX.cod + 5, rowY + 6, { width: colX.desc - colX.cod - 10 });
doc.text(descText, colX.desc, rowY + 6, { width: colW.desc });
doc.text(String(qtde), colX.qtd, rowY + 6);
doc.text('L', colX.un, rowY + 6);
doc.text(`R$ ${vlrUnit.toFixed(2)}`, colX.unit, rowY + 6);
doc.text(`R$ ${vlrTotal.toFixed(2)}`, colX.total, rowY + 6);

doc.font('Helvetica-Oblique').fontSize(7).fillColor('#666666')
  .text(noteText, colX.cod + 5, rowY + descHeight + 12, { width: CONTENT_W - 10 });

doc.y = rowY + rowHeight + 12;
doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
  .text(`TOTAL: R$ ${vlrTotal.toFixed(2)}`, 50, doc.y, { width: CONTENT_W, align: 'right' });
doc.moveDown(1);

hr(6, 8);

// ── Condições comerciais ────────────────────────────────
heading('CONDIÇÕES COMERCIAIS');
field('Forma de pagamento', 'A combinar');
field('Prazo de entrega', 'A confirmar após aprovação da cotação');
field('Frete', 'A combinar');

hr(10, 8);

// ── Observações ──────────────────────────────────────────
heading('OBSERVAÇÕES');
doc.font('Helvetica').fontSize(8.5).fillColor('#333333').text(
  'Embalagens de 1000ml conterão dados de identificação do produto, marca do fabricante e prazo de validade, conforme solicitado. Formol (formaldeído) é substância sujeita a controle regulatório — fornecimento condicionado à apresentação, pelo comprador, da documentação e autorização exigidas pela legislação aplicável, quando cabível. Proposta válida por 5 dias a partir da data de emissão.',
  50, doc.y, { width: CONTENT_W }
);

doc.moveDown(2);
doc.font('Helvetica').fontSize(9).fillColor('#555555')
  .text('Dúvidas ou aprovação: vendas@rimolar.com.br | (11) 5125-0558', 50);

doc.end();
console.log('PDF gerado em:', outPath);
