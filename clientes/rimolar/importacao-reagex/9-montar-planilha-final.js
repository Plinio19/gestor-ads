const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const dados = JSON.parse(fs.readFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), 'utf8'));

const imagemPorTipo = {
  solido: 'https://i.ibb.co/Sw54dB5f/Reagex-Foto-Produtos-Solidos.png',
  solucao: 'https://i.ibb.co/nN9NRt9c/Reagex-Foto-Produtos-Solu-o.png',
  liquido: 'https://i.ibb.co/C3rrfkk4/Reagex-Foto-Produtos-Liquidos.png',
};

// Normaliza pontuação Unicode "esperta" pra equivalente ASCII simples, evitando
// problema de encoding na importação da Tray (que espera Latin-1, não UTF-8).
function sanitizarTexto(v) {
  if (typeof v !== 'string') return v;
  return v
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[\t\n\r]+/g, ' ') // tabs/quebras de linha soltas vindas da planilha da Exodo
    .replace(/ {2,}/g, ' ')
    .trim();
}

function tituloCaso(nome) {
  return nome
    .toLowerCase()
    .replace(/(^|\s|\()([a-zà-ú])/g, (m, sep, c) => sep + c.toUpperCase())
    .replace(/\bPa\b/gi, 'PA').replace(/\bAcs\b/gi, 'ACS').replace(/\bHplc\b/gi, 'HPLC')
    .replace(/\bGc\b/gi, 'GC').replace(/\bIso\b/gi, 'ISO').replace(/\bP\/v\b/gi, 'p/v');
}

const HEADER = [
  'Referência', 'Nome do produto', 'Exibir na loja', 'Exibir produto ativo',
  'Código da categoria principal', 'Nome da categoria - nível 1', 'Nome da categoria - nível 2',
  'HTML da descrição completa', 'Estoque do produto', 'Prazo de disponibilidade',
  'Endereço da imagem principal do produto', 'Marca', 'Mensagem adicional', 'NCM do produto',
  'Altura (cm)', 'Largura (cm)', 'Comprimento (cm)', 'Peso do produto (gramas)',
  'Preço de custo em reais', 'Preço de venda em reais',
  'SEO - Descrição simplificada', 'SEO - Palavras chaves do produto', 'SEO - Titulo do produto',
];

const linhas = [];
let semCategoria = 0, semPreco = 0;

for (const item of dados) {
  if (!item.categoriaIdNivel2) { semCategoria++; continue; }
  if (item.precoCusto == null || item.precoVenda == null) { semPreco++; continue; }

  linhas.push([
    item.codigo,
    tituloCaso(item.produto),
    'Sim',
    'Sim',
    item.categoriaIdNivel2,
    item.categoriaExodo,
    item.subcategoriaExodo,
    item.descricaoHtml,
    999,
    6,
    imagemPorTipo[item.tipoFoto] || '',
    'EXODO',
    'vendas@reagex.com.br',
    item.ncm || '',
    22,
    9.3,
    9.3,
    1000,
    item.precoCusto,
    item.precoVenda,
    item.seoMetaDescricao,
    item.seoPalavrasChave,
    item.seoTitulo,
  ].map(sanitizarTexto));
}

console.log('Linhas prontas:', linhas.length, '/', dados.length);
console.log('Descartadas por falta de categoria:', semCategoria);
console.log('Descartadas por falta de preço:', semPreco);

// --- XLSX (via biblioteca, sem risco de corrupção por base64 manual) ---
const ws = XLSX.utils.aoa_to_sheet([HEADER, ...linhas]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
const outXlsx = path.resolve(__dirname, 'Importacao-Reagex-2599-produtos.xlsx');
XLSX.writeFile(wb, outXlsx);
console.log('\nSalvo XLSX:', outXlsx);

// --- CSV (fallback, separador vírgula, texto entre aspas) ---
function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
const csvLinhas = [HEADER, ...linhas].map(l => l.map(csvEscape).join(',')).join('\r\n');
const outCsv = path.resolve(__dirname, 'Importacao-Reagex-2599-produtos.csv');
fs.writeFileSync(outCsv, '﻿' + csvLinhas, 'utf8'); // BOM pra abrir certo no Excel
console.log('Salvo CSV:', outCsv);
