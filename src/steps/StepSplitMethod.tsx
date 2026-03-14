import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import type { SplitMethod } from '../types';

interface MethodOption {
  id: SplitMethod;
  icon: string;
  title: string;
  description: string;
  route: string;
  requiresScan?: boolean;
}

const METHODS: MethodOption[] = [
  {
    id: 'items',
    icon: 'assignment',
    title: 'Assign items to people',
    description: 'Each person pays for what they ordered',
    route: '/split/items',
    requiresScan: true,
  },
  {
    id: 'even',
    icon: 'balance',
    title: 'Split evenly',
    description: 'Everyone pays the same amount',
    route: '/split/even',
  },
  {
    id: 'percentage',
    icon: 'pie_chart',
    title: 'Split by percentages',
    description: 'Assign custom percentages per person',
    route: '/split/percentage',
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

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Split Method" />

      <div className="flex-1 px-4 py-6">
        <h2 className="mb-2 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
          How should we split it?
        </h2>
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Choose a splitting method
        </p>

        <div className="space-y-3">
          {availableMethods.map((method, i) => (
            <button
              key={method.id}
              onClick={() => handleSelect(method)}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-slate-100 bg-white p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-800 dark:hover:border-primary/30 dark:hover:bg-primary/10"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name={method.icon} className="text-2xl" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {method.title}
                  </span>
                  {i === (billSource === 'scan' ? 0 : 0) &&
                    method.id === 'even' && (
                      <span className="rounded-full bg-nimiq-green/10 px-2 py-0.5 text-[10px] font-bold uppercase text-nimiq-green">
                        Default
                      </span>
                    )}
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {method.description}
                </span>
              </div>
              <Icon
                name="arrow_forward"
                className="text-lg text-slate-400"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
