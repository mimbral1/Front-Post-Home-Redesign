import { formatCurrency } from '../../lib/format';
import type { SaleItem } from '../../types/pos';

type LastScannedProductProps = {
  item: SaleItem | null;
  pulseKey: number;
};

export function LastScannedProduct({ item, pulseKey }: LastScannedProductProps) {
  if (!item) {
    return (
      <section className="last-scan-card last-scan-empty">
        <strong>LISTO PARA ESCANEAR</strong>
      </section>
    );
  }

  return (
    <section key={pulseKey} className="last-scan-card last-scan-live">
      <strong>{item.name}</strong>
      <b>{formatCurrency(item.unitPrice)}</b>
      <small>SKU: {item.sku} - Cantidad {item.quantity} - Subtotal {formatCurrency(item.total)}</small>
    </section>
  );
}
