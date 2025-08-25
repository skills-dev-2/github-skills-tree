import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { GitHubAPI } from '../lib/github-api';

interface ApiUsageInfo {
  limit: number;
  remaining: number;
  used: number;
  resetTime: Date;
  resource: string;
}

/**
 * Component to monitor GitHub API usage and display current limits
 * Helps track optimization efforts to stay under rate limits
 */
export function ApiUsageMonitor() {
  const [apiInfo, setApiInfo] = useState<ApiUsageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiUsage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rateLimitInfo = await GitHubAPI.getRateLimit();
      setApiInfo({
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        used: rateLimitInfo.used,
        resetTime: rateLimitInfo.reset,
        resource: rateLimitInfo.resource
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiUsage();
  }, []);

  const getUsageColor = () => {
    if (!apiInfo) return 'secondary';
    const usagePercent = (apiInfo.used / apiInfo.limit) * 100;
    if (usagePercent > 80) return 'destructive';
    if (usagePercent > 60) return 'secondary';
    return 'default';
  };

  const getRemainingColor = () => {
    if (!apiInfo) return 'secondary';
    if (apiInfo.remaining < 100) return 'destructive';
    if (apiInfo.remaining < 500) return 'secondary';
    return 'default';
  };

  const formatTimeUntilReset = () => {
    if (!apiInfo) return '';
    const minutes = Math.ceil((apiInfo.resetTime.getTime() - Date.now()) / (1000 * 60));
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">GitHub API Usage</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Checking usage...</span>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        
        {apiInfo && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usage:</span>
              <Badge variant={getUsageColor()}>
                {apiInfo.used}/{apiInfo.limit} ({Math.round((apiInfo.used / apiInfo.limit) * 100)}%)
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Remaining:</span>
              <Badge variant={getRemainingColor()}>
                {apiInfo.remaining} calls
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Resets in:</span>
              <span className="text-sm font-mono">
                {formatTimeUntilReset()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Resource:</span>
              <span className="text-sm font-mono">
                {apiInfo.resource}
              </span>
            </div>
            
            {apiInfo.remaining < 100 && (
              <div className="p-3 bg-destructive/10 rounded-md">
                <p className="text-sm text-destructive font-medium">⚠️ Low API calls remaining!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider waiting {formatTimeUntilReset()} before loading more data.
                </p>
              </div>
            )}
          </>
        )}
        
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchApiUsage}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Refreshing...' : 'Refresh Usage'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}