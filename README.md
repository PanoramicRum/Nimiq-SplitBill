# Nimiq SplitBill

A mobile-first bill splitting app with OCR receipt scanning. Snap a photo of your receipt, let the app extract items automatically, and split the bill with friends — evenly, by percentage, or by assigning individual items.

Built with React 19 &middot; TypeScript &middot; Tailwind CSS &middot; Tesseract.js &middot; Zustand &middot; Vite

## Features

- **Scan receipts** — Use your camera or upload a photo to extract bill items via OCR
- **Manual entry** — Enter bill totals or individual items by hand
- **Three split methods** — Assign specific items, split evenly, or split by percentage
- **Tip calculator** — Add tips by percentage or fixed amount
- **Multi-currency** — Supports 17+ currencies with locale-aware formatting
- **Dark mode** — Full dark theme support
- **Nimiq integration** — Generate payment requests via Nimiq blockchain
- **Docker ready** — Dev and production Docker configurations included

## Quick Start

```bash
git clone https://github.com/PanoramicRum/Nimiq-SplitBill.git
cd Nimiq-SplitBill
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Docker

**Development:**
```bash
docker compose up
```

**Production:**
```bash
docker compose -f docker-compose.prod.yml up
```

## Architecture

### App Flow

The app guides users through a 12-step flow:

1. **Start** — Choose to scan a receipt or enter manually
2. **Scan Bill** — Camera capture or photo upload
3. **OCR Processing** — Automatic text extraction
4. **Bill Review** — Verify and edit extracted items
5. **Manual Amount** — (Alternative) Enter total manually
6. **Tip** — Configure tip (none, percentage, or fixed)
7. **People** — Add participant names
8. **Split Method** — Choose how to split (items, even, percentage)
9. **Assign Items** / **Even Split** / **Percentage Split** — Configure the split
10. **Results** — Final summary with per-person amounts

### Directory Structure

```
src/
├── components/
│   ├── layout/          # ScreenShell, ProgressStepper, TopBar, BottomCTA
│   └── ui/              # Icon, CurrencyPicker, DarkModeToggle
├── pages/               # BillSplitFlow (main page with step routing)
├── services/
│   ├── ocr/             # OCR pipeline (see docs/IMAGE_RECOGNITION.md)
│   └── nimiq/           # Nimiq blockchain integration
├── steps/               # 12 step components (one per screen)
├── store/               # Zustand state management
├── types/               # TypeScript interfaces
└── utils/               # Calculations, formatting, sharing helpers
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/services/ocr/` | Image recognition pipeline — self-contained, provider-based architecture |
| `src/steps/` | Each step in the bill-splitting flow is an independent component |
| `src/store/` | Zustand store with localStorage persistence |
| `src/utils/` | Pure utility functions for currency formatting, split calculations |

## OCR Pipeline

The image recognition system lives entirely in `src/services/ocr/` and uses a **provider pattern** for easy extensibility. The current implementation uses [Tesseract.js](https://github.com/naptha/tesseract.js) for client-side OCR.

> **The OCR feature is under active development.** We welcome contributions to improve accuracy. See [docs/IMAGE_RECOGNITION.md](docs/IMAGE_RECOGNITION.md) for a deep dive on the architecture, how to implement new providers, and known limitations.

To swap OCR providers, set the `VITE_OCR_PROVIDER` environment variable:

```bash
# Use the mock provider for development/testing
VITE_OCR_PROVIDER=mock npm run dev
```

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Zustand | 5 | State management (persisted to localStorage) |
| Tailwind CSS | 4 | Utility-first styling |
| Tesseract.js | 7 | Client-side OCR engine |
| Framer Motion | 12 | Page transition animations |
| React Router | 7 | Client-side routing |
| Vite | 8 | Build tool and dev server |
| Vitest | 4 | Testing framework |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |

## Contributing

We welcome contributions, especially to the image recognition module. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

If you're interested in improving OCR accuracy, start with [docs/IMAGE_RECOGNITION.md](docs/IMAGE_RECOGNITION.md) — it explains the full pipeline, how to add new providers, and lists known areas for improvement.

## License

[MIT](LICENSE)
