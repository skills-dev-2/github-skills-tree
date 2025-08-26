/**
 * Persistent caching system using localStorage with cross-tab/session support
 * 
 * This cache system works across browser sessions and tabs by storing data in localStorage.
 * It provides configurable TTL support and automatic cleanup of expired entries.
 */

import { logger } from './console-logger';

interface PersistentCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: number; // Cache version for invalidation
}

interface CacheConfig {
  exerciseTtlHours: number;
  reactionsTtlMinutes: number;
  rateLimitTtlMinutes: number;
  generalTtlMinutes: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  exerciseTtlHours: 24,        // Exercises change rarely - cache for 24 hours
  reactionsTtlMinutes: 30,     // Reactions change more frequently - 30 minutes
  rateLimitTtlMinutes: 1,      // Rate limits should be fresh - 1 minute
  generalTtlMinutes: 60        // General content - 60 minutes
};

/**
 * Persistent cache implementation using localStorage
 */
class PersistentCache {
  private static readonly CACHE_PREFIX = 'skills-tree-cache:';
  private static readonly CONFIG_KEY = 'skills-tree-cache-config';
  private static readonly CACHE_VERSION = 1;
  
  private config: CacheConfig;

  constructor() {
    this.config = this.loadConfig();
    this.setupCleanupTimer();
  }

