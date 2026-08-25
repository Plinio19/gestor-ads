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

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  email?: string;
  telefone?: string;
  cor: string;
  ativo: boolean;
  criadoEm: string;
}

export type Prioridade = 'baixa' | 'normal' | 'alta' | 'urgente';
export type StatusTarefa = 'pendente' | 'em_andamento' | 'concluida';
export type TipoRecorrencia = 'unica' | 'diaria' | 'semanal' | 'mensal';

export interface Recorrencia {
  tipo: TipoRecorrencia;
  diaSemana?: number; // 0=Dom … 6=Sab
  diaMes?: number;    // 1-31
  horario?: string;   // 'HH:mm'
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  responsavelId: string;
  prazo: string;         // YYYY-MM-DD
  recorrencia: Recorrencia;
  prioridade: Prioridade;
  status: StatusTarefa;
  categoria?: string;
  criadaEm: string;
  concluidaEm?: string;
  observacoes?: string;
}

export interface ProcessoEtapa {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  fotos: string[];   // base64 data URLs
  videoUrl?: string;
  responsavel?: string;
  tempo?: string;
}

export interface Processo {
  id: string;
  titulo: string;
  descricao: string;
  responsavelId?: string;
  categoria?: string;
  versao: string;
  criadoEm: string;
  atualizadoEm: string;
  etapas: ProcessoEtapa[];
  observacoes?: string;
  ativo: boolean;
}
