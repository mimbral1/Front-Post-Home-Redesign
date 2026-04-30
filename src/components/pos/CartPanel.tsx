import { formatCurrency } from '../../lib/format';
import type { SaleItem } from '../../types/pos';

type CartPanelProps = {
  items: SaleItem[];
  selectedItemId: string | null;
  canEditPrice: boolean;
  canRemoveItem: boolean;
  onSelect: (itemId: string) => void;
  onIncrease: (itemId: string) => void;
  onDecrease: (itemId: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onPriceChange: (itemId: string, price: number) => void;
  onRemove: (item: SaleItem) => void;
};

export function CartPanel({
  items,
  selectedItemId,
  canEditPrice,
  canRemoveItem,
  onSelect,
  onIncrease,
  onDecrease,
  onQuantityChange,
  onPriceChange,
  onRemove,
}: CartPanelProps) {
  if (items.length === 0) {
    return (
      <section className="cart-panel empty-cart">
        <h2>Productos</h2>
        <p>Escanea o escribe un producto. Enter agrega al carrito.</p>
      </section>
    );
  }

  return (
    <section className="cart-panel">
      <h2>Productos</h2>
      <div className="cart-list">
        {items.map((item) => (
          <article
            key={item.id}
            className={`cart-item ${selectedItemId === item.id ? 'cart-item-selected' : ''}`}
            tabIndex={0}
            onClick={() => onSelect(item.id)}
            onFocus={() => onSelect(item.id)}
          >
            <div className="cart-copy">
              <div className="item-title-row">
                <strong>{item.name}</strong>
                <span className={`source-badge source-${item.source.toLowerCase()}`}>
                  {item.source === 'PREVENTA' ? 'PREVENTA' : 'AUTO'}
                </span>
              </div>
              <span>SKU: {item.sku}</span>
              {item.source === 'PREVENTA' && <span>Vendedor: {item.sellerName}</span>}
              <p>
                IVA {item.iva}% - Desc. {item.discountPercent}% - Subtotal: {formatCurrency(item.total)}
              </p>
            </div>
            <div className="price-editor">
              <label>
                Precio
                <input
                  value={item.unitPrice}
                  inputMode="numeric"
                  disabled={!canEditPrice || item.source === 'PREVENTA'}
                  title={
                    item.source === 'PREVENTA'
                      ? 'Precio de preventa bloqueado'
                      : canEditPrice
                        ? 'Editar precio'
                        : 'Requiere supervisor'
                  }
                  onChange={(event) => onPriceChange(item.id, Number(event.target.value))}
                />
              </label>
            </div>
            <div className="quantity-controls">
              <button type="button" aria-label="Disminuir" onClick={() => onDecrease(item.id)}>
                -
              </button>
              <input
                value={item.quantity}
                inputMode="numeric"
                aria-label="Cantidad"
                onChange={(event) => onQuantityChange(item.id, Number(event.target.value))}
              />
              <button type="button" aria-label="Aumentar" onClick={() => onIncrease(item.id)}>
                +
              </button>
              <button
                className="remove-icon"
                type="button"
                aria-label="Eliminar"
                disabled={!canRemoveItem}
                title={canRemoveItem ? 'Eliminar' : 'Requiere supervisor'}
                onClick={() => onRemove(item)}
              >
                x
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
