import type { SkillTreeNode } from './types';

/**
 * Finds all transitive dependent nodes (nodes that depend on the target node)
 * Uses DFS to build the complete dependency tree
 * 
 * @param targetSlug The slug of the node to find dependents for
 * @param allNodes All available nodes in the skill tree
 * @param visited Set to track visited nodes and prevent infinite loops
 * @returns Array of slugs for all nodes that transitively depend on the target
 */
export function getAllTransitiveDependents(
  targetSlug: string, 
  allNodes: SkillTreeNode[], 
  visited = new Set<string>()
): string[] {
  if (visited.has(targetSlug)) return []; // Prevent infinite loops
  visited.add(targetSlug);
  
  // Find direct dependents (nodes that depend on targetSlug)
  const directDependents = allNodes
    .filter(node => node.dependencies.includes(targetSlug))
    .map(node => node.exercise.slug);
  
  // Recursively find transitive dependents and build complete set
  const allDependents = new Set(directDependents);
  
  directDependents.forEach(depSlug => {
    const transitiveDependents = getAllTransitiveDependents(depSlug, allNodes, visited);
    transitiveDependents.forEach(slug => allDependents.add(slug));
  });
  
  return Array.from(allDependents);
}

/**
 * Calculates new positions for a dragged node and all its dependents
 * 
 * @param draggedNodeSlug The slug of the node being dragged
 * @param newPosition The new position for the dragged node
 * @param currentNodes Current state of all nodes with their positions
 * @returns Object mapping node slugs to their new positions
 */
export function calculateDraggedPositions(
  draggedNodeSlug: string,
  newPosition: { x: number; y: number },
  currentNodes: SkillTreeNode[]
): Record<string, { x: number; y: number }> {
  const draggedNode = currentNodes.find(n => n.exercise.slug === draggedNodeSlug);
  if (!draggedNode) return {};
  
  // Calculate the offset from the current position
  const offset = {
    x: newPosition.x - draggedNode.position.x,
    y: newPosition.y - draggedNode.position.y
  };
  
  // Get all transitive dependents
  const dependentSlugs = getAllTransitiveDependents(draggedNodeSlug, currentNodes);
  const dependentNodes = currentNodes.filter(node => 
    dependentSlugs.includes(node.exercise.slug)
  );
  
  // Calculate new positions
  const newPositions: Record<string, { x: number; y: number }> = {};
  
  // Update the dragged node position
  newPositions[draggedNodeSlug] = newPosition;
  
  // Update dependent node positions with the same offset
  dependentNodes.forEach(depNode => {
    newPositions[depNode.exercise.slug] = {
      x: depNode.position.x + offset.x,
      y: depNode.position.y + offset.y
    };
  });
  
  return newPositions;
}

/**
 * Logs drag operation details to console for debugging
 */
export function logDragOperation(
  draggedNode: SkillTreeNode,
  offset: { x: number; y: number },
  newPosition: { x: number; y: number },
  dependentNodes: SkillTreeNode[]
): void {
  console.log(`Node ${draggedNode.exercise.name} moved by offset:`, {
    offsetX: offset.x,
    offsetY: offset.y,
    newPosition: newPosition,
    dependentsMovedCount: dependentNodes.length,
    dependentNodes: dependentNodes.map(n => n.exercise.name)
  });
}