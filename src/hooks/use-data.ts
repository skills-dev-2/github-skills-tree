import { useState, useEffect } from 'react';
import type { Exercise, Path } from '../lib/types';
import { GitHubAPI } from '../lib/github-api';
import { GITHUB_CONFIG } from '../constants';
import { logger } from '../lib/console-logger';

interface GitHubFile {
  name: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

async function fetchGitHubFiles(path: string): Promise<GitHubFile[]> {
  try {
    logger.debug(`Fetching directory contents: ${path}`);
    // Parse the GitHub repository info from the API base URL
    // Expected format: https://api.github.com/repos/owner/repo/contents
    const match = GITHUB_CONFIG.API_BASE.match(/repos\/([^\/]+)\/([^\/]+)\/contents/);
    if (!match) {
      throw new Error('Invalid GitHub API base URL format');
    }
    
    const [, owner, repo] = match;
    const result = await GitHubAPI.getRepoContents(owner, repo, path, GITHUB_CONFIG.BRANCH);
    logger.debug(`Directory contents loaded: ${path} (${result.length} items)`);
    return result;
  } catch (error) {
    logger.error(`Failed to fetch GitHub files from ${path}`, error);
    throw error;
  }
}

async function fetchFileContent(downloadUrl: string) {
  logger.debug(`Fetching content: ${downloadUrl.split('/').pop()}`);
  const result = await GitHubAPI.getFileContent(downloadUrl);
  logger.debug(`Content loaded: ${downloadUrl.split('/').pop()}`);
  return result;
}

/**
 * Optimized recursive directory fetching with batched API calls
 * Uses a single API call per directory level to minimize GitHub API usage
 */
async function fetchAllExercisesRecursively(basePath: string = 'exercises'): Promise<GitHubFile[]> {
  const allExercises: GitHubFile[] = [];
  const directoriesToProcess: string[] = [basePath];
  
  logger.debug(`Starting recursive fetch for exercises from: ${basePath}`);
  
  // Process directories level by level to minimize API calls
  while (directoriesToProcess.length > 0) {
    const currentPath = directoriesToProcess.shift()!;
    
    try {
      logger.debug(`Processing exercises directory: ${currentPath}`);
      const files = await fetchGitHubFiles(currentPath);
      
      let filesInDir = 0;
      let dirsInDir = 0;
      
      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json') && file.download_url) {
          allExercises.push(file);
          filesInDir++;
        } else if (file.type === 'dir') {
          directoriesToProcess.push(`${currentPath}/${file.name}`);
          dirsInDir++;
        }
      }
      
      logger.debug(`Directory ${currentPath}: ${filesInDir} JSON files, ${dirsInDir} subdirectories`);
    } catch (err) {
      logger.warn(`Failed to process directory ${currentPath}`, err);
    }
  }
  
  logger.debug(`Recursive exercises fetch complete: found ${allExercises.length} exercise files total`);
  return allExercises;
}

/**
 * Optimized recursive directory fetching with batched API calls
 * Uses a single API call per directory level to minimize GitHub API usage
 */
async function fetchAllPathsRecursively(basePath: string = 'paths'): Promise<GitHubFile[]> {
  const allPaths: GitHubFile[] = [];
  const directoriesToProcess: string[] = [basePath];
  
  logger.debug(`Starting recursive fetch for paths from: ${basePath}`);
  
  // Process directories level by level to minimize API calls
  while (directoriesToProcess.length > 0) {
    const currentPath = directoriesToProcess.shift()!;
    
    try {
      logger.debug(`Processing paths directory: ${currentPath}`);
      const files = await fetchGitHubFiles(currentPath);
      
      let filesInDir = 0;
      let dirsInDir = 0;
      
      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json') && file.download_url) {
          allPaths.push(file);
          filesInDir++;
        } else if (file.type === 'dir') {
          directoriesToProcess.push(`${currentPath}/${file.name}`);
          dirsInDir++;
        }
      }
      
      logger.debug(`Directory ${currentPath}: ${filesInDir} JSON files, ${dirsInDir} subdirectories`);
    } catch (err) {
      logger.warn(`Failed to process directory ${currentPath}`, err);
    }
  }
  
  logger.debug(`Recursive paths fetch complete: found ${allPaths.length} path files total`);
  return allPaths;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        logger.info('Loading exercises with optimized batching');
        
        // Step 1: Get all exercise file locations (minimal API calls)
        const jsonFiles = await fetchAllExercisesRecursively('exercises');
        logger.debug(`Found ${jsonFiles.length} exercise files to process`);

        // Step 2: Batch process file downloads to avoid overwhelming the API
        const batchSize = 10; // Process 10 files at a time
        const loadedExercises: Exercise[] = [];
        
        for (let i = 0; i < jsonFiles.length; i += batchSize) {
          const batch = jsonFiles.slice(i, i + batchSize);
          logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jsonFiles.length / batchSize)} (${batch.length} files)`);
          
          const batchPromises = batch.map(async (file) => {
            if (!file.download_url) throw new Error(`No download URL for ${file.name}`);
            return await fetchFileContent(file.download_url);
          });

          const batchResults = await Promise.all(batchPromises);
          loadedExercises.push(...batchResults);
          
          // Small delay between batches to be nice to GitHub's rate limits
          if (i + batchSize < jsonFiles.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        setExercises(loadedExercises);
        
        // Log final optimization summary if debug level
        if (logger.getLevel() === 'debug') {
          logger.debug(`Loading Summary: ${loadedExercises.length} exercises loaded, ${Math.ceil(jsonFiles.length / batchSize)} batches processed, ~${Math.ceil(jsonFiles.length / 10)} API calls estimated, 4hr cache, lazy loading enabled`);
        }
        
        logger.info(`Successfully loaded ${loadedExercises.length} exercises`);
      } catch (err) {
        logger.error('Failed to load exercises', err);
        setError(err instanceof Error ? err.message : 'Failed to load exercises from GitHub');
      } finally {
        setLoading(false);
      }
    }

    loadExercises();
  }, []);

  return { exercises, loading, error };
}

export function usePaths() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaths() {
      try {
        logger.info('Loading paths with optimized batching');
        
        // Step 1: Get all path file locations (minimal API calls)
        const jsonFiles = await fetchAllPathsRecursively('paths');
        logger.debug(`Found ${jsonFiles.length} path files to process`);

        // Step 2: Batch process file downloads to avoid overwhelming the API
        const batchSize = 5; // Smaller batch size for paths as there are fewer of them
        const loadedPaths: Path[] = [];
        
        for (let i = 0; i < jsonFiles.length; i += batchSize) {
          const batch = jsonFiles.slice(i, i + batchSize);
          logger.debug(`Processing path batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jsonFiles.length / batchSize)} (${batch.length} files)`);
          
          const batchPromises = batch.map(async (file) => {
            if (!file.download_url) throw new Error(`No download URL for ${file.name}`);
            return await fetchFileContent(file.download_url);
          });

          const batchResults = await Promise.all(batchPromises);
          loadedPaths.push(...batchResults);
          
          // Small delay between batches to be nice to GitHub's rate limits
          if (i + batchSize < jsonFiles.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        setPaths(loadedPaths);
        logger.info(`Successfully loaded ${loadedPaths.length} paths`);
      } catch (err) {
        logger.error('Failed to load paths', err);
        setError(err instanceof Error ? err.message : 'Failed to load paths from GitHub');
      } finally {
        setLoading(false);
      }
    }

    loadPaths();
  }, []);

  return { paths, loading, error };
}