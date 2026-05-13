'use strict';

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
async function pdfParse(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result;
}

// ============================================================
// CONFIGURAÇÃO
// ============================================================
const CONFIG = {
  pastaNota:      path.join(__dirname, 'notas_brutas'),
  pastaLotes:     path.join(__dirname, 'lotes'),
  arquivoDados:   path.join(__dirname, 'clientes.json'),
  arquivoErros:   path.join(__dirname, 'erros-parsing.json'),
  clientesPorLote: 10,
};

// ============================================================
// UNIDADES DE MEDIDA — para extração de preços das NFs
// ============================================================
const UNIDADES = new Set([
  'UN','KG','ML','LT','FR','CX','PC','MT','GL','FL','TB','SC','BL','PT',
  'EN','DZ','GR','M2','M3','KIT','PAR','JG','RO','L','G','MG','AMP',
  'CP','CT','FD','RL','BG','DS','TP','VD','AM','BI','CJ',
]);

// ============================================================
// FUNÇÕES DE PARSING
// ============================================================

function normalizar(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrai unidade, quantidade e valor unitário da linha âncora do DANFE.
// Formato da linha: [CÓDIGO] [CFOP] [UNID] [QTD] [VAL_UNIT] [...]\t[CST]\t[NCM]
function extrairPrecosDoItem(linhaAncora) {
  const semSufixo = linhaAncora.replace(/\t\d{3}\t\d{8}\s*$/, '');

  // Encontra primeira unidade de medida conhecida na linha
  let unidade = null;
  let posDepoisUnit = -1;
  const reUnit = /\b([A-Z]{1,5})\b/g;
  let m;
  while ((m = reUnit.exec(semSufixo)) !== null) {
    if (UNIDADES.has(m[1])) {
      unidade = m[1];
      posDepoisUnit = m.index + m[0].length;
      break;
    }
  }

  if (posDepoisUnit === -1) return { unidade: null, qtd: null, valorUnitario: null };

  // Após a unidade: primeiro número = qty, segundo = val_unit
  const resto = semSufixo.substring(posDepoisUnit);
  const reNum = /\d{1,3}(?:\.\d{3})*,\d{1,4}|\d+,\d{1,4}/g;
  const nums = [];
  while ((m = reNum.exec(resto)) !== null && nums.length < 2) {
    nums.push(parseFloat(m[0].replace(/\./g, '').replace(',', '.')));
  }

  return { unidade, qtd: nums[0] || null, valorUnitario: nums[1] || null };
}

// ============================================================
// PARSER DANFE
// ============================================================

function extrairCampo(texto, patterns) {
  for (const p of patterns) {
    const m = texto.match(p);
    if (m && m[1] && m[1].trim()) return m[1].trim();
  }
  return null;
}

function parsearNF(texto) {
  const textoStr = (texto && typeof texto === 'object' && texto.text) ? texto.text : (texto || '');
  if (!textoStr) return { nfNum: null, data: null, mesAno: null, nome: null, doc: null, endereco: null, bairro: null, municipio: null, uf: null, cep: null, telefone: null, valorTotal: null, produtos: [], temQuimico: false, setorRelacionado: false };

  const t = textoStr.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const nfNum = extrairCampo(t, [
    /NF-e\s*\nN[°º]\s*([\d.]+)/i,
    /N[°º]\s*([\d.]+)\s*\nS[EÉ]RIE/i,
  ]);

  const data = extrairCampo(t, [
    /DATA DA EMISS[AÃ]O\s*\n\s*(\d{2}\/\d{2}\/\d{4})/i,
    /EMISS[AÃ]O:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /(\d{2}\/\d{2}\/\d{4})/,
  ]);

  const nome = extrairCampo(t, [
    /NOME\s*\/\s*RAZ[AÃ]O SOCIAL\s*\n\s*([^\n]+)/i,
    /DEST\.\/REM\.?:\s*([^-\n]+)/i,
    /DEST\.\s*\/\s*REM\.?:\s*([^-\n]+)/i,
  ]);

  const doc = extrairCampo(t, [
    /CPF\/CNPJ:\s*([\d.\-\/]+)/i,
    /CNPJ\s*\/\s*CPF\s*\n\s*([\d.\-\/]+)/i,
    /CPF\s*\/\s*CNPJ\s*\n\s*([\d.\-\/]+)/i,
  ]);

  const endereco = extrairCampo(t, [
    /ENDERE[CÇ]O\s*\n\s*([^\n]+)/i,
  ]);

  const bairroRaw = extrairCampo(t, [
    /BAIRRO\s*\/\s*DISTRITO\s*\n\s*([^\n]+)/i,
  ]);
  const bairro = bairroRaw ? bairroRaw.replace(/\s*(UF|CEP|MUNICIPIO|DATA)\s*$/i, '').trim() : null;

  const municipio = extrairCampo(t, [
    /MUNIC[IÍ]PIO\s*\n\s*([^\n]+)/i,
  ]);

  const uf = extrairCampo(t, [
    /\bUF\b\s*\n\s*([A-Z]{2})\b/,
  ]);

  const cep = extrairCampo(t, [
    /CEP\s*\n\s*([\d]{5}-?[\d]{3})/i,
    /CEP\s*\n\s*([\d\-]+)/i,
  ]);

  const telefone = extrairCampo(t, [
    /FONE\s*\/\s*FAX\s*\n\s*([\(\)\d\s\-\.+]+)/i,
  ]);

  const valorTotal = extrairCampo(t, [
    /VALOR TOTAL[:\s]+R\$\s*([\d.,]+)/i,
    /VALOR TOTAL DA NOTA\s*\n\s*([\d.,]+)/i,
  ]);

  // --- Produtos: âncora \t[CST 3 dígitos]\t[NCM 8 dígitos] ---
  // Formato A: descrição em linhas acima da âncora
  // Formato B: descrição embutida antes do primeiro \t na linha âncora
  const produtos = [];
  const linhas = t.split('\n');
  const reAncora = /\t(\d{3})\t(\d{8})\s*$/;
  const reRuido = /^(NCM\b|SH\b|CFOP\b|UNID\b|QUANT|VALOR|ALIQ|BASE\b|I\.C\.M|I\.P\.I|DESCRI[ÇC]|C[OÓ]DIGO|PROD\.|LOTE\b|DESCONTO|FRETE|SEGURO|CST\b|AL[IÍ]QUOTA|C[AÁ]LC|UNITÁRIO|UNITARIO|ICMS\b|IPI\b|DADOS\b|L[IÍ]Q[UÜ]IDO\b)/i;

  for (let i = 0; i < linhas.length; i++) {
    const ancMatch = linhas[i].match(reAncora);
    if (!ancMatch) continue;

    const ncm = ancMatch[2];
    const linhaAncora = linhas[i];

    // Formato B: descrição embutida antes do primeiro tab
    const primeiraTab = linhaAncora.indexOf('\t');
    let descEmbedded = null;
    if (primeiraTab > 0) {
      const parteAntes = linhaAncora.substring(0, primeiraTab).trim();
      if (/[A-Za-zÀ-ú]{3}/.test(parteAntes) && parteAntes.length >= 5) {
        descEmbedded = parteAntes;
      }
    }

    // Extrai preços da linha âncora
    const precos = extrairPrecosDoItem(linhaAncora);

    // Formato A: descrição em linhas acima
    const descPartes = [];
    if (!descEmbedded) {
      for (let j = i - 1; j >= Math.max(0, i - 8); j--) {
        const raw = linhas[j];
        const linha = raw.trim();
        if (reAncora.test(raw)) break;
        if (linha.length < 2) continue;
        if (reRuido.test(linha)) continue;
        if (raw.startsWith('\t')) continue;
        if (/^[\d\s.,\-\/]+$/.test(linha)) continue;
        if (!/[A-Za-zÀ-ú]{3}/.test(linha)) continue;
        descPartes.unshift(linha);
      }
    }

    const descricao = (descEmbedded || descPartes.join(' ')).trim();
    const valorItem = (precos.qtd && precos.valorUnitario)
      ? +(precos.qtd * precos.valorUnitario).toFixed(2)
      : null;

    produtos.push({
      descricao:     descricao || `(NCM ${ncm})`,
      ncm,
      unidade:       precos.unidade,
      qtd:           precos.qtd,
      valorUnitario: precos.valorUnitario,
      valorTotal:    valorItem,
    });
  }

  // Fallback: sem âncoras tab → scan de NCMs de 8 dígitos
  if (produtos.length === 0) {
    const reRawNCM = /\b(\d{8})\b/g;
    let m;
    while ((m = reRawNCM.exec(t)) !== null) {
      produtos.push({ descricao: `(NCM ${m[1]})`, ncm: m[1], unidade: null, qtd: null, valorUnitario: null, valorTotal: null });
    }
  }

  return {
    nfNum,
    data,
    mesAno: data ? `${data.substring(3, 5)}/${data.substring(6)}` : null,
    nome: nome ? nome.trim() : null,
    doc: doc ? doc.trim() : null,
    endereco,
    bairro,
    municipio,
    uf,
    cep,
    telefone: telefone ? telefone.trim() : null,
    valorTotal,
    produtos,
  };
}

// ============================================================
// PROCESSAMENTO
// ============================================================

async function processarPDF(filePath) {
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf, { max: 3 });
  return parsearNF(data.text);
}

