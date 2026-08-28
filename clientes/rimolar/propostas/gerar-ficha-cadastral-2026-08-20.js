const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outPath = path.resolve(__dirname, 'Ficha-Cadastral-Rimolar-2026-08-20.pdf');
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
doc.text('vendas@rimolar.com.br  |  (11) 5125-0558  |  www.rimolar.com.br', 50);
doc.moveDown(0.6);

doc.font('Helvetica-Bold').fontSize(15).fillColor(purple).text('FICHA CADASTRAL DE FORNECEDOR', 50);
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(9).fillColor(gray);
doc.text('Emissão: 20/08/2026', 50);

hr(10, 8);

heading('IDENTIFICAÇÃO DA EMPRESA');
field('Nome Fantasia', 'Rimolar Química');
field('Razão Social', 'Expresslab Comercio e Importacao de Equipamentos LTDA');
field('CNPJ', '61.682.943/0001-36');
field('Inscrição Estadual (SP)', '720.137.639.111');
field('Inscrição Municipal', 'A confirmar');
field('Data de abertura', '10/07/2025');
field('Porte', 'Microempresa (ME)');
field('Regime tributário', 'Simples Nacional');
field('Capital Social', 'R$ 20.000,00');
field('Ramo de atividade (CNAE)', 'A confirmar');

hr(10, 8);

heading('ENDEREÇO');
field('Logradouro', 'Avenida Fernando de Noronha, 522, Jardim Margarida');
field('Município/UF', 'Vargem Grande Paulista / SP');
field('CEP', '06739-020');

hr(10, 8);

heading('CONTATO');
field('Site', 'https://www.rimolar.com.br/');
field('E-mail comercial', 'vendas@rimolar.com.br');
field('Telefone', '(11) 5125-0558');
field('Responsável legal / sócio administrador', 'A confirmar');

hr(10, 8);

heading('DADOS BANCÁRIOS');
field('Banco', '461 - Asaas I.P S.A');
field('Agência', '0001');
field('Conta', '6347820-0 (Conta de Pagamento)');
field('Titular', 'Expresslab Comercio e Importacao de Equipamentos LTDA');
field('CNPJ do titular', '61.682.943/0001-36');
field('Chave PIX', 'A confirmar');

hr(10, 8);

heading('OBSERVAÇÕES');
doc.font('Helvetica').fontSize(8.5).fillColor('#333333').text(
  'A Rimolar Química opera sob o CNPJ da Expresslab Comercio e Importacao de Equipamentos LTDA (mesmo grupo econômico, marcas/operações separadas). Campos marcados como "A confirmar" dependem de informação adicional do responsável pela empresa.',
  50, doc.y, { width: CONTENT_W }
);

doc.moveDown(2);
doc.font('Helvetica').fontSize(9).fillColor('#555555')
  .text('Dúvidas: vendas@rimolar.com.br | (11) 5125-0558', 50);

doc.end();
console.log('PDF gerado em:', outPath);
