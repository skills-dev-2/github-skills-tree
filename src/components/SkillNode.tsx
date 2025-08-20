import React, { useState, useCallback, useEffect } from 'react';
import * as Octicons from '@primer/octicons-react';
import type { SkillTreeNode } from '../lib/types';

interface SkillNodeProps {
  node: SkillTreeNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  visibility?: number; // 0 = fully dimmed, 1 = fully visible
  enableDrag?: boolean;
  onDragEnd?: (exerciseSlug: string, newPosition: { x: number; y: number }) => void;
}

// Map exercise icons to Octicon components with fallbacks
const iconMap: Record<string, React.ComponentType<any>> = {
  'mark-github': Octicons.MarkGithubIcon,
  'git-branch': Octicons.GitBranchIcon,
  'markdown': Octicons.MarkdownIcon,
  'browser': Octicons.BrowserIcon,
  'git-pull-request': Octicons.GitPullRequestIcon,
  'git-merge': Octicons.GitMergeIcon,
  'workflow': Octicons.WorkflowIcon,
  'tag': Octicons.TagIcon,
  'issue-opened': Octicons.IssueOpenedIcon,
  'project': Octicons.ProjectIcon,
  'shield': Octicons.ShieldIcon,
  'dependabot': Octicons.DependabotIcon,
  'search': Octicons.SearchIcon,
  'copilot': Octicons.CopilotIcon,
  'codespaces': Octicons.CodespacesIcon,
  'shield-lock': Octicons.ShieldLockIcon,
  'organization': Octicons.OrganizationIcon,
  'repo-forked': Octicons.RepoForkedIcon,
  'terminal': Octicons.TerminalIcon,
  'key': Octicons.KeyIcon,
  'person': Octicons.PersonIcon,
  'book': Octicons.BookIcon,
  'repo-template': Octicons.RepoTemplateIcon,
  'check': Octicons.CheckIcon,
  'package': Octicons.PackageIcon,
  'container': Octicons.ContainerIcon,
  'code': Octicons.CodeIcon,
  'comment-discussion': Octicons.CommentDiscussionIcon,
  'shield-check': Octicons.ShieldCheckIcon,
  'issue-draft': Octicons.IssueDraftIcon,
  'device-mobile': Octicons.DeviceMobileIcon,
  'plug': Octicons.PlugIcon,
  'webhook': Octicons.WebhookIcon,
  'apps': Octicons.AppsIcon,
  'law': Octicons.LawIcon,
  'eye': Octicons.EyeIcon,
  'people': Octicons.PeopleIcon,
  'graph': Octicons.GraphIcon,
  'gear': Octicons.GearIcon,
  'rocket': Octicons.RocketIcon,
  'pulse': Octicons.PulseIcon,
  'heart': Octicons.HeartIcon,
  'arrow-switch': Octicons.ArrowSwitchIcon,
  'accessibility': Octicons.AccessibilityIcon,
  'checklist': Octicons.ChecklistIcon,
  'sync': Octicons.SyncIcon,
};

export function SkillNode({ 
  node, 
  isSelected, 
  isHighlighted, 
  onClick, 
  onMouseEnter, 
  onMouseLeave,
  visibility = 1,
  enableDrag = false,
  onDragEnd
}: SkillNodeProps) {
  const { exercise, path, position } = node;
  
  // Drag state for individual exercise nodes
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggedPosition, setDraggedPosition] = useState(position);
  
  // Update dragged position when the node's position changes (e.g., when dragging is disabled)
  useEffect(() => {
    if (!isDragMode) {
      setDraggedPosition(position);
    }
  }, [position, isDragMode]);
  
  // Get the appropriate icon component with fallback
  const IconComponent = iconMap[exercise.icon] || Octicons.MarkGithubIcon;
  
  // Use only filter-based visibility (no automatic status dimming)
  const finalOpacity = visibility;
  const nodeRadius = isHighlighted || isSelected ? 34 : 28;
  const ringRadius = nodeRadius + 6;
  
  // Use a stable hover area that doesn't change size
  const hoverRadius = 40; // Slightly larger than the largest visual size

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableDrag) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    const startMousePos = { x: e.clientX, y: e.clientY };
    const startNodePos = { ...draggedPosition };
    
    setIsDragMode(true);
    
    // Add global mouse event listeners for dragging
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startMousePos.x;
      const deltaY = e.clientY - startMousePos.y;
      
      setDraggedPosition({
        x: startNodePos.x + deltaX,
        y: startNodePos.y + deltaY
      });
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      setIsDragMode(false);
      
      const deltaX = e.clientX - startMousePos.x;
      const deltaY = e.clientY - startMousePos.y;
      const finalPosition = {
        x: startNodePos.x + deltaX,
        y: startNodePos.y + deltaY
      };
      
      if (onDragEnd) {
        onDragEnd(exercise.slug, finalPosition);
      }
      
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  }, [enableDrag, draggedPosition, exercise.slug, onDragEnd]);

  // Use dragged position when in drag mode, original position otherwise
  const currentPosition = isDragMode ? draggedPosition : position;

  return (
    <g
      transform={`translate(${currentPosition.x}, ${currentPosition.y})`}
      className="skill-node"
      style={{ opacity: finalOpacity }}
    >
      {/* Selection ring */}
      {(isSelected || isHighlighted) && (
        <circle
          r={ringRadius}
          fill="none"
          stroke={path.color}
          strokeWidth="2"
          opacity={isSelected ? 0.8 : 0.5}
          style={{
            transition: 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      )}
      
      {/* Node background */}
      <circle
        r={nodeRadius}
        fill="#21262d"
        stroke={path.color}
        strokeWidth="2"
        style={{
          filter: isHighlighted 
            ? `drop-shadow(0 0 12px ${path.color})` 
            : `drop-shadow(0 2px 8px rgba(0,0,0,0.3))`,
          transition: isDragMode ? 'none' : 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease'
        }}
      />
      
      {/* Icon */}
      <foreignObject
        x={-16}
        y={-16}
        width={32}
        height={32}
      >
        <div className="flex items-center justify-center w-full h-full">
          <IconComponent
            size={24}
            style={{ color: path.color }}
          />
        </div>
      </foreignObject>
      
      {/* Exercise name - only show on hover/selection */}
      {(isHighlighted || isSelected) && (
        <text
          y={nodeRadius + 20}
          textAnchor="middle"
          className="fill-foreground text-sm font-medium"
          style={{ userSelect: 'none' }}
        >
          {exercise.name}
        </text>
      )}
      
      {/* Interactive area - handles both clicking and dragging */}
      <circle
        r={hoverRadius}
        fill="transparent"
        style={{ 
          cursor: enableDrag ? (isDragMode ? 'grabbing' : 'grab') : 'pointer' 
        }}
        onClick={(e) => {
          if (!isDragMode) {
            e.stopPropagation();
            onClick();
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={enableDrag ? undefined : onMouseEnter}
        onMouseLeave={enableDrag ? undefined : onMouseLeave}
      />
    </g>
  );
}