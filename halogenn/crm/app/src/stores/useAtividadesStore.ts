import { create } from 'zustand';
import type { Atividade } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'halogenn/crm/data/atividades.json';

interface State {
  atividades: Atividade[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Atividade[], msg?: string) => Promise<void>;
  upsert: (a: Atividade) => Promise<void>;
  remove: (id: string) => Promise<void>;
  concluir: (id: string) => Promise<Atividade | null>;
}

export const useAtividadesStore = create<State>((set, get) => ({
  atividades: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Atividade>(PATH);
      set({ atividades: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ atividades: lista, sha: newSha });
  },

  upsert: async (a) => {
    const all = get().atividades;
    const ex = all.find(x => x.id === a.id);
    const next = ex ? all.map(x => x.id === a.id ? a : x) : [...all, a];
    await get().save(next, `${ex ? 'Atualizar' : 'Nova'} atividade: ${a.descricao}`);
  },

  remove: async (id) => {
    const next = get().atividades.filter(x => x.id !== id);
    await get().save(next, 'Remover atividade');
  },

  concluir: async (id) => {
    // Garante SHA atualizado antes de salvar
    if (!get().sha) await get().fetch(true);
    const all = get().atividades;
    const ativ = all.find(x => x.id === id) ?? null;
    const next = all.map(x => x.id === id ? { ...x, concluida: true } : x);
    await get().save(next, 'Concluir atividade');
    return ativ;
  },
}));
