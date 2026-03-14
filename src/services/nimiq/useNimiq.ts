import { useCallback, useEffect, useState } from 'react';
import type { NimiqProvider } from './types';

interface NimiqState {
  isAvailable: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useNimiq() {
  const [state, setState] = useState<NimiqState>({
    isAvailable: false,
    address: null,
    isLoading: true,
    error: null,
  });

  // Poll for provider availability (injected async by Nimiq Pay)
  useEffect(() => {
    if (window.nimiq) {
      setState((s) => ({ ...s, isAvailable: true, isLoading: false }));
      return;
    }

    const interval = window.setInterval(() => {
      if (window.nimiq) {
        setState((s) => ({ ...s, isAvailable: true, isLoading: false }));
        clearInterval(interval);
      }
    }, 500);

    // Stop polling after 5 seconds
    const timeout = window.setTimeout(() => {
      clearInterval(interval);
      setState((s) => {
        if (!s.isAvailable) return { ...s, isLoading: false };
        return s;
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const requestAccounts = useCallback(async () => {
    const nimiq = window.nimiq;
    if (!nimiq) {
      setState((s) => ({ ...s, error: 'Nimiq provider not available' }));
      return null;
    }

    try {
      const accounts = await nimiq.listAccounts();
      const address = accounts[0] ?? null;
      setState((s) => ({ ...s, address, error: null }));
      return address;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, error: message }));
      return null;
    }
  }, []);

  const sendPayment = useCallback(
    async (recipient: string, lunaAmount: number, memo?: string) => {
      const nimiq = window.nimiq;
      if (!nimiq) throw new Error('Nimiq provider not available');

      if (memo) {
        return nimiq.sendBasicTransactionWithData({
          recipient,
          value: lunaAmount,
          data: memo,
        });
      }
      return nimiq.sendBasicTransaction({
        recipient,
        value: lunaAmount,
      });
    },
    [],
  );

  return {
    ...state,
    provider: window.nimiq as NimiqProvider | undefined,
    requestAccounts,
    sendPayment,
  };
}
