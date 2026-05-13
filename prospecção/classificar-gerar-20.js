'use strict';

const fs   = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const CONFIG = {
  arquivoDados: path.join(__dirname, 'clientes.json'),
  pastaFichas:  path.join(__dirname, 'fichas'),
};

// ── 20 clientes ALTA identificados por análise manual ──────────────────────
// Ordenados por recorrência (mais meses primeiro)
const CNPJS_ALTA = [
  '17150506000180', // WEST LAB COMERCIO DE PRODUTOS PARA LABORATORIO LTDA     (32m, 90 NFs)
  '60160546000131', // DIGICROM ANALITICA LTDA                                  (32m, 83 NFs)
  '72060999000175', // FUNDACAO COORDENACAO DE PROJETOS PESQUISAS E ESTUDOS    (31m,103 NFs)
  '13597309000152', // REAGE PRODUTOS P LABORATORIO EIRELI                      (31m, 99 NFs)
  '06265738000167', // WALDIR DE ASSIS LEMOS DE OLIVEIRA LTDA                   (30m, 81 NFs)
  '10517066000107', // ERCA INDUSTRIA E COMERCIO DE PRODUTOS QUIMICOS LTDA      (30m, 41 NFs)
  '08154651000148', // GENERAL WATER SANEAMENTO LTDA                            (29m, 54 NFs)
  '02261854000157', // UNINTER EDUCACIONAL SA                                   (29m, 53 NFs)
  '68314830000127', // FUNDACAO DE APOIO A UNIVERSIDADE DE SAO PAULO            (29m, 59 NFs)
  '33047177000100', // LAB4BIO ANALISES LABORATTORIAIS EIRELI                   (27m, 47 NFs)
  '11323420000125', // VALE - PRODUTOS ANALITICOS E AFINS LTDA ME               (27m, 43 NFs)
  '19031125000107', // MACOFREN TECNOLOGIAS                                     (26m, 40 NFs)
  '06628333000146', // FARMACE INDUSTRIA QUIMICO-FARMACEUTICA CEARENSE LTDA     (26m, 59 NFs)
  '22409542000155', // CUNHA LAB LTDA                                           (26m, 48 NFs)
  '34600556000130', // ORIGINARE CENTRO DE REPRODUCAO HUMANA                   (25m, 37 NFs)
  '37987999000114', // RAI INGREDIENTES INDUSTRIAL SA                           (25m, 55 NFs)
  '96230719000198', // MAZA PRODUTOS QUIMICOS LTDA                              (25m, 46 NFs)
  '71487094000113', // FUNDACAO DOM AGUIRRE                                     (25m, 39 NFs)
  '48045090000163', // EPA ENGENHARIA DE PROTECAO AMBIENTAL LTDA                (25m, 58 NFs)
  '18755529000180', // MCG INDUSTRIA FARMACEUTICA E IMPORTACAO LTDA             (25m, 47 NFs)
];

// NCM: capítulos de produtos químicos (para destaque visual no PDF)
// Classificação definitiva é feita pelo Claude Code — aqui é só para cor na ficha
const CAP_QUIMICO = new Set([28,29,31,32,34,35,38]);
function ncmEhQuimico(ncm) {
  const cap = parseInt((ncm || '').replace(/\D/g,'').substring(0,2), 10);
  return CAP_QUIMICO.has(cap);
}

