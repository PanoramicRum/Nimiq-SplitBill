import { useState } from 'react';
import { CURRENCIES } from '../../types';
import { useBillStore } from '../../store/useBillStore';
import { Icon } from './Icon';

interface CurrencyPickerProps {
  open: boolean;
  onClose: () => void;
}

export function CurrencyPicker({ open, onClose }: CurrencyPickerProps) {
  const currencyCode = useBillStore((s) => s.currencyCode);
  const setCurrency = useBillStore((s) => s.setCurrency);
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = search
    ? CURRENCIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : CURRENCIES;

  const handleSelect = (code: string) => {
    setCurrency(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col rounded-t-2xl bg-white dark:bg-slate-900 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Select Currency
          </h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-slate-800">
            <Icon name="search" className="text-lg text-slate-400" />
            <input
              type="text"
              placeholder="Search currency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Currency list */}
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {filtered.map((c) => (
            <button
              key={c.code}
              onClick={() => handleSelect(c.code)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                c.code === currencyCode
                  ? 'bg-primary/10'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-2xl">{c.flag}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {c.code}
                  </span>
                  <span className="text-sm text-slate-400">{c.symbol}</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {c.name}
                </span>
              </div>
              {c.code === currencyCode && (
                <Icon name="check_circle" className="text-xl text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
