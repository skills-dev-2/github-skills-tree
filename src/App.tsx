import React, { useEffect } from 'react';
import { SkillsTree } from './components/SkillsTree';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useExercises, usePaths } from './hooks/use-data';
import { Toaster } from './components/ui/sonner';
import { initializeGitHubMonitoring } from './lib/github-debug';

function App() {
  const { exercises, loading: exercisesLoading, error: exercisesError } = useExercises();
  const { paths, loading: pathsLoading, error: pathsError } = usePaths();

  const loading = exercisesLoading || pathsLoading;
  const error = exercisesError || pathsError;

  // Initialize GitHub API monitoring on app start
  useEffect(() => {
    initializeGitHubMonitoring();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exercises from GitHub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen max-h-screen overflow-hidden bg-background">
        {/* Main Skills Tree - taking full viewport */}
        <main className="relative h-full overflow-hidden">
          <SkillsTree 
            exercises={exercises} 
            paths={paths}
            exerciseCount={exercises.length}
            pathCount={paths.length}
          />
        </main>

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default App;