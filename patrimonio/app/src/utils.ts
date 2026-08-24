export function uid() { return Math.random().toString(36).slice(2, 9); }
export function hoje() { return new Date().toISOString().slice(0, 10); }

export function fmtBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n || 0);
}

export function fmtPct(n: number) { return n.toFixed(1) + '%'; }

export function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return d.split('-').reverse().join('/');
}

export function parseVal(s: string) {
  const n = parseFloat(String(s || 0).replace(/[^\d,.-]/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : Math.abs(n);
}

export const COLORS = ['#2D6A4F','#52B788','#E9A23B','#7D8FA8','#A78BFA','#E07BA0','#5BA4CF','#F4A261'];
