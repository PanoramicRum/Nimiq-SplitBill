import type { OCRItem } from './types';

// ============================================================
// Receipt Parser — extracts items from OCR text
// ============================================================
// Strategy:
//   1. Column detection: use word bounding boxes to find a
//      right-aligned price column, then split each line into
//      "description" (left part) and "price" (right part).
//   2. Line-based fallback: if no bounding boxes are available,
//      use regex to find prices at the end of each line.
//   3. Both paths share the same classification & cleanup logic.
// ============================================================

// --- Price parsing ---

const PRICE_REGEX =
  /[₡$€£¥₩₹R]?\$?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\s?\d{1,2})?)/;

const PRICE_AT_END =
  /[₡$€£¥₩₹R]?\$?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\s?\d{1,2})?)\s*$/;

export function parseAmount(priceStr: string): number {
  // Remove spaces that OCR may introduce within numbers (e.g. "7 300" → "7300")
  let s = priceStr.trim().replace(/(\d)\s+(\d)/g, '$1$2');

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  if (lastComma > lastDot) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    s = s.replace(/,/g, '');
  } else {
    s = s.replace(/,/g, '');
  }

  const val = parseFloat(s);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round(val * 100);
}

// --- Line classification ---

const TOTAL_PATTERN =
  /\b(total\s*factura|grand\s*total|total\s*general|totale|total|subtotal|sub\s*total|amount\s*due|balance\s*due|monto)\b/i;

const TAX_PATTERN =
  /\b(tax|vat|gst|hst|iva|impuesto|i\.v\.a|base\s*imp)/i;

const SKIP_PATTERNS = [
  /\b(factura|invoice|recibo|receipt|ticket)\b/i,
  /\b(cedula|juridica|clave\s*numerica|resoluci[oó]n|autorizad[oa])\b/i,
  /\b(cliente|customer|nombre|name|direcci[oó]n|address)\b/i,
  /\b(fecha|date|hora|time|transacci[oó]n|transaction)\b/i,
  /\b(tarjeta|card|visa|master|amex|efectivo|cash|cambio|change)\b/i,
  /\b(forma\s*de\s*pago|payment|method|modo)\b/i,
  /\b(tel[eé]fono|phone|email|www\.|http|\.com|\.cr)\b/i,
  /\b(gracias|thank|welcome|bienvenido)\b/i,
  /\b(pedido|order|atendido|served|mesa|table)\b/i,
  /\b(empresa|company|s\.?a\.?|s\.?r\.?l\.?|limitada)\b/i,
  /\b(plaza|calle|avenida|barrio|cant[oó]n|provincia|san\s*jos[eé])\b/i,
  /\b(id\s*orden|orden|dgt|p\.?unit|p\.\s*unit)\b/i,
  /^\d[\d\s\-\.]{8,}$/,
  /total\s*items/i,
  /^\s*#\s*(cant|qty)/i,
  /^\s*%\s*imp/i,
  /\b(rohrmoser|escaz[uú]|asunci[oó]n|heredia|alajuela|cartago|puntarenas|guanacaste)\b/i,
];

export function shouldSkipLine(text: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(text));
}

const NON_FOOD_PATTERNS = [
  /\b(bolsa|bag|cubiertos|utensils|propina|tip|servicio|service\s*charge|delivery|envi[oó]|shipping)\b/i,
  /^[A-Z]{1,2}$/,
  /^N[°oº]\s*\d/i,
  /\b(descuento|discount|promo|cupon|coupon)\b/i,
];

export function isLikelyFoodItem(name: string): boolean {
  if (name.length < 3) return false;
  if (NON_FOOD_PATTERNS.some((p) => p.test(name))) return false;
  const digitRatio = (name.match(/\d/g)?.length ?? 0) / name.length;
  if (digitRatio > 0.5) return false;
  return true;
}

// --- Name cleanup ---

