import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

type CombinedDay = { date: string; count: number };

type GetCombinedParams = {
  githubLogin: string;
  gitlabUserId: string | number;
  gitlabBaseUrl?: string;
  daysBack?: number;
  ttlMs?: number;
  includeGitLab?: boolean;
  includeGitHub?: boolean;
};

type RepoItem = {
  name: string;
  url: string;
  updated_at: string;
  language?: string | null;
  source: 'github' | 'gitlab';
};

@Injectable()
export class GitCalendarService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GitCalendarService.name);
  private warmTimer: NodeJS.Timeout | null = null;
  private warmInFlight = false;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.logger.debug('Git Calendar Init');
    this.startWarmLoop();
  }

  onModuleDestroy() {
    if (this.warmTimer) clearInterval(this.warmTimer);
    this.warmTimer = null;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Warm loop: PROACTIVE refresh (network happens here, not on request path)
  // ────────────────────────────────────────────────────────────────────────────

  private startWarmLoop() {
    const intervalMs = 5 * 60 * 1000; // 5 min
    const safeIntervalMs =
      Number.isFinite(intervalMs) && intervalMs >= 30_000
        ? intervalMs
        : 300_000;

    // Warm once immediately (fire and forget)
    void this.warmCacheOnce('startup');

    this.warmTimer = setInterval(() => {
      void this.warmCacheOnce('interval');
    }, safeIntervalMs);

    this.logger.log(`Cache warmer enabled. intervalMs=${safeIntervalMs}`);
  }

  private async warmCacheOnce(reason: 'startup' | 'interval') {
    if (this.warmInFlight) {
      this.logger.debug(`Warm skipped (${reason}) — already running`);
      return;
    }

    const githubLogin = this.config.get<string>('GITHUB_LOGIN') ?? '';
    const gitlabUserIdRaw = this.config.get<string>('GITLAB_USER_ID') ?? '';
    const gitlabBaseUrl =
      this.config.get<string>('GITLAB_BASE_URL') ?? 'https://gitlab.com';

    if (!githubLogin && !gitlabUserIdRaw) {
      this.logger.warn(
        'Warm skipped — missing GITHUB_LOGIN and GITLAB_USER_ID',
      );
      return;
    }

    const daysBack = 189;
    const repoLimit = 5;

    // IMPORTANT:
    // refresh TTL should be > warm interval so you don't expire between refreshes
    const ttlMs = 15 * 60 * 1000; // 15 min

    this.warmInFlight = true;
    const t0 = Date.now();

    try {
      await Promise.all([
        this.refreshCombinedCalendarBlocking({
          githubLogin,
          gitlabUserId: gitlabUserIdRaw,
          gitlabBaseUrl,
          daysBack,
          ttlMs,
        }),
        this.refreshTopReposBlocking({
          githubLogin,
          gitlabUserId: gitlabUserIdRaw,
          gitlabBaseUrl,
          limit: repoLimit,
          ttlMs,
        }),
      ]);

      this.logger.debug(`Warm ok (${reason}) in ${Date.now() - t0}ms`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Warm failed (${reason}): ${msg}`);
    } finally {
      this.warmInFlight = false;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Request-path getters: READ-ONLY cache (never hit network)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Public API: merged contributions per day (date asc).
   * NEVER hits GitHub/GitLab on a request. Reads cache only.
   */
  async getCombinedCalendar(params: GetCombinedParams): Promise<{
    lastUpdated: Date;
    data: CombinedDay[];
  } | null> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      daysBack = 371,
      includeGitLab = true,
      includeGitHub = true,
    } = params;

    if (!includeGitHub && !includeGitLab) return null;

    const baseKey = this.buildCacheKey({
      githubLogin,
      gitlabUserId: String(gitlabUserId),
      gitlabBaseUrl,
      daysBack,
      includeGitLab,
      includeGitHub,
    });

    const fresh = await this.cache.get<{
      lastUpdated: Date;
      data: CombinedDay[];
    }>(`${baseKey}:fresh`);
    if (fresh) return fresh;

    const stale = await this.cache.get<{
      lastUpdated: Date;
      data: CombinedDay[];
    }>(`${baseKey}:stale`);

    return stale ?? null;
  }

  /**
   * Public API: top repos.
   * NEVER hits GitHub/GitLab on a request. Reads cache only.
   */
  async getTopRepos(params: {
    githubLogin: string;
    gitlabUserId: string | number;
    gitlabBaseUrl?: string;
    limit?: number;
    includeGitHub?: boolean;
    includeGitLab?: boolean;
  }): Promise<{
    lastUpdated: Date;
    data: RepoItem[];
  }> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      limit = 5,
      includeGitHub = true,
      includeGitLab = true,
    } = params;

    const baseKey = this.buildRepoCacheKey({
      githubLogin,
      gitlabUserId: String(gitlabUserId),
      gitlabBaseUrl,
      limit,
      includeGitHub,
      includeGitLab,
    });

    const fresh = await this.cache.get<{ lastUpdated: Date; data: RepoItem[] }>(
      `${baseKey}:fresh`,
    );
    if (fresh) return fresh;

    const stale = await this.cache.get<{ lastUpdated: Date; data: RepoItem[] }>(
      `${baseKey}:stale`,
    );

    // always return an object to keep controller/template simple
    return (
      stale ?? {
        lastUpdated: new Date(0),
        data: [],
      }
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Blocking refresh (used by warmer/admin endpoints). Network happens here.
  // ────────────────────────────────────────────────────────────────────────────

  async refreshCombinedCalendarBlocking(params: GetCombinedParams): Promise<{
    lastUpdated: Date;
    data: CombinedDay[];
  } | null> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      daysBack = 371,
      ttlMs = 15 * 60 * 1000,
      includeGitLab = true,
      includeGitHub = true,
    } = params;

    if (!includeGitHub && !includeGitLab) return null;

    const baseKey = this.buildCacheKey({
      githubLogin,
      gitlabUserId: String(gitlabUserId),
      gitlabBaseUrl,
      daysBack,
      includeGitLab,
      includeGitHub,
    });

    // Compute time window
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (daysBack - 1));

    const after = start.toISOString().slice(0, 10);
    const before = end.toISOString().slice(0, 10);

    const [ghMap, glMap] = await Promise.all([
      includeGitHub
        ? this.fetchGitHubCalendarMap(githubLogin)
        : Promise.resolve(new Map<string, number>()),
      includeGitLab
        ? this.fetchGitLabCountsMap({
            gitlabBaseUrl,
            gitlabUserId,
            after,
            before,
          })
        : Promise.resolve(new Map<string, number>()),
    ]);

    const merged: CombinedDay[] = [];
    for (let i = 0; i < daysBack; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = d.toISOString().slice(0, 10);

      const count = (ghMap.get(date) ?? 0) + (glMap.get(date) ?? 0);
      merged.push({ date, count });
    }

    const res = { lastUpdated: new Date(), data: merged };

    // fresh: normal TTL
    await this.cache.set(`${baseKey}:fresh`, res, ttlMs);

    // stale: long TTL to survive refresh failures
    const staleTtlMs = Math.max(ttlMs * 10, 6 * 60 * 60 * 1000);
    await this.cache.set(`${baseKey}:stale`, res, staleTtlMs);

    return res;
  }

  async refreshTopReposBlocking(params: {
    githubLogin: string;
    gitlabUserId: string | number;
    gitlabBaseUrl?: string;
    limit?: number;
    ttlMs?: number;
    includeGitHub?: boolean;
    includeGitLab?: boolean;
  }): Promise<{ lastUpdated: Date; data: RepoItem[] }> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      limit = 5,
      ttlMs = 15 * 60 * 1000,
      includeGitHub = true,
      includeGitLab = true,
    } = params;

    const baseKey = this.buildRepoCacheKey({
      githubLogin,
      gitlabUserId: String(gitlabUserId),
      gitlabBaseUrl,
      limit,
      includeGitHub,
      includeGitLab,
    });

    const [gh, gl] = await Promise.all([
      includeGitHub
        ? this.fetchGitHubTopRepos(githubLogin, limit)
        : Promise.resolve([]),
      // TODO if you want GitLab repos later
      Promise.resolve([] as RepoItem[]),
    ]);

    const merged = [...gh, ...gl].sort((a, b) => {
      const da = Date.parse(a.updated_at);
      const db = Date.parse(b.updated_at);
      return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da);
    });

    const res = { lastUpdated: new Date(), data: merged.slice(0, limit) };

    await this.cache.set(`${baseKey}:fresh`, res, ttlMs);

    const staleTtlMs = Math.max(ttlMs * 10, 6 * 60 * 60 * 1000);
    await this.cache.set(`${baseKey}:stale`, res, staleTtlMs);

    return res;
  }

  /**
   * Optional: "admin force refresh" that clears cache then repopulates.
   */
  async clearAndRefreshCombinedCalendarBlocking(
    params: GetCombinedParams,
  ): Promise<{ lastUpdated: Date; data: CombinedDay[] } | null> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      daysBack = 371,
      includeGitLab = true,
      includeGitHub = true,
    } = params;

    const baseKey = this.buildCacheKey({
      githubLogin,
      gitlabUserId: String(gitlabUserId),
      gitlabBaseUrl,
      daysBack,
      includeGitLab,
      includeGitHub,
    });

    await Promise.all([
      this.cache.del(`${baseKey}:fresh`),
      this.cache.del(`${baseKey}:stale`),
    ]);

    return this.refreshCombinedCalendarBlocking(params);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Network helpers with hard timeouts
  // ────────────────────────────────────────────────────────────────────────────

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GitHub (GraphQL)
  // ────────────────────────────────────────────────────────────────────────────

  private readonly ghQuery = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  private async fetchGitHubCalendarMap(
    login: string,
  ): Promise<Map<string, number>> {
    const token = this.config.get<string>('GITHUB_TOKEN');
    if (!token) {
      this.logger.warn(
        'GITHUB_TOKEN missing; GitHub contributions will be empty.',
      );
      return new Map();
    }

    let resp: Response;
    try {
      resp = await this.fetchWithTimeout(
        'https://api.github.com/graphql',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: this.ghQuery,
            variables: { login },
          }),
        },
        20000,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `GitHub GraphQL request failed (timeout/network): ${msg}`,
      );
      return new Map();
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      this.logger.warn(
        `GitHub GraphQL failed (${resp.status}): ${text.slice(0, 300)}`,
      );
      return new Map();
    }

    type GhContributionDay = { date: string; contributionCount: number };
    type GhResponse = {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              weeks?: Array<{ contributionDays?: GhContributionDay[] }>;
            };
          };
        };
      };
      errors?: Array<{ message?: string }>;
    };

    const jsonUnknown = (await resp.json()) as unknown;
    if (typeof jsonUnknown !== 'object' || jsonUnknown === null) {
      this.logger.warn('GitHub response was not an object');
      return new Map();
    }

    const json = jsonUnknown as GhResponse;

    if (Array.isArray(json.errors) && json.errors.length) {
      const first = json.errors[0]?.message ?? 'Unknown GitHub GraphQL error';
      this.logger.warn(`GitHub GraphQL errors: ${first}`);
    }

    const weeks =
      json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ??
      [];
    const days = weeks.flatMap((w) => w.contributionDays ?? []);

    const map = new Map<string, number>();
    for (const d of days) {
      if (!d?.date) continue;
      map.set(d.date, Number(d.contributionCount ?? 0));
    }
    return map;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GitLab (Events API)
  // ────────────────────────────────────────────────────────────────────────────

  private async fetchGitLabCountsMap(args: {
    gitlabBaseUrl: string;
    gitlabUserId: string | number;
    after: string;
    before: string;
  }): Promise<Map<string, number>> {
    const token = this.config.get<string>('GITLAB_TOKEN');
    if (!token) {
      this.logger.warn(
        'GITLAB_TOKEN missing; GitLab contributions will be empty.',
      );
      return new Map();
    }

    const { gitlabBaseUrl, gitlabUserId, after, before } = args;

    const map = new Map<string, number>();
    const perPage = 100;
    let page = 1;

    const maxPages = 100;

    while (true) {
      if (page > maxPages) break;

      const url = new URL(
        `${gitlabBaseUrl.replace(/\/$/, '')}/api/v4/users/${gitlabUserId}/events`,
      );
      url.searchParams.set('after', after);
      url.searchParams.set('before', before);
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));

      let resp: Response;
      try {
        resp = await this.fetchWithTimeout(
          url,
          {
            headers: {
              'PRIVATE-TOKEN': token,
            },
          },
          20000,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`GitLab request failed (timeout/network): ${msg}`);
        break;
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        this.logger.warn(
          `GitLab events failed (${resp.status}): ${text.slice(0, 300)}`,
        );
        break;
      }

      const events = (await resp.json()) as Array<{ created_at?: string }>;
      for (const e of events) {
        const day = (e.created_at ?? '').slice(0, 10);
        if (!day) continue;
        map.set(day, (map.get(day) ?? 0) + 1);
      }

      const next = resp.headers.get('x-next-page');
      if (!next) break;

      const nextPage = Number(next);
      if (!Number.isFinite(nextPage) || nextPage <= 0) break;
      page = nextPage;
    }

    return map;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GitHub Repos (REST)
  // ────────────────────────────────────────────────────────────────────────────

  private async fetchGitHubTopRepos(
    login: string,
    limit: number,
  ): Promise<RepoItem[]> {
    const token = this.config.get<string>('GITHUB_TOKEN');
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const url = new URL(
      `https://api.github.com/users/${encodeURIComponent(login)}/repos`,
    );
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('direction', 'desc');
    url.searchParams.set('per_page', String(Math.min(limit, 100)));

    let resp: Response;
    try {
      resp = await this.fetchWithTimeout(url, { headers }, 15000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`GitHub repos request failed (timeout/network): ${msg}`);
      return [];
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      this.logger.warn(
        `GitHub repos failed (${resp.status}): ${text.slice(0, 200)}`,
      );
      return [];
    }

    const raw = (await resp.json()) as unknown;
    if (!Array.isArray(raw)) return [];

    return raw
      .map((r): RepoItem | null => {
        if (typeof r !== 'object' || r === null) return null;
        const o = r as Record<string, unknown>;

        const name = typeof o.name === 'string' ? o.name : null;
        const urlStr = typeof o.html_url === 'string' ? o.html_url : null;
        const updatedAt =
          typeof o.updated_at === 'string' ? o.updated_at : null;
        const language = typeof o.language === 'string' ? o.language : null;

        if (!name || !urlStr || !updatedAt) return null;

        return {
          name,
          url: urlStr,
          updated_at: updatedAt,
          language,
          source: 'github',
        };
      })
      .filter((v): v is RepoItem => v != null)
      .slice(0, limit);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Cache key helpers
  // ────────────────────────────────────────────────────────────────────────────

  private buildCacheKey(x: {
    githubLogin: string;
    gitlabUserId: string;
    gitlabBaseUrl: string;
    daysBack: number;
    includeGitLab: boolean;
    includeGitHub: boolean;
  }): string {
    return [
      'gitcal:v3',
      `gh=${x.includeGitHub ? x.githubLogin : 'off'}`,
      `gl=${x.includeGitLab ? x.gitlabUserId : 'off'}`,
      `base=${x.gitlabBaseUrl}`,
      `days=${x.daysBack}`,
    ].join('|');
  }

  private buildRepoCacheKey(x: {
    githubLogin: string;
    gitlabUserId: string;
    gitlabBaseUrl: string;
    limit: number;
    includeGitLab: boolean;
    includeGitHub: boolean;
  }): string {
    return [
      'gitcal:v3:repos',
      `gh=${x.includeGitHub ? x.githubLogin : 'off'}`,
      `gl=${x.includeGitLab ? x.gitlabUserId : 'off'}`,
      `base=${x.gitlabBaseUrl}`,
      `limit=${x.limit}`,
    ].join('|');
  }
}
