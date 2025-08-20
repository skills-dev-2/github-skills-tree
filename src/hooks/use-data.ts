import { useState, useEffect } from 'react';
import type { Exercise, Path } from '../lib/types';

const GITHUB_API_BASE = 'https://api.github.com/repos/chriswblake/dev-skills-exercises/contents';

interface GitHubFile {
  name: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

async function fetchGitHubFiles(path: string): Promise<GitHubFile[]> {
  const response = await fetch(`${GITHUB_API_BASE}/${path}?ref=main`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`GitHub repository or path not found: ${path}`);
    } else if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch files from ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchFileContent(downloadUrl: string) {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchAllExercisesRecursively(basePath: string = 'exercises'): Promise<GitHubFile[]> {
  const allExercises: GitHubFile[] = [];
  
  async function processDirectory(path: string) {
    try {
      const files = await fetchGitHubFiles(path);
      
      for (const file of files) {
        if (file.type === 'file' && file.name.endsWith('.json') && file.download_url) {
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
        // Recursively get all exercise files from GitHub (including subfolders)
        const jsonFiles = await fetchAllExercisesRecursively('exercises');

        // Fetch content of each exercise file
        const exercisePromises = jsonFiles.map(async (file) => {
          if (!file.download_url) throw new Error(`No download URL for ${file.name}`);
          return await fetchFileContent(file.download_url);
        });

        const loadedExercises = await Promise.all(exercisePromises);
        setExercises(loadedExercises);
      } catch (err) {
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
        // Recursively get all path files from GitHub (including subfolders)
        const jsonFiles = await fetchAllPathsRecursively('paths');

        // Fetch content of each path file
        const pathPromises = jsonFiles.map(async (file) => {
          if (!file.download_url) throw new Error(`No download URL for ${file.name}`);
          return await fetchFileContent(file.download_url);
        });

        const loadedPaths = await Promise.all(pathPromises);
        setPaths(loadedPaths);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load paths from GitHub');
      } finally {
        setLoading(false);
      }
    }

    loadPaths();
  }, []);

  return { paths, loading, error };
}