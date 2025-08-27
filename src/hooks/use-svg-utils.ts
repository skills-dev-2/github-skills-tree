import { useMemo } from 'react';
import type { SkillTreeNode } from '../lib/types';

/**
 * Custom hook for managing SVG dimensions based on node positions and viewport constraints
 * Ensures all nodes are visible with appropriate padding while fitting within the available space
 */
export function useSvgDimensions(
  nodes: SkillTreeNode[],
  padding: number = 80,
  minWidth: number = 1400,
  minHeight: number = 1200,
  viewportWidth?: number,
  viewportHeight?: number,
  headerHeight: number = 64
) {
  return useMemo(() => {
    const positions = nodes.map(node => node.position);
    
    if (positions.length === 0) {
      const availableWidth = viewportWidth || minWidth;
      const availableHeight = (viewportHeight || minHeight) - headerHeight;
      
      return {
        width: availableWidth,
        height: availableHeight,
        offsetX: 0,
        offsetY: 0
      };
    }
    
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    // Calculate required dimensions based on content
    const contentWidth = maxX - Math.min(minX, 0) + padding * 2;
    const contentHeight = maxY - Math.min(minY, 0) + padding * 2;
    
    // Use viewport constraints if available, otherwise use minimum dimensions
    const availableWidth = viewportWidth || minWidth;
    const availableHeight = (viewportHeight || minHeight) - headerHeight;
    
    // Ensure we use the full available space
    const width = Math.max(contentWidth, availableWidth);
    const height = Math.max(contentHeight, availableHeight);
    
    return { 
      width, 
      height, 
      offsetX: Math.min(minX, 0) - padding, 
      offsetY: Math.min(minY, 0) - padding 
    };
  }, [nodes, padding, minWidth, minHeight, viewportWidth, viewportHeight, headerHeight]);
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