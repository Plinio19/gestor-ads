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

export interface Asset {
  id: string;
  name: string;
  value: number;
}

export interface Categoria {
  id: string;
  name: string;
  color: string;
  assets: Asset[];
}

export interface CaixaItem {
  id: string;
  valor: number;
  origem: string;
  data: string;
}

export interface Recebimento {
  id: string;
  catId: string;
  descricao: string;
  valor: number;
  vencimento: string;
  recebido: boolean;
  dataRecebimento: string | null;
}

export interface Movimentacao {
  id: string;
  data: string;
  descricao: string;
  tipo: 'transferencia' | 'aporte' | 'resgate' | 'recebimento';
  origemCat?: string;
  origemAtivo?: string;
  destinoCat?: string;
  destinoAtivo?: string;
  valor: number;
}
