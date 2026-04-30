import { mockCustomers } from '../mocks/customers';
import { mockPreventas } from '../mocks/preventas';
import { mockProducts } from '../mocks/products';
import type { Customer, PaymentMethod, Preventa, Product } from '../types/pos';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function mockSearchProducts(query: string): Promise<Product[]> {
  await wait(40);
  const value = query.trim().toLowerCase();
  if (!value) return [];
  return mockProducts.filter(
    (product) =>
      product.barcode.toLowerCase().includes(value) ||
      product.sku.toLowerCase().includes(value) ||
      product.name.toLowerCase().includes(value)
  );
}

export async function mockSearchCustomers(query: string): Promise<Customer[]> {
  await wait(40);
  const value = query.trim().toLowerCase();
  if (!value) return [];
  return mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(value) ||
      customer.rut?.toLowerCase().includes(value)
  );
}

export async function mockProcessPayment(
  method: PaymentMethod,
  isOffline: boolean
): Promise<{ ok: boolean; message: string }> {
  await wait(method === 'CASH' ? 120 : 500);

  if (isOffline && method !== 'CASH') {
    return { ok: false, message: 'Sin conexion con terminal.' };
  }

  return { ok: true, message: isOffline ? 'Venta pagada. Queda pendiente de sincronizacion.' : 'Pago aprobado.' };
}

export async function mockFindPreventa(id: string): Promise<Preventa | null> {
  await wait(60);
  const value = id.trim().toUpperCase();
  return mockPreventas.find((preventa) => preventa.id.toUpperCase() === value) ?? null;
}
