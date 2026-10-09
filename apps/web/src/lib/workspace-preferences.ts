import type { CSSProperties } from 'react';

export type WorkspaceNavigationMode = 'sidebar' | 'dock' | 'launcher';
export type WorkspaceAccent = 'blue' | 'green' | 'orange' | 'red' | 'purple';
export type WorkspaceAppearance = 'light' | 'dark' | 'system';

export const workspaceAccentOptions: Record<WorkspaceAccent, { label: string; color: string; soft: string; surface: string; border: string; strong: string; dark: string; contrast: string; onDark: string; sidebarBg: string; sidebarElevated: string; sidebarBorder: string; sidebarText: string; sidebarMuted: string; sidebarActive: string }> = {
  blue: { label: 'Bleu WRX', color: '#235ee7', soft: '#e9f0ff', surface: '#f4f7ff', border: '#bfd0f4', strong: '#1749c1', dark: '#172c50', contrast: '#f6f8fc', onDark: '#86adff', sidebarBg: '#17212b', sidebarElevated: '#202d39', sidebarBorder: '#344351', sidebarText: '#c5d0da', sidebarMuted: '#8998a6', sidebarActive: '#203b62' },
  green: { label: 'Vert', color: '#26734d', soft: '#e8f2eb', surface: '#f1f7f2', border: '#bdd5c5', strong: '#1c5d3d', dark: '#173b2d', contrast: '#f5faf7', onDark: '#85c99e', sidebarBg: '#17241f', sidebarElevated: '#203129', sidebarBorder: '#35483e', sidebarText: '#c5d2ca', sidebarMuted: '#879b8f', sidebarActive: '#244234' },
  orange: { label: 'Orange', color: '#965e00', soft: '#fbf0df', surface: '#fff8ec', border: '#e5cda6', strong: '#784a00', dark: '#493315', contrast: '#fffaf1', onDark: '#f0be69', sidebarBg: '#282219', sidebarElevated: '#342b1e', sidebarBorder: '#4c402e', sidebarText: '#d8cfc0', sidebarMuted: '#a99a83', sidebarActive: '#463722' },
  red: { label: 'Rouge', color: '#a83f47', soft: '#f8e9e9', surface: '#fff4f4', border: '#e5c0c3', strong: '#92343d', dark: '#482228', contrast: '#fff7f8', onDark: '#f08d94', sidebarBg: '#291d22', sidebarElevated: '#36252b', sidebarBorder: '#4b333a', sidebarText: '#d9cbd0', sidebarMuted: '#aa9299', sidebarActive: '#492830' },
  purple: { label: 'Violet', color: '#7554a6', soft: '#f0ebf7', surface: '#f8f5fc', border: '#d2c5e4', strong: '#633d91', dark: '#342448', contrast: '#faf7ff', onDark: '#c2a2ff', sidebarBg: '#241e2b', sidebarElevated: '#31273a', sidebarBorder: '#493b53', sidebarText: '#d4cddc', sidebarMuted: '#a397b0', sidebarActive: '#40304f' },
};

export function workspaceAccentVariables(accent: WorkspaceAccent): CSSProperties {
  const selected = workspaceAccentOptions[accent];
  return {
    '--workspace-accent': selected.color,
    '--workspace-accent-soft': selected.soft,
    '--workspace-accent-surface': selected.surface,
    '--workspace-accent-border': selected.border,
    '--workspace-accent-focus': `color-mix(in srgb, ${selected.color} 22%, transparent)`,
    '--workspace-accent-strong': selected.strong,
    '--workspace-accent-dark': selected.dark,
    '--workspace-accent-contrast': selected.contrast,
    '--workspace-accent-on-dark': selected.onDark,
    '--workspace-sidebar-bg': selected.sidebarBg,
    '--workspace-sidebar-bg-elevated': selected.sidebarElevated,
    '--workspace-sidebar-border': selected.sidebarBorder,
    '--workspace-sidebar-text': selected.sidebarText,
    '--workspace-sidebar-muted': selected.sidebarMuted,
    '--workspace-sidebar-active-bg': selected.sidebarActive,
  } as CSSProperties;
}

export interface WorkspacePreferences {
  navigationMode: WorkspaceNavigationMode;
  accent: WorkspaceAccent;
  appearance: WorkspaceAppearance;
}

export const defaultWorkspacePreferences: WorkspacePreferences = {
  navigationMode: 'sidebar',
  accent: 'blue',
  appearance: 'light',
};

const navigationModes: WorkspaceNavigationMode[] = ['sidebar', 'dock', 'launcher'];
const accents: WorkspaceAccent[] = ['blue', 'green', 'orange', 'red', 'purple'];
const appearances: WorkspaceAppearance[] = ['light', 'dark', 'system'];

export function resolveWorkspaceAppearance(appearance: WorkspaceAppearance, systemPrefersDark: boolean): 'light' | 'dark' {
  return appearance === 'system' ? (systemPrefersDark ? 'dark' : 'light') : appearance;
}

export function workspacePreferencesKey(userId: string): string {
  return `wrx-workspace-preferences:${userId}`;
}

export function parseWorkspacePreferences(value: string | null): WorkspacePreferences {
  if (!value) return defaultWorkspacePreferences;
  try {
    const parsed = JSON.parse(value) as Partial<WorkspacePreferences>;
    return {
      navigationMode: navigationModes.includes(parsed.navigationMode as WorkspaceNavigationMode)
        ? parsed.navigationMode as WorkspaceNavigationMode : 'sidebar',
      accent: accents.includes(parsed.accent as WorkspaceAccent) ? parsed.accent as WorkspaceAccent : 'blue',
      appearance: appearances.includes(parsed.appearance as WorkspaceAppearance) ? parsed.appearance as WorkspaceAppearance : 'light',
    };
  } catch {
    return defaultWorkspacePreferences;
  }
}

export function readWorkspacePreferences(userId: string): WorkspacePreferences {
  if (typeof window === 'undefined') return defaultWorkspacePreferences;
  try { return parseWorkspacePreferences(window.localStorage.getItem(workspacePreferencesKey(userId))); }
  catch { return defaultWorkspacePreferences; }
}

export function writeWorkspacePreferences(userId: string, preferences: WorkspacePreferences): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(workspacePreferencesKey(userId), JSON.stringify(preferences)); }
  catch { /* Preferences remain usable for the current session when storage is unavailable. */ }
}
