export interface OCRItem {
  name: string;
  price: number; // cents
  quantity: number;
}

export interface OCRResult {
  items: OCRItem[];
  subtotal?: number; // cents
  tax?: number; // cents
  total?: number; // cents
  confidence: number; // 0-1
  raw?: string;
}

export interface OCRProvider {
  name: string;
  processImage(imageData: File | Blob | string): Promise<OCRResult>;
}
