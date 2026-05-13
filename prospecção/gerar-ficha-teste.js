'use strict';

const fs   = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PDFParse } = require('pdf-parse');
const { parsearNF } = require('./processar-notas');

const PASTA = path.join(__dirname, 'ja_verificadas');

const COR = {
  ALTA:     '#C0392B',
  'ALTA-B': '#E67E22',
  MEDIA:    '#F39C12',
  BAIXA:    '#27AE60',
  titulo:   '#1A252F',
  label:    '#7F8C8D',
  valor:    '#2C3E50',
  fundo:    '#F8F9FA',
  linha:    '#E0E0E0',
  branco:   '#FFFFFF',
};

const BADGE = {
  'ALTA':   '● PRIORIDADE ALTA — Recorrente com Químicos',
  'ALTA-B': '● PRIORIDADE ALTA-B — Comprador de Químicos',
  'MEDIA':  '● PRIORIDADE MÉDIA — Setor Relacionado',
  'BAIXA':  '● PRIORIDADE BAIXA',
};

function classificar(temQuimico, setorRelacionado, qtdMeses) {
  if (temQuimico && qtdMeses >= 2) return 'ALTA';
  if (temQuimico)                  return 'ALTA-B';
  if (setorRelacionado)            return 'MEDIA';
  return 'BAIXA';
}

function abordagem(c) {
  const prods = (c.produtosQuimicos || []).slice(0, 2);
  if (c.prioridade === 'ALTA')
    return `Cliente RECORRENTE com histórico de compra de produtos químicos. Abordagem direta: apresentar portfólio completo, oferecer condições especiais de fidelidade e propor contrato de fornecimento. Referenciar produtos já utilizados: ${prods.join(', ') || 'ver histórico'}.`;
  if (c.prioridade === 'ALTA-B')
    return `Cliente com compra de químicos registrada. Verificar se ainda utiliza produtos similares e apresentar variedade do portfólio. Oferecer condição especial de reativação. Produtos identificados: ${prods.length > 0 ? prods.join(', ') : 'soluções tampão, reagentes — ver histórico'}.`;
  if (c.prioridade === 'MEDIA')
    return `Cliente do setor relacionado a produtos químicos. Não há registro de compra de químicos conosco. Abordagem: apresentar portfólio focado no segmento, identificar necessidades e oferecer cotação inicial ou amostra.`;
  return `Cliente sem histórico de compra de químicos. Abordagem consultiva: identificar necessidades, apresentar catálogo geral e verificar interesse em produtos de limpeza industrial ou reagentes básicos.`;
}

