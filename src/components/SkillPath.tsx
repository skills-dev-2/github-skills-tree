import React from 'react';

interface SkillPathProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  isHighlighted: boolean;
}

export function SkillPath({ from, to, color, isHighlighted }: SkillPathProps) {
  // Create path using only vertical and horizontal lines, connecting from bottom of 'from' node to top of 'to' node
  const createPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    // Start from bottom of the source node (add 30px offset for node radius)
    const startPoint = { x: start.x, y: start.y + 30 };
    // End at top of the target node (subtract 30px offset for node radius)
    const endPoint = { x: end.x, y: end.y - 30 };
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    // Always use vertical then horizontal for top-down flow
    if (dy > 0) {
      // Moving downward - go down then across
      const midY = startPoint.y + dy * 0.6;
      return `M ${startPoint.x} ${startPoint.y} L ${startPoint.x} ${midY} L ${endPoint.x} ${midY} L ${endPoint.x} ${endPoint.y}`;
    } else {
      // Moving upward - go across then down
      const midX = startPoint.x + dx * 0.5;
      return `M ${startPoint.x} ${startPoint.y} L ${midX} ${startPoint.y} L ${midX} ${endPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }
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