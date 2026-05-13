'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const CONFIG = {
  arquivoDados: path.join(__dirname, 'clientes.json'),
  pastaPDFs:    path.join(__dirname, 'pdfs'),
};

const COR = {
  ALTA:   '#C0392B',
  'ALTA-B': '#E67E22',
  MEDIA:  '#F39C12',
  BAIXA:  '#27AE60',
  titulo:    '#1A252F',
  subtitulo: '#2C3E50',
  label:     '#7F8C8D',
  valor:     '#2C3E50',
  fundo:     '#F8F9FA',
  linha:     '#E0E0E0',
  branco:    '#FFFFFF',
};

const BADGE = {
  'ALTA':   '● PRIORIDADE ALTA — Recorrente com Químicos',
  'ALTA-B': '● PRIORIDADE ALTA-B — Comprador de Químicos',
  'MEDIA':  '● PRIORIDADE MÉDIA — Setor Relacionado',
  'BAIXA':  '● PRIORIDADE BAIXA',
};

function limparProduto(desc) {
  // Remove ruído de tabela que vem junto na extração
  return desc
    .replace(/\d+\s+\d{8}\s*$/,'')       // remove NCM no final
    .replace(/\s+\d{3}\s+\d{4}\s+[A-Z]{2,3}\s+[\d,.]+.*$/,'') // remove dados numéricos da tabela
    .replace(/^\s*[•\-]\s*/, '')
    .trim();
}

function renderizarFicha(doc, c) {
  const largura = doc.page.width - 80;
  const corPrior = COR[c.prioridade] || COR.BAIXA;

  // Cabeçalho
  doc.rect(40, 40, largura, 55).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(15).font('Helvetica-Bold')
    .text('NETLAB — FICHA DE PROSPECÇÃO', 50, 50, { width: largura - 20 });
  doc.fontSize(9).font('Helvetica')
    .text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      50, 70, { width: largura - 20 });

  // Badge prioridade
  doc.rect(40, 105, largura, 30).fill(corPrior);
  doc.fillColor(COR.branco).fontSize(12).font('Helvetica-Bold')
    .text(BADGE[c.prioridade] || c.prioridade, 50, 113, { width: largura - 20 });

  let y = 148;

  // ── Dados do Cliente ──
  doc.rect(40, y, largura, 20).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('DADOS DO CLIENTE', 50, y + 5);
  y += 24;

  // Nome em destaque
  doc.rect(40, y, largura, 34).fill(COR.fundo).stroke(COR.linha);
  doc.fillColor(COR.titulo).fontSize(14).font('Helvetica-Bold')
    .text(c.nome || '—', 50, y + 9, { width: largura - 20 });
  y += 38;

  const enderecoCompleto = [c.endereco, c.bairro, c.municipio, c.uf].filter(Boolean).join(', ');

  const campos = [
    ['CNPJ / CPF',  c.doc || '—'],
    ['Telefone',    c.telefone || '—'],
    ['Endereço',    enderecoCompleto || '—'],
    ['CEP',         c.cep || '—'],
  ];

  campos.forEach(([label, valor], i) => {
    const bg = i % 2 === 0 ? COR.branco : COR.fundo;
    doc.rect(40, y, largura, 22).fill(bg).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(label, 50, y + 7, { width: 100 });
    doc.fillColor(COR.valor).fontSize(9).font('Helvetica').text(valor, 155, y + 7, { width: largura - 125 });
    y += 22;
  });

  y += 12;

  // ── Histórico ──
  doc.rect(40, y, largura, 20).fill('#2C3E50');
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

  historico.forEach(([label, valor], i) => {
    const bg = i % 2 === 0 ? COR.branco : COR.fundo;
    const destaque = label.includes('químicos') && valor.includes('SIM');
    doc.rect(40, y, largura, 22).fill(bg).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(label, 50, y + 7, { width: 160 });
    doc.fillColor(destaque ? COR.ALTA : COR.valor).fontSize(9)
      .font(destaque ? 'Helvetica-Bold' : 'Helvetica')
      .text(valor, 215, y + 7, { width: largura - 185 });
    y += 22;
  });

  y += 12;

  // ── Produtos Químicos ──
  if (c.temQuimico && c.produtosQuimicos && c.produtosQuimicos.length > 0) {
    doc.rect(40, y, largura, 20).fill('#C0392B');
    doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
      .text('PRODUTOS QUÍMICOS IDENTIFICADOS', 50, y + 5);
    y += 24;

    // Filtrar e limpar produtos — remover ruído de tabela
    const produtosLimpos = c.produtosQuimicos
      .map(limparProduto)
      .filter(p => p.length > 5 && !/^\d/.test(p) && !/^[A-Z]{2,3}\s+\d/.test(p));

    if (produtosLimpos.length === 0) {
      doc.rect(40, y, largura, 22).fill('#FDEDEC').stroke('#F1948A');
      doc.fillColor('#922B21').fontSize(9).font('Helvetica')
        .text('Identificado via código NCM (ver nota original)', 50, y + 7, { width: largura - 20 });
      y += 26;
    } else {
      produtosLimpos.slice(0, 6).forEach((prod, i) => {
        const bg = i % 2 === 0 ? '#FDEDEC' : '#FDFEFE';
        doc.rect(40, y, largura, 22).fill(bg).stroke('#F1948A');
        doc.fillColor('#922B21').fontSize(9).font('Helvetica')
          .text(`• ${prod.substring(0, 95)}`, 50, y + 7, { width: largura - 20 });
        y += 22;
      });
      if (produtosLimpos.length > 6) {
        doc.fillColor(COR.label).fontSize(8)
          .text(`   + ${produtosLimpos.length - 6} produto(s) adicional(is) nas notas`, 50, y + 2);
        y += 16;
      }
    }
    y += 8;
  }

  // ── Abordagem Sugerida ──
  doc.rect(40, y, largura, 20).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ABORDAGEM SUGERIDA', 50, y + 5);
  y += 24;

  const abordagem = gerarAbordagem(c);
  const altAbord = 56;
  doc.rect(40, y, largura, altAbord).fill('#EBF5FB').stroke('#AED6F1');
  doc.fillColor('#1A5276').fontSize(9).font('Helvetica')
    .text(abordagem, 50, y + 8, { width: largura - 20, lineGap: 3 });
  y += altAbord + 10;

  // ── Anotações ──
  doc.rect(40, y, largura, 20).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ANOTAÇÕES DO VENDEDOR', 50, y + 5);
  y += 24;

  doc.rect(40, y, largura, 65).fill(COR.branco).stroke(COR.linha);
  [14, 30, 46].forEach(off => {
    doc.moveTo(50, y + off).lineTo(40 + largura - 10, y + off).stroke(COR.linha);
  });
  y += 70;

  // Rodapé
  const altPag = doc.page.height;
  doc.rect(40, altPag - 38, largura, 24).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(7).font('Helvetica')
    .text(`NETLAB Equipamentos para Laboratórios  |  Uso interno — prospecção comercial  |  ${new Date().toLocaleDateString('pt-BR')}`,
      50, altPag - 30, { width: largura - 20, align: 'center' });
}

