import { useBillStore } from '../../store/useBillStore';
import { Icon } from './Icon';

export function DarkModeToggle() {
  const isDarkMode = useBillStore((s) => s.isDarkMode);
  const toggleDarkMode = useBillStore((s) => s.toggleDarkMode);

  return (
    <button
      onClick={toggleDarkMode}
      className="flex size-12 items-center justify-center rounded-full border border-slate-300 bg-white/50 text-slate-700 backdrop-blur-sm transition-all hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} />
    </button>
  );
}
