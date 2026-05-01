import { useEffect, useState } from 'react';
import { formatCurrency } from '../../lib/format';
import type { PaymentMethod, SaleTab } from '../../types/pos';

type CheckoutPanelProps = {
  sale: SaleTab;
  canPay: boolean;
  message: string | null;
  paymentBusy: boolean;
  paymentShortcutToken: number;
  onOpenCustomerPopup: () => void;
  onPaymentChange: (payment: Partial<SaleTab['payment']>) => void;
  onConfirmPayment: () => void;
};

const fastMethods: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'CASH', label: 'EFECTIVO' },
  { id: 'DEBIT_CARD', label: 'DEBITO' },
  { id: 'CREDIT_CARD', label: 'CREDITO' },
];

function terminalText(status: SaleTab['payment']['terminalStatus']) {
  if (status === 'CONNECTING') return 'Conectando terminal';
  if (status === 'WAITING') return 'Esperando pago en terminal...';
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
  paymentShortcutToken,
  onOpenCustomerPopup,
  onPaymentChange,
  onConfirmPayment,
}: CheckoutPanelProps) {
  const [payOpen, setPayOpen] = useState(false);
  const productCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const hasProducts = productCount > 0;
  const change = Math.max(0, sale.payment.cashReceived - sale.total);

  useEffect(() => {
    setPayOpen(false);
  }, [sale.id]);

  useEffect(() => {
    if (paymentShortcutToken > 0 && canPay) {
      setPayOpen(true);
    }
  }, [canPay, paymentShortcutToken]);

  useEffect(() => {
    if (!payOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPayOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [payOpen]);

  const selectMethod = (method: PaymentMethod) => {
    setPayOpen(true);
    onPaymentChange({
      method,
      terminalStatus: method === 'DEBIT_CARD' || method === 'CREDIT_CARD' ? 'WAITING' : 'IDLE',
    });
  };

  return (
    <aside className="checkout-panel">
      <button className="customer-rut-button" type="button" onClick={onOpenCustomerPopup}>
        <span>Cliente / RUT</span>
        <strong>{sale.customer.id ? sale.customer.name : 'Cliente ocasional'}</strong>
        <small>Cambiar con F4</small>
      </button>

      <section className="total-card">
        <span>Total a pagar</span>
        <strong>{formatCurrency(sale.total)}</strong>
        <small>{productCount} productos</small>
      </section>

      <section className={`quick-pay ${payOpen ? 'quick-pay-open' : ''}`}>
        {!hasProducts && <p className="checkout-empty-hint">Escanea productos para comenzar</p>}

        {hasProducts && !payOpen && (
          <button
            className="primary-button pay-button"
            type="button"
            disabled={!canPay || paymentBusy}
            onClick={() => setPayOpen(true)}
          >
            PAGAR
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
              <label className="field cash-field">
                <span>Monto recibido</span>
                <input
                  type="number"
                  min={0}
                  value={sale.payment.cashReceived || ''}
                  onChange={(event) => onPaymentChange({ cashReceived: Number(event.target.value) })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && sale.payment.cashReceived >= sale.total) {
                      event.preventDefault();
                      onConfirmPayment();
                    }
                  }}
                />
                <small>Vuelto: {formatCurrency(change)}</small>
              </label>
            )}

            {sale.payment.method === 'BANK_TRANSFER' && (
              <label className="field transfer-field">
                <span>Codigo de operacion</span>
                <input
                  value={sale.payment.transferCode}
                  placeholder="Ej: TRX-4582"
                  onChange={(event) => onPaymentChange({ transferCode: event.target.value })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && sale.payment.transferCode.trim()) {
                      event.preventDefault();
                      onConfirmPayment();
                    }
                  }}
                />
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
                  Cancelar
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
