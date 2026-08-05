export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function hoje(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function diasParaVencer(vencimento: string): number {
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + 'T00:00:00');
  return Math.ceil((venc.getTime() - agora.getTime()) / 86400000);
}

export type StatusLicenca = 'ok' | 'vencendo' | 'vencida' | 'sem';

export function statusLicenca(vencimento: string | null | undefined): StatusLicenca {
  if (!vencimento) return 'sem';
  const dias = diasParaVencer(vencimento);
  if (dias < 0) return 'vencida';
  if (dias <= 60) return 'vencendo';
  return 'ok';
}

export function piorStatusLicencas(licencas: { vencimento: string | null }[]): StatusLicenca {
  if (!licencas || !licencas.length) return 'sem';
  const prioridade: Record<StatusLicenca, number> = { vencida: 0, vencendo: 1, ok: 2, sem: 3 };
  return licencas.reduce<StatusLicenca>((pior, lic) => {
    const s = statusLicenca(lic.vencimento);
    return prioridade[s] < prioridade[pior] ? s : pior;
  }, 'ok');
}

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];
