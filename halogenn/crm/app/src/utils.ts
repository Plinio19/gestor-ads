import type { Etapa, TipoAtividade } from './types';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatarData(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatarValor(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
  if (isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function diasDesde(iso: string): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86_400_000);
}

export const ETAPAS: Array<{
  key: Etapa;
  label: string;
  color: string;
  bg: string;
  icone: string;
}> = [
  { key: 'lead',        label: 'Lead',           color: '#8c8c8c', bg: '#f5f5f5',   icone: '🎯' },
  { key: 'qualificado', label: 'Qualificado',     color: '#096dd9', bg: '#e6f4ff',   icone: '✅' },
  { key: 'proposta',    label: 'Proposta',        color: '#1677ff', bg: '#e8f4ff',   icone: '📄' },
  { key: 'negociacao',  label: 'Em Negociação',   color: '#d46b08', bg: '#fff7e6',   icone: '🤝' },
  { key: 'ganho',       label: 'Ganho',           color: '#389e0d', bg: '#f6ffed',   icone: '🏆' },
  { key: 'perdido',     label: 'Perdido',         color: '#cf1322', bg: '#fff1f0',   icone: '❌' },
];

export function getEtapa(key: Etapa) {
  return ETAPAS.find(e => e.key === key) ?? ETAPAS[0];
}

export const SEGMENTOS = [
  'Laboratório', 'Hospital', 'Clínica', 'Indústria Química',
  'Farmácia', 'Universidade', 'Distribuidor', 'Pesquisa', 'Outros',
];

export const ORIGENS = [
  'Indicação', 'Site / Google', 'LinkedIn', 'Instagram',
  'E-mail Marketing', 'Prospecção Ativa', 'Evento', 'Outros',
];

export const TIPOS_ATIVIDADE: Array<{ key: TipoAtividade; label: string; icone: string }> = [
  { key: 'ligacao',  label: 'Ligação',   icone: '📞' },
  { key: 'email',    label: 'E-mail',    icone: '✉️' },
  { key: 'reuniao',  label: 'Reunião',   icone: '🤝' },
  { key: 'visita',   label: 'Visita',    icone: '🚗' },
  { key: 'proposta', label: 'Proposta',  icone: '📄' },
  { key: 'tarefa',   label: 'Tarefa',    icone: '✅' },
];

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];
