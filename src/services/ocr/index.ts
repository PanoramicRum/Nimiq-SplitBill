import type { OCRProvider } from './types';
import { TesseractOCRProvider } from './tesseractOcrProvider';

export type { OCRProvider, OCRResult, OCRItem } from './types';

export function getOCRProvider(): OCRProvider {
  return new TesseractOCRProvider();
}
