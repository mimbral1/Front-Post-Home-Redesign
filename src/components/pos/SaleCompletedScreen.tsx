import { formatCurrency } from '../../lib/format';
import { paymentLabel } from '../../lib/payment';
import type { SaleTab } from '../../types/pos';

type SaleCompletedScreenProps = {
  sale: SaleTab;
  onNewSale: () => void;
};

export function SaleCompletedScreen({ sale, onNewSale }: SaleCompletedScreenProps) {
  return (
    <section className="completed-screen">
      <div className="success-check" aria-hidden="true">
        ✓
      </div>
      <p className="eyebrow">Pago aprobado</p>
      <h2>{sale.completedSaleNumber ?? 'Venta pagada'}</h2>
      <p>Total pagado: {formatCurrency(sale.total)}</p>
      <p>Medio de pago: {paymentLabel(sale.payment.method)}</p>
      <div className="completed-actions">
        <button className="primary-button" type="button" onClick={onNewSale}>
          Nueva venta
        </button>
        <button className="ghost-button" type="button">
          Imprimir comprobante
        </button>
      </div>
    </section>
  );
}
