import type {
  BillItem,
  Person,
  PercentageAllocation,
  SplitResult,
  TipConfig,
} from '../types';

export function calculateTipCents(
  billCents: number,
  config: TipConfig,
): number {
  switch (config.mode) {
    case 'none':
      return 0;
    case 'percentage':
      return Math.round((billCents * config.percentage) / 100);
    case 'fixed':
      return config.fixedAmount;
  }
}

export function calculateEvenSplit(
  grandTotalCents: number,
  people: Person[],
): SplitResult[] {
  const n = people.length;
  if (n === 0) return [];

  const basePer = Math.floor(grandTotalCents / n);
  const remainder = grandTotalCents - basePer * n;

  return people.map((person, i) => {
    const isLast = i === n - 1;
    const total = isLast ? basePer + remainder : basePer;
    return {
      personId: person.id,
      subtotal: total,
      tipShare: 0, // tip already included in grandTotal
      total,
      isRemainderHolder: isLast && remainder > 0,
    };
  });
}

export function calculatePercentageSplit(
  grandTotalCents: number,
  allocations: PercentageAllocation[],
  people: Person[],
): SplitResult[] {
  if (people.length === 0) return [];

  const allocationMap = new Map(
    allocations.map((a) => [a.personId, a.percentage]),
  );

  let runningTotal = 0;
  const results: SplitResult[] = [];

  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const isLast = i === people.length - 1;
    const pct = allocationMap.get(person.id) ?? 0;

    let total: number;
    if (isLast) {
      total = grandTotalCents - runningTotal;
    } else {
      total = Math.round((grandTotalCents * pct) / 100);
      runningTotal += total;
    }

    results.push({
      personId: person.id,
      subtotal: total,
      tipShare: 0,
      total,
      isRemainderHolder: isLast,
    });
  }

  return results;
}

export function calculateItemAssignments(
  items: BillItem[],
  tipCents: number,
  people: Person[],
): SplitResult[] {
  if (people.length === 0) return [];

  // Calculate subtotals per person from item assignments
  const subtotals = new Map<string, number>();
  const personItems = new Map<string, BillItem[]>();

  for (const person of people) {
    subtotals.set(person.id, 0);
    personItems.set(person.id, []);
  }

  let totalAssigned = 0;

  for (const item of items) {
    if (item.assignedTo.length === 0) continue;

    const perPerson = Math.floor(item.price / item.assignedTo.length);
    const itemRemainder = item.price - perPerson * item.assignedTo.length;

    item.assignedTo.forEach((personId, idx) => {
      const share =
        idx === item.assignedTo.length - 1
          ? perPerson + itemRemainder
          : perPerson;
      subtotals.set(personId, (subtotals.get(personId) ?? 0) + share);
      personItems.get(personId)?.push(item);
    });

    totalAssigned += item.price;
  }

  // Distribute tip proportionally based on subtotals
  let tipDistributed = 0;
  const results: SplitResult[] = [];

  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const isLast = i === people.length - 1;
    const subtotal = subtotals.get(person.id) ?? 0;

    let tipShare: number;
    if (isLast) {
      tipShare = tipCents - tipDistributed;
    } else if (totalAssigned > 0) {
      tipShare = Math.round((tipCents * subtotal) / totalAssigned);
      tipDistributed += tipShare;
    } else {
      tipShare = 0;
    }

    results.push({
      personId: person.id,
      subtotal,
      tipShare,
      total: subtotal + tipShare,
      isRemainderHolder: isLast,
      items: personItems.get(person.id),
    });
  }

  return results;
}
