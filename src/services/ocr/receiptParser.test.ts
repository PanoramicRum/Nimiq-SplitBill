import { describe, it, expect } from 'vitest';
import {
  parseAmount,
  parseReceiptText,
  parseWithColumns,
  cleanItemName,
  shouldSkipLine,
  isLikelyFoodItem,
  parseReceipt,
} from './receiptParser';
import type { WordBox } from './receiptParser';

// ============================================================
// Unit tests: parseAmount
// ============================================================

describe('parseAmount', () => {
  it('parses US format: 12.50', () => {
    expect(parseAmount('12.50')).toBe(1250);
  });

  it('parses US format with thousand sep: 1,500.50', () => {
    expect(parseAmount('1,500.50')).toBe(150050);
  });

  it('parses European format: 7.300,00', () => {
    expect(parseAmount('7.300,00')).toBe(730000);
  });

  it('parses European format: 1.500,00', () => {
    expect(parseAmount('1.500,00')).toBe(150000);
  });

  it('parses simple integer: 600', () => {
    expect(parseAmount('600')).toBe(60000);
  });

  it('parses comma decimal without thousand: 600,00', () => {
    expect(parseAmount('600,00')).toBe(60000);
  });

  it('parses 18.500,00 (Costa Rican total)', () => {
    expect(parseAmount('18.500,00')).toBe(1850000);
  });

  it('returns 0 for empty string', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('returns 0 for non-numeric', () => {
    expect(parseAmount('abc')).toBe(0);
  });

  it('parses 5.00 correctly', () => {
    expect(parseAmount('5.00')).toBe(500);
  });
});

// ============================================================
// Unit tests: cleanItemName
// ============================================================

describe('cleanItemName', () => {
  it('strips leading + sign', () => {
    expect(cleanItemName('+ 1 Salsa Umami')).toBe('Salsa Umami');
  });

  it('strips leading # and number', () => {
    expect(cleanItemName('# 3 Burger')).toBe('Burger');
  });

  it('strips "2x" prefix', () => {
    expect(cleanItemName('2x Large Fries')).toBe('Large Fries');
  });

  it('strips leading line number', () => {
    expect(cleanItemName('3 Caesar Salad')).toBe('Caesar Salad');
  });

  it('strips trailing number likely from OCR price bleed (>50)', () => {
    expect(cleanItemName('Coca-Cola Sin Azucar 68')).toBe('Coca-Cola Sin Azucar');
  });

  it('keeps trailing number if <=50 (likely intentional)', () => {
    expect(cleanItemName('Menu 2')).toBe('Menu 2');
  });

  it('handles already clean name', () => {
    expect(cleanItemName('Chick-n Applewood Bacon')).toBe('Chick-n Applewood Bacon');
  });
});

// ============================================================
// Unit tests: shouldSkipLine
// ============================================================

describe('shouldSkipLine', () => {
  it('skips factura lines', () => {
    expect(shouldSkipLine('FACTURA ELECTRONICA')).toBe(true);
  });

  it('skips cedula lines', () => {
    expect(shouldSkipLine('CEDULA JURIDICA: 3105770847')).toBe(true);
  });

  it('skips email lines', () => {
    expect(shouldSkipLine('EMAIL: test@gmail.com')).toBe(true);
  });

  it('skips long number sequences', () => {
    expect(shouldSkipLine('506090226003105770847')).toBe(true);
  });

  it('skips "Total items: 4"', () => {
    expect(shouldSkipLine('Total items: 4')).toBe(true);
  });

  it('skips column headers', () => {
    expect(shouldSkipLine('# CANT ITEM P.UNIT')).toBe(true);
  });

  it('does not skip food items', () => {
    expect(shouldSkipLine('Chick-n Applewood Bacon')).toBe(false);
  });

  it('does not skip simple drink names', () => {
    expect(shouldSkipLine('Coca-Cola')).toBe(false);
  });
});

// ============================================================
// Unit tests: isLikelyFoodItem
// ============================================================

describe('isLikelyFoodItem', () => {
  it('accepts normal food names', () => {
    expect(isLikelyFoodItem('Chick-n Applewood Bacon')).toBe(true);
    expect(isLikelyFoodItem('Te Hatsu Negro Limon')).toBe(true);
    expect(isLikelyFoodItem('Coca-Cola Sin Azucar')).toBe(true);
  });

  it('rejects names that are mostly digits', () => {
    expect(isLikelyFoodItem('3101082538')).toBe(false);
  });

  it('rejects too-short names', () => {
    expect(isLikelyFoodItem('AB')).toBe(false);
  });

  it('rejects discount lines', () => {
    expect(isLikelyFoodItem('Descuento especial')).toBe(false);
  });
});

// ============================================================
// Integration: parseReceiptText (line-based)
// ============================================================

describe('parseReceiptText', () => {
  it('parses Costa Rican Burga receipt', () => {
    const raw = `BURGA
LO NUESTRO.

Empresa Narfaza individual limitada SRL
CEDULA JURIDICA: 3105770847

Plaza mayor Rohrmoser
San José, Escazú, Asunción

FACTURA ELECTRONICA
N° 0020000101000002526

CLAVE NUMERICA:
50609022600310577084700200001010000002526176064350

CLIENTE:
NOMBRE: BRAKAM S.A
CEDULA: 3101082538
DIRECCION: ESCAZU, NA, SAN JOSE
EMAIL: crparadises@gmail.com

FECHA DE EMISION: 9 Feb. 2026

# CANT ITEM P.UNIT
1 2 Chick-n Applewood Bacon 7.300,00
2 1 Te Hatsu Negro Limon 1.500,00
3 1 Coca-Cola Sin Azucar 60 1.800,00
4 1 Salsa Umami 600,00

Total items: 4
TOTAL FACTURA: 18.500,00

% IMP. BASE IMP. IMPUESTO
13 16.371,68 2.128,32

FORMA DE PAGO MONTO
Tarjeta 18.500,00

ID ORDEN:62230853083463 68 #103322
HORA TRANSACCION:14:40:47
Pedido:V-2010
ATENDIDO POR: Pdv01 Burga01
AUTORIZADO MEDIANTE RESOLUCION No
DGT-R-033-2019 DEL 20 de Junio de 2019`;

    const result = parseReceiptText(raw);

    // Should find 4 items
    expect(result.items.length).toBeGreaterThanOrEqual(3);

    // Check we have the key items
    const names = result.items.map((i) => i.name.toLowerCase());
    expect(names.some((n) => n.includes('hatsu') || n.includes('te'))).toBe(true);
    expect(names.some((n) => n.includes('coca') || n.includes('cola'))).toBe(true);
    expect(names.some((n) => n.includes('salsa') || n.includes('umami'))).toBe(true);

    // Total should be detected
    expect(result.total).toBe(1850000); // 18500.00 CRC in cents
  });

  it('parses US restaurant receipt', () => {
    const raw = `THE CHEESECAKE FACTORY
Server: Mike
Table: 14

Avocado Eggrolls          12.95
Glamburger                16.50
Fish and Chips            15.95
Iced Tea                   3.95
Diet Coke                  3.95

Subtotal                  53.30
Tax                        4.26
Total                     57.56

VISA ending 4242
Thank you for dining with us!`;

    const result = parseReceiptText(raw);

    expect(result.items.length).toBe(5);

    const avocado = result.items.find((i) => i.name.toLowerCase().includes('avocado'));
    expect(avocado).toBeDefined();
    expect(avocado!.price).toBe(1295);

    const glamburger = result.items.find((i) => i.name.toLowerCase().includes('glamburger'));
    expect(glamburger).toBeDefined();
    expect(glamburger!.price).toBe(1650);

    expect(result.subtotal).toBe(5330);
    expect(result.tax).toBe(426);
    expect(result.total).toBe(5756);
  });

  it('parses receipt with quantity prefixes', () => {
    const raw = `RESTAURANT XYZ

2x Margherita Pizza     24.00
1x Caesar Salad         12.50
3x Draft Beer           27.00
1x Tiramisu              8.50

Subtotal                72.00
Tax                      5.76
Total                   77.76`;

    const result = parseReceiptText(raw);

    expect(result.items.length).toBe(4);

    const pizza = result.items.find((i) => i.name.toLowerCase().includes('pizza'));
    expect(pizza).toBeDefined();
    expect(pizza!.quantity).toBe(2);
    expect(pizza!.price).toBe(2400);

    const beer = result.items.find((i) => i.name.toLowerCase().includes('beer'));
    expect(beer).toBeDefined();
    expect(beer!.quantity).toBe(3);
  });

  it('parses European receipt with comma decimals', () => {
    const raw = `RISTORANTE BELLA ITALIA
Via Roma 42, Milano

Bruschetta            8,50
Pasta Carbonara      14,00
Tiramisu              7,50
Acqua Minerale        3,00

Totale               33,00
IVA                   2,64`;

    const result = parseReceiptText(raw);

    expect(result.items.length).toBe(4);

    const pasta = result.items.find((i) => i.name.toLowerCase().includes('carbonara'));
    expect(pasta).toBeDefined();
    expect(pasta!.price).toBe(1400);

    const bruschetta = result.items.find((i) => i.name.toLowerCase().includes('bruschetta'));
    expect(bruschetta).toBeDefined();
    expect(bruschetta!.price).toBe(850);
  });

  it('parses receipt with mixed OCR noise', () => {
    const raw = `SODA LA CASITA
Tel: 2222-3333
San Jose, Costa Rica

1 1 Casado con Pollo 4.500,00
2 1 Arroz con Mariscos 6.800,00
3 2 Batido Natural 2.500,00
4 1 Agua 1.000,00

Total: 14.800,00

Gracias por su visita!`;

    const result = parseReceiptText(raw);

    expect(result.items.length).toBeGreaterThanOrEqual(3);
    expect(result.total).toBe(1480000);
  });

  it('handles receipt where numbers bleed into item names', () => {
    const raw = `CAFE DOWNTOWN

Cappuccino Grande 5.50
Blueberry Muffin 4.25
Avocado Toast 12.00

Total 21.75`;

    const result = parseReceiptText(raw);

    expect(result.items.length).toBe(3);
    expect(result.total).toBe(2175);
  });

  it('skips non-food metadata even when it contains numbers', () => {
    const raw = `INVOICE 12345
Date: 2026-01-15
Order: 98765

Chicken Wings 8.99
French Fries 4.99

Total 13.98`;

    const result = parseReceiptText(raw);

    // Should only get 2 food items, not the invoice/date/order lines
    expect(result.items.length).toBe(2);
    expect(result.items[0].name.toLowerCase()).toContain('chicken');
  });
});

// ============================================================
// Integration: parseWithColumns (bounding box-based)
// ============================================================

describe('parseWithColumns', () => {
  it('detects price column and extracts items', () => {
    // Simulate word boxes for a simple receipt:
    // "Burger       12.50"
    // "Fries         5.00"
    // "Total        17.50"
    const imageWidth = 400;
    const words: WordBox[] = [
      // Line 0: Burger 12.50
      { text: 'Burger', x0: 10, x1: 100, y0: 10, y1: 30, line: 0 },
      { text: '12.50', x0: 300, x1: 380, y0: 10, y1: 30, line: 0 },
      // Line 1: Fries 5.00
      { text: 'Fries', x0: 10, x1: 80, y0: 40, y1: 60, line: 1 },
      { text: '5.00', x0: 310, x1: 380, y0: 40, y1: 60, line: 1 },
      // Line 2: Total 17.50
      { text: 'Total', x0: 10, x1: 80, y0: 70, y1: 90, line: 2 },
      { text: '17.50', x0: 300, x1: 380, y0: 70, y1: 90, line: 2 },
    ];

    const result = parseWithColumns(words, imageWidth);

    expect(result.items.length).toBe(2);
    expect(result.items[0].name).toBe('Burger');
    expect(result.items[0].price).toBe(1250);
    expect(result.items[1].name).toBe('Fries');
    expect(result.items[1].price).toBe(500);
    expect(result.total).toBe(1750);
  });

  it('handles Costa Rican receipt with table format', () => {
    const imageWidth = 600;
    const words: WordBox[] = [
      // Line 0: "1  2  Chick-n Applewood Bacon  7.300,00"
      { text: '1', x0: 10, x1: 20, y0: 10, y1: 30, line: 0 },
      { text: '2', x0: 40, x1: 50, y0: 10, y1: 30, line: 0 },
      { text: 'Chick-n', x0: 70, x1: 150, y0: 10, y1: 30, line: 0 },
      { text: 'Applewood', x0: 155, x1: 250, y0: 10, y1: 30, line: 0 },
      { text: 'Bacon', x0: 255, x1: 310, y0: 10, y1: 30, line: 0 },
      { text: '7.300,00', x0: 450, x1: 560, y0: 10, y1: 30, line: 0 },
      // Line 1: "2  1  Te Hatsu Negro Limon  1.500,00"
      { text: '2', x0: 10, x1: 20, y0: 40, y1: 60, line: 1 },
      { text: '1', x0: 40, x1: 50, y0: 40, y1: 60, line: 1 },
      { text: 'Te', x0: 70, x1: 90, y0: 40, y1: 60, line: 1 },
      { text: 'Hatsu', x0: 95, x1: 150, y0: 40, y1: 60, line: 1 },
      { text: 'Negro', x0: 155, x1: 210, y0: 40, y1: 60, line: 1 },
      { text: 'Limon', x0: 215, x1: 270, y0: 40, y1: 60, line: 1 },
      { text: '1.500,00', x0: 450, x1: 560, y0: 40, y1: 60, line: 1 },
      // Line 2: "TOTAL FACTURA:  18.500,00"
      { text: 'TOTAL', x0: 100, x1: 180, y0: 100, y1: 120, line: 2 },
      { text: 'FACTURA:', x0: 185, x1: 290, y0: 100, y1: 120, line: 2 },
      { text: '18.500,00', x0: 450, x1: 560, y0: 100, y1: 120, line: 2 },
    ];

    const result = parseWithColumns(words, imageWidth);

    expect(result.items.length).toBe(2);

    // First item: Chick-n Applewood Bacon
    const chicken = result.items[0];
    expect(chicken.name.toLowerCase()).toContain('chick');
    expect(chicken.price).toBe(730000); // 7300.00 CRC

    // Second item: Te Hatsu Negro Limon
    const tea = result.items[1];
    expect(tea.name.toLowerCase()).toContain('hatsu');
    expect(tea.price).toBe(150000); // 1500.00 CRC

    expect(result.total).toBe(1850000); // 18500.00 CRC
  });

  it('returns empty if not enough price columns found', () => {
    const words: WordBox[] = [
      { text: 'Hello', x0: 10, x1: 80, y0: 10, y1: 30, line: 0 },
      { text: 'World', x0: 90, x1: 160, y0: 10, y1: 30, line: 0 },
    ];

    const result = parseWithColumns(words, 400);
    expect(result.items.length).toBe(0);
  });
});

// ============================================================
// Integration: parseReceipt (combined)
// ============================================================

describe('parseReceipt', () => {
  it('prefers column-based when words are available', () => {
    const imageWidth = 400;
    const words: WordBox[] = [
      { text: 'Burger', x0: 10, x1: 100, y0: 10, y1: 30, line: 0 },
      { text: '12.50', x0: 300, x1: 380, y0: 10, y1: 30, line: 0 },
      { text: 'Fries', x0: 10, x1: 80, y0: 40, y1: 60, line: 1 },
      { text: '5.00', x0: 310, x1: 380, y0: 40, y1: 60, line: 1 },
    ];

    const raw = 'Burger 12.50\nFries 5.00';

    const result = parseReceipt(raw, words, imageWidth);
    expect(result.items.length).toBe(2);
  });

  it('falls back to line-based when no words provided', () => {
    const raw = `Burger 12.50
Fries 5.00
Total 17.50`;

    const result = parseReceipt(raw, [], 0);

    expect(result.items.length).toBe(2);
    expect(result.total).toBe(1750);
  });

  it('falls back to line-based when column detection fails', () => {
    const raw = `Pasta Carbonara 14.00
Tiramisu 7.50
Total 21.50`;

    // Only 1 word with a number, not enough for column detection
    const words: WordBox[] = [
      { text: 'Pasta', x0: 10, x1: 80, y0: 10, y1: 30, line: 0 },
    ];

    const result = parseReceipt(raw, words, 400);

    expect(result.items.length).toBe(2);
    expect(result.total).toBe(2150);
  });
});
