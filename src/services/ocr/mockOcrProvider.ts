import type { OCRProvider, OCRResult } from './types';

export class MockOCRProvider implements OCRProvider {
  name = 'mock';

  async processImage(_imageData: File | Blob | string): Promise<OCRResult> {
    // Simulate network/processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      items: [
        { name: 'Artisan Margherita Pizza', price: 3400, quantity: 2 },
        { name: 'Craft Beer Flight', price: 1850, quantity: 1 },
        { name: 'Truffle Parmesan Fries', price: 1200, quantity: 1 },
        { name: 'Grilled Octopus', price: 2200, quantity: 1 },
        { name: 'House Red Wine (Bottle)', price: 4800, quantity: 1 },
        { name: 'Tiramisu', price: 800, quantity: 1 },
      ],
      subtotal: 14250,
      tax: 1175,
      total: 14250,
      confidence: 0.92,
    };
  }
}
