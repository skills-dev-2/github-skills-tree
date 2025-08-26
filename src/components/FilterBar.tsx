import React, { useState, useMemo } from 'react';
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right";
import XIcon from "lucide-react/dist/esm/icons/x";
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';
import { useResponsive } from '../hooks/use-responsive';
import type { Exercise, Path } from '../lib/types';

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
  items: string[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  renderItem?: (item: string) => React.ReactNode;
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
          {selectedCount > 0 && selectedCount < totalCount && (
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
  onClose
}: FilterBarProps) {
  const { isMobile, isDesktop } = useResponsive();

  // Extract unique values from exercises
  const filterOptions = useMemo(() => {
    const pathsSet = new Set<string>();
    const productsSet = new Set<string>();
    const difficultiesSet = new Set<string>();
    const statusesSet = new Set<string>();

    exercises.forEach(exercise => {
      if (exercise.pathSlug) pathsSet.add(exercise.pathSlug);
      if (exercise.products) exercise.products.forEach(product => productsSet.add(product));
      if (exercise.difficulty) difficultiesSet.add(exercise.difficulty);
      if (exercise.status) statusesSet.add(exercise.status);
    });

    return {
      paths: Array.from(pathsSet).sort(),
      products: Array.from(productsSet).sort(),
      difficulties: Array.from(difficultiesSet).sort(),
      statuses: Array.from(statusesSet).sort()
    };
  }, [exercises]);

  // Create path color mapping for visual indicators
  const pathColorMap = useMemo(() => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    
    const map: Record<string, string> = {};
    paths.forEach((path, index) => {
      map[path.slug] = colors[index % colors.length];
    });
    
    return map;
  }, [paths]);

  // Enhanced path item renderer with colored indicators
  const renderPathItem = (pathSlug: string) => {
    const path = paths.find(p => p.slug === pathSlug);
    const pathName = path ? path.name : pathSlug;
    const colorClass = pathColorMap[pathSlug] || 'bg-gray-500';
    
    return (
      <>
        <div className={`w-3 h-3 rounded-full ${colorClass} flex-shrink-0`} />
        <span className="truncate">{pathName}</span>
      </>
    );
  };

  return (
    <Card className={`
      fixed bg-card/95 backdrop-blur border-border shadow-2xl rounded-xl z-50
      ${isMobile 
        ? 'inset-x-2 top-20 bottom-4 max-w-none' 
        : 'top-20 left-4 w-80 max-h-[calc(100vh-6rem)]'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
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
      <div className="overflow-y-auto flex-1">
        <FilterSection
          title="Learning Path"
          items={filterOptions.paths}
          selectedItems={filters.paths}
          onSelectionChange={(paths) => onFiltersChange({ ...filters, paths })}
          renderItem={renderPathItem}
        />
        
        <FilterSection
          title="Status"
          items={filterOptions.statuses}
          selectedItems={filters.statuses}
          onSelectionChange={(statuses) => onFiltersChange({ ...filters, statuses })}
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
      </div>
    </Card>
  );
}