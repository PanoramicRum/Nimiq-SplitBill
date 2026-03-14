import type { Person, SplitResult } from '../types';
import { formatCurrency } from './formatCurrency';

export function buildShareText(
  results: SplitResult[],
  people: Person[],
  grandTotalCents: number,
  splitMethodLabel: string,
  nimiqAddress?: string | null,
): string {
  const personMap = new Map(people.map((p) => [p.id, p]));
  const lines = [
    'Bill Split Summary',
    `Total: ${formatCurrency(grandTotalCents)}`,
    `Split: ${splitMethodLabel}`,
    '',
  ];

  for (const r of results) {
    const person = personMap.get(r.personId);
    const name = person?.name ?? 'Unknown';
    const extra = r.isRemainderHolder ? ' (covers rounding)' : '';
    lines.push(`${name}: ${formatCurrency(r.total)}${extra}`);
  }

  if (nimiqAddress) {
    lines.push('', `Send your share to: ${nimiqAddress}`);
  }

  lines.push('', 'Calculated with Nimiq Split');
  return lines.join('\n');
}

export async function shareSummary(text: string): Promise<boolean> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      // User cancelled or share failed, fall through to clipboard
    }
  }
  return copyToClipboard(text);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
