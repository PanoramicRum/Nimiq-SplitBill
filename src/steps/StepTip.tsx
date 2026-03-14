import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { calculateTipCents } from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';

const TIP_PRESETS = [10, 15, 18, 20];

export function StepTip() {
  const navigate = useNavigate();
  const billAmountCents = useBillStore((s) => s.billAmountCents);
  const tipConfig = useBillStore((s) => s.tipConfig);
  const setTipConfig = useBillStore((s) => s.setTipConfig);
  const people = useBillStore((s) => s.people);
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const tipCents = calculateTipCents(billAmountCents, tipConfig);
  const grandTotal = billAmountCents + tipCents;
  const perPerson = people.length > 0 ? Math.ceil(grandTotal / people.length) : grandTotal;

  const handlePreset = (pct: number) => {
    setShowCustom(false);
    setTipConfig({ mode: 'percentage', percentage: pct, fixedAmount: 0 });
  };

  const handleNoTip = () => {
    setShowCustom(false);
    setTipConfig({ mode: 'none', percentage: 0, fixedAmount: 0 });
  };

  const handleCustomAmount = () => {
    setShowCustom(true);
    const cents = Math.round(parseFloat(customValue || '0') * 100);
    setTipConfig({ mode: 'fixed', percentage: 0, fixedAmount: cents });
  };

  const handleCustomValueChange = (val: string) => {
    setCustomValue(val);
    const cents = Math.round(parseFloat(val || '0') * 100);
    setTipConfig({ mode: 'fixed', percentage: 0, fixedAmount: cents });
  };

  const activeLabel = tipConfig.mode === 'percentage'
    ? `${tipConfig.percentage}% selected`
    : tipConfig.mode === 'fixed'
      ? 'Custom amount'
      : 'No tip';

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Add a Tip" />

      <div className="flex-1 px-4 py-6">
        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-primary/10 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Bill</p>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {formatCurrency(billAmountCents)}
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/10 p-6 shadow-sm dark:bg-primary/20">
            <p className="text-sm font-medium text-primary">Tip Amount</p>
            <p className="text-3xl font-extrabold tracking-tight text-primary">
              {formatCurrency(tipCents)}
            </p>
          </div>
        </div>

        {/* Tip Selection */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Select Tip Percentage
            </h2>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {activeLabel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleNoTip}
              className={`flex h-12 items-center justify-center rounded-xl font-semibold transition-all ${
                tipConfig.mode === 'none'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2 dark:ring-offset-bg-dark'
                  : 'border border-transparent bg-slate-200 text-slate-900 hover:border-primary/50 hover:bg-primary/20 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-primary/30'
              }`}
            >
              No Tip
            </button>
            {TIP_PRESETS.map((pct) => {
              const isActive =
                tipConfig.mode === 'percentage' && tipConfig.percentage === pct;
              return (
                <button
                  key={pct}
                  onClick={() => handlePreset(pct)}
                  className={`flex h-12 items-center justify-center rounded-xl font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2 dark:ring-offset-bg-dark'
                      : 'border border-transparent bg-slate-200 text-slate-900 hover:border-primary/50 hover:bg-primary/20 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-primary/30'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
            {showCustom ? (
              <div className="flex h-12 items-center justify-center rounded-xl bg-primary/10 px-2 ring-2 ring-primary ring-offset-2 dark:ring-offset-bg-dark">
                <span className="text-primary">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={customValue}
                  onChange={(e) => handleCustomValueChange(e.target.value)}
                  placeholder="0.00"
                  className="w-16 border-0 bg-transparent text-center font-semibold text-primary focus:ring-0"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={handleCustomAmount}
                className="flex h-12 items-center justify-center rounded-xl border border-transparent bg-slate-200 font-semibold text-slate-900 transition-all hover:border-primary/50 hover:bg-primary/20 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-primary/30"
              >
                Custom
              </button>
            )}
          </div>

          {/* Visualization card */}
          <div className="relative mt-8 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-blue-600 p-6">
            <div className="relative z-10">
              <p className="mb-1 text-sm font-medium text-white/80">New Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">
                  {formatCurrency(grandTotal)}
                </span>
                {people.length > 0 && (
                  <span className="text-sm text-white/60">
                    {formatCurrency(perPerson)} / person
                  </span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-20">
              <Icon name="receipt_long" className="text-[96px] text-white" />
            </div>
          </div>
        </section>

        {/* Confirm button */}
        <div className="mt-10">
          <button
            onClick={() => navigate('/people')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-xl shadow-primary/20 transition-transform active:scale-[0.98] hover:bg-primary/90"
          >
            Confirm & Continue
            <Icon name="arrow_forward" />
          </button>
        </div>
      </div>
    </div>
  );
}
