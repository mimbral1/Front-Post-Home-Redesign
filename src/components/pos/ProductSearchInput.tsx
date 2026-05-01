import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../../lib/format';
import type { Product } from '../../types/pos';

type ProductSearchInputProps = {
  products: Product[];
  disabled?: boolean;
  onProductSelected: (product: Product) => void;
  onPreventaCode: (preventaId: string) => void;
  onMissingProduct: (query: string) => void;
};

export function ProductSearchInput({
  products,
  disabled = false,
  onProductSelected,
  onPreventaCode,
  onMissingProduct,
}: ProductSearchInputProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
    const refocus = () => {
      const active = document.activeElement;
      const isTypingField =
        active instanceof HTMLInputElement &&
        active !== inputRef.current &&
        active.closest('.checkout-panel, .cart-item, .preventa-input, .rut-popover');
      if (!disabled && !isTypingField) inputRef.current?.focus();
    };

    window.addEventListener('focus', refocus);
    window.addEventListener('click', refocus);
    return () => {
      window.removeEventListener('focus', refocus);
      window.removeEventListener('click', refocus);
    };
  }, [disabled]);

  const suggestions = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (value.length < 3) return [];
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(value) ||
          product.sku.toLowerCase().includes(value) ||
          product.barcode.includes(value)
      )
      .slice(0, 5);
  }, [products, query]);

  const selectProduct = (product: Product) => {
    onProductSelected(product);
    setQuery('');
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submit = () => {
    const value = query.trim().toLowerCase();
    if (!value) return;
    if (value.toUpperCase().startsWith('PV')) {
      onPreventaCode(query.trim().toUpperCase());
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    const product = products.find(
      (entry) =>
        entry.barcode.toLowerCase() === value ||
        entry.sku.toLowerCase() === value ||
        entry.name.toLowerCase() === value
    );

    if (product) {
      selectProduct(product);
      return;
    }

    onMissingProduct(query);
  };

  return (
    <div className="product-search">
      <label>
        <span>Buscar producto</span>
        <input
          ref={inputRef}
          disabled={disabled}
          data-product-search="true"
          value={query}
          placeholder="Escanear producto, SKU o preventa"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
      </label>

      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map((product) => (
            <button key={product.id} type="button" onClick={() => selectProduct(product)}>
              <span>{product.name}</span>
              <small>{product.sku} - Stock {product.stock}</small>
              <strong>{formatCurrency(product.price)}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
