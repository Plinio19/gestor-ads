import { create } from 'zustand';
import type { Movimentacao } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'patrimonio/data/movimentacoes.json';

interface State {
  movimentacoes: Movimentacao[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Movimentacao[], msg?: string) => Promise<void>;
  add: (item: Movimentacao) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useMovimentacoesStore = create<State>((set, get) => ({
  movimentacoes: [],
  sha: null,
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true });
    try {
      const { lista, sha } = await dataService.getCollection<Movimentacao>(PATH);
      set({ movimentacoes: lista, sha, loading: false, loaded: true });
    } catch {
      set({ loading: false, loaded: true });
    }
  },

  save: async (lista, msg) => {
    if (!get().sha && get().movimentacoes.length > 0) await get().fetch(true);
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ movimentacoes: lista, sha: newSha });
  },

  add: async (item) => {
    const next = [...get().movimentacoes, item];
    await get().save(next, `Movimentação: ${item.descricao}`);
  },

  remove: async (id) => {
    const next = get().movimentacoes.filter(x => x.id !== id);
    await get().save(next, 'Remover movimentação');
  },
}));
