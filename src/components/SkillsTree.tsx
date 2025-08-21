import React, { useState, useMemo, useRef, useCallback } from 'react';
import { SkillNode } from './SkillNode';
import { SkillPath } from './SkillPath';
import { ExerciseDetails } from './ExerciseDetails';
import { FilterBar, type FilterState, type SettingsState } from './FilterBar';
import { SearchBar } from './SearchBar';
import { createSkillTreeData } from '../lib/skill-tree-data';
import { applyVisibilityToNodes } from '../lib/filter-utils';
import { nodesToObstacles } from '../lib/path-routing';
import { useKV } from '@github/spark/hooks';
import type { SkillTreeNode } from '../lib/types';

interface SkillsTreeProps {
  exercises: any[];
  paths: any[];
}

export function SkillsTree({ exercises, paths }: SkillsTreeProps) {
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillTreeNode | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    paths: [],
    products: [],
    difficulties: [],
    statuses: ['Active']
  });
  const [settings, setSettings] = useState<SettingsState>({
    isDragModeEnabled: false
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Store custom node positions in persistent storage
  const [customPositions, setCustomPositions] = useKV("node-positions", {});

  // Pan state for drag-to-move functionality
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const skillTreeNodes = useMemo(() => {
    const nodes = createSkillTreeData(exercises, paths);
    return nodes;
  }, [exercises, paths]);

  // Store original positions when skill tree nodes are first created
  const originalPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    skillTreeNodes.forEach(node => {
      positions[node.exercise.slug] = { ...node.position };
    });
    return positions;
  }, [skillTreeNodes]);

  // Apply custom positions to nodes when in drag mode
  const nodesWithCustomPositions = useMemo(() => {
    return skillTreeNodes.map(node => {
      const customPos = customPositions[node.exercise.slug];
      if (customPos && settings.isDragModeEnabled) {
        return { ...node, position: customPos };
      }
      return node;
    });
  }, [skillTreeNodes, customPositions, settings.isDragModeEnabled]);

  // Apply visibility based on filters and search
  const nodesWithVisibility = useMemo(() => 
    applyVisibilityToNodes(nodesWithCustomPositions, filters, searchTerm),
    [nodesWithCustomPositions, filters, searchTerm]
  );

  const handleNodeClick = (node: SkillTreeNode) => {
    // Only allow node selection/details when not in drag mode
    if (!settings.isDragModeEnabled) {
      setSelectedNode(node === selectedNode ? null : node);
    }
  };

  const handleSettingsChange = (newSettings: SettingsState) => {
    setSettings(newSettings);
    
    // If drag mode is disabled, reset positions to original
    if (!newSettings.isDragModeEnabled) {
      setCustomPositions({});
      setSelectedNode(null); // Clear any selected node
    }
  };

  const handleNodeDrag = useCallback((nodeSlug: string, newPosition: { x: number; y: number }) => {
    if (!settings.isDragModeEnabled) return;
    
    // Find the dragged node
    const draggedNode = nodesWithVisibility.find(n => n.exercise.slug === nodeSlug);
    if (!draggedNode) return;
    
    // Calculate the offset from the original position
    const originalPos = originalPositions[nodeSlug] || draggedNode.position;
    const offset = {
      x: newPosition.x - originalPos.x,
      y: newPosition.y - originalPos.y
    };
    
    // Function to recursively find all dependent nodes
    const getAllDependents = (targetSlug: string, visited = new Set<string>()): string[] => {
      if (visited.has(targetSlug)) return []; // Prevent infinite loops
      visited.add(targetSlug);
      
      // Find direct dependents
      const directDependents = nodesWithVisibility
        .filter(node => node.dependencies.includes(targetSlug))
        .map(node => node.exercise.slug);
      
      // Recursively find transitive dependents
      const allDependents = [...directDependents];
      directDependents.forEach(depSlug => {
        allDependents.push(...getAllDependents(depSlug, visited));
      });
      
      return allDependents;
    };
    
    // Get all transitive dependencies
    const allDependentSlugs = getAllDependents(nodeSlug);
    const dependentNodes = nodesWithVisibility.filter(node => 
      allDependentSlugs.includes(node.exercise.slug)
    );
    
    // Update positions for the dragged node and all its dependents
    const newPositions: Record<string, { x: number; y: number }> = {};
    
    // Update the dragged node position
    newPositions[nodeSlug] = newPosition;
    
    // Update dependent node positions with the same offset
    dependentNodes.forEach(depNode => {
      const depOriginalPos = originalPositions[depNode.exercise.slug] || depNode.position;
      newPositions[depNode.exercise.slug] = {
        x: depOriginalPos.x + offset.x,
        y: depOriginalPos.y + offset.y
      };
    });
    
    // Update state with new positions
    setCustomPositions((current) => ({ ...current, ...newPositions }));
    
    // Log position to console
    console.log(`Node ${draggedNode.exercise.name} moved to relative position:`, {
      x: newPosition.x - originalPos.x,
      y: newPosition.y - originalPos.y,
      dependentsMovedCount: dependentNodes.length,
      dependentNodes: dependentNodes.map(n => n.exercise.name)
    });
  }, [settings.isDragModeEnabled, nodesWithVisibility, originalPositions]);

  const handleNodeHover = (node: SkillTreeNode | null) => {
    setHoveredNode(node);
  };

  // Pan/drag functionality - only enabled when drag mode is disabled
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start dragging if clicking on SVG background, not on nodes or other elements
    // AND drag mode is disabled
    const target = e.target as Element;
    if (!settings.isDragModeEnabled && (target.tagName === 'svg' || target.classList.contains('svg-background'))) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: panOffset.x, y: panOffset.y });
      e.preventDefault();
    }
  }, [panOffset, settings.isDragModeEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPanOffset({
        x: panStart.x + deltaX,
        y: panStart.y + deltaY
      });
    }
  }, [isDragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Also handle mouse leave to stop dragging
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Calculate SVG dimensions based on node positions
  const svgDimensions = useMemo(() => {
    const positions = nodesWithVisibility.map(node => node.position);
    const maxX = Math.max(...positions.map(p => p.x)) + 100;
    const maxY = Math.max(...positions.map(p => p.y)) + 100;
    return { width: Math.max(maxX, 1400), height: Math.max(maxY, 1200) };
  }, [nodesWithVisibility]);

  // Get unique colors for marker definitions
  const uniqueColors = useMemo(() => {
    const colors = new Set<string>();
    nodesWithVisibility.forEach(node => {
      // Add colors from dependency nodes (source of paths)
      node.dependencies.forEach(depSlug => {
        const depNode = nodesWithVisibility.find(n => n.exercise.slug === depSlug);
        if (depNode) {
          colors.add(depNode.path.color);
        }
      });
    });
    return Array.from(colors);
  }, [nodesWithVisibility]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Filter Bar */}
      <FilterBar
        exercises={exercises}
        paths={paths}
        filters={filters}
        onFiltersChange={setFilters}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Search Bar - centered on the page with left margin for filter bar */}
      <div className="absolute left-64 right-0 top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-6 py-3">
          <div className="max-w-2xl mx-auto">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        </div>
      </div>

      {/* Main content area with left margin for filter bar and top margin for search */}
      <div 
        ref={containerRef}
        className="h-full ml-64"
        style={{ 
          cursor: settings.isDragModeEnabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          paddingTop: '159px' // Space for header + search bar
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          width={svgDimensions.width}
          height={svgDimensions.height}
          className="absolute top-0 left-0"
          style={{ 
            minWidth: '100%', 
            minHeight: '100vh',
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Background rect for catching mouse events */}
          <rect
            width="100%"
            height="100%"
            fill="transparent"
            className="svg-background"
          />
          {/* Define arrow markers for all path colors */}
          <defs>
            {uniqueColors.map(color => (
              <marker
                key={`arrow-${color.replace('#', '')}`}
                id={`arrow-${color.replace('#', '')}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="3"
                markerUnits="strokeWidth"
                markerWidth="4"
                markerHeight="3"
                orient="auto"
              >
                <path
                  d="M0,0 L0,6 L9,3 z"
                  fill={color}
                  opacity={0.6}
                />
              </marker>
            ))}
          </defs>

          {/* Render skill paths */}
          <g className="skill-paths">
            {nodesWithVisibility.map(node => {
              return node.dependencies.map(depSlug => {
                const depNode = nodesWithVisibility.find(n => n.exercise.slug === depSlug);
                if (!depNode) return null;
                
                // Generate obstacles for this path (exclude source and target nodes)
                const obstacles = nodesToObstacles(
                  nodesWithVisibility, 
                  [depSlug, node.exercise.slug]
                );
                
                return (
                  <SkillPath
                    key={`${depSlug}-${node.exercise.slug}`}
                    from={depNode.position}
                    to={node.position}
                    color={depNode.path.color}
                    isHighlighted={hoveredNode?.exercise.slug === node.exercise.slug || hoveredNode?.exercise.slug === depNode.exercise.slug}
                    obstacles={obstacles}
                  />
                );
              });
            }).flat().filter(Boolean)}
          </g>

          {/* Render skill nodes */}
          <g className="skill-nodes">
            {nodesWithVisibility.map(node => (
              <SkillNode
                key={node.exercise.slug}
                node={node}
                isSelected={selectedNode?.exercise.slug === node.exercise.slug}
                isHighlighted={hoveredNode?.exercise.slug === node.exercise.slug}
                visibility={node.visibility}
                isDragModeEnabled={settings.isDragModeEnabled}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => handleNodeHover(node)}
                onMouseLeave={() => handleNodeHover(null)}
                onDrag={handleNodeDrag}
              />
            ))}
          </g>
        </svg>

        {/* Exercise details panel - only show when not in drag mode */}
        {!settings.isDragModeEnabled && (selectedNode || hoveredNode) && (
          <ExerciseDetails
            node={selectedNode || hoveredNode!}
            isSelected={!!selectedNode}
            onClose={() => setSelectedNode(null)}
            position={(selectedNode || hoveredNode)?.position}
            panOffset={panOffset}
          />
        )}
      </div>
    </div>
  );
}