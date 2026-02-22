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
  gitlabUserId: string | number; // numeric user id is safest for GitLab
  gitlabBaseUrl?: string; // allow override per-call
  daysBack?: number; // default 371 to match ~53 weeks
  ttlMs?: number;
  includeGitLab?: boolean; // disable GL easily
  includeGitHub?: boolean; // disable GH easily
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

  private startWarmLoop() {
    const intervalMs = 300000;
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
    const gitlabUserId = this.config.get<string>('GITLAB_USER_ID') ?? '';
    const gitlabBaseUrl =
      this.config.get<string>('GITLAB_BASE_URL') ?? 'https://gitlab.com';

    if (!githubLogin && !gitlabUserId) {
      this.logger.warn(
        'Warm skipped — missing GITHUB_LOGIN and GITLAB_USER_ID',
      );
      return;
    }

    const daysBack = 371;
    const repoLimit = 5;

    this.warmInFlight = true;
    const t0 = Date.now();

    try {
      await Promise.all([
        this.getCombinedCalendar({
          githubLogin,
          gitlabUserId,
          gitlabBaseUrl,
          daysBack: Number.isFinite(daysBack) ? daysBack : 371,
          ttlMs: 30 * 60 * 1000,
        }),
        this.getTopRepos({
          githubLogin,
          gitlabUserId,
          gitlabBaseUrl,
          limit: Number.isFinite(repoLimit) ? repoLimit : 5,
          ttlMs: 30 * 60 * 1000,
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

  /**
   * Public API: returns merged contributions per day (date asc).
   * Cached by params (login, gitlab user, daysBack, baseUrl).
   */
  async getCombinedCalendar(params: GetCombinedParams): Promise<CombinedDay[]> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      daysBack = 371,
      ttlMs = 30 * 60 * 1000,
      includeGitLab = true,
      includeGitHub = true,
    } = params;

    if (!includeGitHub && !includeGitLab) return [];

    const cacheKey = this.buildCacheKey({
      githubLogin,
      gitlabUserId: String(gitlabUserId),
      gitlabBaseUrl,
      daysBack,
      includeGitLab,
      includeGitHub,
    });

    const cached = await this.cache.get<CombinedDay[]>(cacheKey);
    if (cached?.length) {
      return cached;
    }

    // Compute time window
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (daysBack - 1));

    const after = start.toISOString().slice(0, 10);
    const before = end.toISOString().slice(0, 10);

    // Fetch both in parallel (as allowed by toggles)
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

    // Merge into a continuous list of days (stable ordering)
    const merged: CombinedDay[] = [];
    for (let i = 0; i < daysBack; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = d.toISOString().slice(0, 10);

      const count = (ghMap.get(date) ?? 0) + (glMap.get(date) ?? 0);
      merged.push({ date, count });
    }

    await this.cache.set(cacheKey, merged, ttlMs);
    return merged;
  }

  /**
   * call this from a controller to force-refresh.
   */
  async refreshCombinedCalendar(
    params: GetCombinedParams,
  ): Promise<CombinedDay[]> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      daysBack = 371,
      includeGitLab = true,
      includeGitHub = true,
    } = params;

    const cacheKey = this.buildCacheKey({
      githubLogin,
      gitlabUserId: String(gitlabUserId),
      gitlabBaseUrl,
      daysBack,
      includeGitLab,
      includeGitHub,
    });

    await this.cache.del(cacheKey);
    return this.getCombinedCalendar(params);
  }

  // -------------------------
  // GitHub (GraphQL)
  // -------------------------

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

    const resp = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: this.ghQuery,
        variables: { login },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      this.logger.warn(
        `GitHub GraphQL failed (${resp.status}): ${text.slice(0, 300)}`,
      );
      return new Map();
    }

    type GhContributionDay = {
      date: string;
      contributionCount: number;
    };

    type GhResponse = {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              weeks?: Array<{
                contributionDays?: GhContributionDay[];
              }>;
            };
          };
        };
      };
      errors?: Array<{ message?: string }>;
    };

    function isGhResponse(x: unknown): x is GhResponse {
      return typeof x === 'object' && x !== null;
    }

    const jsonUnknown = (await resp.json()) as unknown;

    if (!isGhResponse(jsonUnknown)) {
      this.logger.warn('GitHub response was not an object');
      return new Map<string, number>();
    }

    const weeks =
      jsonUnknown.data?.user?.contributionsCollection?.contributionCalendar
        ?.weeks ?? [];
    const days = weeks.flatMap((w) => w.contributionDays ?? []);

    const map = new Map<string, number>();
    for (const d of days) {
      if (!d?.date) continue;
      map.set(d.date, Number(d.contributionCount ?? 0));
    }
    return map;
  }

  // -------------------------
  // GitLab (Events API)
  // -------------------------

  private async fetchGitLabCountsMap(args: {
    gitlabBaseUrl: string;
    gitlabUserId: string | number;
    after: string; // YYYY-MM-DD
    before: string; // YYYY-MM-DD
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

    // GitLab pagination via X-Next-Page header (preferred)
    while (true) {
      const url = new URL(
        `${gitlabBaseUrl.replace(/\/$/, '')}/api/v4/users/${gitlabUserId}/events`,
      );
      url.searchParams.set('after', after);
      url.searchParams.set('before', before);
      url.searchParams.set('per_page', String(perPage));
      url.searchParams.set('page', String(page));

      const resp = await fetch(url, {
        headers: {
          // GitLab supports PRIVATE-TOKEN, or Authorization: Bearer <token> for OAuth tokens.
          'PRIVATE-TOKEN': token,
        },
      });

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

      page = Number(next);
      if (!Number.isFinite(page) || page <= 0) break;
    }

    return map;
  }

  // -------------------------
  // Cache key helper
  // -------------------------

  private buildCacheKey(x: {
    githubLogin: string;
    gitlabUserId: string;
    gitlabBaseUrl: string;
    daysBack: number;
    includeGitLab: boolean;
    includeGitHub: boolean;
  }): string {
    return [
      'gitcal:v1',
      `gh=${x.includeGitHub ? x.githubLogin : 'off'}`,
      `gl=${x.includeGitLab ? x.gitlabUserId : 'off'}`,
      `base=${x.gitlabBaseUrl}`,
      `days=${x.daysBack}`,
    ].join('|');
  }

  async getTopRepos(params: {
    githubLogin: string;
    gitlabUserId: string | number;
    gitlabBaseUrl?: string;
    limit?: number; // default 5
    ttlMs?: number; // default 30 min
    includeGitHub?: boolean;
    includeGitLab?: boolean;
  }): Promise<RepoItem[]> {
    const {
      githubLogin,
      gitlabUserId,
      gitlabBaseUrl = this.config.get<string>('GITLAB_BASE_URL') ??
        'https://gitlab.com',
      limit = 5,
      ttlMs = 30 * 60 * 1000,
      includeGitHub = true,
      includeGitLab = true,
    } = params;

    const cacheKey = [
      'gitcal:v1:repos',
      `gh=${includeGitHub ? githubLogin : 'off'}`,
      `gl=${includeGitLab ? String(gitlabUserId) : 'off'}`,
      `base=${gitlabBaseUrl}`,
      `limit=${limit}`,
    ].join('|');

    const cached = await this.cache.get<RepoItem[]>(cacheKey);
    if (cached?.length) return cached;

    const [gh, gl] = await Promise.all([
      includeGitHub
        ? this.fetchGitHubTopRepos(githubLogin, limit)
        : Promise.resolve([]),
      Promise.resolve([]),
    ]);

    // Merge + sort by updated_at desc
    const merged = [...gh, ...gl].sort((a, b) => {
      const da = Date.parse(a.updated_at);
      const db = Date.parse(b.updated_at);
      return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da);
    });

    const result = merged.slice(0, limit);
    await this.cache.set(cacheKey, result, ttlMs);
    return result;
  }

  private async fetchGitHubTopRepos(
    login: string,
    limit: number,
  ): Promise<RepoItem[]> {
    const token = this.config.get<string>('GITHUB_TOKEN');
    // GitHub REST can work without token for public repos, but token helps with rate limits.
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const url = new URL(
      `https://api.github.com/users/${encodeURIComponent(login)}/repos`,
    );
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('direction', 'desc');
    url.searchParams.set('per_page', String(Math.min(limit, 100)));

    const resp = await fetch(url, { headers });
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
        const url = typeof o.html_url === 'string' ? o.html_url : null;
        const updatedAt =
          typeof o.updated_at === 'string' ? o.updated_at : null;
        const language = typeof o.language === 'string' ? o.language : null;

        if (!name || !url || !updatedAt) return null;

        return {
          name,
          url,
          updated_at: updatedAt,
          language,
          source: 'github',
        };
      })
      .filter((v) => v != null)
      .slice(0, limit);
  }
}
