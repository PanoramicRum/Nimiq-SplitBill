import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BillSource,
  BillItem,
  Person,
  TipConfig,
  SplitMethod,
  PercentageAllocation,
} from '../types';

let nextColorIndex = 0;

interface BillState {
  // Bill input
  billSource: BillSource | null;
  billAmountCents: number;
  items: BillItem[];

  // Tip
  tipConfig: TipConfig;

  // People
  people: Person[];

  // Split
  splitMethod: SplitMethod | null;
  percentageAllocations: PercentageAllocation[];

  // OCR
  ocrConfidence: number | null;

  // Currency
  currencyCode: string;

  // UI
  isDarkMode: boolean;

  // Nimiq
  organizerAddress: string | null;
}

interface BillActions {
  setBillSource: (source: BillSource) => void;
  setBillAmount: (cents: number) => void;
  setItems: (items: BillItem[]) => void;
  updateItem: (id: string, updates: Partial<BillItem>) => void;
  addItem: (item: BillItem) => void;
  removeItem: (id: string) => void;

  setTipConfig: (config: TipConfig) => void;

  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;

  setSplitMethod: (method: SplitMethod) => void;
  setPercentageAllocation: (personId: string, percentage: number) => void;

  assignItemToPerson: (itemId: string, personId: string) => void;
  unassignItemFromPerson: (itemId: string, personId: string) => void;

  setCurrency: (code: string) => void;
  setOcrConfidence: (confidence: number | null) => void;
  setOrganizerAddress: (address: string | null) => void;
  toggleDarkMode: () => void;
  reset: () => void;
}

const initialState: BillState = {
  billSource: null,
  billAmountCents: 0,
  items: [],
  ocrConfidence: null,
  tipConfig: { mode: 'none', percentage: 15, fixedAmount: 0 },
  people: [],
  splitMethod: null,
  percentageAllocations: [],
  currencyCode: 'USD',
  isDarkMode: false,
  organizerAddress: null,
};

export const useBillStore = create<BillState & BillActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setBillSource: (source) => set({ billSource: source }),

      setBillAmount: (cents) => set({ billAmountCents: cents }),

      setItems: (items) => {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        set({ items, billAmountCents: total });
      },

      updateItem: (id, updates) =>
        set((state) => {
          const items = state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
          );
          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          return { items, billAmountCents: total };
        }),

      addItem: (item) =>
        set((state) => {
          const items = [...state.items, item];
          const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { items, billAmountCents: total };
        }),

      removeItem: (id) =>
        set((state) => {
          const items = state.items.filter((item) => item.id !== id);
          const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { items, billAmountCents: total };
        }),

      setTipConfig: (config) => set({ tipConfig: config }),

      addPerson: (name) =>
        set((state) => ({
          people: [
            ...state.people,
            {
              id: crypto.randomUUID(),
              name,
              colorIndex: nextColorIndex++,
            },
          ],
        })),

      removePerson: (id) =>
        set((state) => ({
          people: state.people.filter((p) => p.id !== id),
          percentageAllocations: state.percentageAllocations.filter(
            (a) => a.personId !== id,
          ),
          items: state.items.map((item) => ({
            ...item,
            assignedTo: item.assignedTo.filter((pid) => pid !== id),
          })),
        })),

      updatePerson: (id, updates) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      setSplitMethod: (method) => set({ splitMethod: method }),

      setPercentageAllocation: (personId, percentage) =>
        set((state) => {
          const existing = state.percentageAllocations.filter(
            (a) => a.personId !== personId,
          );
          return {
            percentageAllocations: [...existing, { personId, percentage }],
          };
        }),

      assignItemToPerson: (itemId, personId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId && !item.assignedTo.includes(personId)
              ? { ...item, assignedTo: [...item.assignedTo, personId] }
              : item,
          ),
        })),

      unassignItemFromPerson: (itemId, personId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  assignedTo: item.assignedTo.filter((id) => id !== personId),
                }
              : item,
          ),
        })),

      setCurrency: (code) => set({ currencyCode: code }),
      setOcrConfidence: (confidence) => set({ ocrConfidence: confidence }),
      setOrganizerAddress: (address) => set({ organizerAddress: address }),

      toggleDarkMode: () =>
        set((state) => {
          const next = !state.isDarkMode;
          if (next) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { isDarkMode: next };
        }),

      reset: () => {
        const { isDarkMode, organizerAddress, currencyCode } = get();
        set({ ...initialState, isDarkMode, organizerAddress, currencyCode });
      },
    }),
    {
      name: 'splitbill-state',
      version: 1,
    },
  ),
);
