import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { SkillNode } from './SkillNode';
import { SkillPath } from './SkillPath';
import { ExerciseDetails } from './ExerciseDetails';
import { FilterBar, type FilterState } from './FilterBar';
import { SettingsPanel, type SettingsState } from './SettingsPanel';
import { SearchBar } from './SearchBar';
import { Button } from './ui/button';
import { Funnel, Gear } from '@phosphor-icons/react';
import { createSkillTreeData } from '../lib/skill-tree-data';
import { applyVisibilityToNodes } from '../lib/filter-utils';
import { nodesToObstacles } from '../lib/path-routing';
import { calculateDraggedPositions, logDragOperation } from '../lib/drag-utils';
import { useKV } from '@github/spark/hooks';
import { DEFAULT_CACHE_CONFIG, persistentCache } from '../lib/persistent-cache';
import { logger } from '../lib/console-logger';
import { useSvgDimensions, useArrowMarkers } from '../hooks/use-svg-utils';
import { useResponsive } from '../hooks/use-responsive';
import { UI_CONFIG, FILTER_DEFAULTS } from '../constants';

import type { SkillTreeNode } from '../lib/types';

interface SkillsTreeProps {
  exercises: any[];
  paths: any[];
  exerciseCount: number;
  pathCount: number;
}

