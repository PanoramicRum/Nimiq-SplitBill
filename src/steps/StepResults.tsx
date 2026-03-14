import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import {
  calculateTipCents,
  calculateEvenSplit,
  calculatePercentageSplit,
  calculateItemAssignments,
} from '../utils/calculations';
import { formatCurrency } from '../utils/formatCurrency';
import { buildShareText, shareSummary, copyToClipboard } from '../utils/shareUtils';
import { getAvatarGradient, getInitials } from '../utils/avatarColors';
import { useNimiq } from '../services/nimiq';
import { CURRENCIES } from '../types';
import type { SplitResult } from '../types';

const NIMIQ_PAY_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.nimiq.pay';
const NIMIQ_PAY_APP_STORE = 'https://apps.apple.com/us/app/nimiq-pay/id6471844738';

function getNimiqPayStoreUrl(): string {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return NIMIQ_PAY_APP_STORE;
  }
  return NIMIQ_PAY_PLAY_STORE;
}

/* ── QR Scanner Modal ─────────────────────────────────────────────── */
function QrScannerModal({ onScan, onClose }: { onScan: (address: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;

    async function startScanning() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Use BarcodeDetector if available (Chrome Android, Safari 16.4+)
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const scan = async () => {
            if (stopped || !videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const raw = barcodes[0].rawValue as string;
                // Extract Nimiq address from QR — could be raw address or nimiq: URI
                const address = raw.replace(/^nimiq:/i, '').split('?')[0].trim();
                if (address.length >= 20) {
                  onScan(address);
                  return;
                }
              }
            } catch { /* scan error, continue */ }
            requestAnimationFrame(scan);
          };
          requestAnimationFrame(scan);
        } else {
          setError('QR scanning not supported on this device. Please enter the address manually.');
        }
      } catch {
        setError('Could not access camera. Please enter the address manually.');
      }
    }

    startScanning();

    return () => {
      stopped = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-white">Scan QR Code</span>
        <button onClick={onClose} className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white">
          <Icon name="close" className="text-2xl" />
        </button>
      </div>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8">
          <Icon name="error" className="mb-4 text-5xl text-red-400" />
          <p className="text-center text-white">{error}</p>
          <button onClick={onClose} className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900">
            Go Back
          </button>
        </div>
      ) : (
        <div className="relative flex flex-1 items-center justify-center">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-64 rounded-2xl border-2 border-white/50" />
          </div>
          <p className="absolute bottom-8 text-center text-sm text-white/70">
            Point at a Nimiq address QR code
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main Results Screen ──────────────────────────────────────────── */
export function StepResults() {
  const navigate = useNavigate();
  const billAmountCents = useBillStore((s) => s.billAmountCents);
  const tipConfig = useBillStore((s) => s.tipConfig);
  const people = useBillStore((s) => s.people);
  const splitMethod = useBillStore((s) => s.splitMethod);
  const percentageAllocations = useBillStore((s) => s.percentageAllocations);
  const items = useBillStore((s) => s.items);
  const organizerAddress = useBillStore((s) => s.organizerAddress);
  const reset = useBillStore((s) => s.reset);

  const currencyCode = useBillStore((s) => s.currencyCode);
  const { isAvailable: nimiqAvailable, sendPayment, requestAccounts } = useNimiq();

  const [copied, setCopied] = useState(false);
  const [payingFor, setPayingFor] = useState<string | null>(null);
  const [paidPersons, setPaidPersons] = useState<Set<string>>(new Set());
  const [payError, setPayError] = useState<string | null>(null);
  const [nimPrice, setNimPrice] = useState<number | null>(null);

  // "Someone Else Paid" state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);

  // "You Paid" state
  const [myAddress, setMyAddress] = useState(organizerAddress ?? '');
  const [addressCopied, setAddressCopied] = useState(false);
  const [requestedPersons, setRequestedPersons] = useState<Set<string>>(new Set());

  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const decimals = currency?.decimals ?? 2;

  const fetchNimPrice = useCallback(async () => {
    try {
      const currencyLower = currencyCode.toLowerCase();
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=nimiq-2&vs_currencies=${currencyLower}`,
      );
      const data = await res.json();
      const price = data?.['nimiq-2']?.[currencyLower];
      if (typeof price === 'number' && price > 0) {
        setNimPrice(price);
      }
    } catch {
      // Silently fail
    }
  }, [currencyCode]);

  useEffect(() => {
    fetchNimPrice();
  }, [fetchNimPrice]);

  // Auto-fetch address from Nimiq Pay
  useEffect(() => {
    if (nimiqAvailable && !myAddress) {
      requestAccounts().then((addr) => {
        if (addr) setMyAddress(addr);
      });
    }
  }, [nimiqAvailable, myAddress, requestAccounts]);

  const tipCents = calculateTipCents(billAmountCents, tipConfig);
  const grandTotal = billAmountCents + tipCents;

  let results: SplitResult[] = [];
  let splitLabel = '';

  switch (splitMethod) {
    case 'even':
      results = calculateEvenSplit(grandTotal, people);
      splitLabel = 'Split evenly';
      break;
    case 'percentage':
      results = calculatePercentageSplit(grandTotal, percentageAllocations, people);
      splitLabel = 'Split by percentage';
      break;
    case 'items':
      results = calculateItemAssignments(items, tipCents, people);
      splitLabel = 'Split by items';
      break;
  }

  const personMap = new Map(people.map((p) => [p.id, p]));
  const organizerResult = results[0];
  const othersResults = results.slice(1);

  const centsToNim = (amountCents: number): number | null => {
    if (!nimPrice || nimPrice <= 0) return null;
    const divisor = Math.pow(10, decimals);
    const amountInCurrency = amountCents / divisor;
    return amountInCurrency / nimPrice;
  };

  const handleShare = async () => {
    const text = buildShareText(results, people, grandTotal, splitLabel, myAddress || undefined);
    const success = await shareSummary(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyAddress = async () => {
    if (!myAddress) return;
    const success = await copyToClipboard(myAddress);
    if (success) {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  // "Someone Else Paid" — pay a recipient
  const handlePayRecipient = async (amountCents: number) => {
    if (!recipientAddress.trim()) return;
    setPayingFor('self');
    setPayError(null);

    try {
      const nimAmount = centsToNim(amountCents);
      if (nimAmount === null) {
        setPayError('Could not fetch NIM exchange rate. Please try again.');
        return;
      }

      const lunaAmount = Math.round(nimAmount * 100_000);
      const memo = 'Bill split — my share';

      await sendPayment(recipientAddress.trim(), lunaAmount, memo);
      setPaidPersons((prev) => new Set(prev).add('self'));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isDismissal = /denied|cancel|reject|abort|dismiss|closed|user/i.test(message);
      if (!isDismissal && message !== '[object Object]') {
        setPayError(message);
      }
    } finally {
      setPayingFor(null);
    }
  };

  // "You Paid" — request payment from someone (share a request message)
  const handleRequestPayment = async (result: SplitResult) => {
    const person = personMap.get(result.personId);
    if (!person) return;

    const nimAmount = centsToNim(result.total);
    const nimText = nimAmount !== null ? ` (~${nimAmount.toFixed(2)} NIM)` : '';
    const addressText = myAddress ? `\nSend to: ${myAddress}` : '';

    const text = `Hey ${person.name}, your share of the bill is ${formatCurrency(result.total)}${nimText}.${addressText}\n\nSent via Nimiq SplitBill`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await copyToClipboard(text);
      }
      setRequestedPersons((prev) => new Set(prev).add(result.personId));
    } catch {
      // User cancelled share
    }
  };

  const handleQrScan = useCallback((address: string) => {
    setRecipientAddress(address);
    setShowQrScanner(false);
  }, []);

  const handleStartOver = () => {
    reset();
    navigate('/');
  };

  // Find current user's share (organizer = first person)
  const myShare = organizerResult?.total ?? 0;
  const selfPaid = paidPersons.has('self');

  return (
    <div className="flex flex-1 flex-col">
      {showQrScanner && (
        <QrScannerModal onScan={handleQrScan} onClose={() => setShowQrScanner(false)} />
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {/* Summary card */}
        <div className="mb-4 overflow-hidden rounded-2xl shadow-lg">
          <div className="nimiq-gradient px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              Total Amount
            </p>
            <p className="text-3xl font-extrabold text-white">
              {formatCurrency(grandTotal)}
            </p>
          </div>
          <div className="bg-white px-5 py-4 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {splitLabel}
                </p>
                <p className="text-sm text-slate-500">
                  {tipCents > 0
                    ? `Includes ${tipConfig.mode === 'percentage' ? `${tipConfig.percentage}%` : ''} Tip (${formatCurrency(tipCents)})`
                    : 'No tip included'}
                </p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {people.length} People
              </span>
            </div>
          </div>
        </div>

        {/* Individual shares */}
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Individual Shares
        </h3>
        <div className="mb-6 space-y-2">
          {results.map((result, i) => {
            const person = personMap.get(result.personId);
            if (!person) return null;

            const isOrganizer = i === 0;

            return (
              <div
                key={result.personId}
                className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(person.colorIndex)} text-sm font-bold text-white`}
                  >
                    {getInitials(person.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {person.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isOrganizer ? 'Organizer' : 'Participant'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-primary">
                      {formatCurrency(result.total)}
                    </p>
                    {result.isRemainderHolder && (
                      <p className="text-[10px] font-medium uppercase text-nimiq-gold">
                        Covers rounding
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pay error */}
        {payError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/20">
            <Icon name="error" className="text-lg text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">
              {payError}
            </span>
          </div>
        )}

        {/* ── SOMEONE ELSE PAID ── */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Someone Else Paid
          </h3>
          <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
              Send what you owe to one of the participants.
            </p>

            {/* Address input + QR button */}
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter their Nimiq address"
                className="flex-1 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
              />
              <button
                onClick={() => setShowQrScanner(true)}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all active:scale-95"
                aria-label="Scan QR code"
              >
                <Icon name="qr_code_scanner" className="text-xl" />
              </button>
            </div>

            {/* Pay button */}
            {nimiqAvailable ? (
              <button
                onClick={() => handlePayRecipient(myShare)}
                disabled={!recipientAddress.trim() || payingFor === 'self' || selfPaid}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-nimiq-blue px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {payingFor === 'self' ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Confirming...
                  </>
                ) : selfPaid ? (
                  <>
                    <Icon name="check_circle" className="text-base" />
                    Paid!
                  </>
                ) : (
                  <>
                    <Icon name="send" className="text-base" />
                    Pay {formatCurrency(myShare)}
                    {centsToNim(myShare) !== null ? ` (${centsToNim(myShare)!.toFixed(2)} NIM)` : ''}
                  </>
                )}
              </button>
            ) : (
              <a
                href={getNimiqPayStoreUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-nimiq-blue/10 px-4 py-3 text-sm font-semibold text-nimiq-blue transition-all active:scale-[0.98]"
              >
                <Icon name="account_balance_wallet" className="text-base" />
                Get Nimiq Pay to send payments
              </a>
            )}
          </div>
        </div>

        {/* ── YOU PAID ── */}
        <div className="mb-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            You Paid
          </h3>
          <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-800">
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
              Request payment from the others.
            </p>

            {/* Your address input */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Your Nimiq Address (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={myAddress}
                  onChange={(e) => setMyAddress(e.target.value)}
                  placeholder="NQ..."
                  className="flex-1 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                />
                {myAddress && (
                  <button
                    onClick={handleCopyAddress}
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all active:scale-95"
                    aria-label="Copy address"
                  >
                    <Icon name={addressCopied ? 'check' : 'content_copy'} className="text-lg" />
                  </button>
                )}
              </div>
            </div>

            {/* Request buttons per person */}
            <div className="space-y-2">
              {othersResults.map((result) => {
                const person = personMap.get(result.personId);
                if (!person) return null;

                const isRequested = requestedPersons.has(result.personId);
                const nimAmount = centsToNim(result.total);

                return (
                  <div
                    key={result.personId}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900"
                  >
                    <div
                      className={`flex size-9 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(person.colorIndex)} text-xs font-bold text-white`}
                    >
                      {getInitials(person.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {person.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(result.total)}
                        {nimAmount !== null ? ` (~${nimAmount.toFixed(2)} NIM)` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRequestPayment(result)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all active:scale-95 ${
                        isRequested
                          ? 'bg-nimiq-green/10 text-nimiq-green'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Icon name={isRequested ? 'check' : 'send'} className="text-sm" />
                      {isRequested ? 'Sent' : 'Request'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nimiq Pay promo — show when NOT inside Nimiq Pay */}
        {!nimiqAvailable && (
          <a
            href={getNimiqPayStoreUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3 rounded-xl border border-nimiq-blue/20 bg-nimiq-blue/5 p-4 transition-colors active:bg-nimiq-blue/10 dark:bg-nimiq-blue/10"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nimiq-blue/10">
              <Icon name="account_balance_wallet" className="text-xl text-nimiq-blue" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-nimiq-blue">
                Get Nimiq Pay
              </p>
              <p className="text-xs text-nimiq-blue/70">
                Install the app to pay your friends with NIM
              </p>
            </div>
            <Icon name="arrow_forward" className="text-lg text-nimiq-blue/50" />
          </a>
        )}
      </div>

      {/* Bottom actions */}
      <div className="safe-bottom space-y-2 bg-gradient-to-t from-white via-white to-white/0 px-6 pb-6 pt-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/0">
        <button
          onClick={handleShare}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-white shadow-primary transition-all active:scale-[0.98]"
        >
          <Icon name={copied ? 'check' : 'share'} className="text-xl" />
          {copied ? 'Copied!' : 'Share Summary'}
        </button>
        <button
          onClick={handleStartOver}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 transition-all active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <Icon name="refresh" className="text-xl" />
          Start Over
        </button>
      </div>
    </div>
  );
}
