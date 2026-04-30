import type { Preventa } from '../types/pos';

export const mockPreventas: Preventa[] = [
  {
    id: 'PV12345',
    vendedor: 'Juan Perez',
    items: [
      {
        id: 'BOSCH-650',
        nombre: 'Taladro Bosch 650W',
        cantidad: 1,
        precio: 50000,
        iva: 19,
        descuento: 10,
      },
      {
        id: 'TORNILLO-8X1',
        nombre: 'Tornillo madera 8x1 caja 100 unidades',
        cantidad: 2,
        precio: 2990,
        iva: 19,
        descuento: 0,
      },
    ],
  },
  {
    id: 'PV67890',
    vendedor: 'Camila Soto',
    items: [
      {
        id: 'MAKITA-GA4530',
        nombre: 'Esmeril Angular Makita 720W',
        cantidad: 1,
        precio: 59990,
        iva: 19,
        descuento: 5,
      },
      {
        id: 'CEMENTO-25KG',
        nombre: 'Cemento Polpaico 25 kg',
        cantidad: 10,
        precio: 4990,
        iva: 19,
        descuento: 3,
      },
    ],
  },
];
