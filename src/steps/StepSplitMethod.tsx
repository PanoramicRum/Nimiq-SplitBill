import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import type { SplitMethod } from '../types';

interface MethodOption {
  id: SplitMethod;
  icon: string;
  bgIcon: string;
  title: string;
  description: string;
  route: string;
  requiresScan?: boolean;
  badge?: string;
}

const METHODS: MethodOption[] = [
  {
    id: 'even',
    icon: 'drag_handle',
    bgIcon: 'equalizer',
    title: 'Split Evenly',
    description: 'Divide the total cost equally among all participants.',
    route: '/split/even',
  },
  {
    id: 'items',
    icon: 'checklist',
    bgIcon: 'receipt_long',
    title: 'Assign Items',
    description: 'Each person pays only for the specific items they ordered.',
    route: '/split/items',
    requiresScan: true,
  },
  {
    id: 'percentage',
    icon: 'pie_chart',
    bgIcon: 'pie_chart',
    title: 'Split by %',
    description: 'Define custom percentages for each person in the group.',
    route: '/split/percentage',
    badge: 'Popular',
  },
];

export function StepSplitMethod() {
  const navigate = useNavigate();
  const billSource = useBillStore((s) => s.billSource);
  const setSplitMethod = useBillStore((s) => s.setSplitMethod);

  const availableMethods = METHODS.filter(
    (m) => !m.requiresScan || billSource === 'scan',
  );

  const handleSelect = (method: MethodOption) => {
    setSplitMethod(method.id);
    navigate(method.route);
  };

  // First method gets primary styling
  const isFirst = (i: number) => i === 0;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="New Split" />

      <div className="flex-1 px-6 py-6">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Split Method
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Choose how you'd like to divide the bill with your group.
          </p>
        </div>

        <div className="space-y-4">
          {availableMethods.map((method, i) => (
            <button
              key={method.id}
              onClick={() => handleSelect(method)}
              className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-primary dark:border-primary/20 dark:bg-primary/5"
            >
              {/* Decorative background icon */}
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <Icon name={method.bgIcon} className="text-6xl" />
              </div>

              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 items-center justify-center rounded-full ${
                    isFirst(i)
                      ? 'bg-primary text-white'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  <Icon name={method.icon} className="text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {method.title}
                    </h3>
                    {method.badge && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {method.description}
                  </p>
                  <div
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform active:scale-95 ${
                      isFirst(i)
                        ? 'bg-primary text-white'
                        : 'bg-slate-200 text-slate-900 dark:bg-primary/20 dark:text-primary'
                    }`}
                  >
                    Select
                    <Icon name="chevron_right" className="text-sm" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Smart Scan promo */}
        {billSource !== 'scan' && (
          <div className="relative mt-12 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/60 p-6 text-white shadow-lg">
            <div className="relative z-10">
              <h4 className="text-lg font-bold">Smart Scan</h4>
              <p className="mt-1 text-sm opacity-90">
                Scan your receipt and let AI automatically detect items and prices.
              </p>
              <button
                onClick={() => navigate('/scan')}
                className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary"
              >
                Try Now
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-20">
              <Icon name="document_scanner" className="text-[96px]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
