import { create } from 'zustand';
import type { Processo } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'gestor-equipe/data/processos.json';

interface State {
  processos: Processo[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Processo[], msg?: string) => Promise<void>;
  upsert: (p: Processo) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useProcessosStore = create<State>((set, get) => ({
  processos: [],
  sha: null,
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true });
    try {
      const { lista, sha } = await dataService.getCollection<Processo>(PATH);
      set({ processos: lista, sha, loading: false, loaded: true });
    } catch { set({ loading: false, loaded: true }); }
  },

  save: async (lista, msg) => {
    if (!get().sha && get().processos.length > 0) await get().fetch(true);
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ processos: lista, sha: newSha });
  },

  upsert: async (p) => {
    const all = get().processos;
    const exists = all.findIndex(x => x.id === p.id);
    const next = exists >= 0 ? all.map(x => x.id === p.id ? p : x) : [...all, p];
    await get().save(next, `Processo: ${p.titulo}`);
  },

  remove: async (id) => {
    await get().save(get().processos.filter(x => x.id !== id), 'Remover processo');
  },
}));
