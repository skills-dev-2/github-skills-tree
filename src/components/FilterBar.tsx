import React, { useState, useMemo } from 'react';
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right";
import XIcon from "lucide-react/dist/esm/icons/x";
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { ApiUsageMonitor } from './ApiUsageMonitor';
import { useResponsive } from '../hooks/use-responsive';
import type { Exercise, Path } from '../lib/types';

export interface FilterState {
  paths: string[];
  products: string[];
  difficulties: string[];
  statuses: string[];
}

export interface SettingsState {
  isDragModeEnabled: boolean;
  showApiMonitor: boolean;
}

interface FilterBarProps {
  exercises: Exercise[];
  paths: Path[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
  onClose?: () => void;
}

interface FilterSectionProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  renderItem?: (item: string) => React.ReactNode;
}

interface SettingsSectionProps {
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

function SettingsSection({ settings, onSettingsChange }: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium text-sm text-foreground">Settings</span>
        {isExpanded ? (
          <ChevronDownIcon size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRightIcon size={16} className="text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="drag-mode" className="text-sm text-foreground cursor-pointer">
              Enable node dragging
            </Label>
            <Switch
              id="drag-mode"
              checked={settings.isDragModeEnabled}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, isDragModeEnabled: checked })
              }
            />
          </div>
          {settings.isDragModeEnabled && (
            <p className="text-xs text-muted-foreground">
              Drag mode: Tree panning disabled, click-to-view disabled, exercise icons can be repositioned.
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="api-monitor" className="text-sm text-foreground cursor-pointer">
              Show API usage monitor
            </Label>
            <Switch
              id="api-monitor"
              checked={settings.showApiMonitor}
              onCheckedChange={(checked) => 
                onSettingsChange({ ...settings, showApiMonitor: checked })
              }
            />
          </div>
          
          {settings.showApiMonitor && (
            <div className="mt-3">
              <ApiUsageMonitor />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function FilterSection({ title, items, selectedItems, onSelectionChange, renderItem }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleItemToggle = (item: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(i => i !== item));
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(items);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium text-sm text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full min-w-[24px] text-center" 
                style={{ visibility: selectedItems.length > 0 ? 'visible' : 'hidden' }}>
            {selectedItems.length || 0}
          </span>
          {isExpanded ? (
            <ChevronDownIcon size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRightIcon size={16} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3">
          {items.length > 0 && (
            <div className="flex gap-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-6 px-2"
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-6 px-2"
                disabled={selectedItems.length === 0}
              >
                Clear
              </Button>
            </div>
          )}
          
          <div className="space-y-2">
            {items.map(item => (
              <div key={item} className="flex items-center space-x-2">
                <Checkbox
                  id={`${title}-${item}`}
                  checked={selectedItems.includes(item)}
                  onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
                />
                <label
                  htmlFor={`${title}-${item}`}
                  className="text-sm text-foreground cursor-pointer flex-1 truncate flex items-center gap-2"
                  title={item}
                >
                  {renderItem ? renderItem(item) : item}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({ 
  exercises, 
  paths, 
  filters, 
  onFiltersChange,
  settings,
  onSettingsChange,
  onClose
}: FilterBarProps) {
  const { isMobile, isDesktop } = useResponsive();

  // Extract unique values from exercises
  const filterOptions = useMemo(() => {
    const pathNames = paths.map(p => p.name).sort();
    
    const products = new Set<string>();
    const difficulties = new Set<string>();
    const statuses = new Set<string>();

    exercises.forEach(exercise => {
      if (exercise.products) {
        exercise.products.forEach(product => products.add(product));
      }
      if (exercise.difficulty) {
        difficulties.add(exercise.difficulty);
      }
      statuses.add(exercise.status);
    });

    // Define proper difficulty order
    const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced'];
    const sortedDifficulties = difficultyOrder.filter(d => difficulties.has(d));

    // Capitalize status options
    const capitalizedStatuses = Array.from(statuses).map(status => 
      status.charAt(0).toUpperCase() + status.slice(1)
    ).sort();

    return {
      paths: pathNames,
      products: Array.from(products).sort(),
      difficulties: sortedDifficulties,
      statuses: capitalizedStatuses
    };
  }, [exercises, paths]);

  // Create a map of path names to colors for easy lookup
  const pathColorMap = useMemo(() => {
    const map = new Map<string, string>();
    paths.forEach(path => {
      map.set(path.name, path.color);
    });
    return map;
  }, [paths]);

  const renderPathItem = (pathName: string) => {
    const color = pathColorMap.get(pathName);
    return (
      <>
        {color && (
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="truncate">{pathName}</span>
      </>
    );
  };

  const totalActiveFilters = 
    filters.paths.length + 
    filters.products.length + 
    filters.difficulties.length + 
    filters.statuses.length;

  const handleClearAllFilters = () => {
    onFiltersChange({
      paths: [],
      products: [],
      difficulties: [],
      statuses: ['Active']
    });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {!isDesktop && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}
      
      {/* Filter card - responsive positioning */}
      <Card className="
        fixed z-40 bg-card border border-border rounded-lg shadow-2xl flex flex-col
        /* Mobile: full screen modal */
        inset-x-4 inset-y-4 
        /* Tablet: centered modal */
        sm:inset-x-8 sm:inset-y-8 sm:max-w-md sm:mx-auto
        /* Desktop: floating sidebar */
        md:left-4 md:right-auto md:w-fit md:min-w-64 md:max-w-80 md:max-h-[calc(100vh-10rem)] md:inset-y-auto
      "
      style={{ 
        top: isDesktop ? '140px' : undefined 
      }}>
        <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">Filters</h2>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full min-w-[24px] text-center"
                  style={{ visibility: totalActiveFilters > 0 ? 'visible' : 'hidden' }}>
              {totalActiveFilters || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-xs h-6 px-2"
              >
                <XIcon size={12} className="mr-1" />
                Clear All
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className={`h-8 w-8 p-0 ${isDesktop ? 'hidden' : ''}`}
              >
                <XIcon size={16} />
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Settings Section */}
          <div className="border-b border-border">
            <SettingsSection 
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>

          <FilterSection
            title="Learning Path"
            items={filterOptions.paths}
            selectedItems={filters.paths}
            onSelectionChange={(paths) => onFiltersChange({ ...filters, paths })}
            renderItem={renderPathItem}
          />
          
          <FilterSection
            title="Product"
            items={filterOptions.products}
            selectedItems={filters.products}
            onSelectionChange={(products) => onFiltersChange({ ...filters, products })}
          />
          
          <FilterSection
            title="Difficulty"
            items={filterOptions.difficulties}
            selectedItems={filters.difficulties}
            onSelectionChange={(difficulties) => onFiltersChange({ ...filters, difficulties })}
          />
          
          <FilterSection
            title="Status"
            items={filterOptions.statuses}
            selectedItems={filters.statuses}
            onSelectionChange={(statuses) => onFiltersChange({ ...filters, statuses })}
          />
        </div>
      </Card>
    </>
  );
}