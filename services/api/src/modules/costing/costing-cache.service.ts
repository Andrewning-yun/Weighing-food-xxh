import { Injectable } from '@nestjs/common';
import { ResolvedConfig } from './costing.service';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface CacheStats {
  resultHits: number;
  resultMisses: number;
  configHits: number;
  configMisses: number;
  resultEntries: number;
  configEntries: number;
  hitRate: number;
}

@Injectable()
export class CostingCacheService {
  private readonly resultCache = new Map<string, CacheEntry<unknown>>();
  private readonly configCache = new Map<string, CacheEntry<ResolvedConfig>>();

  private readonly RESULT_TTL = 5 * 60 * 1000; // 5 min
  private readonly CONFIG_TTL = 5 * 60 * 1000; // 5 min
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1h

  private lastCleanup = Date.now();

  private resultHits = 0;
  private resultMisses = 0;
  private configHits = 0;
  private configMisses = 0;

  getResult<T>(storeId: string, date: string, mealType: string): T | null {
    this.cleanupIfNeeded();
    const key = `${storeId}:${date}:${mealType}`;
    const entry = this.resultCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      this.resultHits++;
      return entry.data as T;
    }
    this.resultMisses++;
    this.resultCache.delete(key);
    return null;
  }

  setResult(storeId: string, date: string, mealType: string, data: unknown): void {
    this.resultCache.set(`${storeId}:${date}:${mealType}`, {
      data,
      expiresAt: Date.now() + this.RESULT_TTL,
    });
  }

  getConfig(storeId: string): ResolvedConfig | null {
    this.cleanupIfNeeded();
    const entry = this.configCache.get(storeId);
    if (entry && entry.expiresAt > Date.now()) {
      this.configHits++;
      return entry.data;
    }
    this.configMisses++;
    this.configCache.delete(storeId);
    return null;
  }

  setConfig(storeId: string, config: ResolvedConfig): void {
    this.configCache.set(storeId, {
      data: config,
      expiresAt: Date.now() + this.CONFIG_TTL,
    });
  }

  invalidateStore(storeId: string): void {
    for (const key of this.resultCache.keys()) {
      if (key.startsWith(`${storeId}:`)) {
        this.resultCache.delete(key);
      }
    }
    this.configCache.delete(storeId);
  }

  invalidateAll(): void {
    this.resultCache.clear();
    this.configCache.clear();
  }

  getStats(): CacheStats {
    const total = this.resultHits + this.resultMisses + this.configHits + this.configMisses;
    const hits = this.resultHits + this.configHits;
    return {
      resultHits: this.resultHits,
      resultMisses: this.resultMisses,
      configHits: this.configHits,
      configMisses: this.configMisses,
      resultEntries: this.resultCache.size,
      configEntries: this.configCache.size,
      hitRate: total > 0 ? Number(((hits / total) * 100).toFixed(1)) : 0,
    };
  }

  private cleanupIfNeeded(): void {
    if (Date.now() - this.lastCleanup < this.CLEANUP_INTERVAL) return;
    this.lastCleanup = Date.now();
    const now = Date.now();
    for (const [key, entry] of this.resultCache) {
      if (entry.expiresAt <= now) this.resultCache.delete(key);
    }
    for (const [key, entry] of this.configCache) {
      if (entry.expiresAt <= now) this.configCache.delete(key);
    }
  }
}
