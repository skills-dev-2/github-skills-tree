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

  const getUsageColor = (used: number, limit: number) => {
    const usagePercent = (used / limit) * 100;
    if (usagePercent > 80) return 'destructive';
    if (usagePercent > 60) return 'secondary';
    return 'default';
  };

  const getRemainingColor = (remaining: number) => {
    if (remaining < 100) return 'destructive';
    if (remaining < 500) return 'secondary';
    return 'default';
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

  // Find the most critical resource (lowest remaining relative to limit)
  const getMostCriticalResource = () => {
    if (!apiInfo) return null;
    
    let mostCritical: { resource: string; info: ApiUsageInfo; percentage: number } | null = null;
    
    Object.entries(apiInfo).forEach(([resourceName, info]) => {
      if (info.limit > 0) { // Only consider resources that have limits
        const percentage = (info.remaining / info.limit) * 100;
        if (!mostCritical || percentage < mostCritical.percentage) {
          mostCritical = { resource: resourceName, info, percentage };
        }
      }
    });
    
    return mostCritical;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">GitHub API Usage</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
            {Object.entries(apiInfo)
              .filter(([, info]) => info.limit > 0) // Only show resources with actual limits
              .sort(([a], [b]) => getResourcePriority(a) - getResourcePriority(b))
              .map(([resourceName, info]) => (
                <div key={resourceName} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{getResourceDisplayName(resourceName)}</h4>
                    <Badge variant={getRemainingColor(info.remaining)}>
                      {info.remaining}/{info.limit}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Used:</span>
                      <Badge variant={getUsageColor(info.used, info.limit)} className="text-xs">
                        {info.used} ({Math.round((info.used / info.limit) * 100)}%)
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Resets in:</span>
                      <span className="font-mono">
                        {formatTimeUntilReset(info.resetTime)}
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
                  
                  {info.remaining < 100 && (
                    <div className="p-2 bg-destructive/10 rounded-md mt-2">
                      <p className="text-xs text-destructive font-medium">⚠️ Low API calls remaining!</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Consider waiting {formatTimeUntilReset(info.resetTime)} before making more requests.
                      </p>
                    </div>
                  )}
                </div>
              ))
            }
            
            {(() => {
              const critical = getMostCriticalResource();
              return critical && critical.percentage < 25 && (
                <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">🚨 Critical: {getResourceDisplayName(critical.resource)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only {critical.info.remaining} out of {critical.info.limit} calls remaining ({critical.percentage.toFixed(1)}%)
                  </p>
                </div>
              );
            })()}
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