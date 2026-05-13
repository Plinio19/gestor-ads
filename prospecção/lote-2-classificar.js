'use strict';

const fs   = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const CONFIG = {
  arquivoDados: path.join(__dirname, 'clientes.json'),
  pastaFichas:  path.join(__dirname, 'fichas'),
};

// ── Lote 2 — 20 clientes ALTA classificados pelo Claude Code ─────────────────
// Análise inteligente: leitura de produto + NCM, SEM keywords de script
// Data: 2026-05-13
const LOTE2 = [
  { cnpj: '04202583000194', motivo: 'Agar M-FC, TSB, gerador anaerobac, caldo triptona soja — meios de cultura confirmados' },
  { cnpj: '02177011000177', motivo: 'Buffer pH 4/7/10, KCl 3M eletrolítico, solução pepsina p/ eletrodo — químicos de calibração pHmetro' },
  { cnpj: '10815906000118', motivo: 'Iodeto de potássio PA ACS, tiossulfato de sódio PA ACS, agar batata dextrose, buffers, 15+ químicos' },
  { cnpj: '45833399000120', motivo: 'DPD1/DPD2 reagente líquido para análise de cloro livre (NCM 38229000)' },
  { cnpj: '01858973000129', motivo: 'Acetato de amônio PA ACS (cap.29), fenantrolina 1,10 PA (cap.29), agar TSA, buffers — reagentes analíticos' },
  { cnpj: '21423790000198', motivo: 'Meio tioglicolato, agar manitol, agar DRBC, silica gel TLC, cap.29 orgânico confirmado' },
  { cnpj: '18075746000120', motivo: 'Buffer pH 4/7/10, KCl eletrolítico, papéis indicadores pH — 88 NFs em 23 meses (alta freq.)' },
  { cnpj: '08623794000151', motivo: 'Azul de metileno PA (cap.32), solução padrão turbidez 100 NTU, buffers' },
  { cnpj: '01437707000122', motivo: 'Glutaraldeído 50% em água (cap.29), persulfato de potássio PA (cap.28), KH2PO4/Na2HPO4 PA, acetato de butila PA (cap.29)' },
  { cnpj: '18976715000140', motivo: 'Meio tioglicolato, buffers pH 4/7/10, KCl eletrolítico, papel pH' },
  { cnpj: '05551514000159', motivo: 'MnSO4 PA (cap.28), água peptona tamponada, caldo bile verde brilhante 2%, caldo lauril triptose, agar ureia, agar nutriente' },
  { cnpj: '03613421000186', motivo: 'Solução fenolftaleína 1% alcóolica, agar bacteriológico, caldo BDA, padrão condutividade, gerador anaerobac' },
  { cnpj: '06131415000180', motivo: 'NaOH microperolas PA ACS (cap.28), tripolifosfato sódio (cap.28), padrões turbidez 0,1/10/100/800 NTU, buffer' },
  { cnpj: '14968971000134', motivo: 'Trifenil tetrazolium cloreto 2,3,5 99% (cap.29 — reagente de viabilidade microbiológica)' },
  { cnpj: '82895327000133', motivo: 'Metanol PA ACS (cap.29!), isopropanol 70% (cap.29), carvão ativo (cap.38), indicadores pH, cap.29 múltiplos' },
  { cnpj: '50511286000148', motivo: 'Agar SS, agar nutriente, caldo nutriente, silica gel azul PA (cap.28), gerador anaerobac, padrão condutividade, 8+ culturas' },
  { cnpj: '58309709000153', motivo: 'K2SO4 PA, (NH4)2CO3 PA, preto de eriochrome T (cap.29), oxalato de sódio PA, acetato de amônio PA — reagentes titrimetria' },
  { cnpj: '04019575000107', motivo: 'Sulfato de mercúrio II PA (cap.28 — Hg), Colilert IDEXX (cap.38), sacos com tiossulfato de sódio (cap.28)' },
  { cnpj: '28942524000110', motivo: 'LiCl 3M alcóolico (cap.38), KCl 3M eletrolítico, silica gel p/ cromatografia em coluna 1Kg (cap.28)' },
  { cnpj: '60967551000150', motivo: 'Marcador peso molecular 100bp (cap.38), azul de astra (cap.38), agar TSA, agar Sabouraud, caldo Mac Conkey' },
];

