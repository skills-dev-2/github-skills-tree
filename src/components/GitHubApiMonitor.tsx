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
import { Badge } from './ui/badge';

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

  const getRateLimitBadgeVariant = (remaining: number, limit: number) => {
    const percentage = (remaining / limit) * 100;
    if (percentage < 10) return 'destructive';
    if (percentage < 25) return 'secondary';
    return 'default';
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
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-3">
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
      
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {rateLimitInfo && (
          <div className="space-y-4">
            {Object.entries(rateLimitInfo)
              .sort(([a], [b]) => getResourcePriority(a) - getResourcePriority(b))
              .map(([resourceKey, info]) => (
                <div key={resourceKey} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{getResourceDisplayName(resourceKey)}</h4>
                    <Badge variant={getRateLimitBadgeVariant(info.remaining, info.limit)}>
                      {info.remaining}/{info.limit}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Used:</span>
                      <span className="font-mono">
                        {info.used} ({((info.used / info.limit) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className="font-mono">
                        {((info.remaining / info.limit) * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Resets at:</span>
                      <span className="font-mono">
                        {info.reset.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        info.remaining < info.limit * 0.1 ? 'bg-destructive' :
                        info.remaining < info.limit * 0.25 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${(info.remaining / info.limit) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {lastUpdated && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated: {lastUpdated.toLocaleTimeString()}
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