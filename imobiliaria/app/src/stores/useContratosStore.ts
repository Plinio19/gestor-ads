import { create } from 'zustand';
import type { Contrato } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'imobiliaria/data/contratos.json';

interface ContratosState {
  contratos: Contrato[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  save: (contratos: Contrato[], msg?: string) => Promise<void>;
  upsert: (contrato: Contrato) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byImovel: (imovelId: string) => Contrato | undefined;
}

export const useContratosStore = create<ContratosState>((set, get) => ({
  contratos: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Contrato>(PATH);
      set({ contratos: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (contratos, msg) => {
    const newSha = await dataService.saveCollection(PATH, contratos, get().sha, msg);
    set({ contratos, sha: newSha });
  },

  upsert: async (contrato) => {
    const all = get().contratos;
    const idx = all.findIndex(c => c.id === contrato.id);
    const next = idx >= 0
      ? all.map(c => c.id === contrato.id ? contrato : c)
      : [...all, contrato];
    await get().save(next, idx >= 0 ? 'Atualizar contrato' : 'Novo contrato');
  },

  remove: async (id) => {
    const next = get().contratos.filter(c => c.id !== id);
    await get().save(next, 'Remover contrato');
  },

  byImovel: (imovelId) => get().contratos.find(c => c.imovelId === imovelId),
}));
