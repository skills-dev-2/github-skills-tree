import { useState, useEffect } from 'react';
import type { Exercise, Path } from '../lib/types';
import { GitHubAPI } from '../lib/github-api';
import { GITHUB_CONFIG } from '../constants';

interface GitHubFile {
  name: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

async function fetchGitHubFiles(path: string): Promise<GitHubFile[]> {
  try {
    // Parse the GitHub repository info from the API base URL
    // Expected format: https://api.github.com/repos/owner/repo/contents
    const match = GITHUB_CONFIG.API_BASE.match(/repos\/([^\/]+)\/([^\/]+)\/contents/);
    if (!match) {
      throw new Error('Invalid GitHub API base URL format');
    }
    
    const [, owner, repo] = match;
    return await GitHubAPI.getRepoContents(owner, repo, path, GITHUB_CONFIG.BRANCH);
  } catch (error) {
    console.error(`Failed to fetch GitHub files from ${path}:`, error);
    throw error;
  }
}

async function fetchFileContent(downloadUrl: string) {
  return await GitHubAPI.getFileContent(downloadUrl);
}

async function fetchAllExercisesRecursively(basePath: string = 'exercises'): Promise<GitHubFile[]> {
  const allExercises: GitHubFile[] = [];
  
  async function processDirectory(path: string) {
    try {
      const files = await fetchGitHubFiles(path);
      
      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json') && file.download_url) {
          console.log(`Found exercise file: ${file.download_url}`);
          allExercises.push(file);
        } else if (file.type === 'dir') {
          // Recursively process subdirectories
          await processDirectory(`${path}/${file.name}`);
        }
      }
    } catch (err) {
      // Log the error but continue processing other directories
      console.warn(`Failed to process directory ${path}:`, err);
    }
  }
  
  await processDirectory(basePath);
  return allExercises;
}

async function fetchAllPathsRecursively(basePath: string = 'paths'): Promise<GitHubFile[]> {
  const allPaths: GitHubFile[] = [];
  
  async function processDirectory(path: string) {
    try {
      const files = await fetchGitHubFiles(path);
      
      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json') && file.download_url) {
          allPaths.push(file);
        } else if (file.type === 'dir') {
          // Recursively process subdirectories
          await processDirectory(`${path}/${file.name}`);
        }
      }
    } catch (err) {
      // Log the error but continue processing other directories
      console.warn(`Failed to process directory ${path}:`, err);
    }
  }
  
  await processDirectory(basePath);
  return allPaths;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        console.log('🚀 Loading exercises with enhanced caching and rate limit monitoring...');
        // Recursively get all exercise files from GitHub (including subfolders)
        const jsonFiles = await fetchAllExercisesRecursively('exercises');

        console.log(`📁 Found ${jsonFiles.length} exercise files to process`);

        // Fetch content of each exercise file
        const exercisePromises = jsonFiles.map(async (file) => {
          if (!file.download_url) throw new Error(`No download URL for ${file.name}`);
          return await fetchFileContent(file.download_url);
        });

        const loadedExercises = await Promise.all(exercisePromises);
        setExercises(loadedExercises);
        console.log(`✅ Successfully loaded ${loadedExercises.length} exercises`);
      } catch (err) {
        console.error('❌ Failed to load exercises:', err);
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
        console.log('🚀 Loading paths with enhanced caching and rate limit monitoring...');
        // Recursively get all path files from GitHub (including subfolders)
        const jsonFiles = await fetchAllPathsRecursively('paths');

        console.log(`📁 Found ${jsonFiles.length} path files to process`);

        // Fetch content of each path file
        const pathPromises = jsonFiles.map(async (file) => {
          if (!file.download_url) throw new Error(`No download URL for ${file.name}`);
          return await fetchFileContent(file.download_url);
        });

        const loadedPaths = await Promise.all(pathPromises);
        setPaths(loadedPaths);
        console.log(`✅ Successfully loaded ${loadedPaths.length} paths`);
      } catch (err) {
        console.error('❌ Failed to load paths:', err);
        setError(err instanceof Error ? err.message : 'Failed to load paths from GitHub');
      } finally {
        setLoading(false);
      }
    }

    loadPaths();
  }, []);

  return { paths, loading, error };
}