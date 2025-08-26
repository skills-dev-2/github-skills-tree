/**
 * GitHub API debugging and monitoring utilities
 * 
 * Provides functions to check and monitor GitHub API usage
 */

import { GitHubAPI } from './github-api';
import { persistentCache } from './persistent-cache';
import { logInfo, logError, logDebug } from './console-logger';

/**
 * Check current GitHub API rate limits and log them
 */
export async function checkGitHubRateLimits(): Promise<void> {
  try {
    logDebug('Checking GitHub API rate limits...');
    
    const rateLimitInfo = await GitHubAPI.getRateLimit();
    
    logDebug('Rate limit check completed');
    
  } catch (error) {
    logError('GitHub API rate limit check failed', error);
    logInfo('This might indicate connectivity issues or API problems');
  }
}

/**
 * Log comprehensive GitHub API and cache statistics
 */
export function logGitHubApiStats(): void {
  const cacheStats = persistentCache.getStats();
  
  logInfo('GitHub API & Cache Statistics');
  
  // Cache information
  logDebug(`Cache entries: ${cacheStats.entryCount}`);
  logDebug(`Cache storage: ${(cacheStats.totalSize / 1024).toFixed(1)}KB`);
  
  if (cacheStats.oldestEntry) {
    logDebug(`Oldest entry: ${(cacheStats.oldestEntry instanceof Date ? cacheStats.oldestEntry : new Date(cacheStats.oldestEntry)).toLocaleString()}`);
  }
  if (cacheStats.newestEntry) {
    logDebug(`Newest entry: ${(cacheStats.newestEntry instanceof Date ? cacheStats.newestEntry : new Date(cacheStats.newestEntry)).toLocaleString()}`);
  }
  
  const config = persistentCache.getConfig();
  logDebug(`Cache TTL: Exercises ${config.exerciseTtlHours}h, Reactions ${config.reactionsTtlMinutes}m, Rate limits ${config.rateLimitTtlMinutes}m, General ${config.generalTtlMinutes}m`);
  
  logInfo('GitHub API calls are cached with configurable TTL to minimize rate limit usage');
}

/**
 * Initialize GitHub API monitoring and add debug utilities to window
 */
export function initializeGitHubMonitoring(): void {
  logInfo('Initializing GitHub API monitoring...');
  
  // Check rate limits on startup
  checkGitHubRateLimits();
  
  // Log stats periodically (every 5 minutes)
  setInterval(() => {
    logGitHubApiStats();
  }, 5 * 60 * 1000);
  
  // Add debug utilities to window for manual use
  (window as any).gitHubDebug = {
    checkRateLimits: checkGitHubRateLimits,
    logStats: logGitHubApiStats,
    clearCache: () => {
      persistentCache.clear();
      logInfo('Cache cleared successfully');
    },
    getCacheStats: () => persistentCache.getStats(),
    getCacheConfig: () => persistentCache.getConfig()
  };
  
  // Warning when approaching rate limits
  logInfo('GitHub monitoring active: Will warn if rate limits get low');
  logInfo('Debug utilities available: window.gitHubDebug.checkRateLimits(), window.gitHubDebug.logStats(), window.gitHubDebug.clearCache(), window.gitHubDebug.getCacheStats(), window.gitHubDebug.getCacheConfig()');
}