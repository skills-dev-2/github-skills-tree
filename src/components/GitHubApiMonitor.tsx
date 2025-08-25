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
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
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

  return (
    <Card className="w-full max-w-md">
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
      
      <CardContent className="space-y-3">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {rateLimitInfo && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Rate Limit:</span>
              <Badge variant={getRateLimitBadgeVariant(rateLimitInfo.remaining, rateLimitInfo.limit)}>
                {rateLimitInfo.remaining}/{rateLimitInfo.limit}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Used:</span>
              <span className="text-sm font-mono">
                {rateLimitInfo.used} ({((rateLimitInfo.used / rateLimitInfo.limit) * 100).toFixed(1)}%)
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Resets at:</span>
              <span className="text-sm font-mono">
                {rateLimitInfo.reset.toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Resource:</span>
              <Badge variant="outline">{rateLimitInfo.resource}</Badge>
            </div>
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