function chaveCliente(nf) {
  // Usa CNPJ/CPF como chave única; fallback = nome normalizado
  if (nf.doc && nf.doc.replace(/\D/g, '').length >= 11) {
    return nf.doc.replace(/\D/g, '');
  }
  return normalizar(nf.nome || 'desconhecido');
}


async function processarTudo() {
  console.log('🔍 Listando arquivos NF-e...');
  const arquivos = fs.readdirSync(CONFIG.pastaNota)
    .filter(f => f.endsWith('-nfe.pdf'))
    .sort();

  console.log(`📄 Total de NFs encontradas: ${arquivos.length}`);

  // Carregar progresso anterior se existir
  let clientes = {};
  let processados = new Set();
  if (fs.existsSync(CONFIG.arquivoDados)) {
    const salvo = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
    clientes = salvo.clientes || {};
    processados = new Set(salvo.processados || []);
    console.log(`✅ Progresso anterior: ${processados.size} NFs já processadas`);
  }

  const erros = [];
  let contador = 0;
  let novos = 0;

  for (const arquivo of arquivos) {
    if (processados.has(arquivo)) continue;

    const filePath = path.join(CONFIG.pastaNota, arquivo);
    try {
      const nf = await processarPDF(filePath);

      if (!nf.nome && !nf.doc) {
        erros.push({ arquivo, motivo: 'Não encontrou nome nem documento' });
        processados.add(arquivo);
        continue;
      }

      const chave = chaveCliente(nf);

      if (!clientes[chave]) {
        clientes[chave] = {
          nome: nf.nome,
          doc: nf.doc,
          endereco: nf.endereco,
          bairro: nf.bairro,
          municipio: nf.municipio,
          uf: nf.uf,
          cep: nf.cep,
          telefone: nf.telefone,
          meses: [],
          compras: [],
          temQuimico: false,
          setorRelacionado: false,
          ticketTotal: 0,
          qtdNotas: 0,
        };
        novos++;
      }

      const c = clientes[chave];
      // Atualizar dados com informações mais recentes (se estiver vazio)
      if (!c.telefone && nf.telefone) c.telefone = nf.telefone;
      if (!c.endereco && nf.endereco) c.endereco = nf.endereco;
      if (!c.municipio && nf.municipio) c.municipio = nf.municipio;
      if (!c.uf && nf.uf) c.uf = nf.uf;
      if (!c.cep && nf.cep) c.cep = nf.cep;

      if (nf.mesAno && !c.meses.includes(nf.mesAno)) {
        c.meses.push(nf.mesAno);
      }
      if (nf.temQuimico) c.temQuimico = true;
      if (nf.setorRelacionado) c.setorRelacionado = true;

      const valor = parseFloat((nf.valorTotal || '0').replace(/\./g, '').replace(',', '.')) || 0;
      c.ticketTotal += valor;
      c.qtdNotas++;

      // Registrar produtos químicos encontrados
      const prodsQuimicos = nf.produtos.filter(p => p.ehQuimico).map(p => p.descricao);
      if (prodsQuimicos.length > 0) {
        if (!c.produtosQuimicos) c.produtosQuimicos = [];
        for (const pq of prodsQuimicos) {
          if (!c.produtosQuimicos.includes(pq)) c.produtosQuimicos.push(pq);
        }
      }

      processados.add(arquivo);
      contador++;

      if (contador % 500 === 0) {
        console.log(`  ⏳ Processadas ${contador} NFs... (${novos} clientes únicos)`);
        salvarProgresso(clientes, processados);
      }
    } catch (err) {
      erros.push({ arquivo, motivo: err.message });
      processados.add(arquivo);
    }
  }

  // Calcular ticket médio e prioridade
  for (const chave of Object.keys(clientes)) {
    const c = clientes[chave];
    c.meses = [...new Set(c.meses)].sort();
    c.ticketMedio = c.qtdNotas > 0 ? (c.ticketTotal / c.qtdNotas).toFixed(2) : '0';
    c.frequencia = c.meses.length >= 4 ? 'Recorrente consolidado ⭐'
                 : c.meses.length >= 2 ? 'Recorrente em desenvolvimento'
                 : 'Pontual';
    c.prioridade = classificarPrioridade({ ...c, meses: new Set(c.meses) });
  }

  salvarProgresso(clientes, processados);
  fs.writeFileSync(CONFIG.arquivoErros, JSON.stringify(erros, null, 2));

  console.log(`\n✅ Processamento concluído!`);
  console.log(`   NFs processadas: ${contador}`);
  console.log(`   Clientes únicos: ${Object.keys(clientes).length}`);
  console.log(`   Erros: ${erros.length}`);

  return clientes;
}

