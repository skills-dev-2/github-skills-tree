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
  
  // Mobile node sizes (smaller for mobile)
  NODE_RADIUS_DEFAULT_MOBILE: 24,
  NODE_RADIUS_HIGHLIGHTED_MOBILE: 28,
  NODE_HOVER_RADIUS_MOBILE: 36,
  NODE_ICON_SIZE_MOBILE: 20,
  
  // SVG and layout
  SVG_PADDING: 80,
  SVG_PADDING_MOBILE: 40,
  MIN_SVG_WIDTH: 1400,
  MIN_SVG_HEIGHT: 1200,
  MIN_SVG_WIDTH_MOBILE: 800,
  MIN_SVG_HEIGHT_MOBILE: 600,
  
  // Header and navigation
  HEADER_HEIGHT: 81,
  HEADER_HEIGHT_MOBILE: 65,
  SEARCH_BAR_HEIGHT: 59,
  SEARCH_BAR_HEIGHT_MOBILE: 51,
  TOTAL_TOP_PADDING: 140, // HEADER_HEIGHT + SEARCH_BAR_HEIGHT
  TOTAL_TOP_PADDING_MOBILE: 116, // HEADER_HEIGHT_MOBILE + SEARCH_BAR_HEIGHT_MOBILE
  
  // Animation durations (in ms)
  ANIMATION_FAST: 100,
  ANIMATION_NORMAL: 200,
  ANIMATION_SLOW: 300,
  
  // Progress animation
  PROGRESS_SPIN_DURATION: 15, // seconds
  DEVELOPMENT_COLOR: '#f97316'
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
  DEVELOPMENT: 'development'
} as const;

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
} as const;