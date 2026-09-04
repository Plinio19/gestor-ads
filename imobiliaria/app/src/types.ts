export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface DataResult<T> {
  lista: T[];
  sha: string | null;
}

export interface Imovel {
  id: string;
  codigo: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  nomeProprietario: string;
  contatoProprietario1: string;
  contatoProprietario2?: string;
  area?: number;
  matricula?: string;
  cadastroMunicipal?: string;
  quartos: number;
  banheiros: number;
  vagasGaragem: number;
  mobiliado: boolean;
  quintal: boolean;
  lavanderia: boolean;
  aceitaPet: boolean;
  valorAluguel?: number;
  valorVenda?: number;
  valorCondominio?: number;
  valorIptu?: number;
  status: 'disponivel' | 'alugado';
  finalidade: 'locacao' | 'venda' | 'ambos';
  linksFotos: string[];
  observacoes?: string;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface Contrato {
  id: string;
  imovelId: string;
  nomeInquilino: string;
  contatoInquilino: string;
  dataAssinatura: string;
  linkContrato?: string;
  observacoes?: string;
  criadoEm: string;
}
