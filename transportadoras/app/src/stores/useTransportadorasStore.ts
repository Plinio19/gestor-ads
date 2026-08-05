import { create } from 'zustand';
import type { Transportadora } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'transportadoras/data/transportadoras.json';

interface TransportadorasState {
  transportadoras: Transportadora[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;

  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Transportadora[], msg?: string) => Promise<void>;
  upsert: (t: Transportadora) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTransportadorasStore = create<TransportadorasState>((set, get) => ({
  transportadoras: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Transportadora>(PATH);
      set({ transportadoras: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ transportadoras: lista, sha: newSha });
  },

  upsert: async (t) => {
    const all = get().transportadoras;
    const existing = all.find(x => x.id === t.id);
    const next = existing
      ? all.map(x => x.id === t.id ? t : x)
      : [...all, t];
    await get().save(next, `${existing ? 'Atualizar' : 'Nova'} transportadora: ${t.nome}`);
  },

  remove: async (id) => {
    const next = get().transportadoras.filter(x => x.id !== id);
    const nome = get().transportadoras.find(x => x.id === id)?.nome ?? id;
    await get().save(next, `Remover transportadora: ${nome}`);
  },
}));
