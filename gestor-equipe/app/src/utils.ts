export function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36); }
export function hoje() { return new Date().toISOString().slice(0, 10); }
export function agora() { return new Date().toISOString(); }

export function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return d.slice(0, 10).split('-').reverse().join('/');
}

export function fmtDatetime(d: string | null | undefined) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function diasAte(prazo: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const p = new Date(prazo + 'T00:00:00');
  return Math.round((p.getTime() - hoje.getTime()) / 86400000);
}

export const COR_PRIORIDADE: Record<string, string> = {
  baixa: '#52c41a',
  normal: '#1677ff',
  alta: '#fa8c16',
  urgente: '#f5222d',
};

export const LABEL_PRIORIDADE: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const LABEL_STATUS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

export const LABEL_RECORRENCIA: Record<string, string> = {
  unica: 'Única',
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CORES_AVATAR = [
  '#F56A00', '#7265E6', '#00A2AE', '#2D6A4F',
  '#E9A23B', '#7D8FA8', '#E07BA0', '#5BA4CF',
];

// Avança sempre um período a partir do prazo atual (chamado ao concluir uma tarefa recorrente)
export function proximoPrazo(prazo: string, recorrencia: { tipo: string; diaSemana?: number; diaMes?: number }): string {
  if (recorrencia.tipo === 'unica') return prazo;
  const base = new Date(prazo + 'T00:00:00');

  if (recorrencia.tipo === 'diaria') {
    base.setDate(base.getDate() + 1);
    return base.toISOString().slice(0, 10);
  }

  if (recorrencia.tipo === 'semanal') {
    base.setDate(base.getDate() + 7);
    return base.toISOString().slice(0, 10);
  }

  if (recorrencia.tipo === 'mensal' && recorrencia.diaMes !== undefined) {
    const next = new Date(base.getFullYear(), base.getMonth() + 1, recorrencia.diaMes);
    return next.toISOString().slice(0, 10);
  }

  return prazo;
}
