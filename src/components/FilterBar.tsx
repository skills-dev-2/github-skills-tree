import React, { useState, useMemo } from 'react';
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right";
import XIcon from "lucide-react/dist/esm/icons/x";
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';
import { useResponsive } from '../hooks/use-responsive';
import type { Exercise, Path } from '../lib/types';

/**
 * Converts a status string to title case
 * Examples: "active" -> "Active", "development" -> "Development"
 */
function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export interface FilterState {
  paths: string[];
  products: string[];
  difficulties: string[];
  statuses: string[];
}

interface FilterBarProps {
  exercises: Exercise[];
  paths: Path[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose?: () => void;
}

interface FilterSectionProps {
  title: string;
  items: any[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  renderItem?: (item: any) => React.ReactNode;
  getItemKey?: (item: any) => string;
}

function FilterSection({ title, items, selectedItems, onSelectionChange, renderItem, getItemKey }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleItemToggle = (item: any, checked: boolean) => {
    const itemKey = getItemKey ? getItemKey(item) : item;
    if (checked) {
      onSelectionChange([...selectedItems, itemKey]);
    } else {
      onSelectionChange(selectedItems.filter(i => i !== itemKey));
    }
  };

  const handleSelectAll = () => {
    const allKeys = items.map(item => getItemKey ? getItemKey(item) : item);
    onSelectionChange(allKeys);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedItems.length;
  const totalCount = items.length;

  return (
    <div className="border-b border-border last:border-b-0">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{title}</span>
          {selectedCount > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
              {selectedCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDownIcon size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRightIcon size={16} className="text-muted-foreground" />
        )}
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
            {items.map(item => {
              const itemKey = getItemKey ? getItemKey(item) : item;
              const displayKey = typeof item === 'string' ? item : itemKey;
              return (
                <div key={itemKey} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${title}-${itemKey}`}
                    checked={selectedItems.includes(itemKey)}
                    onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
                  />
                  <label
                    htmlFor={`${title}-${itemKey}`}
                    className="text-sm text-foreground cursor-pointer flex-1 truncate flex items-center gap-2"
                    title={displayKey}
                  >
                    {renderItem ? renderItem(item) : displayKey}
                  </label>
                </div>
              );
            })}
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
  onClose
}: FilterBarProps) {
  const { isMobile, isDesktop } = useResponsive();

  // Extract unique values dynamically from data
  const filterOptions = useMemo(() => {
    const pathSlugsSet = new Set<string>();
    const productsSet = new Set<string>();
    const difficultiesSet = new Set<string>();
    const statusesSet = new Set<string>();

    // Extract unique values from exercises
    exercises.forEach(exercise => {
      if (exercise.pathSlug) pathSlugsSet.add(exercise.pathSlug);
      if (exercise.products) exercise.products.forEach(product => productsSet.add(product));
      if (exercise.difficulty) difficultiesSet.add(exercise.difficulty);
      if (exercise.status) statusesSet.add(exercise.status);
    });

    // Convert path slugs to path names for display, but keep slugs for filtering
    const pathOptions = Array.from(pathSlugsSet).sort().map(slug => {
      const path = paths.find(p => p.slug === slug);
      return {
        slug,
        name: path ? path.name : slug
      };
    });

    return {
      paths: pathOptions,
      products: Array.from(productsSet).sort(),
      difficulties: Array.from(difficultiesSet).sort(),
      statuses: Array.from(statusesSet).sort()
    };
  }, [exercises, paths]);

  // Create path color mapping using actual path colors
  const pathColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    filterOptions.paths.forEach((pathData) => {
      const path = paths.find(p => p.slug === pathData.slug);
      map[pathData.slug] = path?.color || '#0969da'; // fallback to primary blue
    });
    
    return map;
  }, [filterOptions.paths, paths]);

  // Enhanced path item renderer with colored indicators using actual path colors
  const renderPathItem = (pathData: { slug: string; name: string }) => {
    const pathColor = pathColorMap[pathData.slug] || '#0969da';
    
    return (
      <>
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0" 
          style={{ backgroundColor: pathColor }}
        />
        <span className="truncate">{pathData.name}</span>
      </>
    );
  };

  // Status item renderer with title case formatting
  const renderStatusItem = (status: string) => {
    return <span className="truncate">{toTitleCase(status)}</span>;
  };

  return (
    <Card className={`
      fixed bg-card/95 backdrop-blur border-border shadow-2xl rounded-xl z-50
      ${isMobile 
        ? 'inset-x-2 top-20 bottom-4 max-w-none overflow-y-auto' 
        : 'top-20 left-4 w-80 bottom-4 overflow-hidden flex flex-col'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
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

      {/* Filters Content */}
      <div className="overflow-y-auto flex-1 min-h-0">
        <FilterSection
          title="Learning Path"
          items={filterOptions.paths}
          selectedItems={filters.paths}
          onSelectionChange={(paths) => onFiltersChange({ ...filters, paths })}
          renderItem={renderPathItem}
          getItemKey={(pathData) => pathData.slug}
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
          renderItem={renderStatusItem}
        />
      </div>
    </Card>
  );
}