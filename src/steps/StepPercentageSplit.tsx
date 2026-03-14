import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { calculateTipCents } from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';
import { getAvatarGradient, getInitials } from '../utils/avatarColors';

export function StepPercentageSplit() {
  const navigate = useNavigate();
  const billAmountCents = useBillStore((s) => s.billAmountCents);
  const tipConfig = useBillStore((s) => s.tipConfig);
  const people = useBillStore((s) => s.people);
  const percentageAllocations = useBillStore((s) => s.percentageAllocations);
  const setPercentageAllocation = useBillStore(
    (s) => s.setPercentageAllocation,
  );

  const tipCents = calculateTipCents(billAmountCents, tipConfig);
  const grandTotal = billAmountCents + tipCents;

  const allocationMap = new Map(
    percentageAllocations.map((a) => [a.personId, a.percentage]),
  );

  const othersSum = people.slice(0, -1).reduce((sum, p) => {
    return sum + (allocationMap.get(p.id) ?? 0);
  }, 0);

  const lastPersonPct = Math.max(0, 100 - othersSum);
  const isOverAllocated = othersSum > 100;
  const isValid = !isOverAllocated && people.length >= 2;

  const handleChange = (personId: string, value: number) => {
    setPercentageAllocation(personId, Math.max(0, Math.min(100, value)));
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Percentage Split" />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
          Assign percentages
        </h2>

        {/* Progress indicator */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-primary/20 dark:bg-slate-800/50">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-semibold text-slate-600 dark:text-slate-400">
              Allocated
            </span>
            <span
              className={`font-bold ${isOverAllocated ? 'text-red-500' : 'text-primary'}`}
            >
              {othersSum + (isOverAllocated ? 0 : lastPersonPct)}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-primary/20">
            <div
              className={`h-full rounded-full transition-all ${isOverAllocated ? 'bg-red-500' : 'nimiq-gradient'}`}
              style={{
                width: `${Math.min(100, othersSum + lastPersonPct)}%`,
              }}
            />
          </div>
          {isOverAllocated && (
            <div className="mt-2 flex items-center gap-1 text-sm text-red-500">
              <Icon name="warning" className="text-base" />
              Percentages exceed 100%! Reduce some allocations.
            </div>
          )}
        </div>

        {/* Person allocations */}
        <div className="space-y-3">
          {people.map((person, i) => {
            const isLast = i === people.length - 1;
            const pct = isLast
              ? lastPersonPct
              : (allocationMap.get(person.id) ?? 0);
            const amount = Math.round((grandTotal * pct) / 100);

            return (
              <div
                key={person.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(person.colorIndex)} text-sm font-bold text-white`}
                >
                  {getInitials(person.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    {person.name}
                  </p>
                  <p className="text-sm text-primary">
                    {formatCurrency(amount)}
                  </p>
                </div>

                {isLast ? (
                  <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
                    <span className="text-sm font-bold text-primary">
                      {lastPersonPct}%
                    </span>
                    <span className="text-xs text-primary/70">remaining</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChange(person.id, pct - 5)}
                      className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 active:scale-95 dark:bg-slate-700 dark:text-slate-400"
                    >
                      <Icon name="remove" className="text-lg" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) =>
                        handleChange(
                          person.id,
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <span className="text-sm text-slate-500">%</span>
                    <button
                      onClick={() => handleChange(person.id, pct + 5)}
                      className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 active:scale-95 dark:bg-slate-700 dark:text-slate-400"
                    >
                      <Icon name="add" className="text-lg" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <BottomCTA
        label="View results"
        onClick={() => navigate('/results')}
        disabled={!isValid}
      />
    </div>
  );
}
