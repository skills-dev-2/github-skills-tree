/**
 * GitHub API wrapper with rate limit logging and caching
 * 
 * Provides centralized GitHub API access with automatic rate limit tracking,
 * comprehensive logging, and caching to minimize API calls.
 */

import { cachedFetch, createCacheKey } from './cache';
import { apiRequestQueue } from './request-queue';

interface GitHubApiResponse<T = any> {
  data: T;
  rateLimitInfo: {
    limit: number;
    remaining: number;
    reset: Date;
    used: number;
    resource: string;
  };
}

interface RateLimitHeaders {
  'x-ratelimit-limit': string;
  'x-ratelimit-remaining': string;
  'x-ratelimit-reset': string;
  'x-ratelimit-used': string;
  'x-ratelimit-resource': string;
}

/**
 * Extract rate limit information from GitHub API response headers
 */
function extractRateLimitInfo(headers: Headers): GitHubApiResponse<any>['rateLimitInfo'] {
  const limit = parseInt(headers.get('x-ratelimit-limit') || '5000', 10);
  const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0', 10);
  const reset = new Date(parseInt(headers.get('x-ratelimit-reset') || '0', 10) * 1000);
  const used = parseInt(headers.get('x-ratelimit-used') || '0', 10);
  const resource = headers.get('x-ratelimit-resource') || 'core';

  return {
    limit,
    remaining,
    reset,
    used,
    resource
  };
}

/**
 * Log GitHub API rate limit information in a user-friendly format
 */
function logRateLimitInfo(url: string, rateLimitInfo: GitHubApiResponse<any>['rateLimitInfo'], fromCache = false): void {
  const { limit, remaining, reset, used, resource } = rateLimitInfo;
  
  const resetTime = reset.toLocaleTimeString();
  const usagePercentage = ((used / limit) * 100).toFixed(1);
  const remainingPercentage = ((remaining / limit) * 100).toFixed(1);
  
  const source = fromCache ? '📦 [CACHED]' : '🌐 [API CALL]';
  const urgency = remaining < 100 ? '🚨' : remaining < 500 ? '⚠️' : '✅';
  
  console.group(`${source} GitHub API Rate Limits ${urgency}`);
  console.log(`🔗 URL: ${url}`);
  console.log(`📊 Resource: ${resource}`);
  console.log(`📈 Usage: ${used}/${limit} (${usagePercentage}%)`);
  console.log(`⏳ Remaining: ${remaining} (${remainingPercentage}%)`);
  console.log(`🔄 Resets at: ${resetTime}`);
  
  if (remaining < 100) {
    console.warn('🚨 WARNING: Very low rate limit remaining!');
    const minutesUntilReset = Math.ceil((reset.getTime() - Date.now()) / (1000 * 60));
    console.warn(`⏰ Rate limit resets in ${minutesUntilReset} minutes`);
  } else if (remaining < 500) {
    console.warn('⚠️ CAUTION: Rate limit getting low');
  }
  
  console.groupEnd();
}

/**
 * Enhanced GitHub API fetch with rate limit logging, caching, and request queuing
 */
