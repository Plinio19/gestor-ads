import { create } from 'zustand';
import type { Negocio } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'halogenn/crm/data/negocios.json';

interface State {
  negocios: Negocio[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Negocio[], msg?: string) => Promise<void>;
  upsert: (n: Negocio) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useNegociosStore = create<State>((set, get) => ({
  negocios: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Negocio>(PATH);
      set({ negocios: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ negocios: lista, sha: newSha });
  },

  upsert: async (n) => {
    const all = get().negocios;
    const ex = all.find(x => x.id === n.id);
    const next = ex ? all.map(x => x.id === n.id ? n : x) : [...all, n];
    await get().save(next, `${ex ? 'Atualizar' : 'Novo'} negócio: ${n.titulo}`);
  },

  remove: async (id) => {
    const titulo = get().negocios.find(x => x.id === id)?.titulo ?? id;
    const next = get().negocios.filter(x => x.id !== id);
    await get().save(next, `Remover negócio: ${titulo}`);
  },
}));
