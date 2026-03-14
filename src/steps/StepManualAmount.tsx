import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { CURRENCIES } from '../types';

export function StepManualAmount() {
  const navigate = useNavigate();
  const setBillAmount = useBillStore((s) => s.setBillAmount);
  const currencyCode = useBillStore((s) => s.currencyCode);
  const [display, setDisplay] = useState('0');

  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const decimals = currency?.decimals ?? 2;
  const showDot = decimals > 0;

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', showDot ? '.' : '', '0', 'del'];

  const handleKey = (key: string) => {
    if (key === '') return;
    if (key === 'del') {
      setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    if (key === '.') {
      if (display.includes('.')) return;
      setDisplay((prev) => prev + '.');
      return;
    }
    // Max decimal places
    const dotIndex = display.indexOf('.');
    if (dotIndex !== -1 && display.length - dotIndex > decimals) return;
    if (display === '0') {
      setDisplay(key);
    } else {
      setDisplay((prev) => prev + key);
    }
  };

  const amountCents = Math.round(parseFloat(display || '0') * 100);

  const handleContinue = () => {
    setBillAmount(amountCents);
    navigate('/tip');
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Enter Amount" />

      <div className="flex flex-1 flex-col items-center justify-between px-6 py-8">
        {/* Amount display */}
        <div className="flex flex-col items-center">
          <div className="mb-2 rounded-full bg-primary/10 px-3 py-1">
            <span className="text-xs font-bold text-primary">{currencyCode}</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-4xl font-medium text-slate-400">{currency?.symbol ?? '$'}</span>
            <span className="text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {display}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
            Enter the total bill amount
          </p>
        </div>

        {/* Item-by-item entry option */}
        <button
          onClick={() => navigate('/manual/items')}
          className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
        >
          <Icon name="receipt_long" className="text-lg text-primary" />
          Add items instead
        </button>

        {/* Numeric keypad */}
        <div className="mt-4 grid w-full max-w-xs grid-cols-3 gap-3">
          {KEYS.map((key, idx) => (
            <button
              key={idx}
              onClick={() => handleKey(key)}
              disabled={key === ''}
              className={`flex h-16 items-center justify-center rounded-xl text-2xl font-semibold transition-all active:scale-95 ${
                key === ''
                  ? 'invisible'
                  : key === 'del'
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    : 'bg-white text-slate-900 shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
              }`}
            >
              {key === 'del' ? (
                <Icon name="backspace" className="text-2xl" />
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </div>

      <BottomCTA
        label="Continue"
        onClick={handleContinue}
        disabled={amountCents === 0}
      />
    </div>
  );
}
