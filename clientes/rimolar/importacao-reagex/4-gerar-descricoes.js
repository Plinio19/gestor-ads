const fs = require('fs');
const path = require('path');
const subcatConteudo = require('./subcategorias-conteudo.js');
const aplicacoesPorSubcategoria = require('./aplicacoes-por-subcategoria.js');
const enriquecimentoQuimico = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_enriquecimento-quimico-por-cas.json'), 'utf8'));

const dados = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), 'utf8'));

// Simples hash determinístico pra escolher variante de frase sem depender de aleatoriedade real
function hashCodigo(codigo) {
  let h = 0;
  for (let i = 0; i < codigo.length; i++) h = (h * 31 + codigo.charCodeAt(i)) >>> 0;
  return h;
}

const aberturas = [
  (nome, cat) => `${nome} é um reagente da categoria <strong>${cat}</strong>, comercializado pela Reagex Produtos Químicos.`,
  (nome, cat) => `Encontre ${nome} na Reagex - reagente classificado em <strong>${cat}</strong>, com procedência e qualidade analítica.`,
  (nome, cat) => `A Reagex oferece ${nome}, item da linha <strong>${cat}</strong> do nosso catálogo de produtos químicos.`,
  (nome, cat) => `${nome} faz parte da nossa linha de <strong>${cat}</strong>, disponível para pronta entrega na Reagex.`,
];

const fechamentos = [
  (tipoArtigo, tipoIndef) => `Como ${tipoArtigo} de uso em laboratório, siga sempre as recomendações do fabricante para armazenamento (temperatura, luz e umidade) e utilize os equipamentos de proteção individual adequados durante o manuseio. Consulte a FISPQ (Ficha de Informações de Segurança de Produtos Químicos) antes da utilização.`,
  (tipoArtigo, tipoIndef) => `Antes de utilizar este produto, verifique a FISPQ (Ficha de Informações de Segurança de Produtos Químicos) e observe as condições recomendadas de armazenamento e os equipamentos de proteção individual indicados, já que se trata de ${tipoIndef} para uso técnico/laboratorial.`,
];
const exodoRaw = fs.readFileSync(path.resolve(__dirname, 'exodo-nao-controlados.csv'), 'utf8');

// Reaproveita o parser simples de CSV do script 1
function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) { row.push(field); field = ''; }
      else if (c === '\r') {}
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1);
}

const exRows = parseCsv(exodoRaw, ',');
const exHeader = exRows[0];
const exData = exRows.slice(1);
const idx = Object.fromEntries(exHeader.map((h, i) => [h.trim(), i]));

const byCodigo = new Map();
for (const r of exData) byCodigo.set(r[idx['CODIGO']], r);

