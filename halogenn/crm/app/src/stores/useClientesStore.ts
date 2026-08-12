import { create } from 'zustand';
import type { Cliente } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'halogenn/crm/data/clientes.json';

interface State {
  clientes: Cliente[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Cliente[], msg?: string) => Promise<void>;
  upsert: (c: Cliente) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useClientesStore = create<State>((set, get) => ({
  clientes: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Cliente>(PATH);
      set({ clientes: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ clientes: lista, sha: newSha });
  },

  upsert: async (c) => {
    const all = get().clientes;
    const ex = all.find(x => x.id === c.id);
    const next = ex ? all.map(x => x.id === c.id ? c : x) : [...all, c];
    await get().save(next, `${ex ? 'Atualizar' : 'Novo'} cliente: ${c.razaoSocial}`);
  },

  remove: async (id) => {
    const nome = get().clientes.find(x => x.id === id)?.razaoSocial ?? id;
    const next = get().clientes.filter(x => x.id !== id);
    await get().save(next, `Remover cliente: ${nome}`);
  },
}));
