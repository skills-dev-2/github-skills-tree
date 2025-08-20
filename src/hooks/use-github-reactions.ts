import { useState, useEffect } from 'react';

interface GitHubReactions {
  '+1': number;
  '-1': number;
  loading: boolean;
  error: string | null;
}

interface IssueInfo {
  owner: string;
  repo: string;
  issueNumber: number;
}

/**
 * Extract owner, repo, and issue number from a GitHub issue URL
 */
function parseGitHubIssueUrl(issueUrl: string): IssueInfo | null {
  try {
    const url = new URL(issueUrl);
    
    // Expected format: https://github.com/owner/repo/issues/123
    const pathParts = url.pathname.split('/');
    
    if (pathParts.length >= 5 && 
        url.hostname === 'github.com' && 
        pathParts[3] === 'issues') {
      
      return {
        owner: pathParts[1],
        repo: pathParts[2],
        issueNumber: parseInt(pathParts[4], 10)
      };
    }
  } catch (error) {
    console.warn('Invalid GitHub issue URL:', issueUrl, error);
  }
  
  return null;
}

/**
 * Fetch reaction counts for a GitHub issue
 */
async function fetchIssueReactions(owner: string, repo: string, issueNumber: number) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/reactions`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add User-Agent to avoid rate limiting issues
        'User-Agent': 'GitHub-Skills-Tree'
      }
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Issue not found');
    } else if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const reactions = await response.json();
  
  // Count reactions by type
  const reactionCounts = {
    '+1': 0,
    '-1': 0
  };
  
  reactions.forEach((reaction: any) => {
    if (reaction.content === '+1') {
      reactionCounts['+1']++;
    } else if (reaction.content === '-1') {
      reactionCounts['-1']++;
    }
  });
  
  return reactionCounts;
}

/**
 * Hook to fetch GitHub issue reactions
 */
export function useGitHubReactions(issueUrl?: string): GitHubReactions {
  const [reactions, setReactions] = useState<GitHubReactions>({
    '+1': 0,
    '-1': 0,
    loading: false,
    error: null
  });

  useEffect(() => {
    // Reset state when URL changes
    setReactions(prev => ({ ...prev, loading: false, error: null }));
    
    // Don't fetch if no URL provided
    if (!issueUrl) {
      return;
    }

    // Parse the GitHub issue URL
    const issueInfo = parseGitHubIssueUrl(issueUrl);
    if (!issueInfo) {
      setReactions(prev => ({ 
        ...prev, 
        error: 'Invalid GitHub issue URL format' 
      }));
      return;
    }

    // Fetch reactions
    const fetchReactions = async () => {
      setReactions(prev => ({ 
        ...prev, 
        loading: true, 
        error: null 
      }));

      try {
        const reactionCounts = await fetchIssueReactions(
          issueInfo.owner, 
          issueInfo.repo, 
          issueInfo.issueNumber
        );

        setReactions({
          '+1': reactionCounts['+1'],
          '-1': reactionCounts['-1'],
          loading: false,
          error: null
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reactions';
        setReactions(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      }
    };

    fetchReactions();
  }, [issueUrl]);

  return reactions;
}