import { useMemo } from 'react';
import type { SkillTreeNode } from '../lib/types';

/**
 * Custom hook for managing SVG dimensions based on node positions
 * Ensures all nodes are visible with appropriate padding
 */
export function useSvgDimensions(
  nodes: SkillTreeNode[],
  padding: number = 80,
  minWidth: number = 1400,
  minHeight: number = 1200
) {
  return useMemo(() => {
    const positions = nodes.map(node => node.position);
    
    if (positions.length === 0) {
      return {
        width: minWidth,
        height: minHeight,
        offsetX: 0,
        offsetY: 0
      };
    }
    
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    const width = Math.max(maxX - Math.min(minX, 0) + padding * 2, minWidth);
    const height = Math.max(maxY - Math.min(minY, 0) + padding * 2, minHeight);
    
    return { 
      width, 
      height, 
      offsetX: Math.min(minX, 0) - padding, 
      offsetY: Math.min(minY, 0) - padding 
    };
  }, [nodes, padding, minWidth, minHeight]);
}

/**
 * Custom hook for generating unique arrow markers based on node visibility and colors
 */
export function useArrowMarkers(nodes: SkillTreeNode[]) {
  return useMemo(() => {
    const markers = new Map<string, { color: string; visibility: number }>();
    
    nodes.forEach(node => {
      // Add markers for dependency nodes (source of paths)
      node.dependencies.forEach(depSlug => {
        const depNode = nodes.find(n => n.exercise.slug === depSlug);
        if (depNode) {
          const visibility = node.visibility ?? 1;
          const key = `${depNode.path.color}-${Math.round(visibility * 100)}`;
          markers.set(key, { 
            color: depNode.path.color, 
            visibility 
          });
        }
      });
    });
    
    return Array.from(markers.entries()).map(([key, value]) => ({ key, ...value }));
  }, [nodes]);
}