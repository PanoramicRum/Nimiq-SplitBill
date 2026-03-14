import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { calculateTipCents, calculateEvenSplit } from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';
import { getAvatarGradient, getInitials } from '../utils/avatarColors';

export function StepEvenSplit() {
  const navigate = useNavigate();
  const billAmountCents = useBillStore((s) => s.billAmountCents);
  const tipConfig = useBillStore((s) => s.tipConfig);
  const people = useBillStore((s) => s.people);

  const tipCents = calculateTipCents(billAmountCents, tipConfig);
  const grandTotal = billAmountCents + tipCents;
  const results = calculateEvenSplit(grandTotal, people);

  const personMap = new Map(people.map((p) => [p.id, p]));

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Even Split" />

      <div className="flex-1 px-4 py-6">
        {/* Per-person amount hero */}
        <div className="mb-6 flex flex-col items-center rounded-xl bg-primary/5 py-8 dark:bg-primary/10">
          <Icon name="balance" className="mb-2 text-3xl text-primary" />
          <p className="mb-1 text-sm font-semibold text-primary">
            Each person pays
          </p>
          <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
            {results.length > 0 ? formatCurrency(results[0].total) : '$0.00'}
          </p>
          {results.some((r) => r.isRemainderHolder) && (
            <div className="mt-3 flex items-center gap-1 rounded-full bg-nimiq-gold/10 px-3 py-1">
              <Icon name="info" className="text-sm text-nimiq-gold" />
              <span className="text-xs font-medium text-nimiq-gold">
                {personMap.get(results[results.length - 1].personId)?.name}{' '}
                covers the extra{' '}
                {formatCurrency(
                  results[results.length - 1].total - results[0].total,
                )}
              </span>
            </div>
          )}
        </div>

        {/* People list */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Split breakdown
        </h3>
        <div className="space-y-3">
          {results.map((result) => {
            const person = personMap.get(result.personId);
            if (!person) return null;

            return (
              <div
                key={result.personId}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(person.colorIndex)} text-sm font-bold text-white`}
                  >
                    {getInitials(person.name)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {person.name}
                    </p>
                    {result.isRemainderHolder && (
                      <p className="text-xs text-nimiq-gold">
                        Covers rounding
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(result.total)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Total check */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
          <span className="text-sm font-semibold text-slate-500">
            Grand total
          </span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatCurrency(grandTotal)}
          </span>
        </div>
      </div>

      <BottomCTA
        label="View final results"
        onClick={() => navigate('/results')}
      />
    </div>
  );
}