  /**
   * Load cache configuration from storage or use defaults
   */
  private loadConfig(): CacheConfig {
    try {
      const stored = localStorage.getItem(PersistentCache.CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_CACHE_CONFIG, ...parsed };
      }
    } catch (error) {
      logger.error('Failed to load cache config, using defaults', error);
    }
    return DEFAULT_CACHE_CONFIG;
  }

  /**
   * Save cache configuration to storage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(PersistentCache.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      logger.error('Failed to save cache config', error);
    }
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    logger.info('Cache config updated', this.config);
  }

  /**
   * Get current cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Generate cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${PersistentCache.CACHE_PREFIX}${key}`;
  }

  /**
   * Get TTL in milliseconds based on data type
   */
  private getTtlMs(dataType: 'exercises' | 'reactions' | 'rateLimits' | 'general'): number {
    switch (dataType) {
      case 'exercises':
        return this.config.exerciseTtlHours * 60 * 60 * 1000;
      case 'reactions':
        return this.config.reactionsTtlMinutes * 60 * 1000;
      case 'rateLimits':
        return this.config.rateLimitTtlMinutes * 60 * 1000;
      case 'general':
        return this.config.generalTtlMinutes * 60 * 1000;
      default:
        return this.config.generalTtlMinutes * 60 * 1000;
    }
  }

  /**
   * Set a value in the cache with specified data type for automatic TTL
   */
  set<T>(key: string, value: T, dataType: 'exercises' | 'reactions' | 'rateLimits' | 'general' = 'general'): void {
    try {
      const entry: PersistentCacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: this.getTtlMs(dataType),
        version: PersistentCache.CACHE_VERSION
      };
      
      const cacheKey = this.getCacheKey(key);
      localStorage.setItem(cacheKey, JSON.stringify(entry));
      
      logger.debug(`Cache SET: ${key} (${dataType}, TTL: ${this.getTtlMs(dataType) / (60 * 1000)}min)`);
    } catch (error) {
      logger.error(`Failed to cache key: ${key}`, error);
      // If localStorage is full or unavailable, continue silently
    }
  }

  /**
   * Get a value from the cache if it's not expired
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const stored = localStorage.getItem(cacheKey);
      
      if (!stored) {
        return null;
      }

      const entry: PersistentCacheEntry<T> = JSON.parse(stored);
      
      // Check version compatibility
      if (entry.version !== PersistentCache.CACHE_VERSION) {
        localStorage.removeItem(cacheKey);
        logger.debug(`Cache MISS: ${key} (version mismatch)`);
        return null;
      }

      // Check if the entry has expired
      const now = Date.now();
      const isExpired = (now - entry.timestamp) > entry.ttl;
      
      if (isExpired) {
        localStorage.removeItem(cacheKey);
        logger.debug(`Cache MISS: ${key} (expired)`);
        return null;
      }

      logger.debug(`Cache HIT: ${key} (age: ${Math.round((now - entry.timestamp) / (60 * 1000))}min)`);
      return entry.data;
    } catch (error) {
      logger.error(`Failed to retrieve cached key: ${key}`, error);
      return null;
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
      logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete cached key: ${key}`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(PersistentCache.CACHE_PREFIX));
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      logger.info(`Cache cleared: ${cacheKeys.length} entries removed`);
    } catch (error) {
      logger.error('Failed to clear cache', error);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): { cleaned: number; remaining: number } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(PersistentCache.CACHE_PREFIX));
      
      let cleaned = 0;
      const now = Date.now();

      cacheKeys.forEach(cacheKey => {
        if (cacheKey === PersistentCache.CONFIG_KEY) return; // Skip config key
        
        try {
          const stored = localStorage.getItem(cacheKey);
          if (stored) {
            const entry: PersistentCacheEntry<any> = JSON.parse(stored);
            
            // Remove if expired or wrong version
            if (entry.version !== PersistentCache.CACHE_VERSION || 
                (now - entry.timestamp) > entry.ttl) {
              localStorage.removeItem(cacheKey);
              cleaned++;
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(cacheKey);
          cleaned++;
        }
      });

      const remaining = cacheKeys.length - cleaned - 1; // -1 for config key
      return { cleaned, remaining };
    } catch (error) {
      logger.error('Failed to cleanup cache', error);
      return { cleaned: 0, remaining: 0 };
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { totalSize: number; entryCount: number; oldestEntry: Date | null; newestEntry: Date | null } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(PersistentCache.CACHE_PREFIX) && key !== PersistentCache.CONFIG_KEY);
      
      let totalSize = 0;
      let oldestTimestamp = Number.MAX_SAFE_INTEGER;
      let newestTimestamp = 0;
      let validEntries = 0;

      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const entry: PersistentCacheEntry<any> = JSON.parse(value);
            if (entry.timestamp) {
              oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
              newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
              validEntries++;
            }
          } catch (error) {
            // Skip invalid entries
          }
        }
      });

      return {
        totalSize,
        entryCount: validEntries,
        oldestEntry: validEntries > 0 ? new Date(oldestTimestamp) : null,
        newestEntry: validEntries > 0 ? new Date(newestTimestamp) : null
      };
    } catch (error) {
      logger.error('Failed to get cache stats', error);
      return { totalSize: 0, entryCount: 0, oldestEntry: null, newestEntry: null };
    }
  }

  /**
   * Setup automatic cleanup timer
   */
  private setupCleanupTimer(): void {
    // Cleanup expired entries every 15 minutes
    setInterval(() => {
      const { cleaned, remaining } = this.cleanup();
      if (cleaned > 0 || logger.getLevel() === 'debug') {
        logger.debug(`Cache cleanup: ${cleaned} expired entries removed, ${remaining} entries remaining`);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }
}

// Export singleton instance
export const persistentCache = new PersistentCache();

/**
 * Helper function to create a cache key from multiple parts
 */
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.map(part => String(part)).join(':');
}

/**
 * Wrapper function for cached fetch operations with enhanced logging
 */
export async function cachedPersistentFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  dataType: 'exercises' | 'reactions' | 'rateLimits' | 'general' = 'general'
): Promise<T> {
  // Try to get from cache first
  const cached = persistentCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Not in cache, fetch the data
  logger.debug(`Cache miss: ${cacheKey}, fetching data...`);
  try {
    const result = await fetcher();
    persistentCache.set(cacheKey, result, dataType);
    return result;
  } catch (error) {
    // Don't cache errors, but log them
    logger.error(`Fetch failed for cache key: ${cacheKey}`, error);
    throw error;
  }
}