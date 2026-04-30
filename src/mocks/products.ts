import type { Product } from '../types/pos';

export const mockProducts: Product[] = [
  {
    id: 'P001',
    sku: 'BOSCH-650',
    barcode: '780000000001',
    name: 'Taladro Bosch 650W',
    price: 49990,
    stock: 12,
  },
  {
    id: 'P002',
    sku: 'MAKITA-GA4530',
    barcode: '780000000002',
    name: 'Esmeril Angular Makita 720W',
    price: 59990,
    stock: 8,
  },
  {
    id: 'P003',
    sku: 'CEMENTO-25KG',
    barcode: '780000000003',
    name: 'Cemento Polpaico 25 kg',
    price: 4990,
    stock: 120,
  },
  {
    id: 'P004',
    sku: 'TORNILLO-8X1',
    barcode: '780000000004',
    name: 'Tornillo madera 8x1 caja 100 unidades',
    price: 2990,
    stock: 50,
  },
];
