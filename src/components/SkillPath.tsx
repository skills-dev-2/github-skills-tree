import React from 'react';
import { calculateAvoidancePath, type Point, type ObstacleNode } from '../lib/path-routing';

interface SkillPathProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  isHighlighted: boolean;
  obstacles?: ObstacleNode[];
}

export function SkillPath({ from, to, color, isHighlighted, obstacles = [] }: SkillPathProps) {
  // Calculate path that avoids obstacles
  const createPath = (start: Point, end: Point) => {
    const pathPoints = calculateAvoidancePath(start, end, obstacles);
    
    // Convert points to SVG path string
    if (pathPoints.length === 0) return '';
    
    let pathData = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      pathData += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
    }
    
    return pathData;
  };

  const pathData = createPath(from, to);
  const strokeWidth = isHighlighted ? 3 : 2;
  const opacity = isHighlighted ? 0.9 : 0.6;

  return (
    <g className="skill-path">
      {/* Background path for glow effect */}
      {isHighlighted && (
        <path
          d={pathData}
          stroke={color}
          strokeWidth={strokeWidth + 4}
          fill="none"
          opacity={0.3}
          style={{
            filter: `blur(2px)`
          }}
        />
      )}
      
      {/* Main path with arrow marker */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#arrow-${color.replace('#', '')})`}
        style={{
          transition: 'all 0.3s ease',
        }}
      />
    </g>
  );
}