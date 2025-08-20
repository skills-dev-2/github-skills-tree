import React from 'react';
import { Search, X } from '@phosphor-icons/react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
        <Search size={18} />
      </div>
      <Input
        type="text"
        placeholder="Search exercises, paths, descriptions, products, status..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
        aria-label="Search all exercises and learning paths"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
}