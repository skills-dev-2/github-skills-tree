import React, { useState } from 'react';
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right";
import XIcon from "lucide-react/dist/esm/icons/x";
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ApiUsageMonitor } from './ApiUsageMonitor';
import { useResponsive } from '../hooks/use-responsive';
import { useKV } from '@github/spark/hooks';

export interface SettingsState {
  isDragModeEnabled: boolean;
  showApiMonitor: boolean;
  consoleLogLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
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
  };

  const handleConsoleLogLevelChange = (level: string) => {
    const newSettings = { ...settings, consoleLogLevel: level as SettingsState['consoleLogLevel'] };
    handleSettingsChange(newSettings);
  };

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