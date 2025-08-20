# Editing the GitHub Skills Roadmap

This guide explains how to modify the skills roadmap without coding experience by editing JSON files.

## Structure Overview

The roadmap data is stored in two main directories:

- `public/exercises/` - Individual exercise files
- `public/paths/` - Learning path definitions

## Adding a New Exercise

1. Create a new JSON file in `public/exercises/` named `[exercise-slug].json`
2. Use this template:

```json
{
  "slug": "your-exercise-name",
  "status": "active",
  "name": "Your Exercise Name",
  "icon": "mark-github",
  "description": "A brief description of what this exercise teaches.",
  "repositoryUrl": "https://github.com/skills/your-exercise-name",
  "issueUrl": "https://github.com/github/skills-roadmap/issues/123",
  "pathSlug": "fundamentals",
  "dependencies": ["prerequisite-exercise"],
  "position": { "x": 0, "y": 500 }
}
```

### Field Explanations

- **slug**: Unique identifier (use lowercase with hyphens)
- **status**: `"active"`, `"scheduled"`, or `"tentative"`
- **name**: Display name (keep it short, 3-4 words max)
- **icon**: Choose from available Octicons (see icon list below)
- **description**: Brief explanation (15 words or less)
- **repositoryUrl**: GitHub repository URL for the exercise
- **issueUrl**: GitHub issue URL for tracking
- **pathSlug**: Which learning path this belongs to
- **dependencies**: Array of exercise slugs that must be completed first
- **position**: Visual coordinates on the skill tree

### Available Icons

Common icons you can use:
- `mark-github` - GitHub logo
- `git-branch` - Git branching
- `git-pull-request` - Pull requests
- `workflow` - GitHub Actions
- `shield` - Security
- `issue-opened` - Issues
- `project` - Projects
- `copilot` - GitHub Copilot
- `organization` - Organizations
- `markdown` - Documentation
- `browser` - Web pages

## Adding Dependencies

To make one exercise depend on another, add the prerequisite's slug to the `dependencies` array:

```json
{
  "slug": "advanced-topic",
  "dependencies": ["basic-topic", "another-prerequisite"],
  "..."
}
```

Multiple exercises can depend on the same prerequisite, and exercises can have multiple prerequisites.

## Positioning on the Skill Tree

The `position` field controls where the exercise appears visually:

- **x**: Horizontal position (0-1400, left to right)
- **y**: Vertical position (0-1200, top to bottom)

### Layout Guidelines

- **Fundamentals**: x: 100-500, y: 100-600
- **Collaboration**: x: 600-900, y: 200-800  
- **Project Management**: x: 100-400, y: 300-700
- **Automation**: x: 700-1200, y: 300-900
- **Security**: x: 300-600, y: 500-1000
- **AI Productivity**: x: 100-300, y: 200-500

## Adding a New Learning Path

1. Create a new JSON file in `public/paths/` named `[path-slug].json`
2. Use this template:

```json
{
  "slug": "your-path-name",
  "name": "Your Path Display Name",
  "description": "What this learning path covers and why it's important",
  "color": "#ff6b35"
}
```

### Path Colors

Choose colors that don't conflict with existing paths:
- Use hex colors (e.g., `#ff6b35`)
- Ensure good contrast against dark backgrounds
- Test that the color is visible and accessible

## Example: Adding a New Exercise

Let's say you want to add a "GitHub Discussions" exercise:

1. Create `public/exercises/github-discussions.json`:

```json
{
  "slug": "github-discussions",
  "status": "scheduled",
  "name": "GitHub Discussions",
  "icon": "comment-discussion",
  "description": "Build community engagement with GitHub Discussions.",
  "repositoryUrl": "https://github.com/skills/github-discussions",
  "issueUrl": "https://github.com/github/skills-roadmap/issues/234",
  "pathSlug": "collaboration",
  "dependencies": ["github-issues"],
  "position": { "x": 0, "y": 650 }
}
```

This creates a new exercise that:
- Belongs to the collaboration path
- Requires completing "github-issues" first  
- Appears at coordinates (500, 650) on the skill tree
- Is marked as "scheduled" (appears dimmed)

## Tips for Success

- **Keep names short**: 3-4 words maximum for readability
- **Check dependencies**: Make sure prerequisite exercises exist
- **Avoid overlap**: Check that your position doesn't conflict with existing exercises
- **Test positioning**: The skill tree is scrollable, so exercises can be spread out vertically
- **Use descriptive slugs**: Make them easy to understand and reference
- **Follow the pattern**: Look at existing exercises for consistency

## Validation

After making changes, the application will automatically load your new data. If there are errors:

- Check that all JSON files are valid (proper quotes, commas, brackets)
- Verify that referenced dependencies exist
- Ensure pathSlug references an existing path
- Confirm positions are reasonable numbers

The application includes fallback handling, so minor errors won't break the entire roadmap.