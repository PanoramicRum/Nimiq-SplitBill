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
      className="w-20 bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-slate-900 dark:text-white"
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
      className="w-12 bg-transparent border-none p-0 text-sm font-bold text-center focus:ring-0 text-slate-900 dark:text-white"
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
  const currencyCode = useBillStore((s) => s.currencyCode);
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
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
      <TopBar title="Review Receipt" />

      <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-32">
        {/* Confidence badge */}
        {confidenceLabel && (
          <div className={`flex items-center gap-2 rounded-xl bg-${confidenceColor}/10 px-4 py-3 border border-${confidenceColor}/20`}>
            <Icon name={confidenceIcon} className={`text-lg text-${confidenceColor}`} />
            <span className={`text-sm font-medium text-${confidenceColor}`}>
              {confidenceLabel}
              {ocrConfidence !== null && ` (${Math.round(ocrConfidence * 100)}%)`}
            </span>
          </div>
        )}

        {/* Extracted Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Extracted Items
            </h2>
            <Icon name="receipt_long" className="text-primary/60" />
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                ref={editingId === item.id ? editRef : undefined}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
              >
                {editingId === item.id ? (
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={item.name}
                      autoFocus
                      onChange={(e) =>
                        updateItem(item.id, { name: e.target.value })
                      }
                      className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 text-slate-900 dark:text-white"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="text-sm">{currency?.symbol ?? '$'}</span>
                        <PriceInput
                          cents={item.price}
                          onChange={(price) => updateItem(item.id, { price })}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="text-xs">Qty:</span>
                        <QuantityInput
                          quantity={item.quantity}
                          onChange={(quantity) => updateItem(item.id, { quantity })}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm font-bold text-primary"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1" onClick={() => setEditingId(item.id)}>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <span className="text-sm">{currency?.symbol ?? '$'}</span>
                        <span className="text-sm">{formatCurrency(item.price).replace(/^[^\d]*/, '')}</span>
                        {item.quantity > 1 && (
                          <span className="ml-2 text-xs">x{item.quantity}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-400 transition-colors hover:text-red-500"
                    >
                      <Icon name="delete" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add item button */}
          <button
            onClick={handleAddItem}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-slate-500 transition-colors hover:bg-primary/5 dark:border-slate-700"
          >
            <Icon name="add_circle" className="text-xl" />
            <span className="font-bold">Add Item</span>
          </button>
        </section>

        {/* Totals */}
        <section className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between px-2">
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">Total Amount</span>
            <span className="text-xl font-extrabold text-primary">
              {formatCurrency(billAmountCents)}
            </span>
          </div>
        </section>
      </div>

      <BottomCTA
        label="Looks Good, Continue"
        onClick={() => navigate('/tip')}
        disabled={items.length === 0}
      />
    </div>
  );
}
