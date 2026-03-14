const STEP_LABELS = ['Bill', 'Tip', 'People', 'Split', 'Results'];

interface ProgressStepperProps {
  currentStep: number; // 1-5
}

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-3">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={`flex size-2.5 rounded-full transition-all ${
                isActive
                  ? 'scale-125 bg-primary'
                  : isCompleted
                    ? 'bg-primary/60'
                    : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isActive
                  ? 'text-primary'
                  : isCompleted
                    ? 'text-primary/60'
                    : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
