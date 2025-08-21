import { useKV } from '@github/spark/hooks';

export interface SettingsState {
  showExerciseNames: boolean;
}

const defaultSettings: SettingsState = {
  showExerciseNames: false
};

export function useSettings() {
  const [settings, setSettings] = useKV('skills-tree-settings', defaultSettings);

  const updateSetting = <K extends keyof SettingsState>(
    key: K, 
    value: SettingsState[K]
  ) => {
    setSettings(currentSettings => ({
      ...currentSettings,
      [key]: value
    }));
  };

  return {
    settings,
    updateSetting
  };
}