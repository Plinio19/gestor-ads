import { create } from 'zustand';
import type { CaixaItem } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'patrimonio/data/caixa.json';

interface State {
  caixa: CaixaItem[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: CaixaItem[], msg?: string) => Promise<void>;
  add: (item: CaixaItem) => Promise<void>;
  remove: (id: string) => Promise<void>;
  update: (item: CaixaItem) => Promise<void>;
}

export const useCaixaStore = create<State>((set, get) => ({
  caixa: [],
  sha: null,
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true });
    try {
      const { lista, sha } = await dataService.getCollection<CaixaItem>(PATH);
      set({ caixa: lista, sha, loading: false, loaded: true });
    } catch {
      set({ loading: false, loaded: true });
    }
  },

  save: async (lista, msg) => {
    if (!get().sha && get().caixa.length > 0) await get().fetch(true);
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ caixa: lista, sha: newSha });
  },

  add: async (item) => {
    const next = [...get().caixa, item];
    await get().save(next, `Caixa: ${item.origem}`);
  },

  remove: async (id) => {
    const next = get().caixa.filter(x => x.id !== id);
    await get().save(next, 'Remover do caixa');
  },

  update: async (item) => {
    const next = get().caixa.map(x => x.id === item.id ? item : x);
    await get().save(next, 'Atualizar caixa');
  },
}));
