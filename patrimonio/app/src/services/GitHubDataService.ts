import type { GitHubConfig, DataResult } from '../types';

const LS_CONFIG = 'pat_config_v1';
const DEFAULTS = { owner: 'Plinio19', repo: 'gestor-ads', branch: 'main' };

const CACHE_MAP: Record<string, string> = {
  'patrimonio/data/categorias.json':    'pat_categorias',
  'patrimonio/data/caixa.json':         'pat_caixa',
  'patrimonio/data/recebimentos.json':  'pat_recebimentos',
};

class GitHubDataService {
  private config: GitHubConfig | null = null;

  getConfig(): GitHubConfig | null {
    if (this.config) return this.config;
    try {
      const raw = localStorage.getItem(LS_CONFIG);
      if (!raw) return null;
      this.config = JSON.parse(raw) as GitHubConfig;
      return this.config;
    } catch { return null; }
  }

  setConfig(cfg: GitHubConfig) {
    this.config = cfg;
    localStorage.setItem(LS_CONFIG, JSON.stringify(cfg));
  }

  private apiBase(): string {
    const cfg = this.getConfig() ?? { ...DEFAULTS, token: '' };
    return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents`;
  }

  private headers(): Record<string, string> {
    const cfg = this.getConfig();
    const token = cfg?.token ?? '';
    return {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private branch(): string {
    return this.getConfig()?.branch ?? DEFAULTS.branch;
  }

  async getCollection<T>(path: string): Promise<DataResult<T>> {
    const cacheKey = CACHE_MAP[path];
    try {
      const res = await fetch(
        `${this.apiBase()}/${path}?ref=${this.branch()}`,
        { headers: this.headers() },
      );
      if (!res.ok) {
        if (res.status === 404) {
          if (cacheKey) localStorage.removeItem(cacheKey);
          return { lista: [], sha: null };
        }
        throw new Error(`GitHub ${res.status}`);
      }
      const json = await res.json() as { content: string; sha: string };
      const binary = atob(json.content.replace(/\n/g, ''));
      const bytes  = Uint8Array.from(binary, c => c.charCodeAt(0));
      const text   = new TextDecoder('utf-8').decode(bytes);
      const lista  = JSON.parse(text) as T[];
      if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify({ lista, sha: json.sha }));
      return { lista, sha: json.sha };
    } catch (err) {
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached) as DataResult<T>;
      }
      throw err;
    }
  }

  async saveCollection<T>(
    path: string,
    lista: T[],
    sha: string | null,
    message?: string,
  ): Promise<string> {
    const jsonStr = JSON.stringify(lista, null, 2);
    const utf8    = new TextEncoder().encode(jsonStr);
    let binary    = '';
    utf8.forEach(b => { binary += String.fromCharCode(b); });
    const content = btoa(binary);

    const doPut = async (currentSha: string | null) => {
      const body: Record<string, unknown> = {
        message: message ?? `Atualizar ${path}`,
        content,
        branch: this.branch(),
      };
      if (currentSha) body.sha = currentSha;
      return fetch(`${this.apiBase()}/${path}`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
    };

    let res = await doPut(sha);

    if (res.status === 409 || res.status === 422) {
      const fresh = await fetch(
        `${this.apiBase()}/${path}?ref=${this.branch()}`,
        { headers: this.headers() },
      );
      if (fresh.ok) {
        const meta = await fresh.json() as { sha: string };
        res = await doPut(meta.sha);
      }
    }

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Erro ao salvar (${res.status}): ${txt}`);
    }
    const json = await res.json() as { content: { sha: string } };
    const newSha = json.content.sha;
    const cacheKey = CACHE_MAP[path];
    if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify({ lista, sha: newSha }));
    return newSha;
  }

  async testarConexao(): Promise<string> {
    const cfg = this.getConfig();
    if (!cfg?.token) throw new Error('Token não configurado');
    const res = await fetch(
      `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`,
      { headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const json = await res.json() as { full_name: string };
    return json.full_name;
  }
}

export const dataService = new GitHubDataService();
