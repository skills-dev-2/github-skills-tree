/**
 * Application-wide constants
 * Centralizes configuration values and magic numbers
 */

// GitHub API configuration
export const GITHUB_CONFIG = {
  API_BASE: 'https://api.github.com/repos/chriswblake/dev-skills-exercises/contents',
  BRANCH: 'main',
  CACHE_TTL_MINUTES: 60
} as const;

// UI constants
export const UI_CONFIG = {
  // Node sizes and spacing
  NODE_RADIUS_DEFAULT: 28,
  NODE_RADIUS_HIGHLIGHTED: 34,
  NODE_RING_OFFSET: 6,
  NODE_HOVER_RADIUS: 40,
  NODE_ICON_SIZE: 24,
  
  // SVG and layout
  SVG_PADDING: 80,
  MIN_SVG_WIDTH: 1400,
  MIN_SVG_HEIGHT: 1200,
  
  // Header and navigation
  HEADER_HEIGHT: 81,
  SEARCH_BAR_HEIGHT: 59,
  TOTAL_TOP_PADDING: 140, // HEADER_HEIGHT + SEARCH_BAR_HEIGHT
  
  // Animation durations (in ms)
  ANIMATION_FAST: 100,
  ANIMATION_NORMAL: 200,
  ANIMATION_SLOW: 300,
  
  // Progress animation
  PROGRESS_SPIN_DURATION: 15, // seconds
  IN_PROGRESS_COLOR: '#f97316'
} as const;

// Filter defaults
export const FILTER_DEFAULTS = {
  STATUSES: ['Active'] as const
} as const;

// Status values
export const EXERCISE_STATUSES = {
  ACTIVE: 'active',
  SCHEDULED: 'scheduled', 
  TENTATIVE: 'tentative',
  IN_PROGRESS: 'in-progress'
} as const;

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
} as const;