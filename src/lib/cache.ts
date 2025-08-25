/**
 * GitHub API Response Caching System
 * 
 * Provides in-memory caching with TTL support to reduce API calls and improve performance.
 * Automatically cleans up expired entries to prevent memory leaks.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * In-memory cache implementation with automatic cleanup
 */

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set a value in the cache with a TTL
   */
  set<T>(key: string, value: T, ttlMinutes: number = 60): void {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000 // Convert minutes to milliseconds
    };
    this.cache.set(key, entry);
  }

  /**
   * Get a value from the cache if it's not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if the entry has expired
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
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
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const isExpired = (now - entry.timestamp) > entry.ttl;
      if (isExpired) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cache = new MemoryCache();

// Cleanup expired entries every 30 minutes and log the results
setInterval(() => {
  const statsBefore = cache.getStats();
  cache.cleanup();
  const statsAfter = cache.getStats();
  const cleaned = statsBefore.size - statsAfter.size;
  
  console.group('🧹 Cache Cleanup Completed');
  console.log(`📊 Cleaned ${cleaned} expired entries`);
  console.log(`📈 Current cache size: ${statsAfter.size} entries`);
  console.log(`🔑 Active cache keys:`, statsAfter.keys.slice(0, 5).concat(
    statsAfter.keys.length > 5 ? [`...and ${statsAfter.keys.length - 5} more`] : []
  ));
  console.groupEnd();
}, 30 * 60 * 1000);

/**
 * Helper function to create a cache key from multiple parts
 */
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.map(part => String(part)).join(':');
}

/**
 * Wrapper function for cached fetch operations with enhanced logging
 */
export async function cachedFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 60
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(cacheKey);
  if (cached !== null) {
    console.log(`📦 Cache HIT for: ${cacheKey} (TTL: ${ttlMinutes}min)`);
    return cached;
  }

  // Not in cache, fetch the data
  console.log(`🔄 Cache MISS for: ${cacheKey}, fetching data...`);
  try {
    const result = await fetcher();
    cache.set(cacheKey, result, ttlMinutes);
    console.log(`💾 Cached result for: ${cacheKey} (TTL: ${ttlMinutes}min)`);
    return result;
  } catch (error) {
    // Don't cache errors, but log them with more detail
    console.error(`❌ Fetch FAILED for cache key: ${cacheKey}`, error);
    throw error;
  }
}