import { useBillStore } from '../../store/useBillStore';
import { Icon } from './Icon';

export function DarkModeToggle() {
  const isDarkMode = useBillStore((s) => s.isDarkMode);
  const toggleDarkMode = useBillStore((s) => s.toggleDarkMode);

  return (
    <button
      onClick={toggleDarkMode}
      className="flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} />
    </button>
  );
}
