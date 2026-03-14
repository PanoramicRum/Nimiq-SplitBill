import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { DarkModeToggle } from '../components/ui/DarkModeToggle';
import { CurrencyPicker } from '../components/ui/CurrencyPicker';
import { useBillStore } from '../store/useBillStore';
import { useNimiq } from '../services/nimiq';
import { CURRENCIES } from '../types';

const NIMIQ_PAY_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.nimiq.pay';
const NIMIQ_PAY_APP_STORE = 'https://apps.apple.com/us/app/nimiq-pay/id6471844738';

function getNimiqPayStoreUrl(): string {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return NIMIQ_PAY_APP_STORE;
  }
  return NIMIQ_PAY_PLAY_STORE;
}

export function StepStart() {
  const navigate = useNavigate();
  const setBillSource = useBillStore((s) => s.setBillSource);
  const reset = useBillStore((s) => s.reset);
  const setOrganizerAddress = useBillStore((s) => s.setOrganizerAddress);
  const currencyCode = useBillStore((s) => s.currencyCode);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const { isAvailable, requestAccounts } = useNimiq();

  const currency = CURRENCIES.find((c) => c.code === currencyCode);

  // Auto-connect to Nimiq Pay when available
  useEffect(() => {
    if (isAvailable) {
      requestAccounts().then((addr) => {
        if (addr) setOrganizerAddress(addr);
      });
    }
  }, [isAvailable, requestAccounts, setOrganizerAddress]);

  const handleScan = () => {
    reset();
    setBillSource('scan');
    navigate('/scan');
  };

  const handleManual = () => {
    reset();
    setBillSource('manual');
    navigate('/manual');
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <div className="relative flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setShowCurrencyPicker(true)}
          className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Change currency"
        >
          <span className="text-base">{currency?.flag}</span>
          <span>{currencyCode}</span>
          <span className="text-slate-400">{currency?.symbol}</span>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-slate-900 dark:text-white">
          Nimiq SplitBill
        </span>
        <DarkModeToggle />
      </div>

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="nimiq-gradient mb-6 flex h-36 w-full items-center justify-center rounded-2xl">
          <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-lg">
            <Icon
              name="receipt_long"
              filled
              className="text-3xl text-primary"
            />
          </div>
        </div>

        <h1 className="mb-1 text-2xl font-extrabold text-slate-900 dark:text-white">
          Split a bill
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Fast, friendly, and fair. How would you like to start?
        </p>

        {/* Nimiq Pay status */}
        {isAvailable ? (
          <div className="mb-4 flex items-center gap-2 rounded-full bg-nimiq-green/10 px-4 py-1.5">
            <div className="size-2 rounded-full bg-nimiq-green" />
            <span className="text-sm font-medium text-nimiq-green">
              Connected to Nimiq Pay
            </span>
          </div>
        ) : (
          <a
            href={getNimiqPayStoreUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Icon name="download" className="text-sm text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Get <span className="font-semibold text-primary">Nimiq Pay</span> to enable payments
            </span>
            <Icon name="open_in_new" className="text-xs text-slate-400" />
          </a>
        )}

        {/* CTA buttons */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={handleScan}
            className="nimiq-gradient flex w-full items-center justify-between rounded-xl px-6 py-4 text-base font-bold text-white shadow-primary transition-all active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <Icon name="photo_camera" />
              Scan bill
            </span>
            <Icon name="arrow_forward" />
          </button>

          <button
            onClick={handleManual}
            className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span className="flex items-center gap-3">
              <Icon name="edit_note" />
              Enter total manually
            </span>
            <Icon name="arrow_forward" />
          </button>
        </div>
      </div>

      <div className="h-4" />

      <CurrencyPicker
        open={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </div>
  );
}
