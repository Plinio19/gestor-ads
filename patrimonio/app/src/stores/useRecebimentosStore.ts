import { create } from 'zustand';
import type { Recebimento } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'patrimonio/data/recebimentos.json';

interface State {
  recebimentos: Recebimento[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Recebimento[], msg?: string) => Promise<void>;
  add: (item: Recebimento) => Promise<void>;
  remove: (id: string) => Promise<void>;
  marcarRecebido: (id: string, dataRecebimento: string) => Promise<Recebimento | null>;
}

export const useRecebimentosStore = create<State>((set, get) => ({
  recebimentos: [],
  sha: null,
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true });
    try {
      const { lista, sha } = await dataService.getCollection<Recebimento>(PATH);
      set({ recebimentos: lista, sha, loading: false, loaded: true });
    } catch {
      set({ loading: false, loaded: true });
    }
  },

  save: async (lista, msg) => {
    if (!get().sha && get().recebimentos.length > 0) await get().fetch(true);
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ recebimentos: lista, sha: newSha });
  },

  add: async (item) => {
    const next = [...get().recebimentos, item];
    await get().save(next, `Novo recebimento: ${item.descricao}`);
  },

  remove: async (id) => {
    const next = get().recebimentos.filter(x => x.id !== id);
    await get().save(next, 'Remover recebimento');
  },

  marcarRecebido: async (id, dataRecebimento) => {
    if (!get().sha) await get().fetch(true);
    const all = get().recebimentos;
    const item = all.find(x => x.id === id) ?? null;
    const next = all.map(x => x.id === id ? { ...x, recebido: true, dataRecebimento } : x);
    await get().save(next, 'Marcar recebimento como recebido');
    return item;
  },
}));