export function cleanItemName(name: string): string {
  return (
    name
      .replace(/^[+#*\-\s]+/, '')
      .replace(/^\d{1,3}\s+/, '')
      .replace(/^\d{1,2}\s+(?=[A-Za-z])/, '')
      .replace(/^\d+\s*[xX×]\s*/, '')
      // Fix common OCR errors: "0" read as "8" in trailing zeros
      // e.g. "Coca-Cola Sin Azucar 68" → strip trailing numbers that look like misread
      // Strip trailing numbers that are likely OCR bleed from the price column
      .replace(/\s+(\d{1,3})\s*\.?\s*$/, (_match, digits) => {
        const num = parseInt(digits);
        if (num > 20) return ''; // definitely OCR price fragment
        return _match;
      })
      .trim()
  );
}

// --- Quantity extraction ---

function extractQuantity(beforePrice: string): { qty: number; name: string } {
  // Pattern A: "# QTY NAME" — e.g. "1 2 Chick-n Applewood Bacon"
  const tableMatch = beforePrice.match(/^(\d{1,2})\s+(\d{1,2})\s+(.+)$/);
  if (tableMatch) {
    const possibleQty = parseInt(tableMatch[2]);
    const possibleName = tableMatch[3].trim();
    if (possibleQty >= 1 && possibleQty <= 50 && possibleName.length >= 3) {
      return { qty: possibleQty, name: possibleName };
    }
  }

  // Pattern B: Tesseract merged "#QTY" — e.g. "12 Chick-n Applewood Bacon"
  if (!tableMatch) {
    const mergedMatch = beforePrice.match(/^(\d{2,3})\s+(.+)$/);
    if (mergedMatch) {
      const num = mergedMatch[1];
      const possibleName = mergedMatch[2].trim();
      if (num.length === 2 && possibleName.length >= 3) {
        const possibleQty = parseInt(num[1]);
        if (possibleQty >= 1 && possibleQty <= 9) {
          return { qty: possibleQty, name: possibleName };
        }
      }
    }
  }

  // Pattern C: "2x Burger" or "2 X Burger"
  const qtyPrefix = beforePrice.match(/^(\d+)\s*[xX×]\s*(.+)$/);
  if (qtyPrefix) {
    return { qty: parseInt(qtyPrefix[1]) || 1, name: qtyPrefix[2] };
  }

  return { qty: 1, name: beforePrice };
}

// ============================================================
// Column-based parser (uses word bounding boxes)
// ============================================================

export interface WordBox {
  text: string;
  x0: number; // left edge
  x1: number; // right edge
  y0: number; // top
  y1: number; // bottom
  line: number; // line index from Tesseract
}

/**
 * Group words into lines based on vertical position,
 * then detect the price column by finding right-aligned numbers.
 */
export function parseWithColumns(
  words: WordBox[],
  imageWidth: number,
): {
  items: OCRItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
} {
  if (!words.length) return { items: [] };

  // Group words by line (Tesseract line index, or cluster by y-center)
  const lineMap = new Map<number, WordBox[]>();
  for (const w of words) {
    const key = w.line;
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key)!.push(w);
  }

  // Sort each line's words left-to-right
  for (const ws of lineMap.values()) {
    ws.sort((a, b) => a.x0 - b.x0);
  }

  // Find price column: look for lines where the rightmost word(s) are a number
  // Collect the x-positions of right-aligned numbers to find the column boundary
  const priceXPositions: number[] = [];

  for (const ws of lineMap.values()) {
    if (ws.length < 2) continue;
    // Check the rightmost 1-2 words for a number
    const lastWord = ws[ws.length - 1];
    const cleanLast = lastWord.text.replace(/[₡$€£¥₩₹,.\s]/g, '');
    if (/^\d{2,}$/.test(cleanLast)) {
      priceXPositions.push(lastWord.x0);
    }
  }

  if (priceXPositions.length < 2) {
    // Not enough price-like numbers found, fall back to line parser
    return { items: [] };
  }

  // The price column starts around the median x0 of price words
  priceXPositions.sort((a, b) => a - b);
  const medianPriceX =
    priceXPositions[Math.floor(priceXPositions.length / 2)];
  // Allow some tolerance (15% of image width)
  const priceColumnStart = medianPriceX - imageWidth * 0.15;

  const items: OCRItem[] = [];
  let subtotal: number | undefined;
  let tax: number | undefined;
  let total: number | undefined;

  const sortedLines = [...lineMap.entries()].sort((a, b) => a[0] - b[0]);

  for (const [, ws] of sortedLines) {
    // Split words into description (left of price column) and price (right)
    const descWords: string[] = [];
    const priceWords: string[] = [];

    for (const w of ws) {
      if (w.x0 >= priceColumnStart) {
        priceWords.push(w.text);
      } else {
        descWords.push(w.text);
      }
    }

    if (priceWords.length === 0) continue;

    const priceText = priceWords.join('');
    const priceMatch = priceText.match(PRICE_REGEX);
    if (!priceMatch) continue;

    const cents = parseAmount(priceMatch[1]);
    if (cents <= 0) continue;

    const descText = descWords.join(' ').trim();
    if (!descText || descText.length < 2) continue;

    const fullLine = descText + ' ' + priceWords.join(' ');

    // Check total/tax BEFORE skip patterns (e.g. "TOTAL FACTURA" contains "factura")
    if (TAX_PATTERN.test(fullLine)) {
      tax = cents;
      continue;
    }
    if (TOTAL_PATTERN.test(fullLine)) {
      if (/sub/i.test(fullLine)) {
        subtotal = cents;
      } else {
        total = cents;
      }
      continue;
    }

    if (shouldSkipLine(fullLine) || shouldSkipLine(descText)) continue;

    const { qty, name: rawName } = extractQuantity(descText);
    const name = cleanItemName(rawName);

    if (!name || name.length < 2) continue;
    if (!isLikelyFoodItem(name)) continue;

    items.push({ name, price: cents, quantity: qty });
  }

  return { items, subtotal, tax, total };
}

// ============================================================
// Line-based parser (fallback when no bounding boxes)
// ============================================================

export function parseReceiptText(raw: string): {
  items: OCRItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
} {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  const items: OCRItem[] = [];
  let subtotal: number | undefined;
  let tax: number | undefined;
  let total: number | undefined;

  for (const line of lines) {
    if (!/\d/.test(line)) continue;

    const priceMatch = line.match(PRICE_AT_END);
    if (!priceMatch) continue;

    const cents = parseAmount(priceMatch[1]);
    if (cents <= 0) continue;

    // Check total/tax BEFORE skip patterns (e.g. "TOTAL FACTURA" contains "factura")
    if (TAX_PATTERN.test(line)) {
      tax = cents;
      continue;
    }
    if (TOTAL_PATTERN.test(line)) {
      if (/sub/i.test(line)) {
        subtotal = cents;
      } else {
        total = cents;
      }
      continue;
    }

    if (shouldSkipLine(line)) continue;

    const beforePrice = line
      .slice(0, priceMatch.index)
      .replace(/[₡$€£¥₩₹\s.]+$/, '')
      .trim();

    if (!beforePrice || beforePrice.length < 2) continue;
    if (shouldSkipLine(beforePrice)) continue;

    const { qty, name: rawName } = extractQuantity(beforePrice);
    const name = cleanItemName(rawName);

    if (!name || name.length < 2) continue;
    if (!isLikelyFoodItem(name)) continue;

    items.push({ name, price: cents, quantity: qty });
  }

  return { items, subtotal, tax, total };
}

// ============================================================
// Merge: prefer column-based if it finds items, else fallback
// ============================================================

export function parseReceipt(
  raw: string,
  words: WordBox[],
  imageWidth: number,
): {
  items: OCRItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
} {
  // Try column-based first
  if (words.length > 0 && imageWidth > 0) {
    const colResult = parseWithColumns(words, imageWidth);
    if (colResult.items.length > 0) {
      return colResult;
    }
  }

  // Fallback to line-based
  return parseReceiptText(raw);
}