function gerarAbordagem(c) {
  const prods = (c.produtosQuimicos || [])
    .map(limparProduto)
    .filter(p => p.length > 5 && !/^\d/.test(p))
    .slice(0, 2);

  if (c.prioridade === 'ALTA') {
    return `Cliente RECORRENTE com histórico de compra de produtos químicos. Abordagem direta: apresentar portfólio completo, oferecer condições especiais de fidelidade e propor contrato de fornecimento. Referenciar produtos já utilizados: ${prods.join(', ') || 'ver histórico'}.`;
  }
  if (c.prioridade === 'ALTA-B') {
    return `Cliente com compra de químicos registrada. Verificar se ainda utiliza produtos similares e apresentar variedade do portfólio. Oferecer condição especial de reativação. Produtos identificados: ${prods.length > 0 ? prods.join(', ') : 'soluções tampão, reagentes — ver histórico'}.`;
  }
  if (c.prioridade === 'MEDIA') {
    return `Cliente do setor relacionado a produtos químicos. Não há registro de compra de químicos conosco. Abordagem: apresentar portfólio focado no segmento, identificar necessidades e oferecer cotação inicial ou amostra.`;
  }
  return `Cliente sem histórico de compra de químicos. Abordagem consultiva: identificar necessidades, apresentar catálogo geral e verificar interesse em produtos de limpeza industrial ou reagentes básicos.`;
}

async function gerarFichaIndividual(cliente, nomeArquivo) {
  const filePath = path.join(CONFIG.pastaPDFs, nomeArquivo);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  renderizarFicha(doc, cliente);
  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

// ── Entrada: recebe nomes via argumento ──
(async () => {
  if (!fs.existsSync(CONFIG.arquivoDados)) {
    console.error('❌ clientes.json não encontrado.');
    process.exit(1);
  }
  if (!fs.existsSync(CONFIG.pastaPDFs)) fs.mkdirSync(CONFIG.pastaPDFs, { recursive: true });

  const busca = process.argv.slice(2).join(' ').toUpperCase();
  if (!busca) {
    console.error('Uso: node gerar-ficha-individual.js "NOME DO CLIENTE"');
    process.exit(1);
  }

  const dados = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
  const todos = Object.values(dados.clientes || {});

  // Busca parcial no nome
  const encontrados = todos.filter(c => (c.nome || '').toUpperCase().includes(busca));

  if (encontrados.length === 0) {
    console.log(`❌ Nenhum cliente encontrado com "${busca}"`);
    process.exit(1);
  }

  for (const cliente of encontrados) {
    const nomeArq = `ficha-${(cliente.nome || 'cliente').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 40)}.pdf`;
    const filePath = await gerarFichaIndividual(cliente, nomeArq);
    console.log(`✅ ${filePath}`);
  }
})();
