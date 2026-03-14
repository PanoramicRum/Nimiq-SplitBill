import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { formatCurrency } from '../utils/formatCurrency';
import { CURRENCIES } from '../types';

function PriceInput({
  cents,
  onChange,
}: {
  cents: number;
  onChange: (cents: number) => void;
}) {
  const currencyCode = useBillStore((s) => s.currencyCode);
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const decimals = currency?.decimals ?? 2;

  const [localValue, setLocalValue] = useState(
    decimals > 0 ? (cents / 100).toFixed(decimals) : String(cents / 100),
  );

  // Sync from parent when editing starts (editingId changes)
  useEffect(() => {
    setLocalValue(
      decimals > 0 ? (cents / 100).toFixed(decimals) : String(cents / 100),
    );
    // Only re-sync when the input mounts, not on every cents change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(Math.round(parsed * 100));
    }
  };

  const handleBlur = () => {
    // On blur, reformat the value
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const newCents = Math.round(parsed * 100);
      onChange(newCents);
      setLocalValue(
        decimals > 0
          ? (newCents / 100).toFixed(decimals)
          : String(Math.round(newCents / 100)),
      );
    } else {
      setLocalValue(decimals > 0 ? '0.' + '0'.repeat(decimals) : '0');
      onChange(0);
    }
  };

  return (
    <input
      type="number"
      inputMode="decimal"
      step={decimals > 0 ? Math.pow(10, -decimals) : 1}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    />
  );
}

function QuantityInput({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (qty: number) => void;
}) {
  const [localValue, setLocalValue] = useState(String(quantity));

  useEffect(() => {
    setLocalValue(String(quantity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    const parsed = parseInt(raw);
    if (!isNaN(parsed) && parsed >= 1) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localValue);
    if (!isNaN(parsed) && parsed >= 1) {
      onChange(parsed);
      setLocalValue(String(parsed));
    } else {
      setLocalValue('1');
      onChange(1);
    }
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min="1"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    />
  );
}

export function StepBillReview() {
  const navigate = useNavigate();
  const items = useBillStore((s) => s.items);
  const billAmountCents = useBillStore((s) => s.billAmountCents);
  const updateItem = useBillStore((s) => s.updateItem);
  const removeItem = useBillStore((s) => s.removeItem);
  const addItem = useBillStore((s) => s.addItem);
  const ocrConfidence = useBillStore((s) => s.ocrConfidence);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editRef = useRef<HTMLDivElement>(null);

  // Scroll editing card into view when keyboard opens
  useEffect(() => {
    if (editingId && editRef.current) {
      const timer = setTimeout(() => {
        editRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [editingId]);

  const confidenceLabel =
    ocrConfidence !== null && ocrConfidence >= 0.8
      ? 'High confidence scan'
      : ocrConfidence !== null && ocrConfidence >= 0.5
        ? 'Medium confidence — please review'
        : ocrConfidence !== null
          ? 'Low confidence — check items carefully'
          : null;
  const confidenceColor =
    ocrConfidence !== null && ocrConfidence >= 0.8
      ? 'nimiq-green'
      : ocrConfidence !== null && ocrConfidence >= 0.5
        ? 'nimiq-gold'
        : 'red-500';
  const confidenceIcon =
    ocrConfidence !== null && ocrConfidence >= 0.8
      ? 'check_circle'
      : ocrConfidence !== null && ocrConfidence >= 0.5
        ? 'info'
        : 'warning';

  const handleAddItem = () => {
    const id = crypto.randomUUID();
    addItem({
      id,
      name: 'New item',
      price: 0,
      quantity: 1,
      assignedTo: [],
    });
    setEditingId(id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar title="Review Bill" />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Confidence badge */}
        {confidenceLabel && (
          <div className={`mb-4 flex items-center gap-2 rounded-lg bg-${confidenceColor}/10 px-3 py-2`}>
            <Icon name={confidenceIcon} className={`text-lg text-${confidenceColor}`} />
            <span className={`text-sm font-medium text-${confidenceColor}`}>
              {confidenceLabel}
              {ocrConfidence !== null && ` (${Math.round(ocrConfidence * 100)}%)`}
            </span>
          </div>
        )}

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {items.length} items detected
          </h3>
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <Icon name="add" className="text-lg" />
            Add item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              ref={editingId === item.id ? editRef : undefined}
              className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-800"
            >
              {editingId === item.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={item.name}
                    autoFocus
                    onChange={(e) =>
                      updateItem(item.id, { name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-slate-500">
                        Price
                      </label>
                      <PriceInput
                        cents={item.price}
                        onChange={(price) => updateItem(item.id, { price })}
                      />
                    </div>
                    <div className="w-20">
                      <label className="mb-1 block text-xs text-slate-500">
                        Qty
                      </label>
                      <QuantityInput
                        quantity={item.quantity}
                        onChange={(quantity) =>
                          updateItem(item.id, { quantity })
                        }
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-sm font-semibold text-primary"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.price)}
                    </span>
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Icon name="edit" className="text-lg" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex size-8 items-center justify-center rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Icon name="delete" className="text-lg" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            Subtotal
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(billAmountCents)}
          </span>
        </div>

        {/* Extra padding so last item is visible above keyboard */}
        <div className="h-32" />
      </div>

      <BottomCTA
        label="Looks good"
        onClick={() => navigate('/tip')}
        disabled={items.length === 0}
      />
    </div>
  );
}