// ── Estilos ─────────────────────────────────────────────────────────────────
const COR = {
  ALTA:      '#C0392B',
  'ALTA-B':  '#E67E22',
  MEDIA:     '#F1C40F',
  BAIXA:     '#27AE60',
  titulo:    '#1A252F',
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

function gerarAbordagem(c) {
  if (c.prioridade === 'ALTA')
    return `Cliente RECORRENTE com histórico de compra de produtos químicos. Abordagem direta: apresentar portfólio completo, oferecer condições especiais de fidelidade e propor contrato de fornecimento. Referenciar histórico de compras identificado nas notas fiscais.`;
  if (c.prioridade === 'ALTA-B')
    return `Cliente com compra de químicos registrada. Verificar se ainda utiliza produtos similares e apresentar variedade do portfólio. Oferecer condição especial de reativação. Consultar histórico de produtos abaixo.`;
  if (c.prioridade === 'MEDIA')
    return `Cliente do setor relacionado. Não há registro de compra de químicos conosco. Abordagem: apresentar portfólio focado no segmento, identificar necessidades e oferecer cotação inicial.`;
  return `Cliente sem histórico de compra de químicos. Abordagem consultiva: identificar necessidades e apresentar catálogo geral.`;
}

function formatarPreco(valor) {
  if (!valor && valor !== 0) return '—';
  return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Renderiza uma ficha — pode ocupar múltiplas páginas se necessário
function renderizarFicha(doc, c, pos, total, lote) {
  const W = doc.page.width - 80;
  const PG_H = doc.page.height;
  const MARGEM_RODAPE = 55; // espaço reservado para rodapé + margem
  const corPrior = COR[c.prioridade] || COR.BAIXA;

  function rodape() {
    doc.rect(40, PG_H - 38, W, 24).fill(COR.titulo);
    doc.fillColor(COR.branco).fontSize(7).font('Helvetica')
      .text(`NETLAB Equipamentos para Laboratórios  |  Uso interno — prospecção comercial  |  ${new Date().toLocaleDateString('pt-BR')}`,
        50, PG_H - 30, { width: W - 20, align: 'center' });
  }

  function novaPageSeNecessario(alturaNecessaria) {
    if (doc.y + alturaNecessaria > PG_H - MARGEM_RODAPE) {
      rodape();
      doc.addPage();
      doc.y = 40;
    }
  }

  // ── Cabeçalho ──
  doc.rect(40, 40, W, 50).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(14).font('Helvetica-Bold')
    .text('NETLAB — FICHA DE PROSPECÇÃO', 50, 52, { width: W - 20 });
  doc.fontSize(9).font('Helvetica')
    .text(`Lote ${String(lote).padStart(3,'0')}  •  Lead ${pos} de ${total}  •  ${new Date().toLocaleDateString('pt-BR')}`,
      50, 70, { width: W - 20 });

  // ── Badge prioridade ──
  doc.rect(40, 100, W, 26).fill(corPrior);
  doc.fillColor(COR.branco).fontSize(11).font('Helvetica-Bold')
    .text(BADGE[c.prioridade] || c.prioridade, 50, 108, { width: W - 20 });

  let y = 138;

  // ── Dados do Cliente ──
  doc.rect(40, y, W, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('DADOS DO CLIENTE', 50, y + 4);
  y += 22;

  doc.rect(40, y, W, 28).fill(COR.fundo).stroke(COR.linha);
  doc.fillColor(COR.titulo).fontSize(13).font('Helvetica-Bold')
    .text(c.nome || '—', 50, y + 7, { width: W - 20 });
  y += 32;

  const endereco = [c.endereco, c.bairro].filter(Boolean).join(', ') || '—';
  const cidadeUF = [c.municipio, c.uf].filter(Boolean).join(' / ') || '—';

  const campos = [
    ['CNPJ / CPF',  c.doc || '—'],
    ['Telefone',    c.telefone || '—'],
    ['Endereço',    endereco],
    ['Cidade / UF', cidadeUF],
    ['CEP',         c.cep || '—'],
  ];

  campos.forEach(([lbl, val], i) => {
    doc.rect(40, y, W, 20).fill(i % 2 === 0 ? COR.branco : COR.fundo).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(lbl, 50, y + 6, { width: 90 });
    doc.fillColor(COR.valor).fontSize(9).font('Helvetica').text(val, 145, y + 6, { width: W - 115 });
    y += 20;
  });

  y += 10;

  // ── Histórico de Compras ──
  doc.rect(40, y, W, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('HISTÓRICO DE COMPRAS NA NETLAB', 50, y + 4);
  y += 22;

  const hist = [
    ['Qtd de notas',              String(c.qtdNotas || 0)],
    ['Meses que comprou',         (c.meses || []).join(', ') || '—'],
    ['Frequência',                c.frequencia || '—'],
    ['Ticket médio por NF',       formatarPreco(c.ticketMedio)],
    ['Total acumulado',           formatarPreco(c.ticketTotal)],
  ];

  hist.forEach(([lbl, val], i) => {
    doc.rect(40, y, W, 20).fill(i % 2 === 0 ? COR.branco : COR.fundo).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(lbl, 50, y + 6, { width: 150 });
    doc.fillColor(COR.valor).fontSize(9).font('Helvetica').text(val, 205, y + 6, { width: W - 175 });
    y += 20;
  });

  y += 10;

  // ── Abordagem Sugerida ──
  novaPageSeNecessario(80);
  doc.rect(40, y, W, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ABORDAGEM SUGERIDA', 50, y + 4);
  y += 22;

  doc.rect(40, y, W, 50).fill('#EBF5FB').stroke('#AED6F1');
  doc.fillColor('#1A5276').fontSize(9).font('Helvetica')
    .text(gerarAbordagem(c), 50, y + 8, { width: W - 20, lineGap: 3 });
  y += 58;

  y += 8;

  // ── Histórico Completo de Produtos ──
  const produtos = c.produtos || [];
  if (produtos.length > 0) {
    novaPageSeNecessario(50);
    doc.rect(40, y, W, 18).fill('#2C3E50');
    doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
      .text(`HISTÓRICO COMPLETO DE PRODUTOS (${produtos.length} itens únicos)`, 50, y + 4);
    y += 20;

    // Cabeçalho da tabela
    const COL = { desc: 50, un: 310, qty: 345, unit: 390, total: 455 };
    doc.rect(40, y, W, 16).fill('#ECF0F1');
    doc.fillColor(COR.label).fontSize(7).font('Helvetica-Bold');
    doc.text('DESCRIÇÃO DO PRODUTO', COL.desc, y + 5, { width: 255 });
    doc.text('UN',   COL.un,   y + 5, { width: 32 });
    doc.text('QTD',  COL.qty,  y + 5, { width: 42 });
    doc.text('VL.UN.MÉDIO', COL.unit, y + 5, { width: 62 });
    doc.text('TOTAL GASTO', COL.total, y + 5, { width: 65 });
    y += 16;

    // Ordenar: químicos por NCM primeiro, depois resto — ambos por total gasto desc
    const quimicos = produtos.filter(p => ncmEhQuimico(p.ncm));
    const outros   = produtos.filter(p => !ncmEhQuimico(p.ncm));
    const ordenar = arr => arr.sort((a,b) => (b.valorTotalAcumulado||0) - (a.valorTotalAcumulado||0));
    const listaOrdenada = [...ordenar(quimicos), ...ordenar(outros)];

    listaOrdenada.forEach((p, i) => {
      novaPageSeNecessario(18);
      const ehQ = ncmEhQuimico(p.ncm);
      const bg  = ehQ
        ? (i % 2 === 0 ? '#FDEDEC' : '#FDFAFA')
        : (i % 2 === 0 ? COR.branco : COR.fundo);

      doc.rect(40, y, W, 18).fill(bg).stroke(COR.linha);

      // Marca químico com bolinha vermelha
      if (ehQ) {
        doc.fillColor('#C0392B').fontSize(7).font('Helvetica-Bold')
          .text('●', 42, y + 6, { width: 8 });
      }

      doc.fillColor(ehQ ? '#922B21' : COR.valor).fontSize(8)
        .font(ehQ ? 'Helvetica-Bold' : 'Helvetica')
        .text(p.descricao.substring(0, 58), COL.desc, y + 5, { width: 255, lineBreak: false });

      doc.fillColor(COR.label).fontSize(7).font('Helvetica');
      doc.text(p.unidade || '—', COL.un, y + 5, { width: 32 });

      const qtd = p.qtdTotal > 0 ? p.qtdTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : `${p.qtdNFs} NFs`;
      doc.text(qtd, COL.qty, y + 5, { width: 42 });

      doc.fillColor(ehQ ? '#922B21' : COR.valor).fontSize(8)
        .font(ehQ ? 'Helvetica-Bold' : 'Helvetica')
        .text(formatarPreco(p.valorUnitarioMedio), COL.unit, y + 5, { width: 62 });

      doc.fillColor(COR.valor).fontSize(8).font('Helvetica')
        .text(formatarPreco(p.valorTotalAcumulado), COL.total, y + 5, { width: 65 });

      y += 18;
    });

    // Legenda
    y += 4;
    novaPageSeNecessario(20);
    doc.fillColor('#C0392B').fontSize(7).font('Helvetica')
      .text('● Produtos marcados em vermelho = capítulo NCM de produto químico (Claude Code confirma na classificação)', 50, y, { width: W - 20 });
    y += 14;
  }

  y += 6;

  // ── Anotações do Vendedor ──
  novaPageSeNecessario(90);
  doc.rect(40, y, W, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ANOTAÇÕES DO VENDEDOR', 50, y + 4);
  y += 22;

  doc.rect(40, y, W, 65).fill(COR.branco).stroke(COR.linha);
  [16, 32, 48].forEach(off => {
    doc.moveTo(50, y + off).lineTo(40 + W - 10, y + off).stroke(COR.linha);
  });

  rodape();
}

async function gerarPDF(clientes, filePath) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  clientes.forEach((c, i) => {
    if (i > 0) doc.addPage();
    renderizarFicha(doc, c, i + 1, clientes.length, 1);
  });
  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

// ── MAIN ────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(CONFIG.arquivoDados)) {
    console.error('❌ clientes.json não encontrado.');
    process.exit(1);
  }
  if (!fs.existsSync(CONFIG.pastaFichas)) fs.mkdirSync(CONFIG.pastaFichas, { recursive: true });

  const dados = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
  const clientes = dados.clientes || {};

  const lista20 = [];
  const naoEncontrados = [];

  for (const cnpj of CNPJS_ALTA) {
    if (clientes[cnpj]) {
      const c = clientes[cnpj];

      // Classificação manual confirmada (estes foram analisados pelo Claude Code)
      c.temQuimico   = true;
      c.prioridade   = 'ALTA';
      c.classificado = true;
      c.concluido    = true;

      if (!c.ticketMedio && c.ticketTotal && c.qtdNotas) {
        c.ticketMedio = (c.ticketTotal / c.qtdNotas).toFixed(2);
      }

      const meses = (c.meses || []).length;
      c.frequencia = meses >= 4 ? 'Recorrente consolidado ⭐'
                   : meses >= 2 ? 'Recorrente em desenvolvimento'
                   : 'Pontual';

      lista20.push(c);
      const qtdProds = (c.produtos || []).length;
      const qtdQuim  = (c.produtos || []).filter(p => ncmEhQuimico(p.ncm)).length;
      console.log(`✓ ${c.nome} — ${qtdProds} produto(s), ${qtdQuim} com NCM químico`);
    } else {
      naoEncontrados.push(cnpj);
      console.warn(`⚠️  CNPJ não encontrado: ${cnpj}`);
    }
  }

  // Salvar clientes.json com classificações atualizadas
  fs.writeFileSync(CONFIG.arquivoDados, JSON.stringify(dados, null, 2), 'utf8');
  console.log(`\n💾 clientes.json atualizado (${lista20.length} clientes classificados + concluido=true)`);

  if (lista20.length === 0) {
    console.error('❌ Nenhum cliente encontrado. Os CNPJs precisam ser reprocessados.');
    process.exit(1);
  }

  // Gerar PDF
  const data = new Date().toISOString().slice(0, 10);
  const nomeArq = `leads-ALTA-${data}.pdf`;
  const destino = path.join(CONFIG.pastaFichas, nomeArq);
  await gerarPDF(lista20, destino);

  console.log(`\n🎉 PDF gerado com ${lista20.length} leads:`);
  console.log(`   ${destino}`);

  if (naoEncontrados.length > 0) {
    console.warn(`\n⚠️  ${naoEncontrados.length} CNPJ(s) não encontrado(s) — precisa reprocessar as NFs com --tudo`);
    naoEncontrados.forEach(c => console.warn(`   ${c}`));
  }
})();
