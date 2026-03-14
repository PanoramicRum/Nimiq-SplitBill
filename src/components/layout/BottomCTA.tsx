import { Icon } from '../ui/Icon';

interface BottomCTAProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
  variant?: 'primary' | 'secondary';
}

export function BottomCTA({
  label,
  onClick,
  disabled = false,
  icon,
  variant = 'primary',
}: BottomCTAProps) {
  const isPrimary = variant === 'primary';

  return (
    <div className="safe-bottom sticky bottom-0 z-10 bg-gradient-to-t from-white via-white to-white/0 px-6 pb-6 pt-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/0">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold transition-all active:scale-[0.98] ${
          isPrimary
            ? 'bg-primary text-white shadow-primary hover:bg-primary/90 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-600'
            : 'border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
      >
        {icon && <Icon name={icon} className="text-xl" />}
        {label}
        {isPrimary && !icon && <Icon name="arrow_forward" className="text-xl" />}
      </button>
    </div>
  );
}
