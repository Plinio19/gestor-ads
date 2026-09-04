import { create } from 'zustand';
import type { Imovel } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'imobiliaria/data/imoveis.json';

interface ImoveisState {
  imoveis: Imovel[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  save: (imoveis: Imovel[], msg?: string) => Promise<void>;
  upsert: (imovel: Imovel) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useImoveisStore = create<ImoveisState>((set, get) => ({
  imoveis: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Imovel>(PATH);
      set({ imoveis: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (imoveis, msg) => {
    const newSha = await dataService.saveCollection(PATH, imoveis, get().sha, msg);
    set({ imoveis, sha: newSha });
  },

  upsert: async (imovel) => {
    const all = get().imoveis;
    const idx = all.findIndex(i => i.id === imovel.id);
    const next = idx >= 0
      ? all.map(i => i.id === imovel.id ? imovel : i)
      : [...all, imovel];
    await get().save(next, idx >= 0 ? 'Atualizar imóvel' : 'Novo imóvel');
  },

  remove: async (id) => {
    const next = get().imoveis.filter(i => i.id !== id);
    await get().save(next, 'Remover imóvel');
  },
}));
