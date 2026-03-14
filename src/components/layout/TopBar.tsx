import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { DarkModeToggle } from '../ui/DarkModeToggle';
import type { ReactNode } from 'react';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  trailing?: ReactNode;
}

export function TopBar({ title, showBack = true, onBack, trailing }: TopBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex size-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Go back"
          >
            <Icon name="arrow_back" />
          </button>
        )}
      </div>
      {title && (
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
      )}
      <div className="flex items-center gap-1">
        {trailing ?? <DarkModeToggle />}
      </div>
    </div>
  );
}