const CAP_QUIMICO = new Set([28,29,31,32,34,35,38]);
function ncmEhQuimico(ncm) {
  const cap = parseInt((ncm||'').replace(/\D/g,'').substring(0,2), 10);
  return CAP_QUIMICO.has(cap);
}

const COR = {
  ALTA:   '#C0392B',
  titulo: '#1A252F',
  label:  '#7F8C8D',
  valor:  '#2C3E50',
  fundo:  '#F8F9FA',
  linha:  '#E0E0E0',
  branco: '#FFFFFF',
};

function formatarPreco(v) {
  if (!v && v !== 0) return '—';
  return `R$ ${parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gerarAbordagem(c, motivo) {
  return `Cliente RECORRENTE com compra confirmada de produtos químicos. ${motivo}. Abordagem: apresentar portfólio completo, referenciar produtos já identificados, oferecer condição especial de fornecimento recorrente.`;
}

function renderizarFicha(doc, c, motivo, pos, total) {
  const W = doc.page.width - 80;
  const PG_H = doc.page.height;
  const MARGEM_RODAPE = 55;

  function rodape() {
    doc.rect(40, PG_H - 38, W, 24).fill(COR.titulo);
    doc.fillColor(COR.branco).fontSize(7).font('Helvetica')
      .text(`NETLAB — Uso interno — prospecção comercial — Lote 2 — ${new Date().toLocaleDateString('pt-BR')}`,
        50, PG_H - 30, { width: W - 20, align: 'center' });
  }

  function novaPageSeNecessario(h) {
    if (doc.y + h > PG_H - MARGEM_RODAPE) {
      rodape(); doc.addPage(); doc.y = 40;
    }
  }

  // Cabeçalho
  doc.rect(40, 40, W, 50).fill(COR.titulo);
  doc.fillColor(COR.branco).fontSize(14).font('Helvetica-Bold')
    .text('NETLAB — FICHA DE PROSPECÇÃO', 50, 52, { width: W - 20 });
  doc.fontSize(9).font('Helvetica')
    .text(`Lote 002  •  Lead ${pos} de ${total}  •  ${new Date().toLocaleDateString('pt-BR')}`, 50, 70, { width: W - 20 });

  doc.rect(40, 100, W, 26).fill(COR.ALTA);
  doc.fillColor(COR.branco).fontSize(11).font('Helvetica-Bold')
    .text('● PRIORIDADE ALTA — Recorrente com Químicos', 50, 108, { width: W - 20 });

  let y = 138;

  // Dados do cliente
  doc.rect(40, y, W, 18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('DADOS DO CLIENTE', 50, y + 4);
  y += 22;

  doc.rect(40, y, W, 28).fill(COR.fundo).stroke(COR.linha);
  doc.fillColor(COR.titulo).fontSize(13).font('Helvetica-Bold')
    .text(c.nome || '—', 50, y + 7, { width: W - 20 });
  y += 32;

  const end = [c.endereco, c.bairro].filter(Boolean).join(', ') || '—';
  const cid = [c.municipio, c.uf].filter(Boolean).join(' / ') || '—';

  [['CNPJ / CPF', c.doc||'—'], ['Telefone', c.telefone||'—'], ['Endereço', end], ['Cidade / UF', cid], ['CEP', c.cep||'—']].forEach(([l,v],i)=>{
    doc.rect(40,y,W,20).fill(i%2===0?COR.branco:COR.fundo).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(l,50,y+6,{width:90});
    doc.fillColor(COR.valor).fontSize(9).font('Helvetica').text(v,145,y+6,{width:W-115});
    y+=20;
  });
  y+=10;

  // Histórico
  doc.rect(40,y,W,18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('HISTÓRICO DE COMPRAS NA NETLAB',50,y+4);
  y+=22;

  [
    ['Qtd de notas', String(c.qtdNotas||0)],
    ['Meses que comprou', (c.meses||[]).join(', ')||'—'],
    ['Frequência', c.frequencia||'—'],
    ['Ticket médio por NF', formatarPreco(c.ticketMedio)],
    ['Total acumulado', formatarPreco(c.ticketTotal)],
  ].forEach(([l,v],i)=>{
    doc.rect(40,y,W,20).fill(i%2===0?COR.branco:COR.fundo).stroke(COR.linha);
    doc.fillColor(COR.label).fontSize(8).font('Helvetica-Bold').text(l,50,y+6,{width:150});
    doc.fillColor(COR.valor).fontSize(9).font('Helvetica').text(v,205,y+6,{width:W-175});
    y+=20;
  });
  y+=10;

  // Abordagem
  novaPageSeNecessario(80);
  doc.rect(40,y,W,18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('RAZÃO DA CLASSIFICAÇÃO ALTA',50,y+4);
  y+=22;
  doc.rect(40,y,W,48).fill('#EBF5FB').stroke('#AED6F1');
  doc.fillColor('#1A5276').fontSize(9).font('Helvetica').text(motivo,50,y+8,{width:W-20,lineGap:3});
  y+=56;

  novaPageSeNecessario(76);
  doc.rect(40,y,W,18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ABORDAGEM SUGERIDA',50,y+4);
  y+=22;
  doc.rect(40,y,W,48).fill('#EBF5FB').stroke('#AED6F1');
  doc.fillColor('#1A5276').fontSize(9).font('Helvetica')
    .text(`Cliente RECORRENTE confirmado. Abordagem direta: apresentar portfólio completo de produtos químicos, oferecer condições especiais de fidelidade e propor contrato de fornecimento recorrente. Verificar lista de produtos abaixo para personalizar a proposta.`,
      50,y+8,{width:W-20,lineGap:3});
  y+=56;

  // Produtos completos com preços
  const prods = c.produtos||[];
  if(prods.length>0){
    novaPageSeNecessario(50);
    doc.rect(40,y,W,18).fill('#2C3E50');
    doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold')
      .text(`HISTÓRICO COMPLETO DE PRODUTOS (${prods.length} itens únicos)`,50,y+4);
    y+=20;

    const COL = {desc:50,un:310,qty:345,unit:390,total:455};
    doc.rect(40,y,W,16).fill('#ECF0F1');
    doc.fillColor(COR.label).fontSize(7).font('Helvetica-Bold');
    doc.text('DESCRIÇÃO DO PRODUTO',COL.desc,y+5,{width:255});
    doc.text('UN',COL.un,y+5,{width:32});
    doc.text('QTD',COL.qty,y+5,{width:42});
    doc.text('VL.UN.MÉDIO',COL.unit,y+5,{width:62});
    doc.text('TOTAL GASTO',COL.total,y+5,{width:65});
    y+=16;

    const quimicos = prods.filter(p=>ncmEhQuimico(p.ncm));
    const outros   = prods.filter(p=>!ncmEhQuimico(p.ncm));
    const ord = arr=>arr.sort((a,b)=>(b.valorTotalAcumulado||0)-(a.valorTotalAcumulado||0));
    [...ord(quimicos),...ord(outros)].forEach((p,i)=>{
      novaPageSeNecessario(18);
      const ehQ = ncmEhQuimico(p.ncm);
      doc.rect(40,y,W,18).fill(ehQ?(i%2===0?'#FDEDEC':'#FDFAFA'):(i%2===0?COR.branco:COR.fundo)).stroke(COR.linha);
      if(ehQ) doc.fillColor('#C0392B').fontSize(7).font('Helvetica-Bold').text('●',42,y+6,{width:8});
      doc.fillColor(ehQ?'#922B21':COR.valor).fontSize(8).font(ehQ?'Helvetica-Bold':'Helvetica')
        .text(p.descricao.substring(0,58),COL.desc,y+5,{width:255,lineBreak:false});
      doc.fillColor(COR.label).fontSize(7).font('Helvetica');
      doc.text(p.unidade||'—',COL.un,y+5,{width:32});
      const qtd = p.qtdTotal>0?p.qtdTotal.toLocaleString('pt-BR',{maximumFractionDigits:1}):`${p.qtdNFs}×`;
      doc.text(qtd,COL.qty,y+5,{width:42});
      doc.fillColor(ehQ?'#922B21':COR.valor).fontSize(8).font(ehQ?'Helvetica-Bold':'Helvetica')
        .text(formatarPreco(p.valorUnitarioMedio),COL.unit,y+5,{width:62});
      doc.fillColor(COR.valor).fontSize(8).font('Helvetica')
        .text(formatarPreco(p.valorTotalAcumulado),COL.total,y+5,{width:65});
      y+=18;
    });
    y+=4;
    novaPageSeNecessario(14);
    doc.fillColor('#C0392B').fontSize(7).font('Helvetica')
      .text('● vermelho = NCM de capítulo químico (28/29/31/32/34/35/38). Classificação definitiva pelo Claude Code.',50,y,{width:W-20});
    y+=12;
  }

  y+=6;
  novaPageSeNecessario(90);
  doc.rect(40,y,W,18).fill('#2C3E50');
  doc.fillColor(COR.branco).fontSize(10).font('Helvetica-Bold').text('ANOTAÇÕES DO VENDEDOR',50,y+4);
  y+=22;
  doc.rect(40,y,W,65).fill(COR.branco).stroke(COR.linha);
  [16,32,48].forEach(off=>{
    doc.moveTo(50,y+off).lineTo(40+W-10,y+off).stroke(COR.linha);
  });

  rodape();
}

async function gerarPDF(lista, filePath) {
  const doc = new PDFDocument({ margin:40, size:'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  lista.forEach(({c,motivo},i)=>{
    if(i>0) doc.addPage();
    renderizarFicha(doc, c, motivo, i+1, lista.length);
  });
  doc.end();
  return new Promise((res,rej)=>{ stream.on('finish',()=>res(filePath)); stream.on('error',rej); });
}

(async()=>{
  if(!fs.existsSync(CONFIG.arquivoDados)){ console.error('❌ clientes.json não encontrado.'); process.exit(1); }
  if(!fs.existsSync(CONFIG.pastaFichas)) fs.mkdirSync(CONFIG.pastaFichas,{recursive:true});

  const dados = JSON.parse(fs.readFileSync(CONFIG.arquivoDados,'utf8'));
  const clientes = dados.clientes||{};

  const lista=[], naoEncontrados=[];

  for(const {cnpj,motivo} of LOTE2){
    if(clientes[cnpj]){
      const c = clientes[cnpj];
      c.temQuimico   = true;
      c.prioridade   = 'ALTA';
      c.classificado = true;
      c.concluido    = true;
      if(!c.ticketMedio && c.ticketTotal && c.qtdNotas)
        c.ticketMedio = (c.ticketTotal/c.qtdNotas).toFixed(2);
      const m = (c.meses||[]).length;
      c.frequencia = m>=4?'Recorrente consolidado ⭐':m>=2?'Recorrente em desenvolvimento':'Pontual';
      lista.push({c, motivo});
      const q=(c.produtos||[]).filter(p=>ncmEhQuimico(p.ncm)).length;
      console.log(`✓ ${c.nome?.substring(0,45)} — ${(c.meses||[]).length}m, ${c.qtdNotas} NFs, ${q} prod. NCM químico`);
    } else {
      naoEncontrados.push(cnpj);
      console.warn(`⚠️  Não encontrado: ${cnpj}`);
    }
  }

  fs.writeFileSync(CONFIG.arquivoDados, JSON.stringify(dados,null,2),'utf8');
  console.log(`\n💾 clientes.json atualizado — ${lista.length} clientes → ALTA + concluido`);

  if(lista.length===0){ console.error('❌ Nenhum cliente encontrado.'); process.exit(1); }

  const data = new Date().toISOString().slice(0,10);
  const destino = path.join(CONFIG.pastaFichas, `leads-ALTA-lote2-${data}.pdf`);
  await gerarPDF(lista, destino);

  console.log(`\n🎉 PDF gerado: ${destino}`);
  if(naoEncontrados.length>0){
    console.warn(`\n⚠️  CNPJs não encontrados (reprocessar NFs): ${naoEncontrados.join(', ')}`);
  }
})();
