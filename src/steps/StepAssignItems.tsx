import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { BottomCTA } from '../components/layout/BottomCTA';
import { Icon } from '../components/ui/Icon';
import { useBillStore } from '../store/useBillStore';
import { formatCurrency } from '../utils/formatCurrency';
import { getAvatarGradient, getInitials } from '../utils/avatarColors';

export function StepAssignItems() {
  const navigate = useNavigate();
  const items = useBillStore((s) => s.items);
  const people = useBillStore((s) => s.people);
  const assignItemToPerson = useBillStore((s) => s.assignItemToPerson);
  const unassignItemFromPerson = useBillStore((s) => s.unassignItemFromPerson);

  const assignedCount = items.filter((i) => i.assignedTo.length > 0).length;

  // Running totals per person
  const totals = new Map<string, number>();
  for (const person of people) {
    totals.set(person.id, 0);
  }
  for (const item of items) {
    if (item.assignedTo.length === 0) continue;
    const perPerson = Math.floor(item.price / item.assignedTo.length);
    const remainder = item.price - perPerson * item.assignedTo.length;
    item.assignedTo.forEach((pid, idx) => {
      const share =
        idx === item.assignedTo.length - 1
          ? perPerson + remainder
          : perPerson;
      totals.set(pid, (totals.get(pid) ?? 0) + share);
    });
  }

  const toggleAssignment = (itemId: string, personId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    if (item.assignedTo.includes(personId)) {
      unassignItemFromPerson(itemId, personId);
    } else {
      assignItemToPerson(itemId, personId);
    }
  };

  const assignAll = (itemId: string) => {
    for (const person of people) {
      assignItemToPerson(itemId, person.id);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Assign Items" />

      <div className="flex-1 overflow-y-auto">
        {/* Running totals horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          <div className="shrink-0 rounded-xl bg-primary px-3 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              Total Bill
            </p>
            <p className="text-lg font-extrabold text-white">
              {formatCurrency(
                items.reduce((sum, item) => sum + item.price, 0),
              )}
            </p>
          </div>
          {people.map((person) => (
            <div
              key={person.id}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-800/50"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {person.name}
              </p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(totals.get(person.id) ?? 0)}
              </p>
            </div>
          ))}
        </div>

        {/* Items count */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {items.length} items detected
          </span>
          <span className="text-sm font-semibold text-primary">
            {assignedCount} of {items.length} assigned
          </span>
        </div>

        {/* Items */}
        <div className="space-y-3 px-4 pb-20">
          {items.map((item) => {
            const isUnassigned = item.assignedTo.length === 0;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  isUnassigned
                    ? 'border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(item.price)}
                  </span>
                </div>

                {isUnassigned && (
                  <p className="mb-2 text-sm font-medium text-primary">
                    Needs assignment
                  </p>
                )}

                {/* Person chips */}
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => {
                    const isAssigned = item.assignedTo.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        onClick={() => toggleAssignment(item.id, person.id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-all ${
                          isAssigned
                            ? `bg-gradient-to-br ${getAvatarGradient(person.colorIndex)} text-white`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-xs">
                          {getInitials(person.name)}
                        </span>
                        {person.name}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => assignAll(item.id)}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
                  >
                    <Icon name="group" className="text-base" />
                    Split All
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="sticky bottom-16 mx-4 mb-2 rounded-xl bg-white/90 px-4 py-2 shadow-lg backdrop-blur-md dark:bg-slate-900/90">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-primary">
              {assignedCount} of {items.length} items assigned
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${items.length > 0 ? (assignedCount / items.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <BottomCTA
        label="Review Results"
        onClick={() => navigate('/results')}
        disabled={assignedCount === 0}
      />
    </div>
  );
}
