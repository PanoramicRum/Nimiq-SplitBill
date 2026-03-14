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
    <div className="sticky top-0 z-20 flex items-center justify-between bg-bg-light/80 px-4 py-3 backdrop-blur-md dark:bg-bg-dark/80">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex size-12 items-center justify-center rounded-full bg-slate-200 text-slate-900 transition-colors hover:bg-slate-300 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30"
            aria-label="Go back"
          >
            <Icon name="arrow_back" />
          </button>
        )}
      </div>
      {title && (
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
      )}
      <div className="flex items-center gap-1">
        {trailing ?? <DarkModeToggle />}
      </div>
    </div>
  );
}
