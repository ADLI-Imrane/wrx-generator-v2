import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useWorkspacePreferencesStore } from '../stores/workspace-preferences.store';
import {
  defaultWorkspacePreferences,
  parseWorkspacePreferences,
  resolveWorkspaceAppearance,
  workspacePreferencesKey,
  workspaceAccentOptions,
  workspaceAccentVariables,
} from './workspace-preferences';

function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const channels = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
      .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return (channels[0] ?? 0) * 0.2126 + (channels[1] ?? 0) * 0.7152 + (channels[2] ?? 0) * 0.0722;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  const light = values[0] ?? 0;
  const dark = values[1] ?? 0;
  return (light + 0.05) / (dark + 0.05);
}

describe('workspace preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspacePreferencesStore.setState({ ...defaultWorkspacePreferences, userId: null });
  });

  it('persists mode and accent per signed-in user and restores them after reload hydration', () => {
    const store = useWorkspacePreferencesStore.getState();
    store.hydrate('user-a');
    useWorkspacePreferencesStore.getState().setNavigationMode('dock');
    useWorkspacePreferencesStore.getState().setAccent('green');
    useWorkspacePreferencesStore.getState().setAppearance('dark');

    expect(JSON.parse(localStorage.getItem(workspacePreferencesKey('user-a')) || '{}')).toEqual({
      navigationMode: 'dock', accent: 'green', appearance: 'dark',
    });
    expect(localStorage.getItem(workspacePreferencesKey('user-b'))).toBeNull();

    useWorkspacePreferencesStore.getState().hydrate('user-b');
    expect(useWorkspacePreferencesStore.getState()).toMatchObject(defaultWorkspacePreferences);
    useWorkspacePreferencesStore.getState().hydrate('user-a');
    expect(useWorkspacePreferencesStore.getState()).toMatchObject({ navigationMode: 'dock', accent: 'green', appearance: 'dark' });
  });

  it('defaults to Light and resolves System from the current OS preference', () => {
    expect(defaultWorkspacePreferences.appearance).toBe('light');
    expect(resolveWorkspaceAppearance('system', false)).toBe('light');
    expect(resolveWorkspaceAppearance('system', true)).toBe('dark');
    expect(resolveWorkspaceAppearance('dark', false)).toBe('dark');
    expect(resolveWorkspaceAppearance('light', true)).toBe('light');
  });

  it('keeps appearance, accent, and navigation mode independent when each changes', () => {
    useWorkspacePreferencesStore.getState().hydrate('user-a');
    useWorkspacePreferencesStore.getState().setAccent('red');
    useWorkspacePreferencesStore.getState().setAppearance('dark');
    useWorkspacePreferencesStore.getState().setNavigationMode('launcher');
    expect(useWorkspacePreferencesStore.getState()).toMatchObject({ accent: 'red', appearance: 'dark', navigationMode: 'launcher' });
    useWorkspacePreferencesStore.getState().setAppearance('system');
    expect(useWorkspacePreferencesStore.getState()).toMatchObject({ accent: 'red', appearance: 'system', navigationMode: 'launcher' });
  });

  it('defaults invalid or malformed stored settings safely', () => {
    expect(parseWorkspacePreferences('{"navigationMode":"anything","accent":"ultraviolet"}'))
      .toEqual(defaultWorkspacePreferences);
    expect(parseWorkspacePreferences('{"navigationMode":"dock","accent":"red"}'))
      .toEqual({ navigationMode: 'dock', accent: 'red', appearance: 'light' });
    expect(parseWorkspacePreferences('{broken')).toEqual(defaultWorkspacePreferences);
  });

  it('maps every curated accent to the centralized workspace interaction tokens', () => {
    for (const [accent, tokens] of Object.entries(workspaceAccentOptions)) {
      expect(workspaceAccentVariables(accent as keyof typeof workspaceAccentOptions)).toMatchObject({
        '--workspace-accent': tokens.color,
        '--workspace-accent-soft': tokens.soft,
        '--workspace-accent-surface': tokens.surface,
        '--workspace-accent-border': tokens.border,
        '--workspace-accent-focus': `color-mix(in srgb, ${tokens.color} 22%, transparent)`,
        '--workspace-accent-strong': tokens.strong,
        '--workspace-accent-dark': tokens.dark,
        '--workspace-accent-contrast': tokens.contrast,
        '--workspace-accent-on-dark': tokens.onDark,
        '--workspace-sidebar-bg': tokens.sidebarBg,
        '--workspace-sidebar-bg-elevated': tokens.sidebarElevated,
        '--workspace-sidebar-border': tokens.sidebarBorder,
        '--workspace-sidebar-text': tokens.sidebarText,
        '--workspace-sidebar-muted': tokens.sidebarMuted,
        '--workspace-sidebar-active-bg': tokens.sidebarActive,
      });
    }
  });

  it('keeps dark neutral and all five accent-on-dark text combinations readable', () => {
    expect(contrastRatio('#edf1f3', '#20262b')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio('#c2cbd0', '#272f35')).toBeGreaterThanOrEqual(7);
    expect(contrastRatio('#a8b2b8', '#272f35')).toBeGreaterThanOrEqual(5);
    expect(contrastRatio('#7b8790', '#272f35')).toBeGreaterThanOrEqual(3);
    for (const option of Object.values(workspaceAccentOptions)) {
      expect(contrastRatio(option.onDark, '#20262b')).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(option.onDark, '#272f35')).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps Dark Theme controls on neutral or tinted graphite surfaces with readable labels', () => {
    const styles = readFileSync(resolve(process.cwd(), 'src/styles/workspace-navigation.css'), 'utf8');
    expect(styles).toContain(".wrx-app[data-theme='dark'] main .password-console .wrx-character-set {");
    expect(styles).toContain(".wrx-app[data-theme='dark'] main .password-console .wrx-character-set[data-enabled='true']");
    expect(styles).toContain('color: var(--workspace-text); border-color: var(--workspace-accent-theme-border); background: var(--workspace-accent-theme-surface);');
    expect(styles).toContain(".wrx-app[data-theme='dark'] main .digital-card-library :is(.dc-state, .dc-empty)");
    expect(styles).toContain(".wrx-app[data-theme='dark'] main :is(.email-signature-page, .email-signature-editor)");
    expect(styles).not.toMatch(/(^|\n)\.password-console \.wrx-character-set/);
  });

  it.each([
    ['blue', '#17212b', '#202d39', '#344351', '#c5d0da', '#8998a6', '#203b62'],
    ['green', '#17241f', '#203129', '#35483e', '#c5d2ca', '#879b8f', '#244234'],
    ['orange', '#282219', '#342b1e', '#4c402e', '#d8cfc0', '#a99a83', '#463722'],
    ['red', '#291d22', '#36252b', '#4b333a', '#d9cbd0', '#aa9299', '#492830'],
    ['purple', '#241e2b', '#31273a', '#493b53', '#d4cddc', '#a397b0', '#40304f'],
  ] as const)('derives the %s accent-tinted Sidebar surface family', (accent, bg, elevated, border, text, muted, active) => {
    expect(workspaceAccentVariables(accent)).toMatchObject({
      '--workspace-sidebar-bg': bg,
      '--workspace-sidebar-bg-elevated': elevated,
      '--workspace-sidebar-border': border,
      '--workspace-sidebar-text': text,
      '--workspace-sidebar-muted': muted,
      '--workspace-sidebar-active-bg': active,
    });
    expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(muted, elevated)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#ffffff', active)).toBeGreaterThanOrEqual(4.5);
  });

  it('routes shared primary utilities and authenticated tool accents through workspace tokens', () => {
    const styleSource = (file: string) => readFileSync(resolve(process.cwd(), 'src/styles', file), 'utf8');
    const navigationStyles = styleSource('workspace-navigation.css');
    const businessCardStyles = styleSource('business-cards.css');
    const digitalCardStyles = styleSource('digital-cards.css');
    const emailSignatureStyles = styleSource('email-signatures.css');

    expect(navigationStyles).toContain('.wrx-app .from-primary-600');
    expect(navigationStyles).toContain('var(--workspace-accent-focus)');
    expect(navigationStyles).toContain('--blue: var(--workspace-accent)');
    expect(businessCardStyles).toContain('--blue: var(--workspace-accent)');
    expect(digitalCardStyles).toContain('--dc-blue: var(--workspace-accent)');
    expect(emailSignatureStyles).toContain('--es-blue: var(--workspace-accent)');
  });

  it('scopes dark appearance to the authenticated workspace and preserves authored artwork', () => {
    const styleSource = (file: string) => readFileSync(resolve(process.cwd(), 'src/styles', file), 'utf8');
    const navigationStyles = styleSource('workspace-navigation.css');
    const layoutSource = readFileSync(resolve(process.cwd(), 'src/components/Layout.tsx'), 'utf8');
    const routerSource = readFileSync(resolve(process.cwd(), 'src/router.tsx'), 'utf8');
    expect(navigationStyles).toContain(".wrx-app[data-theme='dark']");
    expect(navigationStyles).toContain('.bc-face, .email-signature-art, .dc-preview');
    expect(navigationStyles).not.toMatch(/(^|\n)body\s*\{/);
    expect(layoutSource).toContain('data-theme={resolvedAppearance}');
    expect(routerSource).toContain("{ path: '/c/:slug', element: <PublicDigitalCardPage /> }");
  });
});
