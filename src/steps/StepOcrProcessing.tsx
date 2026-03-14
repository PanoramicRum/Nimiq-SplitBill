import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBillStore } from '../store/useBillStore';
import { getOCRProvider } from '../services/ocr';
import { getCapturedImage } from '../store/capturedImage';
import { Icon } from '../components/ui/Icon';

export function StepOcrProcessing() {
  const navigate = useNavigate();
  const setItems = useBillStore((s) => s.setItems);
  const setOcrConfidence = useBillStore((s) => s.setOcrConfidence);
  const [status, setStatus] = useState('Preparing image...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const runOcr = async () => {
      const image = getCapturedImage();
      if (!image) {
        setError('No image captured. Please go back and try again.');
        return;
      }

      try {
        setStatus('Reading text from bill...');
        const provider = getOCRProvider();
        const currencyCode = useBillStore.getState().currencyCode;
        const result = await provider.processImage(image, { currencyCode });

        if (cancelled) return;

        if (result.items.length === 0) {
          setError(
            'Could not detect any items. The image may be unclear. You can go back to retry or enter the total manually.',
          );
          return;
        }

        const items = result.items.map((item) => ({
          id: crypto.randomUUID(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          assignedTo: [] as string[],
        }));

        setItems(items);
        setOcrConfidence(result.confidence);
        navigate('/scan/review', { replace: true });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(`OCR failed: ${msg}. Try uploading a clearer photo or enter the total manually.`);
      }
    };

    runOcr();

    return () => {
      cancelled = true;
    };
  }, [navigate, setItems, setOcrConfidence]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <Icon name="error" className="text-4xl text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
          Scan issue
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/scan', { replace: true })}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20"
          >
            Try again
          </button>
          <button
            onClick={() => navigate('/manual', { replace: true })}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            Enter manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      {/* Receipt Scanning Visualization */}
      <div className="relative mb-12 aspect-[3/4] w-full max-w-xs">
        {/* Background glow */}
        <div className="absolute inset-0 scale-95 translate-y-4 rounded-xl bg-primary/20 blur-2xl" />
        {/* Receipt canvas */}
        <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          {/* Skeleton loading content */}
          <div className="absolute inset-0 flex flex-col gap-4 p-8">
            <div className="shimmer h-6 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="shimmer h-4 w-1/2 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="mt-8 space-y-3">
              <div className="flex justify-between">
                <div className="shimmer h-4 w-1/3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="shimmer h-4 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between">
                <div className="shimmer h-4 w-1/2 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="shimmer h-4 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="flex justify-between">
                <div className="shimmer h-4 w-2/5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="shimmer h-4 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
            </div>
          </div>
          {/* Scanning line */}
          <div className="nimiq-gradient absolute left-0 top-1/2 z-20 h-1 w-full shadow-[0_0_15px_rgba(4,138,205,0.8)]" />
        </div>
        {/* Floating OCR indicators */}
        <div className="absolute -right-4 top-1/4 z-30 rounded-lg border border-primary/20 bg-white p-3 shadow-xl dark:bg-slate-900">
          <Icon name="font_download" className="block text-2xl text-primary" />
        </div>
        <div className="absolute -left-2 bottom-1/3 z-30 rounded-lg border border-primary/20 bg-white p-3 shadow-xl dark:bg-slate-900">
          <Icon name="payments" className="block text-2xl text-primary" />
        </div>
      </div>

      {/* Text Content */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Parsing your receipt...
        </h1>
        <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-400">
          Extracting items, tax, and total<br />to save you the manual work.
        </p>
      </div>

      {/* Progress Section */}
      <div className="mt-10 w-full max-w-sm space-y-3">
        <div className="flex items-end justify-between px-1">
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Status</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{status}</span>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="nimiq-gradient h-full rounded-full"
            style={{ width: '60%', animation: 'shimmer-move 1.5s ease-in-out infinite' }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 pt-4">
          <span className="flex size-2 rounded-full bg-primary/40" />
          <span className="flex size-2 rounded-full bg-primary/40" />
          <span className="flex size-2 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
