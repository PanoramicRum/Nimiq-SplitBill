import Tesseract from 'tesseract.js';
import type { OCRProvider, OCRResult, OCROptions } from './types';
import { parseReceipt } from './receiptParser';
import type { WordBox } from './receiptParser';

// --- Tesseract language mapping ---

function getLangForCurrency(code: string): string {
  const langMap: Record<string, string> = {
    CRC: 'spa',
    MXN: 'spa',
    ARS: 'spa',
    COP: 'spa',
    PEN: 'spa',
    CLP: 'spa',
    BRL: 'por',
    JPY: 'jpn',
    CNY: 'chi_sim',
    KRW: 'kor',
  };
  return langMap[code] ?? 'eng';
}

// --- Extract word boxes from Tesseract result ---

function extractWordBoxes(data: Tesseract.Page): { words: WordBox[]; width: number; height: number } {
  const words: WordBox[] = [];
  let lineIndex = 0;

  // Tesseract.js v7 structure: data.lines[].words[].text + bbox
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageData = data as any;
  if (pageData.lines) {
    for (const line of pageData.lines) {
      if (line.words) {
        for (const word of line.words) {
          if (word.text.trim()) {
            words.push({
              text: word.text.trim(),
              x0: word.bbox.x0,
              x1: word.bbox.x1,
              y0: word.bbox.y0,
              y1: word.bbox.y1,
              line: lineIndex,
            });
          }
        }
      }
      lineIndex++;
    }
  }

  // Try to get image dimensions from the first block or from words
  let width = 0;
  let height = 0;
  if (data.blocks && data.blocks.length > 0) {
    const lastBlock = data.blocks[data.blocks.length - 1];
    width = Math.max(width, lastBlock.bbox?.x1 ?? 0);
    height = Math.max(height, lastBlock.bbox?.y1 ?? 0);
  }
  // Fallback: use max word coordinates
  for (const w of words) {
    width = Math.max(width, w.x1);
    height = Math.max(height, w.y1);
  }

  return { words, width, height };
}

// --- Provider ---

export class TesseractOCRProvider implements OCRProvider {
  name = 'tesseract';

  async processImage(imageData: File | Blob | string, options?: OCROptions): Promise<OCRResult> {
    const currencyCode = options?.currencyCode ?? 'USD';
    const lang = getLangForCurrency(currencyCode);
    const langs = lang === 'eng' ? 'eng' : `eng+${lang}`;

    const result = await Tesseract.recognize(imageData, langs, {
      logger: () => {},
    });

    const raw = result.data.text;
    const confidence = result.data.confidence / 100;

    // Extract word bounding boxes for column detection
    const { words, width } = extractWordBoxes(result.data);

    const parsed = parseReceipt(raw, words, width);

    return {
      items: parsed.items,
      subtotal: parsed.subtotal,
      tax: parsed.tax,
      total: parsed.total,
      confidence,
      raw,
    };
  }
}
