export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface DataResult<T> {
  lista: T[];
  sha: string | null;
}

export interface Licenca {
  id: string;
  tipo: string;
  vencimento: string | null;
  arquivo?: string;
  nomeArquivo?: string;
}

export interface Transportadora {
  id: string;
  nome: string;
  quimico: 'sim' | 'nao' | 'consultar';
  status: 'ativo' | 'inativo' | 'suspenso';
  telefone: string;
  email: string;
  site: string;
  contato: string;
  obs: string;
  estados: string[];
  licencas: Licenca[];
}

export interface TransRow {
  trans: string;
  valor: string;
  cotacao: string;
  prazo: string;
}

export interface Cotacao {
  id: string;
  data: string;
  pedido: string;
  tomador: string;
  linhas: string;
  cnpjR: string;
  cepR: string;
  cnpjD: string;
  cepD: string;
  vnf: string;
  vol: string;
  pes: string;
  med: string;
  mat: string;
  col: string;
  transRows: TransRow[];
}

export interface Documento {
  id: string;
  tipo: string;
  numero: string;
  data: string;
  transportadora: string;
  arquivo?: string;
  nomeArquivo?: string;
  obs: string;
}
