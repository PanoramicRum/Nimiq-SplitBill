# Image Recognition Pipeline

This document covers the OCR (Optical Character Recognition) system used in SplitBill to extract items from receipt photos. The feature is under active development — contributions to improve accuracy are welcome.

## Overview

The entire OCR pipeline is self-contained in `src/services/ocr/` and runs **client-side** using [Tesseract.js](https://github.com/naptha/tesseract.js). No server round-trip is required.

The system uses a **provider pattern**: the `OCRProvider` interface defines the contract, and implementations can be swapped without touching the rest of the app.

## Architecture

```
Camera/Gallery
    │
    ▼
StepScanBill.tsx ──► capturedImage store (Blob)
                          │
                          ▼
                    StepOcrProcessing.tsx
                          │
                          ▼
                    getOCRProvider(name?)
                          │
                    ┌─────┴──────────────┐
                    │                    │
            TesseractOCR            MockOCR
            Provider                Provider
                    │
                    ▼
            Tesseract.recognize(image, langs)
                    │
                    ├── raw text
                    └── word bounding boxes (x, y, width, height per word)
                          │
                          ▼
                    receiptParser.parseReceipt(raw, words, imageWidth)
                          │
                    ┌─────┴──────┐
                    │            │
            parseWithColumns    parseReceiptText
            (bounding boxes)    (regex fallback)
                    │
                    ▼
            OCRResult { items, subtotal, tax, total, confidence }
                    │
                    ▼
            StepBillReview.tsx (user verifies & edits)
```

## Files

| File | Purpose |
|------|---------|
| `types.ts` | `OCRProvider`, `OCRResult`, `OCRItem`, `OCROptions` interfaces |
| `index.ts` | Factory function `getOCRProvider()` — selects provider by name or env var |
| `tesseractOcrProvider.ts` | Tesseract.js implementation with language detection |
| `mockOcrProvider.ts` | Returns hardcoded data for development/testing |
| `receiptParser.ts` | Two-strategy receipt parser (column-based + line-based) |
| `receiptParser.test.ts` | 42 tests covering parsing, cleanup, and classification |

## The OCRProvider Interface

```typescript
interface OCROptions {
  currencyCode?: string;  // e.g. "USD", "CRC", "EUR" — used for language selection
}

interface OCRProvider {
  name: string;
  processImage(imageData: File | Blob | string, options?: OCROptions): Promise<OCRResult>;
}

interface OCRResult {
  items: OCRItem[];       // Extracted line items
  subtotal?: number;      // In cents
  tax?: number;           // In cents
  total?: number;         // In cents
  confidence: number;     // 0–1 (from OCR engine)
  raw?: string;           // Raw OCR text for debugging
}

interface OCRItem {
  name: string;           // Item description (cleaned)
  price: number;          // Price in cents
  quantity: number;       // Detected quantity (default 1)
}
```

All monetary values are in **cents** (integer) to avoid floating-point issues.

## How to Implement a New Provider

### Step 1: Create the provider file

Create `src/services/ocr/myProvider.ts`:

```typescript
import type { OCRProvider, OCRResult, OCROptions } from './types';

export class MyProvider implements OCRProvider {
  name = 'myProvider';

  async processImage(
    imageData: File | Blob | string,
    options?: OCROptions,
  ): Promise<OCRResult> {
    // Your implementation here.
    //
    // You can either:
    // a) Return raw text and use the existing parseReceipt() function
    // b) Do your own parsing and return OCRResult directly
    //
    // Option (a) — reuse the existing parser:
    //   import { parseReceipt } from './receiptParser';
    //   const raw = await yourOcrEngine(imageData);
    //   const parsed = parseReceipt(raw, [], 0); // no bounding boxes
    //   return { ...parsed, confidence: 0.85, raw };
    //
    // Option (b) — full custom parsing:
    //   return { items: [...], confidence: 0.9 };

    throw new Error('Not implemented');
  }
}
```

### Step 2: Register in the factory

Edit `src/services/ocr/index.ts`:

```typescript
import { MyProvider } from './myProvider';

export function getOCRProvider(providerName?: string): OCRProvider {
  const name = providerName ?? import.meta.env.VITE_OCR_PROVIDER ?? 'tesseract';
  switch (name) {
    case 'myProvider':
      return new MyProvider();
    case 'mock':
      return new MockOCRProvider();
    case 'tesseract':
    default:
      return new TesseractOCRProvider();
  }
}
```

### Step 3: Test it

```bash
# Run with your provider
VITE_OCR_PROVIDER=myProvider npm run dev

# Run the existing parser tests (if you reuse parseReceipt)
npm run test
```

### Step 4: Add tests

Create `src/services/ocr/myProvider.test.ts` with test cases for your provider. If you reuse `parseReceipt()`, the existing 42 tests in `receiptParser.test.ts` already cover the parsing logic.

## Receipt Parser Deep Dive

The parser in `receiptParser.ts` extracts items from OCR output using two strategies:

### Strategy 1: Column-Based (`parseWithColumns`)

Used when Tesseract provides word bounding boxes (position data for each word).

1. **Group words by line** using Tesseract's line index
2. **Detect price column** — find right-aligned numbers, compute median x-position
3. **Split each line** — words left of the price column = description, words right = price
4. **Classify** — detect total/subtotal/tax lines, skip metadata, extract items

This strategy works best on structured receipts with aligned columns.

### Strategy 2: Line-Based (`parseReceiptText`)

Fallback when no bounding boxes are available or column detection fails.

1. **Split raw text into lines**
2. **Find prices at line end** using `PRICE_AT_END` regex
3. **Extract description** from text before the price match
4. **Classify** using the same logic as column-based

### Merge Logic (`parseReceipt`)

```
if (bounding boxes available AND column parser finds items)
  → use column-based results
else
  → use line-based results
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `parseAmount(str)` | Parses price strings in multiple formats (US: `1,500.50`, EU: `1.500,50`) → cents |
| `shouldSkipLine(text)` | Returns true for non-item lines (metadata, addresses, payment info) |
| `isLikelyFoodItem(name)` | Validates item names (rejects short names, high digit ratio, non-food patterns) |
| `cleanItemName(name)` | Strips OCR noise: leading prefixes, quantity markers, trailing price fragments |
| `extractQuantity(text)` | Detects quantity patterns: `2x Item`, `1 2 Item` (table format), merged digits |

### Price Parsing

Supports multiple currency formats:

| Format | Example | Currency |
|--------|---------|----------|
| US dot-decimal | `12.50`, `1,500.50` | USD, CRC |
| European comma-decimal | `7.300,00` | EUR |
| Space-separated thousands | `7 300` | Various |
| Currency symbols | `₡`, `$`, `€`, `£`, `¥`, `₩`, `₹`, `R` | Multi |

### Language Detection

The Tesseract provider selects OCR language models based on the user's currency:

| Currency | Languages |
|----------|-----------|
| CRC, MXN, ARS, COP, PEN, CLP | `eng+spa` (Spanish) |
| BRL | `eng+por` (Portuguese) |
| JPY | `eng+jpn` (Japanese) |
| CNY | `eng+chi_sim` (Chinese) |
| KRW | `eng+kor` (Korean) |
| All others | `eng` (English) |

## Testing

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run only OCR tests
npx vitest run src/services/ocr/
```

### Test Coverage

The test suite in `receiptParser.test.ts` covers:

- **Price parsing** (8 tests) — US, European, comma/dot edge cases
- **Name cleanup** (8 tests) — prefix stripping, OCR noise removal
- **Line filtering** (8 tests) — metadata, emails, location data
- **Food item validation** (4 tests) — format rules, digit ratios
- **Full receipt parsing** (5 tests) — Real-world receipts (Costa Rican, US, European)
- **Column-based parsing** — Structured table with bounding boxes
- **Fallback logic** — Column → line-based cascade

## Known Limitations

These are the areas most in need of improvement:

### OCR Accuracy
- **No image preprocessing** — The raw camera photo is sent directly to Tesseract. Rotation correction, contrast enhancement, de-skewing, and document boundary detection would significantly improve results.
- **Blurry/low-light photos** produce poor results. There's no image quality validation before OCR.
- **Tesseract speed** — Processing takes 2–8 seconds depending on device. Language model downloads add ~15MB per language on first use.

### Parsing Heuristics
- **Price column detection** uses a median x-position heuristic with 15% tolerance. Fails on receipts with multiple price columns or unusual layouts.
- **Quantity extraction** is regex-based and brittle. The merged-digits pattern (`12 Item` → qty=2) is error-prone.
- **Trailing number cleanup** uses a magic threshold of 20 to distinguish OCR noise from intentional numbers.
- **Line-based fallback** only finds prices at the end of lines. Receipts with leading prices are not handled.

### Scope
- **Limited language support** — Only 10 currency codes are mapped to languages. No support for Thai, Vietnamese, Arabic, Hebrew, or Indian languages.
- **No multi-line items** — Item descriptions that span multiple lines are not grouped.
- **Confidence score** reflects Tesseract's character confidence only, not parsing quality.

## Ideas for Improvement

Here are some directions for contributors to explore:

1. **Image preprocessing** — Add rotation correction, cropping, contrast enhancement, and de-skewing before passing to Tesseract. Libraries like OpenCV.js could help.

2. **Cloud OCR providers** — Implement providers for Google Cloud Vision, AWS Textract, or Azure Computer Vision. These typically achieve better accuracy than client-side Tesseract.

3. **ML-based receipt parsing** — Replace regex heuristics with a trained model that understands receipt structure. Projects like [CORD](https://github.com/clovaai/cord) provide receipt-specific datasets.

4. **Hybrid approach** — Use Tesseract for quick local processing, then optionally send to a cloud API for verification if confidence is low.

5. **Image quality feedback** — Before running OCR, check for blur, lighting, and framing. Guide the user to retake if quality is poor.

6. **Service worker caching** — Cache Tesseract language models in a service worker to avoid re-downloading on each visit.

7. **Receipt template matching** — Build a library of known receipt formats (e.g., specific restaurant chains) and use template-specific parsing rules.
