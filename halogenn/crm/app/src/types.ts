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

export interface Contato {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
}

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  site: string;
  segmento: string;
  cidade: string;
  uf: string;
  status: 'ativo' | 'inativo' | 'prospecto';
  obs: string;
  contatos: Contato[];
  criadoEm: string;
}

export type Etapa =
  | 'lead'
  | 'qualificado'
  | 'proposta'
  | 'negociacao'
  | 'ganho'
  | 'perdido';

export interface Negocio {
  id: string;
  titulo: string;
  clienteId: string;
  etapa: Etapa;
  valor: string;
  probabilidade: string;
  dataAbertura: string;
  dataFechamento: string;
  descricao: string;
  origem: string;
  criadoEm: string;
}

export type TipoAtividade = 'ligacao' | 'email' | 'reuniao' | 'visita' | 'tarefa' | 'proposta';

export interface Atividade {
  id: string;
  tipo: TipoAtividade;
  descricao: string;
  clienteId: string;
  negocioId: string;
  data: string;
  concluida: boolean;
  obs: string;
  criadoEm: string;
}