export function SkillsTree({ exercises, paths, exerciseCount, pathCount }: SkillsTreeProps) {
  const { isMobile } = useResponsive();
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SkillTreeNode | null>(null);
  // Initialize filters with default values
  const [filters, setFilters] = useState<FilterState>({
    paths: [],
    products: [],
    difficulties: [],
    statuses: [...FILTER_DEFAULTS.STATUSES]
  });
  const [settings, setSettings] = useState<SettingsState>({
    isDragModeEnabled: false,
    showApiMonitor: false,
    consoleLogLevel: 'info',
    cacheConfig: { ...DEFAULT_CACHE_CONFIG }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  
  // Settings button visibility state (persisted)
  const [isSettingsButtonVisible, setIsSettingsButtonVisible] = useKV('settings-button-visible', false);
  
  // Title click tracking for settings toggle
  const [titleClickCount, setTitleClickCount] = useState(0);
  const titleClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store custom node positions in persistent storage
  const [customPositions, setCustomPositions] = useKV("node-positions", {});

  // Load stored settings and initialize logger
  const [storedSettings] = useKV("app-settings", null);
  
  useEffect(() => {
    if (storedSettings) {
      const mergedSettings = { 
        ...settings, 
        ...storedSettings,
        cacheConfig: { ...DEFAULT_CACHE_CONFIG, ...(storedSettings.cacheConfig || {}) }
      };
      setSettings(mergedSettings);
      logger.setLevel(mergedSettings.consoleLogLevel);
      
      // Initialize persistent cache configuration
      persistentCache.updateConfig(mergedSettings.cacheConfig);
    } else {
      // Initialize with defaults if no stored settings
      logger.setLevel(settings.consoleLogLevel);
      persistentCache.updateConfig(settings.cacheConfig);
    }
  }, [storedSettings]);

  // Pan state for drag-to-move functionality (when not in drag mode)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Processes skill tree data and applies custom positions when in drag mode
   */

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
    
    // Update logger level when console log level changes
    logger.setLevel(newSettings.consoleLogLevel);
    
    // If drag mode is disabled, reset positions to original
    if (!newSettings.isDragModeEnabled) {
      setCustomPositions({});
      setSelectedNode(null); // Clear any selected node
    }
  };

  /**
   * Handles node drag operations by calculating new positions for the dragged node
   * and all its transitive dependents
   */
  const handleNodeDrag = useCallback((nodeSlug: string, newPosition: { x: number; y: number }) => {
    if (!settings.isDragModeEnabled) return;
    
    const draggedNode = nodesWithVisibility.find(n => n.exercise.slug === nodeSlug);
    if (!draggedNode) return;
    
    // Calculate new positions using utility function
    const newPositions = calculateDraggedPositions(nodeSlug, newPosition, nodesWithVisibility);
    
    // Update state with new positions
    setCustomPositions((current) => ({ ...current, ...newPositions }));
    
    // Log the operation for debugging
    const offset = {
      x: newPosition.x - draggedNode.position.x,
      y: newPosition.y - draggedNode.position.y
    };
    const dependentSlugs = Object.keys(newPositions).filter(slug => slug !== nodeSlug);
    const dependentNodes = nodesWithVisibility.filter(node => 
      dependentSlugs.includes(node.exercise.slug)
    );
    
    logDragOperation(draggedNode, offset, newPosition, dependentNodes);
  }, [settings.isDragModeEnabled, nodesWithVisibility]);

  const handleNodeHover = (node: SkillTreeNode | null) => {
    setHoveredNode(node);
  };

  /**
   * Handles mouse events for panning the entire tree (only when drag mode is disabled)
   */
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

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Touch event handlers for mobile panning support
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start dragging if touching SVG background and drag mode is disabled
    const target = e.target as Element;
    if (!settings.isDragModeEnabled && (target.tagName === 'svg' || target.classList.contains('svg-background'))) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setPanStart({ x: panOffset.x, y: panOffset.y });
      e.preventDefault();
    }
  }, [panOffset, settings.isDragModeEnabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      setPanOffset({
        x: panStart.x + deltaX,
        y: panStart.y + deltaY
      });
      e.preventDefault(); // Prevent scrolling
    }
  }, [isDragging, dragStart, panStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle rapid title clicks to toggle settings button visibility
   */
  const handleTitleClick = useCallback(() => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    
    // Clear existing timeout
    if (titleClickTimeoutRef.current) {
      clearTimeout(titleClickTimeoutRef.current);
    }
    
    // Check if we've reached 5 clicks
    if (newCount >= 5) {
      setIsSettingsButtonVisible((current) => !current);
      setTitleClickCount(0);
      logger.debug('Settings button visibility toggled via title clicks');
    } else {
      // Reset counter after 3 seconds
      titleClickTimeoutRef.current = setTimeout(() => {
        setTitleClickCount(0);
      }, 3000);
    }
  }, [titleClickCount, setIsSettingsButtonVisible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (titleClickTimeoutRef.current) {
        clearTimeout(titleClickTimeoutRef.current);
      }
    };
  }, []);

  // Close settings panel when button becomes hidden
  useEffect(() => {
    if (!isSettingsButtonVisible && isSettingsVisible) {
      setIsSettingsVisible(false);
    }
  }, [isSettingsButtonVisible, isSettingsVisible]);

  /**
   * Calculates SVG dimensions based on node positions with responsive padding
   */
  const svgDimensions = useSvgDimensions(
    nodesWithVisibility, 
    isMobile ? UI_CONFIG.SVG_PADDING_MOBILE : UI_CONFIG.SVG_PADDING,
    isMobile ? UI_CONFIG.MIN_SVG_WIDTH_MOBILE : UI_CONFIG.MIN_SVG_WIDTH,
    isMobile ? UI_CONFIG.MIN_SVG_HEIGHT_MOBILE : UI_CONFIG.MIN_SVG_HEIGHT
  );

  /**
   * Creates unique marker definitions for path arrows with different colors and opacity
   */
  const uniqueMarkers = useArrowMarkers(nodesWithVisibility);

  return (
    <div className="relative w-full h-screen overflow-auto bg-background">
      {/* Filter Bar - responsive positioning */}
      {isFiltersVisible && (
        <FilterBar
          exercises={exercises}
          paths={paths}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setIsFiltersVisible(false)}
        />
      )}

      {/* Settings Panel - positioned on the right, only when button is visible */}
      {isSettingsVisible && isSettingsButtonVisible && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setIsSettingsVisible(false)}
        />
      )}

      {/* Compact Header with integrated search and controls */}
      <div className="absolute right-0 top-0 left-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Title Section - more compact and clickable */}
            <div className="min-w-0 flex-shrink-0">
              <h1 
                className="text-base sm:text-xl font-bold text-foreground truncate select-none"
                onClick={handleTitleClick}
                title="Click 5 times quickly to toggle settings"
              >
                GitHub Skills Roadmap
              </h1>
            </div>
            
            {/* Spacer for desktop */}
            <div className="flex-1 hidden sm:block" />
            
            {/* Control buttons and search in single row */}
            <div className="flex items-center gap-2 flex-1 sm:flex-none sm:min-w-[400px] lg:min-w-[500px]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className={`w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-full shadow-lg hover:shadow-xl transition-all flex-shrink-0 ${
                  isFiltersVisible ? 'bg-primary text-primary-foreground' : ''
                }`}
                title="Toggle Filters"
              >
                <Funnel size={16} className="sm:hidden" />
                <Funnel size={18} className="hidden sm:block" />
              </Button>
              {isSettingsButtonVisible && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSettingsVisible(!isSettingsVisible)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-full shadow-lg hover:shadow-xl transition-all flex-shrink-0 ${
                    isSettingsVisible ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  title="Toggle Settings"
                >
                  <Gear size={16} className="sm:hidden" />
                  <Gear size={18} className="hidden sm:block" />
                </Button>
              )}
              <div className="flex-1">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  placeholder={`${exerciseCount} exercises • ${pathCount} learning paths`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with top margin for combined header */}
      <div 
        ref={containerRef}
        className="h-full"
        style={{ 
          cursor: settings.isDragModeEnabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          paddingTop: `${isMobile ? UI_CONFIG.TOTAL_TOP_PADDING_MOBILE : UI_CONFIG.TOTAL_TOP_PADDING}px`
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
          onTouchStart={handleTouchStart}
        >
          {/* Background rect for catching mouse events */}
          <rect
            width="100%"
            height="100%"
            fill="transparent"
            className="svg-background"
          />
          {/* Define arrow markers for all path color-visibility combinations */}
          <defs>
            {uniqueMarkers.map(({ key, color, visibility }) => {
              const baseOpacity = 0.6;
              const markerOpacity = baseOpacity * visibility;
              return (
                <marker
                  key={key}
                  id={`arrow-${color.replace('#', '')}-${Math.round(visibility * 100)}`}
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
                    opacity={markerOpacity}
                  />
                </marker>
              );
            })}
          </defs>

          {/* Render skill paths */}
          <g className="skill-paths" transform={`translate(${-svgDimensions.offsetX}, ${-svgDimensions.offsetY})`}>
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
                    targetVisibility={node.visibility}
                  />
                );
              });
            }).flat().filter(Boolean)}
          </g>

          {/* Render skill nodes */}
          <g className="skill-nodes" transform={`translate(${-svgDimensions.offsetX}, ${-svgDimensions.offsetY})`}>
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
            svgOffset={{ x: svgDimensions.offsetX, y: svgDimensions.offsetY }}
          />
        )}
      </div>
    </div>
  );
}