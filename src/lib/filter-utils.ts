import type { Exercise, Path, SkillTreeNode } from './types';
import type { FilterState } from '../components/FilterBar';

/**
 * Check if an exercise matches the search term across all fields
 * @param exercise - The exercise to check
 * @param path - The learning path the exercise belongs to
 * @param searchTerm - The search term to match against
 * @returns True if any field matches the search term (case-insensitive)
 */
export function matchesSearchTerm(
  exercise: Exercise, 
  path: Path, 
  searchTerm: string
): boolean {
  if (!searchTerm.trim()) return true;
  
  const term = searchTerm.toLowerCase();
  
  // Check all exercise fields
  const fieldsToSearch = [
    exercise.name,
    exercise.description,
    exercise.status,
    exercise.difficulty,
    exercise.slug,
    path.name,
    path.description,
    ...(exercise.products || []),
    ...(exercise.dependencies || [])
  ];
  
  return fieldsToSearch.some(field => 
    field && field.toLowerCase().includes(term)
  );
}

/**
 * Calculate the visibility level of an exercise based on active filters
 * @param exercise - The exercise to evaluate
 * @param path - The learning path the exercise belongs to  
 * @param filters - Current filter state
 * @param searchTerm - Current search term (overrides filters when present)
 * @returns A number from 0 (fully dimmed) to 1 (fully visible)
 */
export function calculateExerciseVisibility(
  exercise: Exercise,
  path: Path,
  filters: FilterState,
  searchTerm?: string
): number {
  // If search term exists, use search logic instead of filters
  if (searchTerm && searchTerm.trim()) {
    return matchesSearchTerm(exercise, path, searchTerm) ? 1 : 0.15;
  }
  // If no filters are active, show everything at full visibility
  const totalActiveFilters = 
    filters.paths.length + 
    filters.products.length + 
    filters.difficulties.length + 
    filters.statuses.length;

  if (totalActiveFilters === 0) {
    return 1;
  }

  const activeFilters: { category: string; values: string[]; hasMatch: boolean }[] = [];

  // Check path filter
  if (filters.paths.length > 0) {
    activeFilters.push({
      category: 'path',
      values: filters.paths,
      hasMatch: filters.paths.includes(path.name)
    });
  }

  // Check product filter
  if (filters.products.length > 0) {
    activeFilters.push({
      category: 'product',
      values: filters.products,
      hasMatch: exercise.products ? 
        exercise.products.some(product => filters.products.includes(product)) : 
        false
    });
  }

  // Check difficulty filter
  if (filters.difficulties.length > 0) {
    activeFilters.push({
      category: 'difficulty',
      values: filters.difficulties,
      hasMatch: exercise.difficulty ? 
        filters.difficulties.includes(exercise.difficulty) : 
        false
    });
  }

  // Check status filter (handle capitalized filter values)
  if (filters.statuses.length > 0) {
    activeFilters.push({
      category: 'status',
      values: filters.statuses,
      hasMatch: filters.statuses.some(status => 
        status.toLowerCase() === exercise.status.toLowerCase()
      )
    });
  }

  // Calculate visibility based on matching filters
  const matchingFilters = activeFilters.filter(filter => filter.hasMatch).length;
  const totalActiveFilterCount = activeFilters.length;

  if (totalActiveFilterCount === 0) {
    return 1; // No active filters
  }

  // Calculate percentage based on matching filters
  // 0 matches = 25% visibility (75% dimmed)
  // All matches = 100% visibility (0% dimmed)
  const baseVisibility = 0.25; // Minimum visibility when no filters match
  const visibilityRange = 1 - baseVisibility; // The range we can adjust
  const matchPercentage = matchingFilters / totalActiveFilterCount;
  
  return baseVisibility + (visibilityRange * matchPercentage);
}

/**
 * Apply visibility calculations to skill tree nodes
 */
export function applyVisibilityToNodes(
  nodes: SkillTreeNode[], 
  filters: FilterState,
  searchTerm?: string
): (SkillTreeNode & { visibility: number })[] {
  return nodes.map(node => ({
    ...node,
    visibility: calculateExerciseVisibility(node.exercise, node.path, filters, searchTerm)
  }));
}