async function githubApiFetch<T>(
  url: string, 
  options: RequestInit = {},
  ttlMinutes: number = 60
): Promise<GitHubApiResponse<T>> {
  const cacheKey = createCacheKey('github-api', url, JSON.stringify(options));
  
  return cachedFetch(cacheKey, async () => {
    // Queue the actual API request to control rate
    return apiRequestQueue.enqueue(async () => {
      console.log(`🚦 [QUEUE] Processing GitHub API request: ${url}`);
      
      // Add GitHub-specific headers
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Skills-Tree',
        ...options.headers
      };

      const response = await fetch(url, { ...options, headers });
      
      // Extract rate limit info before checking response status
      const rateLimitInfo = extractRateLimitInfo(response.headers);
      
      // Log rate limit information
      logRateLimitInfo(url, rateLimitInfo, false);
      
      if (!response.ok) {
        if (response.status === 403) {
          const resetTime = rateLimitInfo.reset.toLocaleString();
          const minutesUntilReset = Math.ceil((rateLimitInfo.reset.getTime() - Date.now()) / (1000 * 60));
          throw new Error(
            `GitHub API rate limit exceeded! ` +
            `Used: ${rateLimitInfo.used}/${rateLimitInfo.limit}. ` +
            `Resets in ${minutesUntilReset} minutes (${resetTime}). ` +
            `Please wait before making more requests.`
          );
        } else if (response.status === 404) {
          throw new Error(`GitHub resource not found: ${url}`);
        } else if (response.status === 401) {
          throw new Error(`GitHub API authentication required. Please check your API token.`);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${url}`);
      }

      const data = await response.json();
      
      return {
        data,
        rateLimitInfo
      };
    });
  }, ttlMinutes);
}

/**
 * Cached GitHub API fetch that also logs rate limits for cached responses
 */
export async function cachedGithubApiFetch<T>(
  url: string,
  options: RequestInit = {},
  ttlMinutes: number = 60
): Promise<T> {
  const cacheKey = createCacheKey('github-api', url, JSON.stringify(options));
  
  // Check if we have a cached response
  const cached = await cachedFetch(cacheKey, async () => {
    return githubApiFetch<T>(url, options, ttlMinutes);
  }, ttlMinutes);
  
  // If this was a cache hit, log it with stored rate limit info
  if (cached && typeof cached === 'object' && 'rateLimitInfo' in cached) {
    const response = cached as GitHubApiResponse<T>;
    logRateLimitInfo(url, response.rateLimitInfo, true);
    return response.data;
  }
  
  // If it wasn't cached or doesn't have rate limit info, fetch fresh
  const response = await githubApiFetch<T>(url, options, ttlMinutes);
  return response.data;
}

/**
 * Specialized GitHub API functions for common operations
 */
export const GitHubAPI = {
  /**
   * Fetch repository contents (cached for 4 hours - static content changes rarely)
   */
  async getRepoContents(
    owner: string,
    repo: string,
    path: string = '',
    branch: string = 'main'
  ): Promise<any[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    return cachedGithubApiFetch<any[]>(url, {}, 240); // 4 hour cache
  },

  /**
   * Fetch file content from raw GitHub URL (cached for 4 hours - static content)
   */
  async getFileContent<T>(downloadUrl: string): Promise<T> {
    // Raw GitHub URLs don't have rate limits, but we still cache them aggressively
    const cacheKey = createCacheKey('github-file-content', downloadUrl);
    
    return cachedFetch(cacheKey, async () => {
      console.log(`🔗 Fetching file content: ${downloadUrl}`);
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log(`✅ Successfully fetched file content from: ${downloadUrl}`);
      return data;
    }, 240); // 4 hour cache for static files
  },

  /**
   * Fetch issue information including reactions and comment count (cached for 30 minutes)
   * Shorter cache time as this is dynamic data that changes more frequently
   */
  async getIssueInfo(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<{ '+1': number; '-1': number; comments: number }> {
    // Fetch issue details to get comment count
    const issueUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
    const issueData = await cachedGithubApiFetch<any>(issueUrl, {}, 30); // 30 min cache for dynamic data
    
    // Fetch reactions
    const reactionsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/reactions`;
    const reactions = await cachedGithubApiFetch<any[]>(reactionsUrl, {}, 30); // 30 min cache for dynamic data
    
    // Count reactions by type
    const reactionCounts = { '+1': 0, '-1': 0 };
    reactions.forEach((reaction: any) => {
      if (reaction.content === '+1') {
        reactionCounts['+1']++;
      } else if (reaction.content === '-1') {
        reactionCounts['-1']++;
      }
    });
    
    const result = {
      '+1': reactionCounts['+1'],
      '-1': reactionCounts['-1'],
      comments: issueData.comments || 0
    };
    
    console.log(`📊 Issue info for ${owner}/${repo}#${issueNumber}: 👍 ${result['+1']}, 👎 ${result['-1']}, 💬 ${result.comments} comments`);
    return result;
  },

  /**
   * Fetch issue reactions (cached for 60 minutes)
   * @deprecated Use getIssueInfo instead for more complete data
   */
  async getIssueReactions(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<{ '+1': number; '-1': number }> {
    const info = await this.getIssueInfo(owner, repo, issueNumber);
    return { '+1': info['+1'], '-1': info['-1'] };
  },

  /**
   * Get current rate limit status for all resources (not cached - always fresh)
   */
  async getRateLimit(): Promise<{ [resource: string]: GitHubApiResponse<any>['rateLimitInfo'] }> {
    const url = 'https://api.github.com/rate_limit';
    
    const response = await apiRequestQueue.enqueue(async () => {
      console.log(`🚦 [QUEUE] Processing GitHub API request: ${url}`);
      
      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Skills-Tree',
      };

      const apiResponse = await fetch(url, { headers });
      
      if (!apiResponse.ok) {
        throw new Error(`GitHub API error: ${apiResponse.status} ${apiResponse.statusText} - ${url}`);
      }

      const data = await apiResponse.json();
      
      // Parse all resource types from the response
      const allLimits: { [resource: string]: GitHubApiResponse<any>['rateLimitInfo'] } = {};
      
      if (data.resources) {
        // Process all resource types
        Object.entries(data.resources).forEach(([resourceName, resourceData]: [string, any]) => {
          allLimits[resourceName] = {
            limit: resourceData.limit,
            remaining: resourceData.remaining,
            reset: new Date(resourceData.reset * 1000),
            used: resourceData.used || (resourceData.limit - resourceData.remaining),
            resource: resourceName
          };
        });
      }
      
      // Also include the legacy "rate" object if it exists (typically contains core data)
      if (data.rate) {
        allLimits['rate'] = {
          limit: data.rate.limit,
          remaining: data.rate.remaining,
          reset: new Date(data.rate.reset * 1000),
          used: data.rate.used || (data.rate.limit - data.rate.remaining),
          resource: data.rate.resource || 'core'
        };
      }
      
      if (Object.keys(allLimits).length === 0) {
        console.error('Unexpected rate limit response structure:', data);
        throw new Error('Unable to parse rate limit response');
      }
      
      // Log all rate limit information
      Object.values(allLimits).forEach(rateLimitInfo => {
        logRateLimitInfo(url, rateLimitInfo, false);
      });
      
      return allLimits;
    });
    
    return response;
  }
};