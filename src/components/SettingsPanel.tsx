import React, { useState } from 'react';
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right";
import XIcon from "lucide-react/dist/esm/icons/x";
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ApiUsageMonitor } from './ApiUsageMonitor';
import { useResponsive } from '../hooks/use-responsive';
import { useKV } from '@github/spark/hooks';

import { persistentCache, DEFAULT_CACHE_CONFIG } from '../lib/persistent-cache';

export interface SettingsState {
  isDragModeEnabled: boolean;
  showApiMonitor: boolean;
  consoleLogLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  cacheConfig: {
    exerciseTtlHours: number;
    reactionsTtlMinutes: number;
    rateLimitTtlMinutes: number;
    generalTtlMinutes: number;
  };
}

interface SettingsPanelProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
  onClose?: () => void;
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

/**
 * Collapsible section for organizing settings
 */
function SettingsSection({ title, children, defaultExpanded = false }: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-border last:border-b-0">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium text-sm text-foreground">{title}</span>
        {isExpanded ? (
          <ChevronDownIcon size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRightIcon size={16} className="text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated settings panel with console logging controls and other application settings
 */
export function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
  const { isMobile } = useResponsive();

  // Store settings in persistent storage
  const [, setStoredSettings] = useKV("app-settings", settings);

  const handleSettingsChange = (newSettings: SettingsState) => {
    onSettingsChange(newSettings);
    setStoredSettings(newSettings);
    
    // Update persistent cache configuration
    persistentCache.updateConfig(newSettings.cacheConfig);
  };

  const handleConsoleLogLevelChange = (level: string) => {
    const newSettings = { ...settings, consoleLogLevel: level as SettingsState['consoleLogLevel'] };
    handleSettingsChange(newSettings);
  };

  const handleCacheConfigChange = (key: keyof SettingsState['cacheConfig'], value: number) => {
    const newSettings = {
      ...settings,
      cacheConfig: {
        ...settings.cacheConfig,
        [key]: value
      }
    };
    handleSettingsChange(newSettings);
  };

  const resetCacheConfig = () => {
    const newSettings = {
      ...settings,
      cacheConfig: { ...DEFAULT_CACHE_CONFIG }
    };
    handleSettingsChange(newSettings);
  };

  const clearCache = () => {
    persistentCache.clear();
    // Show some feedback to user
    // Could add a toast here if desired
  };

  const cacheStats = persistentCache.getStats();

  return (
    <Card className={`
      fixed bg-card/95 backdrop-blur border-border shadow-2xl rounded-xl z-50
      ${isMobile 
        ? 'inset-x-2 top-20 bottom-4 max-w-none' 
        : 'top-20 right-4 w-80 max-h-[calc(100vh-6rem)]'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <XIcon size={16} />
          </Button>
        )}
      </div>

      {/* Settings Content */}
      <div className="overflow-y-auto flex-1">
        {/* Cache Settings */}
        <SettingsSection title="Cache Settings">
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Configure how long different types of data are cached. Longer cache times reduce API calls but may show stale data.
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exercises-cache" className="text-xs text-foreground">
                  Exercises (hours)
                </Label>
                <Input
                  id="exercises-cache"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.cacheConfig.exerciseTtlHours}
                  onChange={(e) => handleCacheConfigChange('exerciseTtlHours', parseInt(e.target.value) || 24)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="reactions-cache" className="text-xs text-foreground">
                  Reactions (min)
                </Label>
                <Input
                  id="reactions-cache"
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.cacheConfig.reactionsTtlMinutes}
                  onChange={(e) => handleCacheConfigChange('reactionsTtlMinutes', parseInt(e.target.value) || 30)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="rate-limit-cache" className="text-xs text-foreground">
                  Rate Limits (min)
                </Label>
                <Input
                  id="rate-limit-cache"
                  type="number"
                  min="1"
                  max="60"
                  value={settings.cacheConfig.rateLimitTtlMinutes}
                  onChange={(e) => handleCacheConfigChange('rateLimitTtlMinutes', parseInt(e.target.value) || 1)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor="general-cache" className="text-xs text-foreground">
                  General (min)
                </Label>
                <Input
                  id="general-cache"
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.cacheConfig.generalTtlMinutes}
                  onChange={(e) => handleCacheConfigChange('generalTtlMinutes', parseInt(e.target.value) || 60)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetCacheConfig}
                className="h-8 px-3 text-xs"
              >
                Reset to Defaults
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCache}
                className="h-8 px-3 text-xs"
              >
                Clear Cache
              </Button>
            </div>
            
            {/* Cache Statistics */}
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Cache entries:</span>
                  <span>{cacheStats.entryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage used:</span>
                  <span>{(cacheStats.totalSize / 1024).toFixed(1)} KB</span>
                </div>
                {cacheStats.oldestEntry && (
                  <div className="flex justify-between">
                    <span>Oldest entry:</span>
                    <span>{cacheStats.oldestEntry.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Interface Settings */}
        <SettingsSection title="Interface" defaultExpanded={true}>
          <div className="flex items-center justify-between">
            <Label htmlFor="drag-mode" className="text-sm text-foreground cursor-pointer">
              Enable node dragging
            </Label>
            <Switch
              id="drag-mode"
              checked={settings.isDragModeEnabled}
              onCheckedChange={(checked) => 
                handleSettingsChange({ ...settings, isDragModeEnabled: checked })
              }
            />
          </div>
          {settings.isDragModeEnabled && (
            <p className="text-xs text-muted-foreground">
              Drag mode: Tree panning disabled, click-to-view disabled, exercise icons can be repositioned.
            </p>
          )}
        </SettingsSection>

        {/* Development Settings */}
        <SettingsSection title="Development">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="console-log-level" className="text-sm text-foreground">
                Console log verbosity
              </Label>
              <Select
                value={settings.consoleLogLevel}
                onValueChange={handleConsoleLogLevelChange}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Controls the level of detail in console logging. Debug shows all operations, None disables logging.
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="api-monitor" className="text-sm text-foreground cursor-pointer">
                Show API usage monitor
              </Label>
              <Switch
                id="api-monitor"
                checked={settings.showApiMonitor}
                onCheckedChange={(checked) => 
                  handleSettingsChange({ ...settings, showApiMonitor: checked })
                }
              />
            </div>
            
            {settings.showApiMonitor && (
              <div className="mt-3">
                <ApiUsageMonitor />
              </div>
            )}
          </div>
        </SettingsSection>
      </div>
    </Card>
  );
}