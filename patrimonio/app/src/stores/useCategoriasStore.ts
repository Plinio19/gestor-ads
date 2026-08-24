import { create } from 'zustand';
import type { Categoria } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'patrimonio/data/categorias.json';

const COLORS = ['#2D6A4F','#52B788','#E9A23B','#7D8FA8','#A78BFA','#E07BA0','#5BA4CF','#F4A261'];

function uid() { return Math.random().toString(36).slice(2, 9); }
function hoje() { return new Date().toISOString().slice(0, 10); }

function defaultCategorias(): Categoria[] {
  return [
    { id: uid(), name: 'Renda Fixa', color: COLORS[0], assets: [
      { id: uid(), name: 'BTG Pactual', value: 40677.78 },
    ]},
    { id: uid(), name: 'Renda Variável', color: COLORS[1], assets: [
      { id: uid(), name: 'AREA11', value: 8127.60 },
      { id: uid(), name: 'WRLD11', value: 8219.75 },
      { id: uid(), name: 'AUVP11', value: 4957.68 },
    ]},
    { id: uid(), name: 'Imóveis', color: COLORS[2], assets: [
      { id: uid(), name: 'Construção de Casas', value: 30000.00 },
    ]},
    { id: uid(), name: 'Veículos', color: COLORS[3], assets: [
      { id: uid(), name: 'Moto GSX650F', value: 28000.00 },
      { id: uid(), name: 'Carro City 2013', value: 40000.00 },
    ]},
    { id: uid(), name: 'Aportes em Empresas', color: COLORS[4], assets: [
      { id: uid(), name: 'Halogenn', value: 7000.00 },
      { id: uid(), name: 'N30 Engenharia', value: 5000.00 },
    ]},
  ];
}

export { uid, hoje, COLORS, defaultCategorias };

interface State {
  categorias: Categoria[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Categoria[], msg?: string) => Promise<void>;
  set: (lista: Categoria[]) => void;
}

export const useCategoriasStore = create<State>((set, get) => ({
  categorias: [],
  sha: null,
  loading: false,
  loaded: false,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true });
    try {
      const { lista, sha } = await dataService.getCollection<Categoria>(PATH);
      const cats = lista.length > 0 ? lista : defaultCategorias();
      set({ categorias: cats, sha, loading: false, loaded: true });
      if (lista.length === 0 && sha === null) {
        const newSha = await dataService.saveCollection(PATH, cats, null, 'Init categorias');
        set({ sha: newSha });
      }
    } catch {
      set({ categorias: defaultCategorias(), loading: false, loaded: true });
    }
  },

  save: async (lista, msg) => {
    if (!get().sha) await get().fetch(true);
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ categorias: lista, sha: newSha });
  },

  set: (lista) => set({ categorias: lista }),
}));
