import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../../lib/format';
import { finalCustomer, mockCustomers } from '../../mocks/customers';
import type { Customer, PaymentMethod, SaleTab } from '../../types/pos';

type CheckoutPanelProps = {
  sale: SaleTab;
  canPay: boolean;
  message: string | null;
  paymentBusy: boolean;
  onCustomerChange: (customer: Customer) => void;
  onPaymentChange: (payment: Partial<SaleTab['payment']>) => void;
  onConfirmPayment: () => void;
};

const fastMethods: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'CASH', label: 'Efectivo' },
  { id: 'DEBIT_CARD', label: 'Debito' },
  { id: 'CREDIT_CARD', label: 'Credito' },
];

function terminalText(status: SaleTab['payment']['terminalStatus']) {
  if (status === 'CONNECTING') return 'Conectando terminal';
  if (status === 'WAITING') return 'Esperando pago...';
  if (status === 'APPROVED') return 'Pago aprobado';
  if (status === 'REJECTED') return 'Pago rechazado';
  if (status === 'CONNECTION_ERROR') return 'Error de conexion';
  if (status === 'CANCELLED') return 'Pago cancelado';
  return 'Terminal lista';
}

export function CheckoutPanel({
  sale,
  canPay,
  message,
  paymentBusy,
  onCustomerChange,
  onPaymentChange,
  onConfirmPayment,
}: CheckoutPanelProps) {
  const [customerQuery, setCustomerQuery] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const productCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const change = Math.max(0, sale.payment.cashReceived - sale.total);

  useEffect(() => {
    setPayOpen(false);
  }, [sale.id]);

  const customerMatches = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    return mockCustomers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.rut?.toLowerCase().includes(query)
      )
      .slice(0, 3);
  }, [customerQuery]);

  const selectMethod = (method: PaymentMethod) => {
    setPayOpen(true);
    onPaymentChange({
      method,
      terminalStatus: method === 'DEBIT_CARD' || method === 'CREDIT_CARD' ? 'WAITING' : 'IDLE',
    });
  };

  return (
    <aside className="checkout-panel">
      <section className="total-card">
        <span>Total</span>
        <strong>{formatCurrency(sale.total)}</strong>
        <small>{productCount} productos</small>
      </section>

      <section className="inline-customer">
        <div>
          <strong>Cliente</strong>
          <span>{sale.customer.name}</span>
        </div>
        <input
          data-customer-search="true"
          value={customerQuery}
          placeholder="RUT o nombre"
          onChange={(event) => setCustomerQuery(event.target.value)}
        />
        {customerMatches.length > 0 && (
          <div className="inline-results">
            {customerMatches.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  onCustomerChange(customer);
                  setCustomerQuery('');
                }}
              >
                {customer.name}
                <span>{customer.rut}</span>
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => onCustomerChange(finalCustomer)}>
          Cliente ocasional
        </button>
      </section>

      <section className="quick-pay">
        {!payOpen && (
          <button
            className="primary-button pay-button"
            type="button"
            disabled={!canPay || paymentBusy}
            onClick={() => setPayOpen(true)}
          >
            {canPay ? 'PAGAR' : 'Agrega productos'}
          </button>
        )}

        {payOpen && (
          <>
            <div className="payment-methods-inline">
              {fastMethods.map((method) => (
                <button
                  key={method.id}
                  className={sale.payment.method === method.id ? 'selected-method' : ''}
                  type="button"
                  onClick={() => selectMethod(method.id)}
                >
                  {method.label}
                </button>
              ))}
            </div>

            {sale.payment.method === 'CASH' && (
              <label className="field">
                <span>Monto recibido</span>
                <input
                  type="number"
                  min={0}
                  value={sale.payment.cashReceived || ''}
                  onChange={(event) => onPaymentChange({ cashReceived: Number(event.target.value) })}
                />
                <small>Vuelto: {formatCurrency(change)}</small>
              </label>
            )}

            {(sale.payment.method === 'DEBIT_CARD' || sale.payment.method === 'CREDIT_CARD') && (
              <div className="terminal-status">
                <strong>{terminalText(sale.payment.terminalStatus)}</strong>
                <button type="button" disabled={paymentBusy} onClick={() => onPaymentChange({ terminalStatus: 'APPROVED' })}>
                  Simular aprobado
                </button>
                <button type="button" disabled={paymentBusy} onClick={() => onPaymentChange({ terminalStatus: 'REJECTED' })}>
                  Simular rechazado
                </button>
                <button type="button" disabled={paymentBusy} onClick={() => onPaymentChange({ terminalStatus: 'CANCELLED' })}>
                  Cancelar pago
                </button>
              </div>
            )}

            <button className="primary-button pay-button" type="button" disabled={paymentBusy} onClick={onConfirmPayment}>
              {paymentBusy ? 'Procesando...' : 'Confirmar pago'}
            </button>
          </>
        )}
      </section>

      {message && <div className="compact-message">{message}</div>}
    </aside>
  );
}
