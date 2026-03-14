import type { ReactNode } from 'react';

interface ScreenShellProps {
  children: ReactNode;
  className?: string;
}

const shellHeight = 'var(--app-height, 100dvh)';

export function ScreenShell({ children, className = '' }: ScreenShellProps) {
  return (
    <div
      className="flex justify-center bg-bg-light dark:bg-bg-dark"
      style={{ height: shellHeight }}
    >
      <div
        className={`flex w-full max-w-md flex-col bg-bg-light shadow-xl dark:border-x dark:border-primary/10 dark:bg-bg-dark ${className}`}
        style={{ height: shellHeight }}
      >
        {children}
      </div>
    </div>
  );
}
