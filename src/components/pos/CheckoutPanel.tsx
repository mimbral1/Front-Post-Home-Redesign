import { useEffect } from 'react';
import { formatCurrency } from '../../lib/format';
import type { PaymentMethod, PaymentState, SaleItem, SaleTab } from '../../types/pos';
import { CartPanel } from './CartPanel';

type CheckoutPanelProps = {
  sale: SaleTab;
  canPay: boolean;
  message: string | null;
  selectedItemId: string | null;
  recentItemId: string | null;
  canEditPrice: boolean;
  canRemoveItem: boolean;
  paymentBusy: boolean;
  paymentShortcutToken: number;
  onSelectItem: (itemId: string) => void;
  onOpenCustomerPopup: () => void;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onPriceChange: (itemId: string, price: number) => void;
  onRemove: (item: SaleItem) => void;
  onPaymentChange: (payment: Partial<SaleTab['payment']>) => void;
  onConfirmPayment: (payment?: Partial<PaymentState>) => void;
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
  selectedItemId,
  recentItemId,
  canEditPrice,
  canRemoveItem,
  paymentBusy,
  paymentShortcutToken,
  onSelectItem,
  onOpenCustomerPopup,
  onIncrease,
  onDecrease,
  onQuantityChange,
  onPriceChange,
  onRemove,
  onPaymentChange,
  onConfirmPayment,
}: CheckoutPanelProps) {
  const productCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const hasProducts = productCount > 0;
  const subtotalBeforeDiscounts = sale.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discountTotal = subtotalBeforeDiscounts - sale.total;
  const change = Math.max(0, sale.payment.cashReceived - sale.total);

  const selectMethod = (method: PaymentMethod) => {
    onPaymentChange({
      method,
      cashReceived: method === 'CASH' ? sale.total : sale.payment.cashReceived,
      terminalStatus: method === 'DEBIT_CARD' || method === 'CREDIT_CARD' ? 'APPROVED' : 'IDLE',
    });
  };

  const buildPaymentIntent = (): Partial<PaymentState> => {
    const method = sale.payment.method ?? 'CASH';

    if (method === 'CASH') {
      return {
        method,
        cashReceived: sale.payment.cashReceived || sale.total,
        terminalStatus: 'IDLE',
      };
    }

    if (method === 'DEBIT_CARD' || method === 'CREDIT_CARD') {
      return {
        method,
        terminalStatus: sale.payment.terminalStatus === 'REJECTED' ? 'REJECTED' : 'APPROVED',
      };
    }

    return { method };
  };

  useEffect(() => {
    if (hasProducts && !sale.payment.method) {
      selectMethod('CASH');
    }
  }, [hasProducts, sale.id, sale.payment.method]);

  useEffect(() => {
    if (paymentShortcutToken > 0 && canPay) {
      onConfirmPayment(buildPaymentIntent());
    }
  }, [canPay, paymentShortcutToken]);

  return (
    <aside className="checkout-panel">
      <button className="customer-rut-button" type="button" onClick={onOpenCustomerPopup}>
        <span>Cliente / RUT</span>
        <strong>{sale.customer.id ? sale.customer.name : 'Cliente ocasional'}</strong>
        <small>Cambiar con F4</small>
      </button>

      <CartPanel
        items={sale.items}
        selectedItemId={selectedItemId}
        recentItemId={recentItemId}
        canEditPrice={canEditPrice}
        canRemoveItem={canRemoveItem}
        onSelect={onSelectItem}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        onQuantityChange={onQuantityChange}
        onPriceChange={onPriceChange}
        onRemove={onRemove}
      />

      <div className="checkout-footer">
        <section className="checkout-totals">
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotalBeforeDiscounts)}</strong>
          </div>
          <div>
            <span>Descuentos</span>
            <strong>{discountTotal > 0 ? `-${formatCurrency(discountTotal)}` : formatCurrency(0)}</strong>
          </div>
          <div className="checkout-total-row">
            <span>TOTAL</span>
            <strong>{formatCurrency(sale.total)}</strong>
          </div>
          <small>{productCount} productos</small>
        </section>

        <section className="quick-pay">
          <div className="quick-pay-heading">
            <span>Forma de pago</span>
            {hasProducts && <strong>{formatCurrency(sale.total)}</strong>}
          </div>

          {!hasProducts && <p className="checkout-empty-hint">Escanea productos para comenzar</p>}

          <div className="payment-methods-inline">
            {fastMethods.map((method) => (
              <button
                key={method.id}
                className={sale.payment.method === method.id ? 'selected-method' : ''}
                type="button"
                disabled={!hasProducts || paymentBusy}
                onClick={() => selectMethod(method.id)}
              >
                {method.label}
              </button>
            ))}
          </div>

          {hasProducts && sale.payment.method === 'CASH' && (
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
                    onConfirmPayment(buildPaymentIntent());
                  }
                }}
              />
              <small>Vuelto: {formatCurrency(change)}</small>
            </label>
          )}

          {hasProducts && sale.payment.method === 'BANK_TRANSFER' && (
            <label className="field transfer-field">
              <span>Codigo de operacion</span>
              <input
                value={sale.payment.transferCode}
                placeholder="Ej: TRX-4582"
                onChange={(event) => onPaymentChange({ transferCode: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && sale.payment.transferCode.trim()) {
                    event.preventDefault();
                    onConfirmPayment(buildPaymentIntent());
                  }
                }}
              />
            </label>
          )}

          {hasProducts && (sale.payment.method === 'DEBIT_CARD' || sale.payment.method === 'CREDIT_CARD') && (
            <div className="terminal-status">
              <strong>{terminalText(sale.payment.terminalStatus)}</strong>
              <span>Listo para generar la venta.</span>
            </div>
          )}

          <button
            className="primary-button pay-button"
            type="button"
            disabled={paymentBusy || !canPay}
            onClick={() => onConfirmPayment(buildPaymentIntent())}
          >
            {paymentBusy ? 'Procesando...' : hasProducts ? 'PAGAR Y GENERAR VENTA' : 'AGREGA PRODUCTOS PARA PAGAR'}
          </button>
        </section>
      </div>

      {message && <div className="compact-message">{message}</div>}
    </aside>
  );
}
