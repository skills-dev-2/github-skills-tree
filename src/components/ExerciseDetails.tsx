import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import * as Octicons from '@primer/octicons-react';
import type { SkillTreeNode } from '../lib/types';

interface ExerciseDetailsProps {
  node: SkillTreeNode;
  isSelected: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  panOffset?: { x: number; y: number };
}

export function ExerciseDetails({ node, isSelected, onClose, position, panOffset = { x: 0, y: 0 } }: ExerciseDetailsProps) {
  const { exercise, path } = node;
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  // Calculate safe position that keeps popup visible
  const calculatePosition = () => {
    if (!position) return { top: '1.5rem', right: '1.5rem' };

    const cardWidth = 320; // 80 * 4px (w-80)
    const cardHeight = 400; // Approximate height
    const padding = 20; // Minimum distance from viewport edge

    // Get viewport dimensions (accounting for filter bar)
    const viewportWidth = window.innerWidth - 320; // Subtract filter bar width
    const viewportHeight = window.innerHeight;
    
    // Calculate position with pan offset applied
    let left = position.x + panOffset.x + 60; // Offset to the right of the node
    let top = position.y + panOffset.y - 100; // Offset above the node center

    // Adjust horizontal position if it would overflow
    if (left + cardWidth > viewportWidth - padding) {
      left = position.x + panOffset.x - cardWidth - 60; // Show to the left instead
    }
    if (left < padding + 320) { // Account for filter bar width
      left = padding + 320;
    }

    // Adjust vertical position if it would overflow
    if (top + cardHeight > viewportHeight - padding) {
      top = viewportHeight - cardHeight - padding;
    }
    if (top < padding + 80) { // Account for header height
      top = padding + 80;
    }

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  // Update position when node changes or on mount
  useEffect(() => {
    setPositionStyle(calculatePosition());
  }, [position, node, panOffset]);

  // Recalculate position on resize
  useEffect(() => {
    const updatePosition = () => {
      setPositionStyle(calculatePosition());
    };

    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [position, panOffset]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'tentative': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card 
      className={`
        w-80 border-border bg-card/95 backdrop-blur transition-all duration-200 ease-out
        ${isSelected ? 'z-50 scale-100 opacity-100' : 'z-40 pointer-events-none scale-95 opacity-90'}
      `}
      style={{
        ...positionStyle,
        borderColor: path.color,
        boxShadow: `0 0 24px ${path.color}33`
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: path.color }}
            />
            {exercise.name}
          </CardTitle>
          {isSelected && (
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Octicons.XIcon size={16} />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge className={getStatusColor(exercise.status)}>
            {exercise.status}
          </Badge>
          <Badge variant="outline" style={{ borderColor: path.color, color: path.color }}>
            {path.name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          {exercise.description}
        </p>

        <div className="space-y-3">
          {node.dependencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-1">Prerequisites</h4>
              <div className="flex flex-wrap gap-1">
                {node.dependencies.map(depSlug => (
                  <Badge 
                    key={depSlug} 
                    variant="secondary"
                    className="text-xs"
                  >
                    {depSlug}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {node.dependents.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-1">Unlocks</h4>
              <div className="flex flex-wrap gap-1">
                {node.dependents.slice(0, 3).map(depSlug => (
                  <Badge 
                    key={depSlug} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {depSlug}
                  </Badge>
                ))}
                {node.dependents.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{node.dependents.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {isSelected && (
            <div className="pt-2 border-t border-border">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  style={{ backgroundColor: path.color }}
                  className="text-white hover:opacity-90 transition-opacity"
                  asChild
                >
                  <a 
                    href={exercise.repositoryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Octicons.RepoIcon size={14} className="mr-1" />
                    Repository
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <a 
                    href={exercise.issueUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Octicons.IssueOpenedIcon size={14} className="mr-1" />
                    Issue
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}