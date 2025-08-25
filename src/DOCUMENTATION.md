# GitHub Skills Tree - Code Documentation

## Architecture Overview

The GitHub Skills Tree is a React-based interactive visualization that displays GitHub learning exercises in a tree structure. Users can explore learning paths, filter content, and track their progress through various exercises.

### Core Components

#### `App.tsx`
Main application component that handles data loading and provides the overall layout structure.

**Responsibilities:**
- Fetches exercises and paths data from GitHub
- Provides loading and error states
- Renders header with application title and stats
- Wraps the main content in an ErrorBoundary for graceful error handling

#### `SkillsTree.tsx` 
The primary interactive component that renders the skill tree visualization.

**Key Features:**
- SVG-based node and path rendering
- Interactive node selection and hover states
- Pan and zoom functionality for tree navigation
- Drag mode for repositioning exercise nodes
- Filter and search capabilities
- Dynamic path routing around obstacles

#### `SkillNode.tsx`
Individual exercise node component with interactive states and visual feedback.

**Features:**
- Icon rendering using Octicons
- Multiple visual states (default, highlighted, selected, development)
- Drag and drop support when in drag mode
- Progress indicators for development exercises
- Hover interactions and tooltips

#### `FilterBar.tsx`
Collapsible sidebar for filtering and configuring the skill tree display.

**Capabilities:**
- Filter by learning paths, products, difficulties, and statuses
- Settings toggle for drag mode
- Collapsible sections to save space
- Real-time filtering with visual feedback

### Data Flow

1. **Data Loading**: `useExercises()` and `usePaths()` hooks fetch data from GitHub API
2. **Tree Construction**: `createSkillTreeData()` processes raw data into skill tree nodes
3. **Filtering**: `applyVisibilityToNodes()` applies filters and search terms
4. **Rendering**: Components render the filtered and positioned nodes

### Key Libraries and Dependencies

- **React**: Core UI framework with hooks for state management
- **@primer/octicons-react**: GitHub's icon library for exercise icons
- **@phosphor-icons/react**: Additional icons for UI controls
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Pre-built React components for consistent UI

### Performance Optimizations

- **Memoization**: Extensive use of `useMemo` and `useCallback` to prevent unnecessary re-renders
- **API Caching**: 60-minute cache for GitHub API responses to reduce network calls
- **SVG Rendering**: Efficient SVG-based graphics for smooth interactions
- **Selective Updates**: Only re-render components when their specific data changes

### Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Follows GitHub's design system for accessibility compliance
- **Focus Management**: Clear visual focus indicators

### Error Handling

- **ErrorBoundary**: Catches and displays JavaScript errors gracefully
- **Network Error Handling**: Specific error messages for API failures
- **Graceful Degradation**: Fallback icons and states when data is missing

### State Management

The application uses a combination of:
- **React State**: For component-level state (selections, hover states)
- **useKV Hook**: For persistent data (custom node positions)
- **URL Parameters**: For deep-linking to specific views (future enhancement)

### Testing Strategy

- **Component Testing**: Individual component behavior and interactions
- **Integration Testing**: Data flow between components
- **Visual Testing**: Screenshot comparisons for UI consistency
- **Accessibility Testing**: WCAG compliance verification