/**
 * GitHub API Rate Limit Monitor Component
 * 
 * A debugging component that displays current GitHub API rate limit status.
 * Only visible in development mode or when specifically enabled.
 */

import React, { useState, useEffect } from 'react';
import { GitHubAPI } from '../lib/github-api';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
  resource: string;
}

interface GitHubApiMonitorProps {
  /** Whether to show the monitor (defaults to false) */
  visible?: boolean;
  /** Automatic refresh interval in seconds (0 to disable) */
  autoRefresh?: number;
}

export function GitHubApiMonitor({ visible = false, autoRefresh = 0 }: GitHubApiMonitorProps) {
  const [rateLimitInfo, setRateLimitInfo] = useState<{ [resource: string]: RateLimitInfo } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const checkRateLimit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const info = await GitHubAPI.getRateLimit();
      setRateLimitInfo(info);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check rate limit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && autoRefresh > 0) {
      const interval = setInterval(checkRateLimit, autoRefresh * 1000);
      return () => clearInterval(interval);
    }
  }, [visible, autoRefresh]);

  if (!visible) {
    return null;
  }

  const getRateLimitColor = (remaining: number, limit: number) => {
    const percentage = (remaining / limit) * 100;
    if (percentage < 10) return 'text-red-400';
    if (percentage < 25) return 'text-amber-400';
    return 'text-green-400';
  };

  const getResourceDisplayName = (resource: string) => {
    const names: { [key: string]: string } = {
      'core': 'Core API',
      'search': 'Search API', 
      'code_search': 'Code Search',
      'graphql': 'GraphQL API',
      'integration_manifest': 'Integration',
      'rate': 'Legacy Rate'
    };
    return names[resource] || resource;
  };

  const getResourcePriority = (resource: string) => {
    // Define order for display - most important first
    const priorities: { [key: string]: number } = {
      'core': 1,
      'search': 2,
      'code_search': 3,
      'graphql': 4,
      'integration_manifest': 5,
      'rate': 6
    };
    return priorities[resource] || 99;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          GitHub API Status
          <Button
            onClick={checkRateLimit}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {rateLimitInfo && (
          <div className="space-y-2">
            {Object.entries(rateLimitInfo)
              .sort(([a], [b]) => getResourcePriority(a) - getResourcePriority(b))
              .map(([resourceKey, info]) => (
                <div key={resourceKey} className="flex items-center justify-between py-1 px-2 bg-muted/20 rounded">
                  <span className="text-sm font-medium">{getResourceDisplayName(resourceKey)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm ${getRateLimitColor(info.remaining, info.limit)}`}>
                      {info.remaining}/{info.limit}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({info.reset.toLocaleTimeString()})
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {lastUpdated && (
          <div className="text-xs text-muted-foreground text-center pt-1 border-t">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {!rateLimitInfo && !error && (
          <div className="text-sm text-muted-foreground text-center">
            Click "Refresh" to check current GitHub API rate limits
          </div>
        )}
      </CardContent>
    </Card>
  );
}