import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ServiceHealth = 'up' | 'degraded' | 'down' | 'unknown';

export interface CatalogRawService {
  id: string;
  name: string;
  visibility?: 'public' | 'private' | 'unknown';
  description?: string | null;
  image?: string | null;
  state?: string | null;
  status?: string | null;
  created?: number | null;
  urls?: string[];
  lanUrls?: string[];
  healthCandidates?: string[];
  health?: string;
  responseTimeMs?: number | null;
  attempts?: number;
  error?: string | null;
  checkedUrl?: string | null;
  labels?: Record<string, any>;
  healthConfig?: { path?: string; port?: number | null };
}

export interface CatalogRawSnapshot {
  generatedAt: string;
  count: number;
  services: CatalogRawService[];
  refresh?: {
    startedAt?: string | null;
    finishedAt?: string | null;
    durationMs?: number | null;
    error?: string | null;
    lanBaseUrl?: string | null;
    refreshIntervalMs?: number | null;
  };
}

export interface HostedService {
  id: string;
  name: string;
  visibility: 'public' | 'private' | 'unknown';
  description: string | null;
  urls: string[];
  lanUrls: string[];
  health: ServiceHealth;
  responseTimeMs: number | null;
  checkedUrl: string | null;
  error: string | null;
}

export interface HostedServicesViewModel {
  generatedAt: string;
  refresh?: CatalogRawSnapshot['refresh'];
  public: HostedService[];
  private: HostedService[];
}

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    // You said use this for now:
    return (
      this.config.get<string>('CATALOG_URL') ||
      'http://10.0.0.151/hh/catalog/services'
    );
  }

  private normalizeHealth(h?: string): ServiceHealth {
    const s = String(h || '').toLowerCase();
    if (s === 'up') return 'up';
    if (s === 'degraded') return 'degraded';
    if (s === 'down') return 'down';
    return 'unknown';
  }

  private async fetchJsonWithTimeout<T>(
    url: string,
    timeoutMs = 2500,
  ): Promise<T> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(t);
    }
  }

  async getHostedServices(): Promise<HostedServicesViewModel> {
    try {
      const snap = await this.fetchJsonWithTimeout<CatalogRawSnapshot>(
        this.baseUrl,
        2500,
      );

      const mapped: HostedService[] = (snap.services || []).map((s) => ({
        id: s.id,
        name: s.name,
        visibility: s.visibility || 'unknown',
        description: s.description ?? null,
        urls: Array.isArray(s.urls) ? s.urls : [],
        lanUrls: Array.isArray(s.lanUrls) ? s.lanUrls : [],
        health: this.normalizeHealth(s.health),
        responseTimeMs:
          typeof s.responseTimeMs === 'number' ? s.responseTimeMs : null,
        checkedUrl: s.checkedUrl ?? null,
        error: s.error ?? null,
      }));

      const pub = mapped
        .filter((x) => x.visibility === 'public')
        .sort((a, b) => a.name.localeCompare(b.name));
      const priv = mapped
        .filter((x) => x.visibility === 'private')
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        generatedAt: snap.generatedAt,
        refresh: snap.refresh,
        public: pub,
        private: priv,
      };
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.warn(`Catalog fetch failed: ${e?.message || e}`);
      // Graceful fallback: render empty lists (UI still loads)
      return {
        generatedAt: new Date().toISOString(),
        public: [],
        private: [],
      };
    }
  }
}