function salvarProgresso(clientes, processados) {
  fs.writeFileSync(CONFIG.arquivoDados, JSON.stringify({
    atualizadoEm: new Date().toISOString(),
    totalClientes: Object.keys(clientes).length,
    totalProcessados: processados.size,
    clientes,
    processados: [...processados],
  }, null, 2));
}

// ============================================================
// GERADOR DE LOTES
// ============================================================

function gerarLotes(clientes, loteInicio = 1) {
  if (!fs.existsSync(CONFIG.pastaLotes)) fs.mkdirSync(CONFIG.pastaLotes);

  // Ordenar: ALTA → ALTA-B → MEDIA → BAIXA, depois por recorrência
  const ordem = { 'ALTA': 0, 'ALTA-B': 1, 'MEDIA': 2, 'BAIXA': 3 };
  const lista = Object.values(clientes).sort((a, b) => {
    const pA = ordem[a.prioridade] ?? 4;
    const pB = ordem[b.prioridade] ?? 4;
    if (pA !== pB) return pA - pB;
    return (b.meses.length || 0) - (a.meses.length || 0);
  });

  let loteNum = loteInicio;
  let idx = 0;
  const lotesGerados = [];

  while (idx < lista.length) {
    const grupo = lista.slice(idx, idx + CONFIG.clientesPorLote);
    idx += CONFIG.clientesPorLote;

    const nLote = String(loteNum).padStart(3, '0');
    const arquivo = path.join(CONFIG.pastaLotes, `lote-${nLote}.md`);
    const conteudo = formatarLote(nLote, grupo);
    fs.writeFileSync(arquivo, conteudo, 'utf8');
    lotesGerados.push(arquivo);
    loteNum++;
  }

  console.log(`\n📁 ${lotesGerados.length} lotes gerados em ${CONFIG.pastaLotes}`);
  return lotesGerados;
}

