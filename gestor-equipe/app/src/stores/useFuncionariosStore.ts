import { create } from 'zustand';
import type { Funcionario } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'gestor-equipe/data/funcionarios.json';

interface State {
  funcionarios: Funcionario[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Funcionario[], msg?: string) => Promise<void>;
  upsert: (f: Funcionario) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useFuncionariosStore = create<State>((set, get) => ({
  funcionarios: [],
  sha: null,
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true });
    try {
      const { lista, sha } = await dataService.getCollection<Funcionario>(PATH);
      set({ funcionarios: lista, sha, loading: false, loaded: true });
    } catch { set({ loading: false, loaded: true }); }
  },

  save: async (lista, msg) => {
    if (!get().sha && get().funcionarios.length > 0) await get().fetch(true);
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ funcionarios: lista, sha: newSha });
  },

  upsert: async (f) => {
    const all = get().funcionarios;
    const exists = all.findIndex(x => x.id === f.id);
    const next = exists >= 0 ? all.map(x => x.id === f.id ? f : x) : [...all, f];
    await get().save(next, `Funcionário: ${f.nome}`);
  },

  remove: async (id) => {
    await get().save(get().funcionarios.filter(x => x.id !== id), 'Remover funcionário');
  },
}));
