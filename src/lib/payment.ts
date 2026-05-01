import type { PaymentMethod, SaleTab } from '../types/pos';

export function isCardPayment(method: PaymentMethod | null) {
  return method === 'DEBIT_CARD' || method === 'CREDIT_CARD';
}

export function paymentLabel(method: PaymentMethod | null) {
  if (method === 'CASH') return 'Efectivo';
  if (method === 'DEBIT_CARD') return 'Debito';
  if (method === 'CREDIT_CARD') return 'Credito';
  if (method === 'BANK_TRANSFER') return 'Transferencia';
  if (method === 'OTHER') return 'Otro';
  return 'Sin medio';
}

export function validateSalePayment(sale: SaleTab | null) {
  if (!sale) return 'No hay venta activa.';
  if (!sale.payment.method) return 'Selecciona un medio de pago.';
  if (sale.payment.method === 'CASH' && sale.payment.cashReceived < sale.total) {
    return 'El monto recibido es menor al total.';
  }
  if (isCardPayment(sale.payment.method) && sale.payment.terminalStatus !== 'APPROVED') {
    return 'El pago con tarjeta aun no esta aprobado.';
  }
  if (sale.payment.method === 'BANK_TRANSFER' && !sale.payment.transferCode.trim()) {
    return 'Ingresa el codigo de operacion.';
  }
  return null;
}
