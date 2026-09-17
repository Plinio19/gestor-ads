import { create } from 'zustand';
import type { ContaPagar } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'imobiliaria/data/contasPagar.json';

interface ContasPagarState {
  contas: ContaPagar[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  save: (contas: ContaPagar[], msg?: string) => Promise<void>;
  upsert: (conta: ContaPagar) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useContasPagarStore = create<ContasPagarState>((set, get) => ({
  contas: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<ContaPagar>(PATH);
      set({ contas: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (contas, msg) => {
    const newSha = await dataService.saveCollection(PATH, contas, get().sha, msg);
    set({ contas, sha: newSha });
  },

  upsert: async (conta) => {
    const all = get().contas;
    const idx = all.findIndex(c => c.id === conta.id);
    const next = idx >= 0 ? all.map(c => c.id === conta.id ? conta : c) : [...all, conta];
    await get().save(next, idx >= 0 ? 'Atualizar conta a pagar' : 'Nova conta a pagar');
  },

  remove: async (id) => {
    const next = get().contas.filter(c => c.id !== id);
    await get().save(next, 'Remover conta a pagar');
  },
}));
