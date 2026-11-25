import { create } from 'zustand';
import type { RastreioNF } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'transportadoras/data/rastreio.json';

interface RastreioState {
  nfs: RastreioNF[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;

  fetch: (force?: boolean) => Promise<void>;
  save: (lista: RastreioNF[], msg?: string) => Promise<void>;
  upsert: (nf: RastreioNF) => Promise<void>;
  remove: (id: string) => Promise<void>;
  marcarEntregue: (id: string, dataEntrega: string) => Promise<void>;
}

export const useRastreioStore = create<RastreioState>((set, get) => ({
  nfs: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<RastreioNF>(PATH);
      set({ nfs: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ nfs: lista, sha: newSha });
  },

  upsert: async (nf) => {
    const all = get().nfs;
    const existing = all.find(x => x.id === nf.id);
    const next = existing
      ? all.map(x => x.id === nf.id ? nf : x)
      : [...all, nf];
    await get().save(next, `${existing ? 'Atualizar' : 'Nova'} NF ${nf.notaFiscal}`);
  },

  remove: async (id) => {
    const nf = get().nfs.find(x => x.id === id);
    const next = get().nfs.filter(x => x.id !== id);
    await get().save(next, `Remover NF ${nf?.notaFiscal ?? id}`);
  },

  marcarEntregue: async (id, dataEntrega) => {
    const all = get().nfs;
    const nf = all.find(x => x.id === id);
    if (!nf) return;
    const updated = { ...nf, entregue: true, dataEntrega };
    const next = all.map(x => x.id === id ? updated : x);
    await get().save(next, `NF ${nf.notaFiscal} entregue em ${dataEntrega}`);
  },
}));
