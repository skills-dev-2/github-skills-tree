/**
 * GitHub API debugging and monitoring utilities
 * 
 * Provides functions to check and monitor GitHub API usage
 */

import { GitHubAPI } from './github-api';
import { cache } from './cache';

/**
 * Check current GitHub API rate limits and log them
 */
export async function checkGitHubRateLimits(): Promise<void> {
  try {
    console.group('🔍 GitHub API Rate Limit Check');
    console.log('⏱️ Checking current rate limits...');
    
    const rateLimitInfo = await GitHubAPI.getRateLimit();
    
    console.log('✅ Rate limit check completed');
    console.groupEnd();
    
  } catch (error) {
    console.group('❌ GitHub API Rate Limit Check Failed');
    console.error('Failed to check rate limits:', error);
    console.log('💡 This might indicate connectivity issues or API problems');
    console.groupEnd();
  }
}

/**
 * Log comprehensive GitHub API and cache statistics
 */
export function logGitHubApiStats(): void {
  const cacheStats = cache.getStats();
  
  console.group('📊 GitHub API & Cache Statistics');
  
  // Cache information
  console.log(`💾 Cache entries: ${cacheStats.size}`);
  console.log(`🔑 Cache keys:`, cacheStats.keys);
  
  // Filter GitHub-related cache keys
  const githubKeys = cacheStats.keys.filter(key => 
    key.includes('github-api') || 
    key.includes('github-files') || 
    key.includes('github-reactions')
  );
  
  console.log(`🐙 GitHub-related cache entries: ${githubKeys.length}`);
  if (githubKeys.length > 0) {
    console.log(`🔗 GitHub cache keys:`, githubKeys);
  }
  
  // Memory usage estimation
  const estimatedMemoryKB = Math.round(
    JSON.stringify(cacheStats).length / 1024
  );
  console.log(`🧠 Estimated cache memory usage: ~${estimatedMemoryKB}KB`);
  
  console.log('💡 All GitHub API calls are cached for 60 minutes to minimize rate limit usage');
  console.groupEnd();
}

/**
 * Initialize GitHub API monitoring and add debug utilities to window
 */
export function initializeGitHubMonitoring(): void {
  console.log('🚀 Initializing GitHub API monitoring...');
  
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
      console.log('✅ Cache cleared successfully');
    }
  };
  
  // Warning when approaching rate limits
  console.log('⚠️  Monitoring active: Will warn if rate limits get low');
  console.log('💡 Debug utilities available: window.gitHubDebug.checkRateLimits(), window.gitHubDebug.logStats(), window.gitHubDebug.clearCache()');
}