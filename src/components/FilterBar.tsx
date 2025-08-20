import React, { useState, useMemo } from 'react';
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right";
import XIcon from "lucide-react/dist/esm/icons/x";
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Card } from './ui/card';
import { Label } from './ui/label';
import type { Exercise, Path } from '../lib/types';

export interface FilterState {
  paths: string[];
  products: string[];
  difficulties: string[];
  statuses: string[];
}

export interface SettingsState {
  enableDragExercises: boolean;
}

interface FilterBarProps {
  exercises: Exercise[];
  paths: Path[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  settings: SettingsState;
  onSettingsChange: (settings: SettingsState) => void;
}

interface FilterSectionProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

function FilterSection({ title, items, selectedItems, onSelectionChange }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

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
          {selectedItems.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              {selectedItems.length}
            </span>
          )}
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
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {items.map(item => (
              <div key={item} className="flex items-center space-x-2">
                <Checkbox
                  id={`${title}-${item}`}
                  checked={selectedItems.includes(item)}
                  onCheckedChange={(checked) => handleItemToggle(item, !!checked)}
                />
                <label
                  htmlFor={`${title}-${item}`}
                  className="text-sm text-foreground cursor-pointer flex-1 truncate"
                  title={item}
                >
                  {item}
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
  onSettingsChange
}: FilterBarProps) {

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
      statuses: []
    });
  };

  return (
    <Card className="fixed left-0 top-20 z-40 w-fit min-w-64 max-w-80 h-[calc(100vh-5rem)] bg-card border-r border-border rounded-none border-l-0 border-t-0 border-b-0">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">Filters</h2>
          {totalActiveFilters > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
              {totalActiveFilters}
            </span>
          )}
        </div>
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Settings Section */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between p-3">
            <span className="font-medium text-sm text-foreground">Settings</span>
          </div>
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="drag-exercises" className="text-sm text-foreground cursor-pointer">
                Enable Exercise Dragging
              </Label>
              <Switch
                id="drag-exercises"
                checked={settings.enableDragExercises}
                onCheckedChange={(checked) => 
                  onSettingsChange({ ...settings, enableDragExercises: checked })
                }
              />
            </div>
          </div>
        </div>

        <FilterSection
          title="Learning Path"
          items={filterOptions.paths}
          selectedItems={filters.paths}
          onSelectionChange={(paths) => onFiltersChange({ ...filters, paths })}
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
  );
}