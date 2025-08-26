import React, { useState, useCallback, useEffect } from 'react';
import * as Octicons from '@primer/octicons-react';
import type { SkillTreeNode } from '../lib/types';
import { UI_CONFIG, EXERCISE_STATUSES } from '../constants';
import { useResponsive } from '../hooks/use-responsive';
import { logger } from '../lib/console-logger';

interface SkillNodeProps {
  node: SkillTreeNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDrag: (nodeSlug: string, position: { x: number; y: number }) => void;
  isDragModeEnabled: boolean;
  visibility?: number; // 0 = fully dimmed, 1 = fully visible
}

/**
 * Retrieves the appropriate Octicon component by name
 * Handles both direct component names and backward compatibility
 * 
 * @param iconName - The name of the icon (e.g., "WorkflowIcon" or "workflow")
 * @returns The React component for the icon, or fallback if not found
 */
function getIconComponent(iconName: string): React.ComponentType<any> {
  // If iconName is already a component name (e.g., "WorkflowIcon"), use it directly
  if (iconName && (Octicons as any)[iconName]) {
    return (Octicons as any)[iconName];
  }
  
  // If not found, try adding "Icon" suffix for backward compatibility
  const iconWithSuffix = iconName.endsWith('Icon') ? iconName : iconName + 'Icon';
  if ((Octicons as any)[iconWithSuffix]) {
    return (Octicons as any)[iconWithSuffix];
  }
  
  // Log warning and return fallback
  logger.warn(`Icon component "${iconName}" not found in Octicons, using fallback MarkGithubIcon`);
  return Octicons.MarkGithubIcon;
}

