import { create } from 'zustand';
import type { Ticket } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'transportadoras/data/tickets.json';

interface TicketsState {
  tickets: Ticket[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;

  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Ticket[], msg?: string) => Promise<void>;
  upsert: (t: Ticket) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Ticket>(PATH);
      set({ tickets: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ tickets: lista, sha: newSha });
  },

  upsert: async (t) => {
    const all = get().tickets;
    const existing = all.find(x => x.id === t.id);
    const next = existing
      ? all.map(x => x.id === t.id ? t : x)
      : [...all, t];
    await get().save(next, `${existing ? 'Atualizar' : 'Novo'} ticket #${t.numero}`);
  },

  remove: async (id) => {
    const ticket = get().tickets.find(x => x.id === id);
    const next = get().tickets.filter(x => x.id !== id);
    await get().save(next, `Remover ticket #${ticket?.numero ?? id}`);
  },
}));
