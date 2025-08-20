import React, { useState, useMemo, useRef, useCallback } from 'react';
import { SkillNode } from './SkillNode';
import { SkillPath } from './SkillPath';
import { ExerciseDetails } from './ExerciseDetails';
import { FilterBar, type FilterState, type SettingsState } from './FilterBar';
import { SearchBar } from './SearchBar';
import { createSkillTreeData } from '../lib/skill-tree-data';
import { applyVisibilityToNodes } from '../lib/filter-utils';
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
    statuses: []
  });
  const [settings, setSettings] = useState<SettingsState>({
    enableDragExercises: false
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Pan state for drag-to-move functionality
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Exercise drag positions - store relative positions when dragging is enabled
  const [exercisePositions, setExercisePositions] = useState<Record<string, { x: number; y: number }>>({});

  const skillTreeNodes = useMemo(() => 
    createSkillTreeData(exercises, paths), 
    [exercises, paths]
  );

  // Apply visibility based on filters and search, and adjust positions for dragging
  const nodesWithVisibility = useMemo(() => {
    const visibleNodes = applyVisibilityToNodes(skillTreeNodes, filters, searchTerm);
    
    // Apply custom positions when exercise dragging is enabled
    if (settings.enableDragExercises) {
      return visibleNodes.map(node => {
        const customPos = exercisePositions[node.exercise.slug];
        if (customPos) {
          // Find the node's last dependency to calculate absolute position
          const lastDep = node.dependencies.length > 0 
            ? skillTreeNodes.find(n => n.exercise.slug === node.dependencies[node.dependencies.length - 1])
            : null;
          
          const basePosition = lastDep ? lastDep.position : { x: 0, y: 0 };
          
          return {
            ...node,
            position: {
              x: basePosition.x + customPos.x,
              y: basePosition.y + customPos.y
            }
          };
        }
        return node;
      });
    }
    
    return visibleNodes;
  }, [skillTreeNodes, filters, searchTerm, settings.enableDragExercises, exercisePositions]);

  // Handle settings changes - clear positions when dragging is disabled
  const handleSettingsChange = useCallback((newSettings: SettingsState) => {
    if (!newSettings.enableDragExercises && settings.enableDragExercises) {
      // Dragging was disabled, clear all custom positions
      setExercisePositions({});
    }
    setSettings(newSettings);
  }, [settings.enableDragExercises]);

  const handleNodeClick = (node: SkillTreeNode) => {
    setSelectedNode(node === selectedNode ? null : node);
  };

  const handleNodeHover = (node: SkillTreeNode | null) => {
    setHoveredNode(node);
  };

  // Pan/drag functionality for tree movement
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start tree dragging if exercise dragging is disabled and clicking on SVG background
    if (!settings.enableDragExercises) {
      const target = e.target as Element;
      if (target.tagName === 'svg' || target.classList.contains('svg-background')) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setPanStart({ x: panOffset.x, y: panOffset.y });
        e.preventDefault();
      }
    }
  }, [panOffset, settings.enableDragExercises]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && !settings.enableDragExercises) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPanOffset({
        x: panStart.x + deltaX,
        y: panStart.y + deltaY
      });
    }
  }, [isDragging, dragStart, panStart, settings.enableDragExercises]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Also handle mouse leave to stop dragging
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle exercise node drag functionality
  const handleExerciseDragEnd = useCallback((exerciseSlug: string, newPosition: { x: number; y: number }) => {
    if (!settings.enableDragExercises) return;

    // Find the original node and calculate relative position
    const originalNode = skillTreeNodes.find(n => n.exercise.slug === exerciseSlug);
    if (!originalNode) return;

    // Find the node's last dependency to calculate relative position
    const lastDep = originalNode.dependencies.length > 0 
      ? skillTreeNodes.find(n => n.exercise.slug === originalNode.dependencies[originalNode.dependencies.length - 1])
      : null;
    
    const basePosition = lastDep ? lastDep.position : { x: 0, y: 0 };
    
    const relativePosition = {
      x: newPosition.x - basePosition.x,
      y: newPosition.y - basePosition.y
    };

    console.log(`Exercise ${exerciseSlug} moved to relative position:`, relativePosition);

    // Calculate how much the node actually moved
    const originalAbsolutePos = originalNode.position;
    const deltaX = newPosition.x - originalAbsolutePos.x;
    const deltaY = newPosition.y - originalAbsolutePos.y;

    // Update positions in one batch
    setExercisePositions(prev => {
      const newPositions = { ...prev };
      
      // Update the dragged exercise
      newPositions[exerciseSlug] = relativePosition;
      
      // Find all exercises that depend on this one and move them by the same delta
      const dependentExercises = skillTreeNodes.filter(node => 
        node.dependencies.includes(exerciseSlug)
      );

      dependentExercises.forEach(depNode => {
        // Calculate the dependent node's current position (considering any custom positions)
        const currentCustomPos = prev[depNode.exercise.slug];
        let currentAbsolutePos;
        
        if (currentCustomPos) {
          // If this dependent node has been manually positioned, use its custom position
          const depLastDep = depNode.dependencies.length > 0 
            ? skillTreeNodes.find(n => n.exercise.slug === depNode.dependencies[depNode.dependencies.length - 1])
            : null;
          const depBasePosition = depLastDep ? depLastDep.position : { x: 0, y: 0 };
          currentAbsolutePos = {
            x: depBasePosition.x + currentCustomPos.x,
            y: depBasePosition.y + currentCustomPos.y
          };
        } else {
          // Use the original position from the tree data
          currentAbsolutePos = depNode.position;
        }
        
        // Move the dependent by the same amount as the parent
        const newAbsolutePos = {
          x: currentAbsolutePos.x + deltaX,
          y: currentAbsolutePos.y + deltaY
        };

        // Calculate relative position for the dependent
        const depLastDep = depNode.dependencies.length > 0 
          ? skillTreeNodes.find(n => n.exercise.slug === depNode.dependencies[depNode.dependencies.length - 1])
          : null;
        const depBasePosition = depLastDep ? depLastDep.position : { x: 0, y: 0 };
        
        const newRelativePos = {
          x: newAbsolutePos.x - depBasePosition.x,
          y: newAbsolutePos.y - depBasePosition.y
        };

        newPositions[depNode.exercise.slug] = newRelativePos;
      });

      return newPositions;
    });
  }, [settings.enableDragExercises, skillTreeNodes]);

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
      colors.add(node.path.color);
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
          cursor: isDragging ? 'grabbing' : (settings.enableDragExercises ? 'default' : 'grab'),
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
                
                return (
                  <SkillPath
                    key={`${depSlug}-${node.exercise.slug}`}
                    from={depNode.position}
                    to={node.position}
                    color={node.path.color}
                    isHighlighted={hoveredNode?.exercise.slug === node.exercise.slug || hoveredNode?.exercise.slug === depNode.exercise.slug}
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
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => handleNodeHover(node)}
                onMouseLeave={() => handleNodeHover(null)}
                enableDrag={settings.enableDragExercises}
                onDragEnd={handleExerciseDragEnd}
              />
            ))}
          </g>
        </svg>

        {/* Exercise details panel */}
        {(selectedNode || hoveredNode) && (
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