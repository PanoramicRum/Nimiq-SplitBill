const STEP_LABELS = ['Bill', 'Tip', 'People', 'Split', 'Results'];

interface ProgressStepperProps {
  currentStep: number; // 1-5
}

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  const totalSteps = STEP_LABELS.length;
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="flex flex-col gap-3 px-6 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Step {currentStep} of {totalSteps}
          <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {STEP_LABELS[currentStep - 1]}
          </span>
        </p>
        <p className="text-sm font-bold text-primary">{percentage}%</p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/20">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
