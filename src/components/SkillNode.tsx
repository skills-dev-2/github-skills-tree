import React from 'react';
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
  visibility = 1
}: SkillNodeProps) {
  const { exercise, path, position } = node;
  
  // Get the appropriate icon component with fallback
  const IconComponent = iconMap[exercise.icon] || Octicons.MarkGithubIcon;
  
  // Use only filter-based visibility (no automatic status dimming)
  const finalOpacity = visibility;
  const nodeRadius = isHighlighted || isSelected ? 34 : 28;
  const ringRadius = nodeRadius + 6;
  
  // Use a stable hover area that doesn't change size
  const hoverRadius = 40; // Slightly larger than the largest visual size

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
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
          transition: 'r 0.2s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease'
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
      
      {/* Invisible hover area - stable size to prevent hover bounce */}
      <circle
        r={hoverRadius}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </g>
  );
}