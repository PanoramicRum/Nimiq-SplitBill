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
    <div className="nimiq-gradient-welcome relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg bg-primary p-2">
            <Icon name="account_balance_wallet" className="text-2xl text-white" />
          </div>
          <h1 className="text-xl font-extrabold uppercase italic tracking-tight text-slate-900 dark:text-white">
            SplitBill
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCurrencyPicker(true)}
            className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/50 px-3 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-all hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
            title="Change currency"
          >
            <span className="text-base">{currency?.flag}</span>
            <span>{currencyCode}</span>
          </button>
          <DarkModeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Hero Illustration */}
        <div className="relative mb-12 flex aspect-square w-full max-w-sm items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-[80px]" />
          <div className="relative flex h-64 w-64 rotate-3 transform flex-col items-center justify-center gap-4 rounded-xl border border-slate-200/30 bg-white/20 shadow-2xl backdrop-blur-sm transition-transform duration-500 hover:rotate-0 dark:border-white/8 dark:bg-white/3">
            <Icon name="receipt_long" className="text-6xl text-primary" />
            <div className="h-2 w-32 rounded-full bg-slate-900/10 dark:bg-white/10" />
            <div className="h-2 w-24 rounded-full bg-slate-900/10 dark:bg-white/10" />
          </div>
        </div>

        <h2 className="mb-4 max-w-md text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
          Split the bill, <br />not the <span className="text-primary">friendship.</span>
        </h2>
        <p className="mb-10 max-w-xs text-lg text-slate-500 dark:text-slate-400">
          The most seamless way to share expenses with anyone, anywhere.
        </p>

        {/* Nimiq Pay status */}
        {isAvailable ? (
          <div className="mb-6 flex items-center gap-2 rounded-full bg-nimiq-green/10 px-4 py-1.5">
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
            className="mb-6 flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/30 px-4 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <Icon name="download" className="text-sm text-slate-500 dark:text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Get <span className="font-semibold text-primary">Nimiq Pay</span> to enable payments
            </span>
            <Icon name="open_in_new" className="text-xs text-slate-500 dark:text-slate-400" />
          </a>
        )}

        {/* CTA buttons */}
        <div className="flex w-full max-w-sm flex-col gap-4">
          <button
            onClick={handleScan}
            className="group relative flex h-16 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-[#05a5f5] text-lg font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Icon name="photo_camera" />
            <span>Scan Receipt</span>
            <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          <button
            onClick={handleManual}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-full border-2 border-slate-300 text-lg font-semibold text-slate-600 transition-all hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
          >
            <Icon name="edit_note" />
            <span>Enter Total Manually</span>
          </button>
        </div>
      </main>

      <div className="h-8" />

      <CurrencyPicker
        open={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </div>
  );
}
