export interface Exercise {
  slug: string;
  status: 'active' | 'scheduled' | 'tentative';
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
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface Path {
  slug: string;
  name: string;
  description: string;
  color: string;
}

export interface SkillTreeNode {
  exercise: Exercise;
  path: Path;
  position: { x: number; y: number };
  dependencies: string[]; // slugs of exercises this depends on
  dependents: string[]; // slugs of exercises that depend on this
}