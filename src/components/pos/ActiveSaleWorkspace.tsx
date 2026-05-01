import { mockProducts } from '../../mocks/products';
import type { Product, SaleItem, SaleTab } from '../../types/pos';
import { CartPanel } from './CartPanel';
import { CheckoutPanel } from './CheckoutPanel';
import { LastScannedProduct } from './LastScannedProduct';
import { ProductSearchInput } from './ProductSearchInput';

type ActiveSaleWorkspaceProps = {
  sale: SaleTab;
  canPay: boolean;
  message: string | null;
  selectedItemId: string | null;
  canEditPrice: boolean;
  canRemoveItem: boolean;
  canCancelSale: boolean;
  paymentBusy: boolean;
  paymentShortcutToken: number;
  lastScannedItem: SaleItem | null;
  scanPulseToken: number;
  recentItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onAddProduct: (product: Product) => void;
  onLoadPreventa: (preventaId: string) => void;
  onMissingProduct: (query: string) => void;
  onOpenCustomerPopup: () => void;
  onHoldSale: () => void;
  onCancelSale: () => void;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onPriceChange: (itemId: string, price: number) => void;
  onRemove: (item: SaleItem) => void;
  onPaymentChange: (payment: Partial<SaleTab['payment']>) => void;
  onConfirmPayment: () => void;
};

export function ActiveSaleWorkspace({
  sale,
  canPay,
  message,
  selectedItemId,
  canEditPrice,
  canRemoveItem,
  canCancelSale,
  paymentBusy,
  paymentShortcutToken,
  lastScannedItem,
  scanPulseToken,
  recentItemId,
  onSelectItem,
  onAddProduct,
  onLoadPreventa,
  onMissingProduct,
  onOpenCustomerPopup,
  onHoldSale,
  onCancelSale,
  onIncrease,
  onDecrease,
  onQuantityChange,
  onPriceChange,
  onRemove,
  onPaymentChange,
  onConfirmPayment,
}: ActiveSaleWorkspaceProps) {
  return (
    <section className="sale-workspace">
      <header className="sale-header">
        <div>
          <p className="eyebrow">Venta activa</p>
          <h1>{sale.displayNumber}</h1>
        </div>
        <div className="sale-header-actions">
          <button className="ghost-button" type="button" onClick={onHoldSale}>
            Poner en espera
          </button>
          <button
            className="ghost-button danger-ghost"
            type="button"
            disabled={!canCancelSale}
            title={canCancelSale ? 'Cancelar venta' : 'Requiere supervisor'}
            onClick={onCancelSale}
          >
            Cancelar
          </button>
        </div>
      </header>

      <section className="sale-search-row">
        <ProductSearchInput
          products={mockProducts}
          onProductSelected={onAddProduct}
          onPreventaCode={onLoadPreventa}
          onMissingProduct={onMissingProduct}
        />
      </section>

      <div className="execution-grid">
        <section className="left-execution">
          <LastScannedProduct item={lastScannedItem} pulseKey={scanPulseToken} />
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
        </section>

        <CheckoutPanel
          sale={sale}
          canPay={canPay}
          message={message}
          paymentBusy={paymentBusy}
          paymentShortcutToken={paymentShortcutToken}
          onOpenCustomerPopup={onOpenCustomerPopup}
          onPaymentChange={onPaymentChange}
          onConfirmPayment={onConfirmPayment}
        />
      </div>
    </section>
  );
}
