import type { OCRProvider } from './types';
import { TesseractOCRProvider } from './tesseractOcrProvider';
import { MockOCRProvider } from './mockOcrProvider';

export type { OCRProvider, OCRResult, OCRItem, OCROptions } from './types';

export function getOCRProvider(providerName?: string): OCRProvider {
  const name = providerName ?? import.meta.env.VITE_OCR_PROVIDER ?? 'tesseract';
  switch (name) {
    case 'mock':
      return new MockOCRProvider();
    case 'tesseract':
    default:
      return new TesseractOCRProvider();
  }
}
