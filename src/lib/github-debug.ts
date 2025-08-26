/**
 * GitHub API debugging and monitoring utilities
 * 
 * Provides functions to check and monitor GitHub API usage
 */

import { GitHubAPI } from './github-api';
import { cache } from './cache';
import { logInfo, logError, logDebug } from './console-logger';

/**
 * Check current GitHub API rate limits and log them
 */
export async function checkGitHubRateLimits(): Promise<void> {
  try {
    logDebug('🔍 GitHub API Rate Limit Check');
    logDebug('⏱️ Checking current rate limits...');
    
    const rateLimitInfo = await GitHubAPI.getRateLimit();
    
    logDebug('✅ Rate limit check completed');
    
  } catch (error) {
    logError('❌ GitHub API Rate Limit Check Failed');
    logError('Failed to check rate limits:', error);
    logInfo('💡 This might indicate connectivity issues or API problems');
  }
}

/**
 * Log comprehensive GitHub API and cache statistics
 */
export function logGitHubApiStats(): void {
  const cacheStats = cache.getStats();
  
  logInfo('📊 GitHub API & Cache Statistics');
  
  // Cache information
  logDebug(`💾 Cache entries: ${cacheStats.size}`);
  logDebug(`🔑 Cache keys:`, cacheStats.keys);
  
  // Filter GitHub-related cache keys
  const githubKeys = cacheStats.keys.filter(key => 
    key.includes('github-api') || 
    key.includes('github-files') || 
    key.includes('github-reactions')
  );
  
  logDebug(`🐙 GitHub-related cache entries: ${githubKeys.length}`);
  if (githubKeys.length > 0) {
    logDebug(`🔗 GitHub cache keys:`, githubKeys);
  }
  
  // Memory usage estimation
  const estimatedMemoryKB = Math.round(
    JSON.stringify(cacheStats).length / 1024
  );
  logDebug(`🧠 Estimated cache memory usage: ~${estimatedMemoryKB}KB`);
  
  logInfo('💡 All GitHub API calls are cached for 60 minutes to minimize rate limit usage');
}

/**
 * Initialize GitHub API monitoring and add debug utilities to window
 */
export function initializeGitHubMonitoring(): void {
  logInfo('🚀 Initializing GitHub API monitoring...');
  
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
      cache.clear();
      logInfo('✅ Cache cleared successfully');
    }
  };
  
  // Warning when approaching rate limits
  logInfo('⚠️  Monitoring active: Will warn if rate limits get low');
  logInfo('💡 Debug utilities available: window.gitHubDebug.checkRateLimits(), window.gitHubDebug.logStats(), window.gitHubDebug.clearCache()');
}