function formatarLote(nLote, clientes) {
  const linhas = [`# Lote ${nLote} — Prospecção NETLAB\n`];
  linhas.push(`**Gerado em:** ${new Date().toLocaleDateString('pt-BR')}\n`);
  linhas.push(`**Total de clientes:** ${clientes.length}\n`);
  linhas.push('---\n');

  clientes.forEach((c, i) => {
    const icon = c.prioridade === 'ALTA' ? '🔴'
               : c.prioridade === 'ALTA-B' ? '🟠'
               : c.prioridade === 'MEDIA' ? '🟡' : '🟢';

    linhas.push(`## Cliente ${i + 1} — ${icon} PRIORIDADE: ${c.prioridade}\n`);
    linhas.push(`- **Nome:** ${c.nome || '—'}`);
    linhas.push(`- **CNPJ/CPF:** ${c.doc || '—'}`);
    linhas.push(`- **Endereço:** ${[c.endereco, c.bairro, c.municipio, c.uf, c.cep].filter(Boolean).join(', ') || '—'}`);
    linhas.push(`- **Telefone:** ${c.telefone || '—'}`);
    linhas.push(`- **Setor identificado:** ${c.setorRelacionado ? 'Sim — setor relacionado a químicos' : 'Não identificado'}`);
    linhas.push(`- **Comprou produtos químicos:** ${c.temQuimico ? 'Sim ✅' : 'Não'}`);
    if (c.produtosQuimicos && c.produtosQuimicos.length > 0) {
      linhas.push(`- **Produtos químicos comprados:** ${c.produtosQuimicos.slice(0, 3).join(' | ')}`);
    }
    linhas.push(`- **Frequência:** ${c.frequencia}`);
    linhas.push(`- **Meses que comprou:** ${c.meses.join(', ') || '—'}`);
    linhas.push(`- **Qtd de notas:** ${c.qtdNotas}`);
    linhas.push(`- **Ticket médio:** R$ ${parseFloat(c.ticketMedio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    linhas.push(`- **Observações para prospecção:** _preencher_\n`);
    linhas.push('---\n');
  });

  return linhas.join('\n');
}

// ============================================================
// RELATÓRIO DE RESUMO
// ============================================================

function gerarResumo(clientes) {
  const contagem = { 'ALTA': 0, 'ALTA-B': 0, 'MEDIA': 0, 'BAIXA': 0 };
  for (const c of Object.values(clientes)) {
    contagem[c.prioridade] = (contagem[c.prioridade] || 0) + 1;
  }

  const total = Object.keys(clientes).length;
  const resumo = [
    `# Resumo do Processamento — NETLAB\n`,
    `**Data:** ${new Date().toLocaleDateString('pt-BR')}`,
    `**Total de clientes únicos:** ${total}\n`,
    `## Distribuição por Prioridade`,
    `| Prioridade | Qtd | % |`,
    `|---|---|---|`,
    `| 🔴 ALTA (recorrentes + químicos) | ${contagem['ALTA']} | ${((contagem['ALTA']/total)*100).toFixed(1)}% |`,
    `| 🟠 ALTA-B (1x químicos) | ${contagem['ALTA-B']} | ${((contagem['ALTA-B']/total)*100).toFixed(1)}% |`,
    `| 🟡 MÉDIA (setor relacionado) | ${contagem['MEDIA']} | ${((contagem['MEDIA']/total)*100).toFixed(1)}% |`,
    `| 🟢 BAIXA | ${contagem['BAIXA']} | ${((contagem['BAIXA']/total)*100).toFixed(1)}% |`,
  ].join('\n');

  fs.writeFileSync(path.join(__dirname, 'resumo.md'), resumo, 'utf8');
  console.log('\n📊 Resumo salvo em resumo.md');
  console.log(resumo);
}

// ============================================================
// PROCESSAMENTO EM LOTE DE 500
// ============================================================

async function processarLote500(tamanho = 500) {
  const pastaVerificadas = path.join(__dirname, 'ja_verificadas');
  if (!fs.existsSync(pastaVerificadas)) fs.mkdirSync(pastaVerificadas);

  // Listar NFs ainda na pasta notas_brutas (não movidas ainda)
  const arquivos = fs.readdirSync(CONFIG.pastaNota)
    .filter(f => f.endsWith('-nfe.pdf'))
    .sort()
    .slice(0, tamanho);

  if (arquivos.length === 0) {
    console.log('✅ Nenhuma NF pendente em notas_brutas. Tudo processado!');
    return;
  }

  // Carregar dados acumulados anteriores
  let clientes = {};
  let totalJaProcessados = 0;
  if (fs.existsSync(CONFIG.arquivoDados)) {
    const salvo = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
    clientes = salvo.clientes || {};
    totalJaProcessados = salvo.totalProcessados || 0;
  }

  console.log(`\n📦 Iniciando lote de ${arquivos.length} NFs`);
  console.log(`   Clientes acumulados até agora: ${Object.keys(clientes).length}`);
  console.log(`   Total já processadas (histórico): ${totalJaProcessados}\n`);

  const erros = [];
  let contador = 0;
  let novos = 0;

  for (const arquivo of arquivos) {
    const filePath = path.join(CONFIG.pastaNota, arquivo);
    try {
      const nf = await processarPDF(filePath);

      if (nf.nome || nf.doc) {
        const chave = chaveCliente(nf);

        if (!clientes[chave]) {
          clientes[chave] = {
            nome: nf.nome,
            doc: nf.doc,
            endereco: nf.endereco,
            bairro: nf.bairro,
            municipio: nf.municipio,
            uf: nf.uf,
            cep: nf.cep,
            telefone: nf.telefone,
            meses: [],
            nfs: [],
            produtos: [],
            temQuimico: null,
            setorRelacionado: null,
            prioridade: null,
            classificado: false,
            ticketTotal: 0,
            qtdNotas: 0,
          };
          novos++;
        }

        const c = clientes[chave];
        if (!c.telefone && nf.telefone) c.telefone = nf.telefone;
        if (!c.endereco && nf.endereco) c.endereco = nf.endereco;
        if (!c.municipio && nf.municipio) c.municipio = nf.municipio;
        if (!c.uf && nf.uf) c.uf = nf.uf;
        if (!c.cep && nf.cep) c.cep = nf.cep;
        if (nf.mesAno && !c.meses.includes(nf.mesAno)) c.meses.push(nf.mesAno);
        if (nf.nfNum) { if (!c.nfs) c.nfs = []; if (!c.nfs.includes(nf.nfNum)) c.nfs.push(nf.nfNum); }

        const valor = parseFloat((nf.valorTotal || '0').replace(/\./g, '').replace(',', '.')) || 0;
        c.ticketTotal += valor;
        c.qtdNotas++;

        // Acumular produtos com preços (qty e valor somados por produto único)
        if (!c.produtos) c.produtos = [];
        for (const p of nf.produtos) {
          let entry = c.produtos.find(x => x.descricao === p.descricao && x.ncm === p.ncm);
          if (!entry) {
            entry = { descricao: p.descricao, ncm: p.ncm, unidade: p.unidade || null, qtdTotal: 0, qtdNFs: 0, valorTotalAcumulado: 0 };
            c.produtos.push(entry);
          }
          entry.qtdNFs++;
          if (p.qtd) entry.qtdTotal = +(entry.qtdTotal + p.qtd).toFixed(4);
          if (p.valorTotal) entry.valorTotalAcumulado = +(entry.valorTotalAcumulado + p.valorTotal).toFixed(2);
        }
      } else {
        erros.push({ arquivo, motivo: 'Nome/doc não encontrado' });
      }

      // Mover para ja_verificadas independente de erro de parsing
      fs.renameSync(filePath, path.join(pastaVerificadas, arquivo));
      contador++;

      if (contador % 100 === 0) {
        process.stdout.write(`  ⏳ ${contador}/500...\r`);
      }
    } catch (err) {
      erros.push({ arquivo, motivo: err.message });
      // Mover mesmo com erro para não reprocessar
      try { fs.renameSync(filePath, path.join(pastaVerificadas, arquivo)); } catch (_) {}
      contador++;
    }
  }

  // Calcular ticket médio, frequência e valor unitário médio por produto
  for (const chave of Object.keys(clientes)) {
    const c = clientes[chave];
    c.meses = [...new Set(c.meses)].sort();
    c.ticketMedio = c.qtdNotas > 0 ? (c.ticketTotal / c.qtdNotas).toFixed(2) : '0';
    c.frequencia = c.meses.length >= 4 ? 'Recorrente consolidado ⭐'
                 : c.meses.length >= 2 ? 'Recorrente em desenvolvimento'
                 : 'Pontual';
    (c.produtos || []).forEach(p => {
      if (p.qtdTotal > 0 && p.valorTotalAcumulado > 0) {
        p.valorUnitarioMedio = +(p.valorTotalAcumulado / p.qtdTotal).toFixed(2);
      }
    });
  }

  // Salvar dados acumulados
  const totalProcessados = totalJaProcessados + contador;
  fs.writeFileSync(CONFIG.arquivoDados, JSON.stringify({
    atualizadoEm: new Date().toISOString(),
    totalClientes: Object.keys(clientes).length,
    totalProcessados,
    clientes,
  }, null, 2));

  // Salvar erros deste lote
  if (erros.length > 0) {
    const errosExistentes = fs.existsSync(CONFIG.arquivoErros)
      ? JSON.parse(fs.readFileSync(CONFIG.arquivoErros, 'utf8'))
      : [];
    fs.writeFileSync(CONFIG.arquivoErros, JSON.stringify([...errosExistentes, ...erros], null, 2));
  }

  // Relatório do lote
  const pendentes = fs.readdirSync(CONFIG.pastaNota).filter(f => f.endsWith('-nfe.pdf')).length;
  const recorrentes = Object.values(clientes).filter(c => (c.meses || []).length >= 2).length;
  const naoClassificados = Object.values(clientes).filter(c => !c.classificado).length;

  console.log(`\n✅ Lote concluído!`);
  console.log(`   NFs processadas neste lote: ${contador}`);
  console.log(`   Total processadas (acumulado): ${totalProcessados}`);
  console.log(`   NFs ainda pendentes: ${pendentes}`);
  console.log(`   Clientes únicos acumulados: ${Object.keys(clientes).length} (${novos} novos neste lote)`);
  console.log(`   Recorrentes (2+ meses): ${recorrentes}`);
  console.log(`   Aguardando classificação: ${naoClassificados}`);
  console.log(`   Erros neste lote: ${erros.length}`);
  if (pendentes > 0) {
    console.log(`\n💡 Continuar: node prospecção/processar-notas.js --tudo`);
  } else {
    console.log(`\n✅ Todas as NFs processadas! Peça ao Claude para classificar os clientes.`);
  }
}

// ============================================================
// EXPORTS (para uso em outros scripts)
// ============================================================
module.exports = { parsearNF, processarPDF, normalizar };

// ============================================================
// ENTRADA — argumentos de linha de comando
// ============================================================
if (require.main !== module) return;
const args = process.argv.slice(2);
const modo = args[0] || '--ajuda';

(async () => {
  if (modo === '--lote500' || modo === '--lote') {
    const tamanho = modo === '--lote' ? (parseInt(args[1]) || 500) : 500;
    await processarLote500(tamanho);
  }

  else if (modo === '--tudo') {
    let pendentes = fs.readdirSync(CONFIG.pastaNota).filter(f => f.endsWith('-nfe.pdf')).length;
    if (pendentes === 0) { console.log('✅ Nenhuma NF pendente.'); process.exit(0); }
    let rodada = 0;
    while (pendentes > 0) {
      rodada++;
      console.log(`\n${'='.repeat(50)}\n🔄 RODADA ${rodada} — ${pendentes} NFs restantes\n${'='.repeat(50)}`);
      await processarLote500(500);
      pendentes = fs.readdirSync(CONFIG.pastaNota).filter(f => f.endsWith('-nfe.pdf')).length;
    }
    const salvo = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
    console.log(`\n🎉 PROCESSAMENTO COMPLETO!`);
    console.log(`   Total de clientes únicos: ${salvo.totalClientes}`);
    console.log(`   Total de NFs processadas: ${salvo.totalProcessados}`);
    console.log(`\n   Agora peça ao Claude para classificar os clientes.`);
  }

  else if (modo === '--processar') {
    // Processa TUDO de uma vez (modo original)
    const clientes = await processarTudo();
    gerarResumo(clientes);
    console.log('\n💡 Próximo passo: node processar-notas.js --lotes');
  }

  else if (modo === '--lotes') {
    if (!fs.existsSync(CONFIG.arquivoDados)) {
      console.error('❌ clientes.json não encontrado. Rode --lote500 primeiro.');
      process.exit(1);
    }
    const salvo = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
    gerarLotes(salvo.clientes);
  }

  else if (modo === '--resumo') {
    if (!fs.existsSync(CONFIG.arquivoDados)) {
      console.error('❌ clientes.json não encontrado.');
      process.exit(1);
    }
    const salvo = JSON.parse(fs.readFileSync(CONFIG.arquivoDados, 'utf8'));
    gerarResumo(salvo.clientes);
  }

  else if (modo === '--teste') {
    console.log('🧪 Modo teste — processando 20 NFs...');
    const arquivos = fs.readdirSync(CONFIG.pastaNota)
      .filter(f => f.endsWith('-nfe.pdf'))
      .sort()
      .slice(0, 20);

    for (const arquivo of arquivos) {
      const filePath = path.join(CONFIG.pastaNota, arquivo);
      try {
        const nf = await processarPDF(filePath);
        console.log(`\n✅ ${arquivo}`);
        console.log(`   Nome: ${nf.nome}`);
        console.log(`   Doc:  ${nf.doc}`);
        console.log(`   Município: ${nf.municipio}/${nf.uf}`);
        console.log(`   Tel: ${nf.telefone}`);
        console.log(`   Data: ${nf.data} | Valor: ${nf.valorTotal}`);
        console.log(`   Produtos (${nf.produtos.length}):`);
        nf.produtos.slice(0, 3).forEach(p => {
          const preco = p.valorUnitario ? `R$${p.valorUnitario.toFixed(2)}/${p.unidade || 'un'}` : 'sem preço';
          console.log(`     [NCM ${p.ncm}] ${p.descricao.substring(0,50)} — ${preco}`);
        });
      } catch (err) {
        console.log(`\n❌ ${arquivo}: ${err.message}`);
      }
    }
  }

  else {
    console.log(`
Uso:
  node prospecção/processar-notas.js --lote500    Processa próximas 500 NFs e move para ja_verificadas/
  node prospecção/processar-notas.js --lotes      Gera fichas de prospecção (lote-001.md, lote-002.md...)
  node prospecção/processar-notas.js --resumo     Mostra resumo dos clientes já processados
  node prospecção/processar-notas.js --teste      Testa o parser nas primeiras 20 NFs (sem mover)
    `);
  }
})();
