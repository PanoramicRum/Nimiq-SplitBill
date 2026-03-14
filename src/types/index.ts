export interface CurrencyConfig {
  code: string;
  symbol: string;
  flag: string;
  name: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  { code: 'CRC', symbol: '₡', flag: '🇨🇷', name: 'Costa Rica Colón', locale: 'es-CR', decimals: 0 },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro', locale: 'de-DE', decimals: 2 },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  { code: 'MXN', symbol: '$', flag: '🇲🇽', name: 'Mexican Peso', locale: 'es-MX', decimals: 2 },
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷', name: 'Brazilian Real', locale: 'pt-BR', decimals: 2 },
  { code: 'CAD', symbol: '$', flag: '🇨🇦', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  { code: 'ARS', symbol: '$', flag: '🇦🇷', name: 'Argentine Peso', locale: 'es-AR', decimals: 2 },
  { code: 'COP', symbol: '$', flag: '🇨🇴', name: 'Colombian Peso', locale: 'es-CO', decimals: 0 },
  { code: 'PEN', symbol: 'S/', flag: '🇵🇪', name: 'Peruvian Sol', locale: 'es-PE', decimals: 2 },
  { code: 'CLP', symbol: '$', flag: '🇨🇱', name: 'Chilean Peso', locale: 'es-CL', decimals: 0 },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan', locale: 'zh-CN', decimals: 2 },
  { code: 'KRW', symbol: '₩', flag: '🇰🇷', name: 'South Korean Won', locale: 'ko-KR', decimals: 0 },
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
  { code: 'AUD', symbol: '$', flag: '🇦🇺', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: 'Swiss Franc', locale: 'de-CH', decimals: 2 },
];

export type BillSource = 'scan' | 'manual';

export type SplitMethod = 'even' | 'percentage' | 'items';

export type TipMode = 'none' | 'percentage' | 'fixed';

export interface Person {
  id: string;
  name: string;
  colorIndex: number;
}

export interface BillItem {
  id: string;
  name: string;
  price: number; // cents
  quantity: number;
  assignedTo: string[]; // Person IDs
}

export interface TipConfig {
  mode: TipMode;
  percentage: number;
  fixedAmount: number; // cents
}

export interface PercentageAllocation {
  personId: string;
  percentage: number;
}

export interface SplitResult {
  personId: string;
  subtotal: number; // cents
  tipShare: number; // cents
  total: number; // cents
  isRemainderHolder: boolean;
  items?: BillItem[];
}
