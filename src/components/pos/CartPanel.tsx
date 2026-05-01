import { formatCurrency } from '../../lib/format';
import type { SaleItem } from '../../types/pos';

type CartPanelProps = {
  items: SaleItem[];
  selectedItemId: string | null;
  recentItemId: string | null;
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
  recentItemId,
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
    <section className="cart-panel ticket-panel">
      <div className="ticket-heading">
        <h2>Ticket</h2>
        <span>{items.length} lineas</span>
      </div>
      <div className="cart-list">
        {items.map((item) => (
          <article
            key={item.id}
            className={`cart-item ticket-item ${selectedItemId === item.id ? 'cart-item-selected' : ''} ${
              recentItemId === item.id ? 'cart-item-recent' : ''
            }`}
            tabIndex={0}
            onClick={() => onSelect(item.id)}
            onFocus={() => onSelect(item.id)}
          >
            <strong className="ticket-qty">{item.quantity}x</strong>
            <div className="cart-copy">
              <div className="item-title-row">
                <strong>{item.name}</strong>
                <span className={`source-badge source-${item.source.toLowerCase()}`}>
                  {item.source === 'PREVENTA' ? 'PREVENTA' : 'AUTO'}
                </span>
              </div>
              <span>
                SKU: {item.sku}
                {item.source === 'PREVENTA' && item.sellerName ? ` - ${item.sellerName}` : ''}
              </span>
              {(item.discountPercent > 0 || item.iva > 0) && (
                <p>IVA {item.iva}% - Desc. {item.discountPercent}%</p>
              )}
            </div>
            <strong className="ticket-subtotal">{formatCurrency(item.total)}</strong>
            <div className="ticket-controls">
              <button type="button" aria-label="Disminuir" onClick={() => onDecrease(item.id)}>
                -
              </button>
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
            {canEditPrice && item.source !== 'PREVENTA' && (
              <div className="price-editor ticket-price-editor">
                <label>
                  Precio
                  <input
                    value={item.unitPrice}
                    inputMode="numeric"
                    title="Editar precio"
                    onChange={(event) => onPriceChange(item.id, Number(event.target.value))}
                  />
                </label>
              </div>
            )}
            <div className="quantity-controls ticket-quantity-fallback">
              <input
                value={item.quantity}
                inputMode="numeric"
                aria-label="Cantidad"
                onChange={(event) => onQuantityChange(item.id, Number(event.target.value))}
              />
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
