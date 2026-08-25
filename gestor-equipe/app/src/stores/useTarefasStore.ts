import { create } from 'zustand';
import type { Tarefa } from '../types';
import { dataService } from '../services/GitHubDataService';
import { hoje, proximoPrazo, uid, agora } from '../utils';

const PATH = 'gestor-equipe/data/tarefas.json';

interface State {
  tarefas: Tarefa[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Tarefa[], msg?: string) => Promise<void>;
  upsert: (t: Tarefa) => Promise<void>;
  concluir: (id: string) => Promise<void>;
  reabrir: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTarefasStore = create<State>((set, get) => ({
  tarefas: [],
  sha: null,
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true });
    try {
      const { lista, sha } = await dataService.getCollection<Tarefa>(PATH);
      set({ tarefas: lista, sha, loading: false, loaded: true });
    } catch { set({ loading: false, loaded: true }); }
  },

  save: async (lista, msg) => {
    if (!get().sha && get().tarefas.length > 0) await get().fetch(true);
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ tarefas: lista, sha: newSha });
  },

  upsert: async (t) => {
    const all = get().tarefas;
    const exists = all.findIndex(x => x.id === t.id);
    const next = exists >= 0 ? all.map(x => x.id === t.id ? t : x) : [...all, t];
    await get().save(next, `Tarefa: ${t.titulo}`);
  },

  concluir: async (id) => {
    const all = get().tarefas;
    const t = all.find(x => x.id === id);
    if (!t) return;
    const updated = { ...t, status: 'concluida' as const, concluidaEm: agora() };
    let next = all.map(x => x.id === id ? updated : x);

    // Se recorrente, gera nova instância
    if (t.recorrencia.tipo !== 'unica') {
      const novoPrazo = proximoPrazo(t.prazo, t.recorrencia);
      if (novoPrazo !== t.prazo) {
        const nova: Tarefa = {
          ...t,
          id: uid(),
          prazo: novoPrazo,
          status: 'pendente',
          criadaEm: agora(),
          concluidaEm: undefined,
        };
        next = [...next, nova];
      }
    }
    await get().save(next, `Concluir: ${t.titulo}`);
  },

  reabrir: async (id) => {
    const next = get().tarefas.map(x => x.id === id
      ? { ...x, status: 'pendente' as const, concluidaEm: undefined }
      : x);
    await get().save(next, 'Reabrir tarefa');
  },

  remove: async (id) => {
    await get().save(get().tarefas.filter(x => x.id !== id), 'Remover tarefa');
  },
}));

/* ── Helpers para notificações ── */
export function tarefasVencidas(tarefas: Tarefa[]): Tarefa[] {
  const h = hoje();
  return tarefas.filter(t => t.status !== 'concluida' && t.prazo < h);
}

export function tarefasHoje(tarefas: Tarefa[]): Tarefa[] {
  const h = hoje();
  return tarefas.filter(t => t.status !== 'concluida' && t.prazo === h);
}
