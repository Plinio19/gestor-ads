const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, 'Proposta-COT-2026-08-26-001-JRHidroquimica.pdf');
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

doc.font('Helvetica-Bold').fontSize(20).fillColor(purple).text('RIMOLAR QUÍMICA', 50, 50);
doc.font('Helvetica').fontSize(8.5).fillColor(gray);
doc.text('Expresslab Comercio e Importacao de Equipamentos LTDA — CNPJ: 61.682.943/0001-36 — IE: 720.137.639.111', 50);
doc.text('Avenida Fernando de Noronha, 522, Jardim Margarida, Vargem Grande Paulista - SP, CEP 06739-020', 50);
doc.text('vendas@rimolar.com.br  |  (11) 5125-0558', 50);
doc.moveDown(0.6);

doc.font('Helvetica-Bold').fontSize(15).fillColor(purple).text('PROPOSTA COMERCIAL / COTAÇÃO', 50);
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(9).fillColor(gray);
doc.text('Número: COT-2026-08-26-001    |    Emissão: 26/08/2026    |    Validade: 31/08/2026 (5 dias)', 50);

hr(10, 8);

heading('DESTINATÁRIO');
field('Razão Social', 'WV Hidroanálise LTDA (nome fantasia: JR Hidroquímica)');
field('CNPJ', '85.314.086/0001-80');
field('Inscrição Estadual', 'Isento');
field('Endereço', 'Rua Santa Luzia, 75, Trindade, Florianópolis - SC, CEP 88036-540');
field('Contato', 'Geni Marin');
field('Telefone/WhatsApp', '(48) 99115-1443');
field('E-mail', 'laboratorio@jrhidroquimica.com.br');

hr(10, 8);

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

const qtde = 2;
const vlrUnit = 601.40;
const subtotal = qtde * vlrUnit;
const descText = 'Spectroquant DQO (25-1500mg/L COD) 25 testes Merck p/ análise em espectrofotômetro (teste em cubetas) — pronta entrega';

doc.font('Helvetica').fontSize(9);
const descHeight = doc.heightOfString(descText, { width: colW.desc });
const rowHeight = Math.max(descHeight, 12) + 12;

doc.rect(50, rowY, CONTENT_W, rowHeight).fillAndStroke('#F7F3FC', '#DDDDDD');
doc.fillColor('#000000');
doc.text('1145410001', colX.cod + 5, rowY + 6, { width: colX.desc - colX.cod - 10 });
doc.text(descText, colX.desc, rowY + 6, { width: colW.desc });
doc.text(String(qtde), colX.qtd, rowY + 6);
doc.text('Emb', colX.un, rowY + 6);
doc.text(`R$ ${vlrUnit.toFixed(2)}`, colX.unit, rowY + 6);
doc.text(`R$ ${subtotal.toFixed(2)}`, colX.total, rowY + 6);

doc.y = rowY + rowHeight + 12;
doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
  .text(`TOTAL: R$ ${subtotal.toFixed(2)}`, 50, doc.y, { width: CONTENT_W, align: 'right' });
doc.moveDown(1);

hr(6, 8);

heading('CONDIÇÕES COMERCIAIS');
field('Forma de pagamento', 'A combinar');
field('Frete', 'A combinar (calculado após confirmação do pedido para o CEP 88036-540)');
field('Prazo de envio', 'Pronta entrega — a confirmar após aprovação da cotação');

hr(10, 8);

heading('OBSERVAÇÕES');
doc.font('Helvetica').fontSize(8.5).fillColor('#333333').text(
  'Razão social e endereço completo consultados na base pública do CNPJ (Receita Federal) — nome fantasia informado pelo cliente ("JR Hidroquímica") corresponde à razão social WV Hidroanálise LTDA. Proposta válida por 5 dias a partir da data de emissão.',
  50, doc.y, { width: CONTENT_W }
);

doc.moveDown(2);
doc.font('Helvetica').fontSize(9).fillColor('#555555')
  .text('Dúvidas ou aprovação: vendas@rimolar.com.br | (11) 5125-0558', 50);

doc.end();
console.log('PDF gerado em:', outPath);
