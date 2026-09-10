// Cruza a lista de preços da Exodo com o CSV de categorias já cadastradas na Tray.
// Objetivo: para cada produto, achar o ID da categoria nível 2 (subcategoria) na Tray
// a partir do par (CATEGORIA, SUBCATEGORIA) do arquivo da Exodo.
const fs = require('fs');
const path = require('path');

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

const exodoRaw = fs.readFileSync(path.resolve(__dirname, 'exodo-nao-controlados.csv'), 'utf8');
const catRaw = fs.readFileSync(path.resolve(__dirname, 'categorias-tray.csv'), 'latin1');

const exodoRows = parseCsv(exodoRaw, ',');
const exodoHeader = exodoRows[0];
const exodoData = exodoRows.slice(1);
console.log('Exodo: header =', JSON.stringify(exodoHeader));
console.log('Exodo: total de linhas de produto =', exodoData.length);

const catRows = parseCsv(catRaw, ';');
const catHeader = catRows[0];
const catData = catRows.slice(1);
console.log('\nCategorias Tray: header =', JSON.stringify(catHeader));
console.log('Categorias Tray: total =', catData.length);

// Monta índice: nome nível 1 -> id ; (nome nível1 || nome nível2) -> id nível2
const catById = new Map();
for (const r of catData) {
  const [id, parentId, nome, nivel] = r;
  catById.set(id, { id, parentId, nome, nivel: Number(nivel) });
}
const nivel1ByName = new Map();
const nivel2ByParentAndName = new Map(); // key: parentId|nomeNivel2
for (const c of catById.values()) {
  if (c.nivel === 1) nivel1ByName.set(c.nome.trim().toLowerCase(), c.id);
  if (c.nivel === 2) nivel2ByParentAndName.set(`${c.parentId}|${c.nome.trim().toLowerCase()}`, c.id);
}

console.log('\n--- Categorias nível 1 na Tray ---');
for (const [nome, id] of nivel1ByName) console.log(` ${id} = ${nome}`);

// Índice das colunas da Exodo
const idxCategoria = exodoHeader.indexOf('CATEGORIA');
const idxSubcategoria = exodoHeader.indexOf('SUBCATEGORIA');
const idxCodigo = exodoHeader.indexOf('CODIGO');
const idxPreco = exodoHeader.findIndex(h => h.trim() === 'PREÇO');
const idxProduto = exodoHeader.indexOf('PRODUTO');
const idxNcm = exodoHeader.indexOf('NCM');

console.log('\nÍndices:', { idxCodigo, idxProduto, idxPreco, idxNcm, idxCategoria, idxSubcategoria });

const naoMapeados = new Set();
let mapeadosOk = 0;
const resultado = [];

for (const r of exodoData) {
  const categoriaExodo = (r[idxCategoria] || '').trim();
  const subcategoriaExodo = (r[idxSubcategoria] || '').trim();
  const id1 = nivel1ByName.get(categoriaExodo.toLowerCase());
  let id2 = null;
  if (id1) id2 = nivel2ByParentAndName.get(`${id1}|${subcategoriaExodo.toLowerCase()}`);
  if (!id1 || !id2) {
    naoMapeados.add(`${categoriaExodo} > ${subcategoriaExodo}`);
  } else {
    mapeadosOk++;
  }
  resultado.push({
    codigo: r[idxCodigo],
    produto: r[idxProduto],
    precoTexto: r[idxPreco],
    ncm: r[idxNcm],
    categoriaExodo,
    subcategoriaExodo,
    categoriaIdNivel1: id1 || null,
    categoriaIdNivel2: id2 || null,
  });
}

console.log(`\nMapeados corretamente: ${mapeadosOk} / ${exodoData.length}`);
console.log(`Combinações CATEGORIA>SUBCATEGORIA não encontradas na Tray (${naoMapeados.size}):`);
for (const nm of naoMapeados) console.log(' -', nm);

fs.writeFileSync(path.resolve(__dirname, '_mapeamento-categorias.json'), JSON.stringify(resultado, null, 1));
console.log('\nSalvo: _mapeamento-categorias.json');
