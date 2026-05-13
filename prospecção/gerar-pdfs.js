'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const CONFIG = {
  arquivoDados: path.join(__dirname, 'clientes.json'),
  pastaPDFs:    path.join(__dirname, 'pdfs'),
  clientesPorPDF: 10,
};

// ============================================================
// CORES E ESTILOS
// ============================================================
const COR = {
  ALTA:   '#C0392B',
  'ALTA-B': '#E67E22',
  MEDIA:  '#F1C40F',
  BAIXA:  '#27AE60',
  titulo: '#1A252F',
  subtitulo: '#2C3E50',
  label:  '#7F8C8D',
  valor:  '#2C3E50',
  fundo:  '#F8F9FA',
  linha:  '#E0E0E0',
  branco: '#FFFFFF',
};

const ICONE_PRIORIDADE = {
  'ALTA':   '● PRIORIDADE ALTA',
  'ALTA-B': '● PRIORIDADE ALTA-B',
  'MEDIA':  '● PRIORIDADE MÉDIA',
  'BAIXA':  '● PRIORIDADE BAIXA',
};

// ============================================================
// GERADOR DE PDF DE LOTE (10 clientes por arquivo)
// ============================================================

function gerarPDFLote(clientes, nomeArquivo, numLote) {
  const filePath = path.join(CONFIG.pastaPDFs, nomeArquivo);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  clientes.forEach((cliente, idx) => {
    if (idx > 0) doc.addPage();
    renderizarFicha(doc, cliente, idx + 1, clientes.length, numLote);
  });

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

function renderizarFicha(doc, c, posicao, total, numLote) {
  const largura = doc.page.width - 80; // margens de 40 cada lado
  const corPrior = COR[c.prioridade] || COR.BAIXA;

  // ── Cabeçalho do documento ──
  doc.rect(40, 40, largura, 50).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(14).font('Helvetica-Bold')
    .text('NETLAB — FICHA DE PROSPECÇÃO', 50, 52, { width: largura - 20 });
  doc.fontSize(9).font('Helvetica')
    .text(`Lote ${String(numLote).padStart(3,'0')}  •  Cliente ${posicao} de ${total}  •  ${new Date().toLocaleDateString('pt-BR')}`,
      50, 70, { width: largura - 20 });

  // ── Badge de prioridade ──
  doc.rect(40, 100, largura, 28).fill(corPrior);
  doc.fillColor(COR.branco).fontSize(11).font('Helvetica-Bold')
    .text(ICONE_PRIORIDADE[c.prioridade] || c.prioridade, 50, 108, { width: largura - 20 });

  // ── Bloco: dados do cliente ──
  let y = 140;

  doc.rect(40, y, largura, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
    .text('DADOS DO CLIENTE', 50, y + 4);
  y += 22;

  // Nome em destaque
  doc.rect(40, y, largura, 30).fill(COR.fundo).stroke(COR.linha);
  doc.fillColor(COR.titulo).fontSize(13).font('Helvetica-Bold')
    .text(c.nome || '—', 50, y + 8, { width: largura - 20 });
  y += 36;

  // Grid de dados
  const campos = [
    ['CNPJ / CPF', c.doc || '—'],
    ['Telefone',   c.telefone || '—'],
    ['Endereço',   [c.endereco, c.bairro].filter(Boolean).join(', ') || '—'],
    ['Cidade/UF',  [c.municipio, c.uf].filter(Boolean).join(' / ') || '—'],
    ['CEP',        c.cep || '—'],
  ];

  campos.forEach(([label, valor], i) => {
    const bgColor = i % 2 === 0 ? COR.branco : COR.fundo;
    doc.rect(40, y, largura, 20).fill(bgColor).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold')
      .text(label, 50, y + 6, { width: 90, continued: false });
    doc.fillColor(COR.valor).fontSize(9).font('Helvetica')
      .text(valor, 145, y + 6, { width: largura - 115 });
    y += 20;
  });

  y += 10;

  // ── Bloco: histórico de compras ──
  doc.rect(40, y, largura, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
    .text('HISTÓRICO DE COMPRAS', 50, y + 4);
  y += 22;

  const dadosCompra = [
    ['Qtd de notas emitidas', String(c.qtdNotas || 0)],
    ['Meses que comprou',     (c.meses || []).join(', ') || '—'],
    ['Frequência',            c.frequencia || '—'],
    ['Ticket médio',          `R$ ${parseFloat(c.ticketMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Comprou produtos químicos', c.temQuimico ? '✓ SIM' : 'Não'],
    ['Setor relacionado a químicos', c.setorRelacionado ? '✓ SIM' : 'Não'],
  ];

  dadosCompra.forEach(([label, valor], i) => {
    const bgColor = i % 2 === 0 ? COR.branco : COR.fundo;
    const corValor = label.includes('químicos') && valor.includes('SIM') ? COR.ALTA : COR.valor;
    doc.rect(40, y, largura, 20).fill(bgColor).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold')
      .text(label, 50, y + 6, { width: 160 });
    doc.fillColor(corValor).fontSize(9).font('Helvetica-Bold')
      .text(valor, 210, y + 6, { width: largura - 180 });
    y += 20;
  });

  // Produtos químicos comprados (se houver)
  if (c.produtosQuimicos && c.produtosQuimicos.length > 0) {
    y += 4;
    doc.rect(40, y, largura, 18).fill('#C0392B');
    doc.fillColor(COR.branco).fontSize(9).font('Helvetica-Bold')
      .text('PRODUTOS QUÍMICOS IDENTIFICADOS NAS NOTAS:', 50, y + 4);
    y += 22;

    const prods = c.produtosQuimicos.slice(0, 5);
    prods.forEach((prod, i) => {
      const bgColor = i % 2 === 0 ? '#FDEDEC' : COR.branco;
      const linhaH = 18;
      doc.rect(40, y, largura, linhaH).fill(bgColor).stroke('#F1948A');
      doc.fillColor('#922B21').fontSize(8).font('Helvetica')
        .text(`• ${prod.substring(0, 90)}`, 50, y + 5, { width: largura - 20 });
      y += linhaH;
    });
    if (c.produtosQuimicos.length > 5) {
      doc.fillColor(COR.label).fontSize(8)
        .text(`   + ${c.produtosQuimicos.length - 5} produto(s) químico(s) adicional(is)`, 50, y + 2);
      y += 14;
    }
  }

  y += 10;

  // ── Bloco: abordagem sugerida ──
  doc.rect(40, y, largura, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
    .text('ABORDAGEM SUGERIDA', 50, y + 4);
  y += 22;

  const abordagem = gerarAbordagem(c);
  doc.rect(40, y, largura, 50).fill('#EBF5FB').stroke('#AED6F1');
  doc.fillColor('#1A5276').fontSize(9).font('Helvetica')
    .text(abordagem, 50, y + 8, { width: largura - 20, lineGap: 3 });
  y += 54;

  // ── Espaço para anotações ──
  y += 6;
  doc.rect(40, y, largura, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
    .text('ANOTAÇÕES DO VENDEDOR', 50, y + 4);
  y += 22;

  doc.rect(40, y, largura, 60).fill(COR.branco).stroke(COR.linha);
  doc.fillColor(COR.linha).fontSize(8)
    .text('_______________________________________________________________________________________________________', 50, y + 14)
    .text('_______________________________________________________________________________________________________', 50, y + 30)
    .text('_______________________________________________________________________________________________________', 50, y + 46);

  // ── Rodapé ──
  const altPagina = doc.page.height;
  doc.rect(40, altPagina - 40, largura, 25).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(7).font('Helvetica')
    .text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}  |  NETLAB Equipamentos para Laboratórios  |  Uso interno — prospecção comercial`,
      50, altPagina - 32, { width: largura - 20, align: 'center' });
}

function gerarAbordagem(c) {
  if (c.prioridade === 'ALTA') {
    return `Cliente RECORRENTE que já comprou produtos químicos. Abordagem direta: apresentar portfólio químico completo, oferecer condições especiais de fidelidade, propor contrato de fornecimento. Mencionar os produtos que já utilizam: ${(c.produtosQuimicos || []).slice(0,2).join(', ') || 'ver histórico'}.`;
  }
  if (c.prioridade === 'ALTA-B') {
    return `Cliente que já comprou produtos químicos (compra única identificada). Abordagem: verificar se ainda usa produtos similares, apresentar variedade do portfólio, oferecer condição de reativação. Produtos identificados: ${(c.produtosQuimicos || []).slice(0,2).join(', ') || 'ver histórico'}.`;
  }
  if (c.prioridade === 'MEDIA') {
    return `Cliente do setor relacionado a químicos (${c.nome}). Não comprou químicos conosco ainda. Abordagem: apresentar portfólio focado no segmento, identificar necessidades específicas do setor, oferecer amostra ou cotação inicial.`;
  }
  return `Cliente sem histórico de compra de químicos. Abordagem consultiva: identificar necessidades, apresentar catálogo geral, verificar interesse em produtos de limpeza industrial ou reagentes básicos.`;
}

// ============================================================
// ORQUESTRADOR PRINCIPAL
// ============================================================

async function gerarTodosPDFs() {
  if (!fs.existsSync(CONFIG.arquivoDados)) {
    console.error('❌ clientes.json não encontrado. Rode --lote500 primeiro.');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.pastaPDFs)) fs.mkdirSync(CONFIG.pastaPDFs, { recursive: true });

  const salvo = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
  const todos = Object.values(salvo.clientes || {});

  // Ordenar: ALTA → ALTA-B → MÉDIA → BAIXA, depois por recorrência
  const ordem = { 'ALTA': 0, 'ALTA-B': 1, 'MEDIA': 2, 'BAIXA': 3 };
  const lista = todos.sort((a, b) => {
    const pA = ordem[a.prioridade] ?? 4;
    const pB = ordem[b.prioridade] ?? 4;
    if (pA !== pB) return pA - pB;
    return (b.meses || []).length - (a.meses || []).length;
  });

  // Separar por prioridade
  const alta   = lista.filter(c => c.prioridade === 'ALTA');
  const altaB  = lista.filter(c => c.prioridade === 'ALTA-B');
  const media  = lista.filter(c => c.prioridade === 'MEDIA');
  const baixa  = lista.filter(c => c.prioridade === 'BAIXA');

  console.log(`\n📄 Gerando PDFs de prospecção...`);
  console.log(`   🔴 ALTA:   ${alta.length} clientes`);
  console.log(`   🟠 ALTA-B: ${altaB.length} clientes`);
  console.log(`   🟡 MÉDIA:  ${media.length} clientes`);
  console.log(`   🟢 BAIXA:  ${baixa.length} clientes (apenas CSV)`);

  // Lotes de 10 por PDF — ALTA + ALTA-B juntos (prioridade máxima)
  const prioritarios = [...alta, ...altaB];
  let loteNum = 1;
  let pdfsGerados = 0;

  for (let i = 0; i < prioritarios.length; i += CONFIG.clientesPorPDF) {
    const grupo = prioritarios.slice(i, i + CONFIG.clientesPorPDF);
    const nome = `lote-${String(loteNum).padStart(3,'0')}-ALTA.pdf`;
    await gerarPDFLote(grupo, nome, loteNum);
    loteNum++;
    pdfsGerados++;
    process.stdout.write(`  ⏳ PDFs ALTA/ALTA-B: ${pdfsGerados} gerados...\r`);
  }
  console.log(`  ✅ ${pdfsGerados} PDFs de ALTA/ALTA-B gerados`);

  // Lotes de MÉDIA
  let pdfsMedia = 0;
  for (let i = 0; i < media.length; i += CONFIG.clientesPorPDF) {
    const grupo = media.slice(i, i + CONFIG.clientesPorPDF);
    const nome = `lote-${String(loteNum).padStart(3,'0')}-MEDIA.pdf`;
    await gerarPDFLote(grupo, nome, loteNum);
    loteNum++;
    pdfsMedia++;
    process.stdout.write(`  ⏳ PDFs MÉDIA: ${pdfsMedia} gerados...\r`);
  }
  console.log(`  ✅ ${pdfsMedia} PDFs de MÉDIA gerados`);

  // CSV para BAIXA
  if (baixa.length > 0) {
    gerarCSV(baixa, path.join(CONFIG.pastaPDFs, 'clientes-baixa.csv'));
    console.log(`  ✅ CSV de BAIXA gerado (${baixa.length} clientes)`);
  }

  // CSV completo de todos
  gerarCSV(lista, path.join(CONFIG.pastaPDFs, 'todos-clientes.csv'));

  console.log(`\n🎉 Pronto!`);
  console.log(`   Total de PDFs de prospecção: ${pdfsGerados + pdfsMedia}`);
  console.log(`   Pasta: ${CONFIG.pastaPDFs}`);
  console.log(`\n📅 Rotina diária:`);
  console.log(`   Dia 1: lote-001-ALTA.pdf  (10 clientes prioritários)`);
  console.log(`   Dia 2: lote-002-ALTA.pdf`);
  console.log(`   ...`);
}

function gerarCSV(clientes, filePath) {
  const cabecalho = 'Prioridade,Nome,CNPJ/CPF,Telefone,Endereço,Bairro,Municipio,UF,CEP,Frequencia,Meses,QtdNotas,TicketMedio,TemQuimico,SetorRelacionado';
  const linhas = clientes.map(c => [
    c.prioridade,
    `"${(c.nome || '').replace(/"/g, "'")}"`,
    c.doc || '',
    c.telefone || '',
    `"${(c.endereco || '').replace(/"/g, "'")}"`,
    `"${(c.bairro || '').replace(/"/g, "'")}"`,
    `"${(c.municipio || '').replace(/"/g, "'")}"`,
    c.uf || '',
    c.cep || '',
    `"${c.frequencia || ''}"`,
    `"${(c.meses || []).join(';')}"`,
    c.qtdNotas || 0,
    c.ticketMedio || 0,
    c.temQuimico ? 'Sim' : 'Não',
    c.setorRelacionado ? 'Sim' : 'Não',
  ].join(','));

  fs.writeFileSync(filePath, [cabecalho, ...linhas].join('\n'), 'utf8');
}

// ── Entrada ──
gerarTodosPDFs().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
