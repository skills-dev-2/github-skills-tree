import React, { useState, useCallback, useEffect } from 'react';
import * as Octicons from '@primer/octicons-react';
import type { SkillTreeNode } from '../lib/types';
import { UI_CONFIG, EXERCISE_STATUSES } from '../constants';

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
  console.warn(`Icon component "${iconName}" not found in Octicons. Using fallback MarkGithubIcon.`);
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
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  
  // Get the appropriate icon component using the React component name
  const IconComponent = getIconComponent(exercise.icon);
  
  // Use only filter-based visibility (no automatic status dimming)
  const finalOpacity = visibility;
  const nodeRadius = isHighlighted || isSelected ? UI_CONFIG.NODE_RADIUS_HIGHLIGHTED : UI_CONFIG.NODE_RADIUS_DEFAULT;
  const ringRadius = nodeRadius + UI_CONFIG.NODE_RING_OFFSET;
  
  // Use a stable hover area that doesn't change size
  const hoverRadius = UI_CONFIG.NODE_HOVER_RADIUS;
  
  // Check if exercise is in progress
  const isInProgress = exercise.status === EXERCISE_STATUSES.IN_PROGRESS;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isDragModeEnabled) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
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

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
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
      {/* In-progress pulsing ring */}
      {isInProgress && (
        <circle
          r={nodeRadius + 12}
          fill="none"
          stroke={UI_CONFIG.IN_PROGRESS_COLOR}
          strokeWidth="1"
          opacity="0.6"
          className="animate-pulse"
          style={{
            filter: `drop-shadow(0 0 8px ${UI_CONFIG.IN_PROGRESS_COLOR})`,
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
          opacity={isSelected ? 0.8 : 0.5}
          style={{
            transition: 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}
      
      {/* Node background */}
      <circle
        r={nodeRadius}
        fill={isInProgress ? UI_CONFIG.IN_PROGRESS_COLOR : "#21262d"}
        stroke={path.color}
        strokeWidth="2"
        style={{
          filter: isHighlighted 
            ? `drop-shadow(0 0 12px ${path.color})` 
            : `drop-shadow(0 2px 8px rgba(0,0,0,0.3))`,
          transition: isDragging ? 'none' : 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease'
        }}
      />
      
      {/* In-progress progress indicator arc */}
      {isInProgress && (
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
        x={-16}
        y={-16}
        width={32}
        height={32}
      >
        <div className="flex items-center justify-center w-full h-full">
          <IconComponent
            size={UI_CONFIG.NODE_ICON_SIZE}
            style={{ color: isInProgress ? '#ffffff' : path.color }}
          />
        </div>
      </foreignObject>
      

      
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </g>
  );
}