export function SkillNode({ 
  node, 
  isSelected, 
  isHighlighted, 
  onClick, 
  onMouseEnter, 
  onMouseLeave,
  onDrag,
  isDragModeEnabled,
  visibility = 1
}: SkillNodeProps) {
  const { exercise, path, position } = node;
  const { isMobile } = useResponsive();
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  
  // Get the appropriate icon component using the React component name
  const IconComponent = getIconComponent(exercise.icon);
  
  // Use responsive sizing
  const nodeRadiusDefault = isMobile ? UI_CONFIG.NODE_RADIUS_DEFAULT_MOBILE : UI_CONFIG.NODE_RADIUS_DEFAULT;
  const nodeRadiusHighlighted = isMobile ? UI_CONFIG.NODE_RADIUS_HIGHLIGHTED_MOBILE : UI_CONFIG.NODE_RADIUS_HIGHLIGHTED;
  const hoverRadius = isMobile ? UI_CONFIG.NODE_HOVER_RADIUS_MOBILE : UI_CONFIG.NODE_HOVER_RADIUS;
  const iconSize = isMobile ? UI_CONFIG.NODE_ICON_SIZE_MOBILE : UI_CONFIG.NODE_ICON_SIZE;
  
  // Use only filter-based visibility (no automatic status dimming)
  const finalOpacity = visibility;
  const nodeRadius = isHighlighted || isSelected ? nodeRadiusHighlighted : nodeRadiusDefault;
  const ringRadius = nodeRadius + UI_CONFIG.NODE_RING_OFFSET;
  
  // Check exercise status
  const isDevelopment = exercise.status === EXERCISE_STATUSES.DEVELOPMENT;
  const isTentative = exercise.status === EXERCISE_STATUSES.TENTATIVE;
  const isScheduled = exercise.status === EXERCISE_STATUSES.SCHEDULED;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isDragModeEnabled) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPosition({ x: position.x, y: position.y });
      e.stopPropagation();
      e.preventDefault();
    }
  }, [isDragModeEnabled, position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDragModeEnabled) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setInitialPosition({ x: position.x, y: position.y });
      e.stopPropagation();
      e.preventDefault();
    }
  }, [isDragModeEnabled, position]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragModeEnabled && !isDragging) {
      onClick();
    }
  }, [isDragModeEnabled, isDragging, onClick]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    // Only trigger click if we're not in drag mode and not currently dragging
    if (!isDragModeEnabled && !isDragging) {
      onClick();
    }
    setIsDragging(false); // Always stop dragging on touch end
  }, [isDragModeEnabled, isDragging, onClick]);

  // Handle mouse move and up events globally when dragging
  useEffect(() => {
    if (!isDragging || !isDragModeEnabled) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const newPosition = {
        x: initialPosition.x + deltaX,
        y: initialPosition.y + deltaY
      };
      onDrag(exercise.slug, newPosition);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;
        const newPosition = {
          x: initialPosition.x + deltaX,
          y: initialPosition.y + deltaY
        };
        onDrag(exercise.slug, newPosition);
        e.preventDefault(); // Prevent scrolling
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, isDragModeEnabled, dragStart, initialPosition, exercise.slug, onDrag]);

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      className="skill-node"
      style={{ 
        opacity: finalOpacity,
        cursor: isDragModeEnabled ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
      }}
    >
      {/* Development pulsing ring */}
      {isDevelopment && (
        <circle
          r={nodeRadius + 12}
          fill="none"
          stroke={UI_CONFIG.DEVELOPMENT_COLOR}
          strokeWidth="1"
          opacity="0.6"
          className="animate-pulse"
          style={{
            filter: `drop-shadow(0 0 8px ${UI_CONFIG.DEVELOPMENT_COLOR})`,
          }}
        />
      )}
      
      {/* Selection ring */}
      {(isSelected || isHighlighted) && (
        <circle
          r={ringRadius}
          fill="none"
          stroke={path.color}
          strokeWidth="2"
          strokeDasharray={isTentative || isScheduled ? "5,3" : "none"}
          opacity={isSelected ? 0.8 : 0.5}
          style={{
            transition: 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}
      
      {/* Node background */}
      <circle
        r={nodeRadius}
        fill={isDevelopment ? UI_CONFIG.DEVELOPMENT_COLOR : "#21262d"}
        stroke={path.color}
        strokeWidth="2"
        strokeDasharray={isTentative || isScheduled ? "5,3" : "none"}
        style={{
          filter: isHighlighted 
            ? `drop-shadow(0 0 12px ${path.color})` 
            : `drop-shadow(0 2px 8px rgba(0,0,0,0.3))`,
          transition: isDragging ? 'none' : 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease'
        }}
      />
      
      {/* Development progress indicator arc */}
      {isDevelopment && (
        <>
          {/* Background arc */}
          <circle
            r={nodeRadius - 4}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          {/* Animated progress arc */}
          <circle
            r={nodeRadius - 4}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * (nodeRadius - 4) * 0.6} ${2 * Math.PI * (nodeRadius - 4)}`}
            strokeDashoffset="0"
            style={{
              animation: `progress-spin ${UI_CONFIG.PROGRESS_SPIN_DURATION}s linear infinite`,
              transformOrigin: '0 0'
            }}
          />
        </>
      )}
      
      {/* Icon */}
      <foreignObject
        x={isMobile ? -12 : -16}
        y={isMobile ? -12 : -16}
        width={isMobile ? 24 : 32}
        height={isMobile ? 24 : 32}
      >
        <div className="flex items-center justify-center w-full h-full">
          <IconComponent
            size={iconSize}
            style={{ color: isDevelopment ? '#ffffff' : path.color }}
          />
        </div>
      </foreignObject>
      
      {/* Calendar icon for scheduled exercises */}
      {isScheduled && (
        <foreignObject
          x={nodeRadius * 0.5}
          y={-nodeRadius * 0.8}
          width={isMobile ? 16 : 20}
          height={isMobile ? 16 : 20}
        >
          <div className="flex items-center justify-center w-full h-full bg-card rounded-sm border border-border">
            <Octicons.CalendarIcon
              size={isMobile ? 10 : 12}
              style={{ color: path.color }}
            />
          </div>
        </foreignObject>
      )}
      

      
      {/* Exercise name - only show on hover/selection when not in drag mode */}
      {!isDragModeEnabled && (isHighlighted || isSelected) && (
        <text
          y={nodeRadius + 20}
          textAnchor="middle"
          className="fill-foreground text-sm font-medium"
          style={{ userSelect: 'none' }}
        >
          {exercise.name}
        </text>
      )}
      
      {/* Interactive area */}
      <circle
        r={hoverRadius}
        fill="transparent"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </g>
  );
}