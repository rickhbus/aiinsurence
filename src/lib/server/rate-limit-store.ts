export type RateLimitIncrement = {
  count: number;
  resetAt: number;
};

// Keep this interface narrow so a future Vercel Firewall, Edge Config, or
// managed rate-limit adapter can plug in without changing route code.
export type RateLimitStore = {
  name: "memory" | "redis";
  increment(key: string, windowMs: number): Promise<RateLimitIncrement>;
};

type MemoryEntry = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & {
  __healthRateLimitMemoryStore?: MemoryRateLimitStore;
  __healthRateLimitConfiguredStore?: RateLimitStore;
};

export class MemoryRateLimitStore implements RateLimitStore {
  name = "memory" as const;
  private entries = new Map<string, MemoryEntry>();

  async increment(key: string, windowMs: number): Promise<RateLimitIncrement> {
    const now = Date.now();
    const existing = this.entries.get(key);

    if (!existing || existing.resetAt <= now) {
      const entry = { count: 1, resetAt: now + windowMs };
      this.entries.set(key, entry);
      return { ...entry };
    }

    existing.count += 1;
    this.entries.set(key, existing);

    return { ...existing };
  }

  clear() {
    this.entries.clear();
  }
}

export class RedisRateLimitStore implements RateLimitStore {
  name = "redis" as const;

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fallback: RateLimitStore = getMemoryRateLimitStore(),
  ) {}

  async increment(key: string, windowMs: number): Promise<RateLimitIncrement> {
    try {
      const encodedKey = encodeURIComponent(key);
      const countResponse = await fetch(`${this.url.replace(/\/$/, "")}/incr/${encodedKey}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      });

      if (!countResponse.ok) {
        throw new Error(`Redis rate-limit increment failed: ${countResponse.status}`);
      }

      const payload = (await countResponse.json()) as { result?: number | string };
      const count = Number(payload.result);
      const safeCount = Number.isFinite(count) ? count : 1;
      let ttlMs = windowMs;

      if (safeCount === 1) {
        await fetch(
          `${this.url.replace(/\/$/, "")}/pexpire/${encodedKey}/${Math.max(1, windowMs)}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
            cache: "no-store",
          },
        ).catch(() => undefined);
      } else {
        ttlMs = await this.readTtlMs(encodedKey, windowMs);
      }

      return {
        count: safeCount,
        resetAt: Date.now() + ttlMs,
      };
    } catch {
      return this.fallback.increment(key, windowMs);
    }
  }

  private async readTtlMs(encodedKey: string, fallbackWindowMs: number) {
    try {
      const response = await fetch(`${this.url.replace(/\/$/, "")}/pttl/${encodedKey}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        return fallbackWindowMs;
      }

      const payload = (await response.json()) as { result?: number | string };
      const ttl = Number(payload.result);

      return Number.isFinite(ttl) && ttl > 0 ? ttl : fallbackWindowMs;
    } catch {
      return fallbackWindowMs;
    }
  }
}

export function getMemoryRateLimitStore() {
  globalStore.__healthRateLimitMemoryStore ??= new MemoryRateLimitStore();

  return globalStore.__healthRateLimitMemoryStore;
}

export function getConfiguredRateLimitStore(
  env: Record<string, string | undefined> = process.env,
) {
  const redisUrl = clean(env.UPSTASH_REDIS_REST_URL) || clean(env.REDIS_REST_URL);
  const redisToken =
    clean(env.UPSTASH_REDIS_REST_TOKEN) || clean(env.REDIS_REST_TOKEN);

  if (!redisUrl || !redisToken) {
    return getMemoryRateLimitStore();
  }

  globalStore.__healthRateLimitConfiguredStore ??= new RedisRateLimitStore(
    redisUrl,
    redisToken,
  );

  return globalStore.__healthRateLimitConfiguredStore;
}

export function resetRateLimitStoresForTests() {
  globalStore.__healthRateLimitMemoryStore?.clear();
  delete globalStore.__healthRateLimitConfiguredStore;
}

function clean(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}
