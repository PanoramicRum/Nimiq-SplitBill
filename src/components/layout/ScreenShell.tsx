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
        className={`flex w-full max-w-md flex-col bg-white shadow-xl dark:bg-slate-900 ${className}`}
        style={{ height: shellHeight }}
      >
        {children}
      </div>
    </div>
  );
}
