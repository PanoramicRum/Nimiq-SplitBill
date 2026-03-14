import { CURRENCIES } from '../types';
import { useBillStore } from '../store/useBillStore';

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currencyCode: string): Intl.NumberFormat {
  let fmt = formatterCache.get(currencyCode);
  if (!fmt) {
    const config = CURRENCIES.find((c) => c.code === currencyCode);
    const locale = config?.locale ?? 'en-US';
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: config?.decimals ?? 2,
      maximumFractionDigits: config?.decimals ?? 2,
    });
    formatterCache.set(currencyCode, fmt);
  }
  return fmt;
}

export function formatCurrency(cents: number): string {
  const code = useBillStore.getState().currencyCode;
  return getFormatter(code).format(cents / 100);
}

export function formatCurrencyCompact(cents: number): string {
  const code = useBillStore.getState().currencyCode;
  const config = CURRENCIES.find((c) => c.code === code);
  const value = cents / 100;
  if (Number.isInteger(value) && (config?.decimals ?? 2) > 0) {
    return getFormatter(code).format(value);
  }
  return getFormatter(code).format(value);
}

export function getCurrencySymbol(): string {
  const code = useBillStore.getState().currencyCode;
  const config = CURRENCIES.find((c) => c.code === code);
  return config?.symbol ?? '$';
}
