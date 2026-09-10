const dados = require('./_mapeamento-categorias.json');
let problemas = 0;
for (const d of dados) {
  const html = d.descricaoHtml;
  for (const tag of ['p', 'ul', 'li', 'h2', 'h3', 'strong', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'span']) {
    const abre = (html.match(new RegExp(`<${tag}(\\s[^>]*)?>`, 'g')) || []).length;
    const fecha = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (abre !== fecha) {
      problemas++;
      console.log('DESBALANCEADO', d.codigo, tag, abre, fecha);
    }
  }
  if (!d.seoTitulo || !d.seoMetaDescricao || !d.descricaoHtml) {
    problemas++;
    console.log('CAMPO VAZIO', d.codigo);
  }
}
console.log('Total de problemas:', problemas, '/', dados.length, 'produtos');
