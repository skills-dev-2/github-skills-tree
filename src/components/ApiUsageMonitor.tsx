import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  const [apiInfo, setApiInfo] = useState<{ [resource: string]: ApiUsageInfo } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiUsage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allRateLimits = await GitHubAPI.getRateLimit();
      
      // Convert the rate limit data to our ApiUsageInfo format
      const apiUsageData: { [resource: string]: ApiUsageInfo } = {};
      
      Object.entries(allRateLimits).forEach(([resourceName, rateLimitInfo]) => {
        apiUsageData[resourceName] = {
          limit: rateLimitInfo.limit,
          remaining: rateLimitInfo.remaining,
          used: rateLimitInfo.used,
          resetTime: rateLimitInfo.reset,
          resource: rateLimitInfo.resource
        };
      });
      
      setApiInfo(apiUsageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API usage');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiUsage();
  }, []);

  const getRemainingColor = (remaining: number, limit: number) => {
    const percentage = (remaining / limit) * 100;
    if (percentage < 10) return 'text-red-500';
    if (percentage < 25) return 'text-amber-500';
    return 'text-green-500';
  };

  const formatTimeUntilReset = (resetTime: Date) => {
    const minutes = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60));
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">GitHub API Usage</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-2">
            <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Checking...</span>
          </div>
        )}
        
        {error && (
          <div className="text-xs text-destructive p-2 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        
        {apiInfo && (
          <>
            {Object.entries(apiInfo)
              .filter(([, info]) => info.limit > 0) // Only show resources with actual limits
              .sort(([a], [b]) => getResourcePriority(a) - getResourcePriority(b))
              .map(([resourceName, info]) => (
                <div key={resourceName} className="flex items-center justify-between py-1 text-xs">
                  <span className="text-muted-foreground">{getResourceDisplayName(resourceName)}:</span>
                  <div className="flex items-center space-x-2">
                    <span 
                      className={`font-mono font-medium ${getRemainingColor(info.remaining, info.limit)}`}
                    >
                      {info.remaining}
                    </span>
                    <span className="text-muted-foreground">/ {info.limit}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatTimeUntilReset(info.resetTime)})
                    </span>
                  </div>
                </div>
              ))
            }
          </>
        )}
        
        <div className="pt-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchApiUsage}
            disabled={loading}
            className="w-full h-7 text-xs"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}