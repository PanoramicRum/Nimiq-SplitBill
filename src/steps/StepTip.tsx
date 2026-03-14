import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { useBillStore } from '../store/useBillStore';
import { calculateTipCents } from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';

const TIP_PRESETS = [10, 15, 18, 20];

export function StepTip() {
  const navigate = useNavigate();
  const billAmountCents = useBillStore((s) => s.billAmountCents);
  const tipConfig = useBillStore((s) => s.tipConfig);
  const setTipConfig = useBillStore((s) => s.setTipConfig);
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const tipCents = calculateTipCents(billAmountCents, tipConfig);
  const grandTotal = billAmountCents + tipCents;

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

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Tip" />

      <div className="flex-1 px-6 py-6">
        <h2 className="mb-6 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
          Want to include a tip?
        </h2>

        {/* Percentage presets */}
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          {TIP_PRESETS.map((pct) => {
            const isActive =
              tipConfig.mode === 'percentage' && tipConfig.percentage === pct;
            return (
              <button
                key={pct}
                onClick={() => handlePreset(pct)}
                className={`h-12 rounded-full border-2 px-6 font-semibold transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {pct}%
              </button>
            );
          })}
          <button
            onClick={handleNoTip}
            className={`h-12 rounded-full border-2 px-6 font-semibold transition-all ${
              tipConfig.mode === 'none'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            No Tip
          </button>
        </div>

        {/* Custom amount */}
        <div className="mb-8 flex justify-center">
          {showCustom ? (
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                value={customValue}
                onChange={(e) => handleCustomValueChange(e.target.value)}
                placeholder="0.00"
                className="w-24 border-0 bg-transparent text-center text-lg font-semibold text-slate-900 focus:ring-0 dark:text-white"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={handleCustomAmount}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Custom amount
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-800">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">
                Subtotal
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(billAmountCents)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                Tip
                {tipConfig.mode === 'percentage' && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {tipConfig.percentage}%
                  </span>
                )}
              </span>
              <span className="font-semibold text-primary">
                +{formatCurrency(tipCents)}
              </span>
            </div>
            <div className="border-t border-slate-100 pt-2 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  Total
                </span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomCTA label="Continue" onClick={() => navigate('/people')} />
    </div>
  );
}
