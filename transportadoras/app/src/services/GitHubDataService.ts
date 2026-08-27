import type { DataResult, GitHubConfig } from '../types';

const LS_CONFIG = 'trans_config_v1';
const DEFAULTS: Partial<GitHubConfig> = {
  owner: 'Plinio19',
  repo: 'gestor-ads',
  branch: 'main',
};

const CACHE_MAP: Record<string, string> = {
  'transportadoras/data/transportadoras.json': 'trans_transportadoras',
  'transportadoras/data/cotacoes.json':        'trans_cotacoes',
  'transportadoras/data/documentos.json':      'trans_docs',
  'transportadoras/data/tickets.json':         'trans_tickets',
};

function cacheKey(path: string): string {
  return CACHE_MAP[path] ?? `trans_${path.replace(/[^a-z0-9]/gi, '_')}`;
}

function getConfig(): GitHubConfig | null {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_CONFIG) || '{}');
    const cfg = { ...DEFAULTS, ...stored } as GitHubConfig;
    return cfg.token ? cfg : null;
  } catch {
    return null;
  }
}

function apiBase(cfg: GitHubConfig, path: string, bust = false): string {
  const ts = bust ? `&_t=${Date.now()}` : '';
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch}${ts}`;
}

function apiBaseNoRef(cfg: GitHubConfig, path: string): string {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
}

function headers(cfg: GitHubConfig): HeadersInit {
  return {
    Authorization: `token ${cfg.token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64.replace(/\n/g, '').replace(/\r/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

async function fetchFreshSha(cfg: GitHubConfig, path: string): Promise<string | null> {
  try {
    const res = await fetch(apiBase(cfg, path, true), {
      headers: { ...headers(cfg), 'Cache-Control': 'no-cache' },
    });
    if (res.ok) return (await res.json()).sha as string;
  } catch { /* ignora */ }
  return null;
}

export class GitHubDataService {
  isConfigured(): boolean {
    const cfg = getConfig();
    return !!(cfg?.token && cfg?.owner && cfg?.repo);
  }

  getConfig(): GitHubConfig | null {
    return getConfig();
  }

  saveConfigToLS(cfg: Partial<GitHubConfig>): void {
    const current = JSON.parse(localStorage.getItem(LS_CONFIG) || '{}');
    localStorage.setItem(LS_CONFIG, JSON.stringify({ ...current, ...cfg }));
  }

  async getCollection<T>(path: string): Promise<DataResult<T>> {
    const cfg = getConfig();
    const key = cacheKey(path);

    if (!cfg) {
      const cached = localStorage.getItem(key);
      if (cached) {
        try { return JSON.parse(cached) as DataResult<T>; } catch { /* invalid cache */ }
      }
      throw new Error('GitHub não configurado. Acesse Configurações.');
    }

    const res = await fetch(apiBase(cfg, path), { headers: headers(cfg) });

    if (res.status === 404) return { lista: [], sha: null };

    if (!res.ok) {
      const cached = localStorage.getItem(key);
      if (cached) {
        try { return JSON.parse(cached) as DataResult<T>; } catch { /* invalid cache */ }
      }
      throw new Error(`GitHub ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const sha: string = json.sha;
    const raw = fromBase64(json.content);
    const lista: T[] = JSON.parse(raw);

    localStorage.setItem(key, JSON.stringify({ lista, sha }));
    return { lista, sha };
  }

  async saveCollection<T>(
    path: string,
    data: T[],
    sha: string | null,
    message = 'Atualização Transportadoras',
  ): Promise<string> {
    const cfg = getConfig();
    if (!cfg) throw new Error('GitHub não configurado.');

    const content = toBase64(JSON.stringify(data, null, 2));

    const doPut = (currentSha: string | null) => fetch(apiBaseNoRef(cfg, path), {
      method: 'PUT',
      headers: headers(cfg),
      body: JSON.stringify({
        message, content, branch: cfg.branch,
        ...(currentSha ? { sha: currentSha } : {}),
      }),
    });

    // Sempre busca SHA fresco com cache-busting para evitar SHA desatualizado
    const freshSha = (await fetchFreshSha(cfg, path)) ?? sha;

    let res = await doPut(freshSha);

    // Em conflito, busca SHA novamente e tenta mais uma vez
    if (res.status === 409 || res.status === 422) {
      const retrySha = (await fetchFreshSha(cfg, path)) ?? freshSha;
      res = await doPut(retrySha);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `GitHub ${res.status}`);
    }

    const newSha: string = (await res.json()).content.sha;
    localStorage.setItem(cacheKey(path), JSON.stringify({ lista: data, sha: newSha }));
    return newSha;
  }

  async uploadFile(path: string, base64Content: string, message: string): Promise<string> {
    const cfg = getConfig();
    if (!cfg) throw new Error('GitHub não configurado.');

    let sha: string | undefined;
    try {
      const check = await fetch(apiBase(cfg, path), { headers: headers(cfg) });
      if (check.ok) sha = (await check.json()).sha;
    } catch { /* arquivo novo */ }

    const body: Record<string, unknown> = { message, content: base64Content, branch: cfg.branch };
    if (sha) body.sha = sha;

    const res = await fetch(apiBaseNoRef(cfg, path), {
      method: 'PUT',
      headers: headers(cfg),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || `GitHub ${res.status}`);
    }

    return path;
  }

  rawUrl(path: string): string {
    const cfg = getConfig();
    if (!cfg) return '';
    return `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${path}`;
  }

  async testarConexao(): Promise<boolean> {
    const cfg = getConfig();
    if (!cfg) return false;
    try {
      const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`, {
        headers: { Authorization: `token ${cfg.token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const dataService = new GitHubDataService();
