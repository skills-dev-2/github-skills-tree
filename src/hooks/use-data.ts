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

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        // Get list of exercise files from GitHub
        const files = await fetchGitHubFiles('exercises');
        const jsonFiles = files.filter(file => 
          file.type === 'file' && 
          file.name.endsWith('.json') && 
          file.download_url
        );

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
        // Get list of path files from GitHub
        const files = await fetchGitHubFiles('paths');
        const jsonFiles = files.filter(file => 
          file.type === 'file' && 
          file.name.endsWith('.json') && 
          file.download_url
        );

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