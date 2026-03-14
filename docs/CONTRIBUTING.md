# Contributing to Nimiq SplitBill

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Nimiq-SplitBill.git
   cd Nimiq-SplitBill
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the dev server:**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/` — New features (e.g., `feature/google-vision-provider`)
- `fix/` — Bug fixes (e.g., `fix/price-parsing-european-format`)
- `docs/` — Documentation changes

### Before Submitting

```bash
# Lint your code
npm run lint

# Run tests
npm run test

# Build to check for TypeScript errors
npm run build
```

### Pull Requests

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- If adding a new OCR provider, include test results with sample receipts
- Reference any related issues

## Contributing to Image Recognition

The OCR module is the area where contributions are most needed. The image recognition accuracy is the main limitation of the current app.

### Quick Overview

The OCR code is **self-contained** in `src/services/ocr/`:

```
src/services/ocr/
├── types.ts                 # OCRProvider interface — the contract
├── index.ts                 # Factory function (provider selection)
├── tesseractOcrProvider.ts  # Current Tesseract.js implementation
├── mockOcrProvider.ts       # Mock for testing
├── receiptParser.ts         # Receipt text → structured items
└── receiptParser.test.ts    # 42 tests
```

### How to Contribute

The simplest way to improve OCR is to **implement a new `OCRProvider`**. The interface is minimal:

```typescript
interface OCRProvider {
  name: string;
  processImage(imageData: File | Blob | string, options?: OCROptions): Promise<OCRResult>;
}
```

See [docs/IMAGE_RECOGNITION.md](IMAGE_RECOGNITION.md) for the full guide including:
- Step-by-step instructions to add a new provider
- Architecture diagrams
- Receipt parser deep dive
- Known limitations and improvement ideas

### What to Work On

Areas where help is most needed:

1. **Image preprocessing** — Rotation, cropping, contrast before OCR
2. **Better OCR engines** — Cloud API providers (Google Vision, AWS Textract)
3. **Parser improvements** — Better price detection, multi-line items, more languages
4. **Testing with real receipts** — More test cases from different countries/formats

### Testing OCR Changes

```bash
# Use the mock provider during UI development
VITE_OCR_PROVIDER=mock npm run dev

# Run parser tests
npm run test

# Test with a specific provider
VITE_OCR_PROVIDER=yourProvider npm run dev
```

## Code Style

- **TypeScript** with strict mode
- **Tailwind CSS** for all styling (no CSS modules or inline styles)
- **Zustand** for state management (no prop drilling)
- **Functional components** with hooks (no class components)
- **Framer Motion** for animations

## Reporting Issues

### OCR Accuracy Issues

When reporting OCR problems, include:
- A photo of the receipt (redact sensitive info)
- The raw OCR text output (shown in browser console)
- Expected vs. actual parsed items
- Your currency setting

### UI Issues

Include:
- Screenshot of the issue
- Device and browser (e.g., iPhone 15, Safari 18)
- Steps to reproduce
- Dark mode on/off

## Questions?

Open an issue on GitHub and tag it with `question`.
