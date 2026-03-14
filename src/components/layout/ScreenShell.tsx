import type { ReactNode } from 'react';

interface ScreenShellProps {
  children: ReactNode;
  className?: string;
}

export function ScreenShell({ children, className = '' }: ScreenShellProps) {
  return (
    <div className="flex min-h-screen justify-center bg-bg-light dark:bg-bg-dark" style={{ minHeight: '100dvh' }}>
      <div
        className={`flex min-h-screen w-full max-w-md flex-col bg-bg-light shadow-xl dark:border-x dark:border-primary/10 dark:bg-bg-dark ${className}`}
        style={{ minHeight: '100dvh' }}
      >
        {children}
      </div>
    </div>
  );
}
