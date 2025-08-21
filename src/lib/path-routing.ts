import type { SkillTreeNode } from './types';

export interface Point {
  x: number;
  y: number;
}

export interface ObstacleNode {
  x: number;
  y: number;
  radius: number;
}

/**
 * Calculate optimal path between two nodes that avoids overlapping with other nodes
 */
export function calculateAvoidancePath(
  from: Point,
  to: Point,
  obstacles: ObstacleNode[],
  nodeRadius: number = 30
): Point[] {
  // Start from bottom of source node, end at top of target node
  const startPoint = { x: from.x, y: from.y + nodeRadius };
  const endPoint = { x: to.x, y: to.y - nodeRadius };

  // Use a clearance buffer to ensure paths don't get too close to nodes
  const clearance = 15; // Additional clearance beyond node radius

  // If no obstacles or direct path doesn't intersect any obstacles, use simple routing
  if (obstacles.length === 0 || !pathIntersectsObstacles(getDirectPath(startPoint, endPoint), obstacles, clearance)) {
    return getDirectPath(startPoint, endPoint);
  }

  // Use pathfinding to route around obstacles
  return findPathAroundObstacles(startPoint, endPoint, obstacles, clearance);
}

/**
 * Generate a simple orthogonal path (vertical then horizontal)
 */
function getDirectPath(start: Point, end: Point): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dy > 0) {
    // Moving downward - go down then across
    const midY = start.y + dy * 0.6;
    return [
      start,
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      end
    ];
  } else {
    // Moving upward - go across then down
    const midX = start.x + dx * 0.5;
    return [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end
    ];
  }
}

/**
 * Check if a path intersects with any obstacles
 */
function pathIntersectsObstacles(
  path: Point[], 
  obstacles: ObstacleNode[], 
  clearance: number
): boolean {
  if (path.length < 2 || obstacles.length === 0) return false;
  
  for (let i = 0; i < path.length - 1; i++) {
    const segment = { start: path[i], end: path[i + 1] };
    
    for (const obstacle of obstacles) {
      if (lineIntersectsCircle(segment.start, segment.end, obstacle, clearance)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a line segment intersects with a circle (node)
 */
function lineIntersectsCircle(
  lineStart: Point, 
  lineEnd: Point, 
  circle: ObstacleNode, 
  clearance: number
): boolean {
  const radius = circle.radius + clearance;
  
  // Vector from line start to line end
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // Handle degenerate case where line has no length
  if (dx === 0 && dy === 0) {
    const distance = Math.sqrt(
      Math.pow(lineStart.x - circle.x, 2) + 
      Math.pow(lineStart.y - circle.y, 2)
    );
    return distance <= radius;
  }
  
  // Vector from line start to circle center
  const fx = lineStart.x - circle.x;
  const fy = lineStart.y - circle.y;
  
  // Quadratic equation coefficients for line-circle intersection
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = (fx * fx + fy * fy) - radius * radius;
  
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    return false; // No intersection
  }
  
  // Check if intersection points are within the line segment
  const discriminantSqrt = Math.sqrt(discriminant);
  const t1 = (-b - discriminantSqrt) / (2 * a);
  const t2 = (-b + discriminantSqrt) / (2 * a);
  
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

/**
 * Find path around obstacles using a simplified pathfinding approach
 */
function findPathAroundObstacles(
  start: Point,
  end: Point,
  obstacles: ObstacleNode[],
  clearance: number
): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Simple strategy: try different routing patterns
  const routingStrategies = [
    // Original L-shaped routing
    dy > 0 ? 
      [start, { x: start.x, y: start.y + dy * 0.6 }, { x: end.x, y: start.y + dy * 0.6 }, end] :
      [start, { x: start.x + dx * 0.5, y: start.y }, { x: start.x + dx * 0.5, y: end.y }, end],
    
    // Try going horizontal first
    [start, { x: end.x, y: start.y }, end],
    
    // Try vertical offset routing
    [start, { x: start.x, y: end.y }, end],
    
    // Try wider arc
    dy > 0 ?
      [start, { x: start.x, y: start.y + dy * 0.3 }, { x: end.x, y: start.y + dy * 0.3 }, end] :
      [start, { x: start.x + dx * 0.7, y: start.y }, { x: start.x + dx * 0.7, y: end.y }, end]
  ];

  // Find first strategy that doesn't intersect obstacles
  for (const strategy of routingStrategies) {
    if (!pathIntersectsObstacles(strategy, obstacles, clearance)) {
      return strategy;
    }
  }
  
  // Fallback: return original direct path
  return getDirectPath(start, end);
}

/**
 * Convert nodes to obstacles for pathfinding
 * Note: We ignore visibility to ensure consistent line paths regardless of filter state
 */
export function nodesToObstacles(
  nodes: (SkillTreeNode & { visibility: number })[],
  excludeNodes: string[] = []
): ObstacleNode[] {
  return nodes
    .filter(node => !excludeNodes.includes(node.exercise.slug))
    .map(node => ({
      x: node.position.x,
      y: node.position.y,
      radius: 30 // Standard node radius
    }));
}