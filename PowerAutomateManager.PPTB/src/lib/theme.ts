export function applyTheme(theme: 'light' | 'dark'): void {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.body.classList.toggle('theme-light', theme === 'light');
}