function tituloCaso(nome) {
  // "1-CLORONAFTALENO 84,5% (GC) 100ML" -> Title Case preservando números/percentuais
  return nome
    .toLowerCase()
    .replace(/(^|\s|\()([a-zà-ú])/g, (m, sep, c) => sep + c.toUpperCase())
    .replace(/\bPa\b/gi, 'PA').replace(/\bAcs\b/gi, 'ACS').replace(/\bHplc\b/gi, 'HPLC')
    .replace(/\bGc\b/gi, 'GC').replace(/\bIso\b/gi, 'ISO').replace(/\bP\/v\b/gi, 'p/v');
}

function extrairEmbalagem(nome) {
  const m = nome.match(/(\d+(?:[.,]\d+)?)\s*(ML|L|MG|GR|G|KG)\b/i);
  if (!m) return null;
  return `${m[1]}${m[2].toUpperCase()}`;
}

function grauPureza(nome) {
  const graus = [];
  if (/\bPA\b/i.test(nome)) graus.push('PA (Pureza Analítica)');
  if (/\bACS\b/i.test(nome)) graus.push('ACS');
  if (/\bHPLC\b/i.test(nome)) graus.push('grau HPLC');
  if (/\bPUREX\b/i.test(nome)) graus.push('grau Purex (alta pureza)');
  if (/\bPURISSIMO\b/i.test(nome)) graus.push('puríssimo');
  if (/\bP\.A\b/i.test(nome)) graus.push('P.A.');
  return graus.length ? graus.join(', ') : null;
}

function validadeTexto(validade) {
  // formato observado: "6 - ANO" ou "2 - ANO" ou "4 - ANO"
  const m = (validade || '').match(/(\d+)\s*-\s*ANO/i);
  if (!m) return null;
  const n = Number(m[1]);
  return `${n} ${n === 1 ? 'ano' : 'anos'}`;
}

// Extrai o nome químico "puro" (sem embalagem/concentração/grau) pra exibir como "Produto: X"
function nomeBase(nome) {
  return nome
    .replace(/\(?\d+(?:[.,]\d+)?\s*%\)?/g, '') // percentuais: "84,5%", "(84,5%)"
    .replace(/\b\d+(?:[.,]\d+)?\s*(ML|L|MG|GR|G|KG)\b/gi, '') // embalagem
    .replace(/\b(PA|ACS|HPLC|GC|PUREX|PURISSIMO|ISO|P\.A\.?)\b/gi, '') // grau
    .replace(/[()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,.-]+$/, '')
    .trim();
}

const aplicacoesVariantes = [
  ['Pesquisa científica e desenvolvimento (P&D)', 'Sínteses especializadas e processos químicos controlados', 'Análises industriais e controle de qualidade de processo', 'Laboratórios de ensino, pesquisa e extensão', 'Aplicações analíticas e laboratoriais diversas'],
  ['Ensaios e análises laboratoriais de rotina', 'Controle de qualidade em ambiente industrial', 'Preparo de soluções e reagentes de trabalho', 'Atividades de ensino e pesquisa acadêmica', 'Processos de síntese e desenvolvimento químico'],
];

function tagsIndicado(item) {
  const tags = ['Laboratório', 'Pesquisa e Desenvolvimento (P&D)'];
  if (item.categoriaExodo === 'Indicadores') tags.push('Titulações e análises volumétricas');
  else if (item.categoriaExodo === 'Reagentes Especiais') tags.push('Métodos analíticos especiais');
  else tags.push('Indústria e controle de qualidade');
  return tags;
}

const tipoLabel = { solido: 'sólido', solucao: 'solução', liquido: 'líquido' };
const tipoArtigo = { solido: 'todo sólido', solucao: 'toda solução', liquido: 'todo líquido' };
const tipoIndef = { solido: 'um sólido', solucao: 'uma solução', liquido: 'um líquido' };

function gerarDescricaoHtml(item, row) {
  const nomeOriginal = item.produto;
  const cas = row[idx['CAS']];
  const ncm = row[idx['NCM']];
  const concentracao = row[idx['CONCENTRACAO']];
  const densidade = row[idx['DENSIDADE']];
  const classeRisco = row[idx['CLASSE RISCO']];
  const onu = row[idx['ONU']];
  const validade = validadeTexto(row[idx['VALIDADE']]);
  const embalagem = extrairEmbalagem(nomeOriginal);
  const grau = grauPureza(nomeOriginal);
  const tipo = tipoLabel[item.tipoFoto] || 'produto';
  const h = hashCodigo(item.codigo);
  const nomeFmt = tituloCaso(nomeOriginal);
  const nomeCurto = tituloCaso(nomeBase(nomeOriginal)) || nomeFmt;
  const catFmt = `${item.categoriaExodo} &rsaquo; ${item.subcategoriaExodo}`;
  const temCas = cas && cas !== '-';

  const chaveSubcat = `${item.categoriaExodo} > ${item.subcategoriaExodo}`;
  const textoSubcategoria = subcatConteudo[chaveSubcat];
  const enriq = temCas ? enriquecimentoQuimico[cas] : null;

  // --- Indicado para (tags) ---
  const tags = tagsIndicado(item);
  const tagsHtml = tags.map(t => `<span style="display:inline-block;border:1px solid #ccc;border-radius:4px;padding:2px 10px;margin:0 6px 6px 0;font-size:12px;">${t}</span>`).join('');

  // --- Intro ---
  const partesIntro = [];
  partesIntro.push(aberturas[h % aberturas.length](nomeFmt, catFmt));
  if (embalagem) partesIntro.push(`Disponível em embalagem de ${embalagem}${grau ? `, grau ${grau}` : ''}.`);
  else if (grau) partesIntro.push(`Produto de ${grau}.`);
  partesIntro.push('Disponível na Reagex com garantia de procedência, nota fiscal em todas as compras e entrega para todo o Brasil.');

  // --- Características do Produto (checklist) ---
  const caracteristicas = [];
  caracteristicas.push(['Produto', nomeCurto]);
  if (grau) caracteristicas.push(['Grau de Pureza', grau]);
  if (concentracao && concentracao !== '-') caracteristicas.push(['Concentração', `${concentracao}%`]);
  if (embalagem) caracteristicas.push(['Embalagem', embalagem]);
  caracteristicas.push(['Fabricante', 'Êxodo Científica']);
  caracteristicas.push(['Categoria', item.subcategoriaExodo]);
  caracteristicas.push(['Disponibilidade', 'Pronta entrega']);
  caracteristicas.push(['Prazo de Entrega', '6 dias úteis']);
  const caracteristicasHtml = caracteristicas
    .map(([k, v]) => `<li><span style="color:#1a7a3c;">&#10003;</span> <strong>${k}:</strong> ${v}</li>`)
    .join('');

  // --- Especificações Técnicas (tabela) ---
  const specRows = [];
  specRows.push(['Nome do Produto', nomeCurto]);
  if (temCas) specRows.push(['CAS', cas]);
  if (enriq?.dadosMolecularesHtml) {
    const liTexts = [...enriq.dadosMolecularesHtml.matchAll(/<strong>(.*?):<\/strong>\s*([^<]+)/g)];
    for (const [, k, v] of liTexts) specRows.push([k, v.trim()]);
  }
  if (grau) specRows.push(['Grau / Qualidade', grau]);
  if (concentracao && concentracao !== '-') specRows.push(['Concentração', `${concentracao}%`]);
  if (densidade && densidade !== '-') specRows.push(['Densidade', `${densidade} g/mL`]);
  if (embalagem) specRows.push(['Volume / Massa', embalagem]);
  if (ncm && ncm !== '-') specRows.push(['NCM', ncm]);
  if (validade) specRows.push(['Validade', `${validade} a partir da fabricação`]);
  if (classeRisco && classeRisco !== '-') specRows.push(['Classe de risco', `${classeRisco}${onu && onu !== '-' ? ` (ONU ${onu})` : ''}`]);
  specRows.push(['Fabricante', 'Êxodo Científica']);
  specRows.push(['Categoria', `${item.categoriaExodo} / ${item.subcategoriaExodo}`]);
  specRows.push(['Nota Fiscal', 'Emitida em todas as compras']);
  specRows.push(['Prazo de Entrega', '6 dias úteis']);

  const specTableHtml = `<table style="width:100%;border-collapse:collapse;font-size:14px;" cellpadding="6">
<thead><tr style="background:#f2f2f2;"><th style="text-align:left;border:1px solid #ddd;">Parâmetro</th><th style="text-align:left;border:1px solid #ddd;">Especificação</th></tr></thead>
<tbody>${specRows.map(([k, v]) => `<tr><td style="border:1px solid #ddd;"><strong>${k}</strong></td><td style="border:1px solid #ddd;">${v}</td></tr>`).join('')}</tbody>
</table>`;

  // --- Aplicações: papéis reais do composto (PubChem) quando existir; senão, lista por subcategoria ---
  let aplicacoes;
  let origemAplicacoes;
  if (enriq?.rolesAplicaveis?.length) {
    aplicacoes = enriq.rolesAplicaveis.map(r => `Uso documentado como ${r}`);
    origemAplicacoes = 'composto';
  } else if (aplicacoesPorSubcategoria[chaveSubcat]) {
    aplicacoes = aplicacoesPorSubcategoria[chaveSubcat];
    origemAplicacoes = 'subcategoria';
  } else {
    aplicacoes = aplicacoesVariantes[h % aplicacoesVariantes.length];
    origemAplicacoes = 'generico';
  }
  const aplicacoesHtml = `<ul>${aplicacoes.map(a => `<li>${a}</li>`).join('')}</ul>`;
  item._origemAplicacoes = origemAplicacoes;

  const html = [
    `<h2>${nomeFmt}</h2>`,
    `<p><strong>Indicado para:</strong> ${tagsHtml}</p>`,
    `<p>${partesIntro.join(' ')}</p>`,
    textoSubcategoria ? `<h3>Sobre ${item.subcategoriaExodo}</h3><p>${textoSubcategoria}</p>` : '',
    `<h3>Características do Produto</h3><ul style="list-style:none;padding-left:0;">${caracteristicasHtml}</ul>`,
    (enriq && enriq.htmlPapeis) ? `<h3>Informações Químicas</h3>${enriq.htmlPapeis}` : '',
    `<h3>Especificações Técnicas</h3>${specTableHtml}`,
    `<h3>Aplicações</h3>${aplicacoesHtml}`,
    `<h3>Armazenamento e Manuseio</h3><p>${fechamentos[h % fechamentos.length](tipoArtigo[item.tipoFoto] || 'todo produto', tipoIndef[item.tipoFoto] || 'um produto')}</p>`,
    `<p style="font-size:13px;color:#555;">&#10003; Produto original com nota fiscal &nbsp;|&nbsp; &#10003; Estoque disponível &nbsp;|&nbsp; &#10003; Entrega em todo o Brasil &nbsp;|&nbsp; &#10003; Compra 100% segura</p>`,
    `<p>Dúvidas técnicas ou comerciais: entre em contato com a Reagex pelo <strong>vendas@reagex.com.br</strong>.</p>`,
  ].filter(Boolean).join('\n');

  return html;
}

const metaVariantes = [
  (nome, cas, emb, sub) => `Compre ${nome}${emb ? ` (${emb})` : ''} na Reagex.${cas ? ` CAS ${cas}.` : ''} Reagente para laboratório, categoria ${sub}, entrega para todo o Brasil.`,
  (nome, cas, emb, sub) => `${nome}${emb ? `, embalagem ${emb}` : ''}${cas ? `, CAS ${cas}` : ''} - reagente de grau analítico da linha ${sub}. Peça já na Reagex Produtos Químicos.`,
  (nome, cas, emb, sub) => `Precisa de ${nome} para o seu laboratório? A Reagex vende${emb ? ` em embalagem de ${emb}` : ''}${cas ? `, CAS ${cas}` : ''}, categoria ${sub}.`,
];

function gerarMetaDescricao(item, row) {
  const cas = row[idx['CAS']];
  const casVal = cas && cas !== '-' ? cas : null;
  const embalagem = extrairEmbalagem(item.produto);
  const h = hashCodigo(item.codigo);
  const texto = metaVariantes[h % metaVariantes.length](tituloCaso(item.produto), casVal, embalagem, item.subcategoriaExodo);
  return texto.slice(0, 160);
}

function gerarTituloSeo(item) {
  const t = tituloCaso(item.produto);
  return `${t} | Reagex Produtos Químicos`.slice(0, 150);
}

function gerarPalavrasChave(item, row) {
  const cas = row[idx['CAS']];
  const kws = [item.produto, item.subcategoriaExodo, item.categoriaExodo];
  if (cas && cas !== '-') kws.push(cas);
  return kws.join(', ');
}

// Gera pra todos e salva
for (const item of dados) {
  const row = byCodigo.get(item.codigo);
  item.descricaoHtml = gerarDescricaoHtml(item, row);
  item.seoMetaDescricao = gerarMetaDescricao(item, row);
  item.seoTitulo = gerarTituloSeo(item);
  item.seoPalavrasChave = gerarPalavrasChave(item, row);
}

fs.writeFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), JSON.stringify(dados, null, 1));

// Amostra pra revisão: 2 sólidos, 2 soluções, 2 líquidos
const amostra = [
  ...dados.filter(d => d.tipoFoto === 'solido').slice(0, 2),
  ...dados.filter(d => d.tipoFoto === 'solucao').slice(0, 2),
  ...dados.filter(d => d.tipoFoto === 'liquido').slice(0, 2),
];

console.log('=== AMOSTRA PARA REVISÃO (6 de 2599) ===\n');
for (const a of amostra) {
  console.log('CÓDIGO:', a.codigo, '| TIPO:', a.tipoFoto);
  console.log('SEO Título:', a.seoTitulo);
  console.log('SEO Meta descrição:', a.seoMetaDescricao);
  console.log('SEO Palavras-chave:', a.seoPalavrasChave);
  console.log('Descrição HTML:\n' + a.descricaoHtml);
  console.log('\n---\n');
}
