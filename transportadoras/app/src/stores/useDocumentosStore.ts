import { create } from 'zustand';
import type { Documento } from '../types';
import { dataService } from '../services/GitHubDataService';

const PATH = 'transportadoras/data/documentos.json';

interface DocumentosState {
  documentos: Documento[];
  sha: string | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;

  fetch: (force?: boolean) => Promise<void>;
  save: (lista: Documento[], msg?: string) => Promise<void>;
  upsert: (d: Documento) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useDocumentosStore = create<DocumentosState>((set, get) => ({
  documentos: [],
  sha: null,
  loading: false,
  loaded: false,
  error: null,

  fetch: async (force = false) => {
    if (!force && get().loaded) return;
    set({ loading: true, error: null });
    try {
      const { lista, sha } = await dataService.getCollection<Documento>(PATH);
      set({ documentos: lista, sha, loading: false, loaded: true });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  save: async (lista, msg) => {
    const newSha = await dataService.saveCollection(PATH, lista, get().sha, msg);
    set({ documentos: lista, sha: newSha });
  },

  upsert: async (d) => {
    const all = get().documentos;
    const existing = all.find(x => x.id === d.id);
    const next = existing
      ? all.map(x => x.id === d.id ? d : x)
      : [...all, d];
    await get().save(next, `${existing ? 'Atualizar' : 'Novo'} documento: ${d.tipo} ${d.numero}`);
  },

  remove: async (id) => {
    const next = get().documentos.filter(x => x.id !== id);
    const doc = get().documentos.find(x => x.id === id);
    await get().save(next, `Remover documento: ${doc?.tipo ?? ''} ${doc?.numero ?? ''}`);
  },
}));
