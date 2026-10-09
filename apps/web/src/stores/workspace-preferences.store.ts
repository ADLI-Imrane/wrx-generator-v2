import { create } from 'zustand';
import {
  defaultWorkspacePreferences,
  readWorkspacePreferences,
  writeWorkspacePreferences,
  type WorkspaceAccent,
  type WorkspaceAppearance,
  type WorkspaceNavigationMode,
  type WorkspacePreferences,
} from '../lib/workspace-preferences';

interface WorkspacePreferencesState extends WorkspacePreferences {
  userId: string | null;
  hydrate: (userId: string | null) => void;
  setNavigationMode: (mode: WorkspaceNavigationMode) => void;
  setAccent: (accent: WorkspaceAccent) => void;
  setAppearance: (appearance: WorkspaceAppearance) => void;
}

export const useWorkspacePreferencesStore = create<WorkspacePreferencesState>((set, get) => ({
  ...defaultWorkspacePreferences,
  userId: null,
  hydrate: (userId) => set({ userId, ...(userId ? readWorkspacePreferences(userId) : defaultWorkspacePreferences) }),
  setNavigationMode: (navigationMode) => {
    const { userId, accent, appearance } = get();
    set({ navigationMode });
    if (userId) writeWorkspacePreferences(userId, { navigationMode, accent, appearance });
  },
  setAccent: (accent) => {
    const { userId, navigationMode, appearance } = get();
    set({ accent });
    if (userId) writeWorkspacePreferences(userId, { navigationMode, accent, appearance });
  },
  setAppearance: (appearance) => {
    const { userId, navigationMode, accent } = get();
    set({ appearance });
    if (userId) writeWorkspacePreferences(userId, { navigationMode, accent, appearance });
  },
}));
