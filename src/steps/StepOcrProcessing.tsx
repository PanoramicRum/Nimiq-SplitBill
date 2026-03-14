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
        const result = await provider.processImage(image);

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
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <button
            onClick={() => navigate('/manual', { replace: true })}
            className="rounded-xl border-2 border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            Enter manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="mb-6 flex size-20 animate-pulse items-center justify-center rounded-full bg-primary/10">
        <Icon name="document_scanner" className="text-4xl text-primary" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
        Scanning your bill...
      </h2>
      <p className="text-center text-slate-500 dark:text-slate-400">
        {status}
      </p>

      {/* Loading bar */}
      <div className="mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: '60%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
