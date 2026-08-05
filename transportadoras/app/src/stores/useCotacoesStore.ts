import { create } from 'zustand';
import type { Cotacao } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'transportadoras/data/cotacoes.json';

interface CotacoesState {
  cotacoes: Cotacao[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;

  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Cotacao[], msg?: string) => Promise<void>;
  upsert: (c: Cotacao) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCotacoesStore = create<CotacoesState>((set, get) => ({
  cotacoes: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Cotacao>(PATH);
      set({ cotacoes: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ cotacoes: lista, sha: newSha });
  },

  upsert: async (c) => {
    const all = get().cotacoes;
    const existing = all.find(x => x.id === c.id);
    const next = existing
      ? all.map(x => x.id === c.id ? c : x)
      : [...all, c];
    await get().save(next, `${existing ? 'Atualizar' : 'Nova'} cotação: pedido ${c.pedido}`);
  },

  remove: async (id) => {
    const next = get().cotacoes.filter(x => x.id !== id);
    const pedido = get().cotacoes.find(x => x.id === id)?.pedido ?? id;
    await get().save(next, `Remover cotação: pedido ${pedido}`);
  },
}));
