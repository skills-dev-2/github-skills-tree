import { useState, useEffect } from 'react';
import { GitHubAPI } from '../lib/github-api';

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
 * Fetch reaction counts for a GitHub issue using the centralized API wrapper
 */
async function fetchIssueReactions(owner: string, repo: string, issueNumber: number) {
  return await GitHubAPI.getIssueReactions(owner, repo, issueNumber);
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
        console.log(`🔍 Fetching reactions for issue: ${issueInfo.owner}/${issueInfo.repo}#${issueInfo.issueNumber}`);
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
        
        console.log(`✅ Loaded reactions: 👍 ${reactionCounts['+1']}, 👎 ${reactionCounts['-1']}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reactions';
        console.error('❌ Error fetching GitHub reactions:', errorMessage);
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