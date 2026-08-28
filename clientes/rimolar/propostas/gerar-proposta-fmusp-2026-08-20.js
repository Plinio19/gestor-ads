const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, 'Proposta-COT-2026-08-20-002-FMUSP.pdf');
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
doc.text('Número: COT-2026-08-20-002    |    Emissão: 20/08/2026    |    Validade: 25/08/2026 (5 dias)', 50);

hr(10, 8);

heading('DADOS PARA EMISSÃO DA NOTA FISCAL (FATURAMENTO)');
field('Razão Social', 'Fundação Faculdade de Medicina');
field('CNPJ', '56.577.059/0001-00');
field('Inscrição Estadual', '112.495.960.114');
field('Endereço', 'Av. Reboucas, 381, Jardim Paulista, São Paulo/SP, CEP 05401-000');
field('Isenção de ICMS', 'Isenta de ICMS nos termos do Artigo nº 153, Anexo I do Decreto 45.490/00 — Convênio 120/2011. Valor do ICMS não cobrado a constar nos dados adicionais da NF — alíquota exata a confirmar com a contabilidade antes da emissão.');

hr(10, 8);

heading('ENDEREÇO DE ENTREGA — LIM 44');
field('Local', 'Sala 4113, 4º andar, FMUSP');
field('Endereço', 'Av. Dr. Enéas Carvalho de Aguiar, 250, Cerqueira César, São Paulo/SP, CEP 05403-000');
field('Janela de entrega', 'Segunda a quinta-feira, das 13h às 17h — combinar data com antecedência antes do envio');

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

const qtde = 100;
const vlrUnit = 35.0;
const subtotal = qtde * vlrUnit;
const descText = 'Paraformaldeído 4% Tamponado';
const noteText = 'Quantidade cotada (100L) conforme definição interna do gestor — cliente havia solicitado orçamento de 50L';

doc.font('Helvetica').fontSize(9);
const descHeight = doc.heightOfString(descText, { width: colW.desc });
const rowHeight = Math.max(descHeight, 12) + 10 + 12;

doc.rect(50, rowY, CONTENT_W, rowHeight).fillAndStroke('#F7F3FC', '#DDDDDD');
doc.fillColor('#000000');
doc.text('A CONFIRMAR', colX.cod + 5, rowY + 6, { width: colX.desc - colX.cod - 10 });
doc.text(descText, colX.desc, rowY + 6, { width: colW.desc });
doc.text(String(qtde), colX.qtd, rowY + 6);
doc.text('L', colX.un, rowY + 6);
doc.text(`R$ ${vlrUnit.toFixed(2)}`, colX.unit, rowY + 6);
doc.text(`R$ ${subtotal.toFixed(2)}`, colX.total, rowY + 6);

doc.font('Helvetica-Oblique').fontSize(7).fillColor('#666666')
  .text(noteText, colX.cod + 5, rowY + descHeight + 12, { width: CONTENT_W - 10 });

doc.y = rowY + rowHeight + 12;
doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
  .text(`TOTAL: R$ ${subtotal.toFixed(2)}`, 50, doc.y, { width: CONTENT_W, align: 'right' });
doc.moveDown(1);

hr(6, 8);

heading('CONDIÇÕES COMERCIAIS');
field('Forma de pagamento', 'A combinar');
field('Frete', 'A combinar — entrega restrita à janela de seg-qui, 13h-17h, combinar data com antecedência');
field('Prazo de envio', 'A confirmar após aprovação da cotação');

hr(10, 8);

heading('OBSERVAÇÕES');
doc.font('Helvetica').fontSize(8.5).fillColor('#333333').text(
  'Cotação emitida para 100 litros — cliente havia solicitado orçamento de 50 litros; volume e preço (R$35,00/L) definidos internamente pelo gestor da Rimolar antes do envio. Código de referência do produto no catálogo Rimolar ainda não confirmado. Paraformaldeído é substância sujeita a controle regulatório — fornecimento condicionado à documentação/autorização exigida pela legislação aplicável, quando cabível. Nota Fiscal deve mencionar a isenção de ICMS conforme dados informados pelo cliente (Artigo nº 153, Anexo I do Decreto 45.490/00, Convênio 120/2011) — alíquota/valor exato a confirmar com a contabilidade antes da emissão. Proposta válida por 5 dias a partir da data de emissão.',
  50, doc.y, { width: CONTENT_W }
);

doc.moveDown(2);
doc.font('Helvetica').fontSize(9).fillColor('#555555')
  .text('Dúvidas ou aprovação: vendas@rimolar.com.br | (11) 5125-0558', 50);

doc.end();
console.log('PDF gerado em:', outPath);