function renderizarFicha(doc, c) {
  const W = doc.page.width - 80;

  // Cabeçalho
  doc.rect(40, 40, W, 55).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(15).font('Helvetica-Bold')
    .text('NETLAB — FICHA DE PROSPECÇÃO', 50, 50, { width: W - 20 });
  doc.fontSize(9).font('Helvetica')
    .text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      50, 70, { width: W - 20 });

  // Badge
  doc.rect(40, 105, W, 30).fill(COR[c.prioridade] || COR.BAIXA);
  doc.fillColor(COR.branco).fontSize(12).font('Helvetica-Bold')
    .text(BADGE[c.prioridade] || c.prioridade, 50, 113, { width: W - 20 });

  let y = 148;

  // ── Dados do Cliente ──
  doc.rect(40, y, W, 20).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('DADOS DO CLIENTE', 50, y + 5);
  y += 24;

  doc.rect(40, y, W, 34).fill(COR.fundo).stroke(COR.linha);
  doc.fillColor(COR.titulo).fontSize(14).font('Helvetica-Bold')
    .text(c.nome || '—', 50, y + 9, { width: W - 20 });
  y += 38;

  const enderCompleto = [c.endereco, c.bairro, c.municipio, c.uf].filter(Boolean).join(', ');

  const campos = [
    ['CNPJ / CPF', c.doc      || '—'],
    ['Telefone',   c.telefone || '—'],
    ['Endereço',   enderCompleto || '—'],
    ['CEP',        c.cep      || '—'],
    ['NF(s)',      (c.nfs || []).join(', ') || '—'],
  ];

  campos.forEach(([lbl, val], i) => {
    doc.rect(40, y, W, 22).fill(i % 2 === 0 ? COR.branco : COR.fundo).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(lbl, 50, y + 7, { width: 100 });
    doc.fillColor(COR.valor).fontSize(9).font('Helvetica').text(val, 155, y + 7, { width: W - 125 });
    y += 22;
  });

  y += 12;

  // ── Histórico ──
  doc.rect(40, y, W, 20).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('HISTÓRICO DE COMPRAS NA NETLAB', 50, y + 5);
  y += 24;

  const historico = [
    ['Qtd de notas',         String(c.qtdNotas || 0)],
    ['Meses que comprou',    (c.meses || []).join(', ') || '—'],
    ['Frequência',           c.frequencia || '—'],
    ['Ticket médio',         `R$ ${parseFloat(c.ticketMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Comprou químicos',     c.temQuimico ? '✓ SIM' : 'Não'],
    ['Setor relacionado',    c.setorRelacionado ? '✓ SIM' : 'Não identificado'],
  ];

  historico.forEach(([lbl, val], i) => {
    const destaque = lbl.includes('químicos') && val.includes('SIM');
    doc.rect(40, y, W, 22).fill(i % 2 === 0 ? COR.branco : COR.fundo).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(lbl, 50, y + 7, { width: 160 });
    doc.fillColor(destaque ? COR.ALTA : COR.valor).fontSize(9)
      .font(destaque ? 'Helvetica-Bold' : 'Helvetica')
      .text(val, 215, y + 7, { width: W - 185 });
    y += 22;
  });

  y += 12;

  // ── Todos os produtos identificados ──
  if (c.todosProdutos && c.todosProdutos.length > 0) {
    doc.rect(40, y, W, 20).fill('#2C3E50');
    doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
      .text('PRODUTOS IDENTIFICADOS NAS NOTAS', 50, y + 5);
    y += 24;

    c.todosProdutos.slice(0, 8).forEach((prod, i) => {
      const bg = i % 2 === 0 ? COR.fundo : COR.branco;
      doc.rect(40, y, W, 22).fill(bg).stroke(COR.linha);
      doc.fillColor(COR.valor).fontSize(9).font('Helvetica')
        .text(`• ${prod.substring(0, 95)}`, 50, y + 7, { width: W - 20 });
      y += 22;
    });
    if (c.todosProdutos.length > 8) {
      doc.fillColor(COR.label).fontSize(8)
        .text(`   + ${c.todosProdutos.length - 8} produto(s) adicional(is)`, 50, y + 2);
      y += 16;
    }
    y += 8;
  }

  // ── Produtos Químicos (se houver) ──
  if (c.temQuimico && c.produtosQuimicos && c.produtosQuimicos.length > 0) {
    doc.rect(40, y, W, 20).fill('#C0392B');
    doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
      .text('PRODUTOS QUÍMICOS IDENTIFICADOS', 50, y + 5);
    y += 24;

    c.produtosQuimicos.slice(0, 6).forEach((prod, i) => {
      doc.rect(40, y, W, 22).fill(i % 2 === 0 ? '#FDEDEC' : '#FDFEFE').stroke('#F1948A');
      doc.fillColor('#922B21').fontSize(9).font('Helvetica')
        .text(`• ${prod.substring(0, 95)}`, 50, y + 7, { width: W - 20 });
      y += 22;
    });
    y += 8;
  }

  // ── Abordagem Sugerida ──
  doc.rect(40, y, W, 20).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ABORDAGEM SUGERIDA', 50, y + 5);
  y += 24;

  doc.rect(40, y, W, 56).fill('#EBF5FB').stroke('#AED6F1');
  doc.fillColor('#1A5276').fontSize(9).font('Helvetica')
    .text(abordagem(c), 50, y + 8, { width: W - 20, lineGap: 3 });
  y += 66;

  // ── Anotações ──
  doc.rect(40, y, W, 20).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ANOTAÇÕES DO VENDEDOR', 50, y + 5);
  y += 24;

  doc.rect(40, y, W, 65).fill(COR.branco).stroke(COR.linha);
  [14, 30, 46].forEach(off => {
    doc.moveTo(50, y + off).lineTo(40 + W - 10, y + off).stroke(COR.linha);
  });

  // Rodapé
  const H = doc.page.height;
  doc.rect(40, H - 38, W, 24).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(7).font('Helvetica')
    .text(`NETLAB Equipamentos para Laboratórios  |  Uso interno — prospecção comercial  |  ${new Date().toLocaleDateString('pt-BR')}`,
      50, H - 30, { width: W - 20, align: 'center' });
}

async function gerarPDF(cliente, destPath) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(destPath);
  doc.pipe(stream);
  renderizarFicha(doc, cliente);
  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(destPath));
    stream.on('error', reject);
  });
}

(async () => {
  const nfFiles = fs.existsSync(PASTA)
    ? fs.readdirSync(PASTA).filter(f => f.endsWith('-nfe.pdf')).sort()
    : [];

  if (nfFiles.length === 0) {
    console.log('❌ Nenhuma NF encontrada em ja_verificadas/');
    process.exit(1);
  }

  console.log(`📄 Processando ${nfFiles.length} NF(s) em ja_verificadas/...\n`);

  for (const arquivo of nfFiles) {
    const filePath = path.join(PASTA, arquivo);
    try {
      const buf = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: buf });
      const result = await parser.getText();
      await parser.destroy();

      const texto = (result && result.text) ? result.text : (typeof result === 'string' ? result : '');
      const nf = parsearNF(texto);

      if (!nf || (!nf.nome && !nf.doc)) {
        console.log(`⚠️  ${arquivo}: não extraiu dados de cliente`);
        continue;
      }

      const valor = parseFloat((nf.valorTotal || '0').replace(/\./g, '').replace(',', '.')) || 0;
      const meses = nf.mesAno ? [nf.mesAno] : [];
      const prioridade = classificar(nf.temQuimico, nf.setorRelacionado, meses.length);

      const cliente = {
        nome: nf.nome,
        doc: nf.doc,
        endereco: nf.endereco,
        bairro: nf.bairro,
        municipio: nf.municipio,
        uf: nf.uf,
        cep: nf.cep,
        telefone: nf.telefone,
        meses,
        frequencia: meses.length >= 4 ? 'Recorrente consolidado ⭐'
                  : meses.length >= 2 ? 'Recorrente em desenvolvimento'
                  : 'Pontual',
        qtdNotas: 1,
        ticketMedio: valor.toFixed(2),
        temQuimico: nf.temQuimico,
        setorRelacionado: nf.setorRelacionado,
        prioridade,
        nfs: nf.nfNum ? [nf.nfNum] : [],
        produtosQuimicos: nf.produtos.filter(p => p.ehQuimico).map(p => p.descricao),
        todosProdutos: nf.produtos.map(p => p.descricao),
      };

      // Log diagnóstico
      console.log(`📋 NF: ${nf.nfNum || '(número não encontrado)'}`);
      console.log(`   Cliente:    ${nf.nome}`);
      console.log(`   Doc:        ${nf.doc}`);
      console.log(`   Endereço:   ${[nf.endereco, nf.municipio, nf.uf].filter(Boolean).join(', ')}`);
      console.log(`   Telefone:   ${nf.telefone || '—'}`);
      console.log(`   Data:       ${nf.data}   Valor: R$ ${nf.valorTotal}`);
      console.log(`   Prioridade: ${prioridade}  |  Químico: ${nf.temQuimico}  |  Setor: ${nf.setorRelacionado}`);
      console.log(`   Produtos (${nf.produtos.length}):`);
      nf.produtos.forEach(p => {
        console.log(`     [NCM ${p.ncm}] ${p.ehQuimico ? '🔬 QUÍMICO' : '          '} — ${p.descricao}`);
      });

      const nomePDF = `ficha-${(nf.nome || 'cliente').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}.pdf`;
      const destPath = path.join(PASTA, nomePDF);
      await gerarPDF(cliente, destPath);
      console.log(`\n✅ PDF gerado: ${destPath}\n`);

    } catch (err) {
      console.error(`❌ Erro em ${arquivo}: ${err.message}`);
      if (process.env.DEBUG) console.error(err.stack);
    }
  }
})();
