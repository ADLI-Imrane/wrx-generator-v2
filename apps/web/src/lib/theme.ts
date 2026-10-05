export function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem('wrx-theme', dark ? 'dark' : 'light');
  } catch {
    /* ignore */
  }
  return dark;
}
export const isDark = () => document.documentElement.classList.contains('dark');
