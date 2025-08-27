import type { Exercise, Path, SkillTreeNode } from '../lib/types';

// Create skill tree data directly from exercises and paths with embedded mapping
export function createSkillTreeData(exercises: Exercise[], paths: Path[]): SkillTreeNode[] {
  const pathMap = new Map(paths.map(path => [path.slug, path]));
  
  // First pass: create nodes without calculated positions
  const nodes: SkillTreeNode[] = exercises.map((exercise, index) => {
    const pathSlug = exercise.pathSlug;
    const dependencies = exercise.dependencies || [];
    
    // Find the path for this exercise, or use the first available path as fallback
    let path: Path;
    if (pathSlug && pathMap.has(pathSlug)) {
      path = pathMap.get(pathSlug)!;
    } else if (paths.length > 0) {
      path = paths[0];
    } else {
      // Create a default path only if no paths are available at all
      path = { 
        slug: 'default', 
        name: 'Default', 
        description: 'Default learning path',
        color: '#0969da'
      };
    }
    
    return {
      exercise,
      path,
      position: { x: 0, y: 0 }, // Will be calculated below
      dependencies,
      dependents: [] // Will be calculated below
    };
  });

  // Calculate dependents (reverse dependencies)
  nodes.forEach(node => {
    node.dependencies.forEach(depSlug => {
      const depNode = nodes.find(n => n.exercise.slug === depSlug);
      if (depNode) {
        depNode.dependents.push(node.exercise.slug);
      }
    });
  });

  // Calculate positions relative to dependencies
  const positionedNodes = new Set<string>();
  const nodeMap = new Map(nodes.map(node => [node.exercise.slug, node]));

  const calculatePosition = (node: SkillTreeNode): void => {
    if (positionedNodes.has(node.exercise.slug)) return;

    // If no dependencies, use the exercise's position as absolute (or default to origin)
    if (node.dependencies.length === 0) {
      node.position = node.exercise.position || { x: 0, y: 0 };
      positionedNodes.add(node.exercise.slug);
      return;
    }

    // Ensure all dependencies are positioned first
    for (const depSlug of node.dependencies) {
      const depNode = nodeMap.get(depSlug);
      if (depNode && !positionedNodes.has(depSlug)) {
        calculatePosition(depNode);
      }
    }

    // Find the last dependency (rightmost/bottommost position)
    let lastDepNode: SkillTreeNode | undefined;
    let lastDepPosition = { x: 0, y: 0 };
    
    for (const depSlug of node.dependencies) {
      const depNode = nodeMap.get(depSlug);
      if (depNode) {
        // Choose the dependency with the highest x + y value as the "last" one
        const depTotal = depNode.position.x + depNode.position.y;
        const lastTotal = lastDepPosition.x + lastDepPosition.y;
        if (depTotal > lastTotal) {
          lastDepPosition = depNode.position;
          lastDepNode = depNode;
        }
      }
    }

    // Calculate final position relative to last dependency
    const relativePosition = node.exercise.position || { x: 0, y: 50 }; // Default relative offset
    
    node.position = {
      x: lastDepPosition.x + relativePosition.x,
      y: lastDepPosition.y + relativePosition.y
    };

    positionedNodes.add(node.exercise.slug);
  };

  // Calculate positions for all nodes
  nodes.forEach(calculatePosition);

  return nodes;
}