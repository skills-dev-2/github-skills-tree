import { EXERCISE_STATUSES, DIFFICULTY_LEVELS } from '../constants';

/**
 * Represents a single exercise in the skills tree
 */
export interface Exercise {
  slug: string;
  status: keyof typeof EXERCISE_STATUSES;
  name: string;
  icon: string;
  description: string;
  repositoryUrl: string;
  issueUrl: string;
  
  // Skill tree layout information (optional for backward compatibility)
  pathSlug?: string; // Which learning path this exercise belongs to
  dependencies?: string[]; // Array of exercise slugs this depends on
  position?: { x: number; y: number }; // Visual position in the skill tree
  
  // Filter fields
  products?: string[];
  difficulty?: keyof typeof DIFFICULTY_LEVELS;
}

/**
 * Represents a learning path that groups related exercises
 */
export interface Path {
  slug: string;
  name: string;
  description: string;
  color: string; // CSS color value (hex, rgb, etc.)
}

/**
 * Represents a node in the skill tree with computed positioning and relationships
 */
export interface SkillTreeNode {
  exercise: Exercise;
  path: Path;
  position: { x: number; y: number };
  dependencies: string[]; // slugs of exercises this depends on
  dependents: string[]; // slugs of exercises that depend on this
  visibility?: number; // 0-1 opacity for filtering, default 1
}