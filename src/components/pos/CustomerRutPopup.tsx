import { useEffect, useMemo, useRef, useState } from 'react';
import { finalCustomer, mockCustomers } from '../../mocks/customers';
import type { Customer } from '../../types/pos';

type CustomerRutPopupProps = {
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
};

export function CustomerRutPopup({ onClose, onSelectCustomer }: CustomerRutPopupProps) {
  const [query, setQuery] = useState('');
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase().replace(/[.-]/g, '');
    if (value.length < 2) return [];
    return mockCustomers.filter((customer) => {
      const rut = customer.rut?.toLowerCase().replace(/[.-]/g, '') ?? '';
      return customer.name.toLowerCase().includes(value) || rut.includes(value);
    });
  }, [query]);

  const selectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  const search = () => {
    const customer = matches[0];
    if (customer) {
      selectCustomer(customer);
      return;
    }
    if (query.trim()) setNotFound(true);
  };

  const createQuick = () => {
    const value = query.trim();
    if (!value) {
      selectCustomer(finalCustomer);
      return;
    }

    selectCustomer({
      id: `QUICK-${Date.now()}`,
      rut: value,
      name: value,
      creditEnabled: false,
      creditLimit: 0,
      availableCredit: 0,
    });
  };

  return (
    <div className="rut-popover-backdrop" onMouseDown={onClose}>
      <section className="rut-popover" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Ingresar cliente</h2>
        <input
          ref={inputRef}
          value={query}
          placeholder="RUT o nombre"
          onChange={(event) => {
            setQuery(event.target.value);
            setNotFound(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              search();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
        />
        {notFound && <p>Cliente no encontrado</p>}
        <div className="rut-popover-actions">
          <button type="button" onClick={() => selectCustomer(finalCustomer)}>
            Cliente ocasional
          </button>
          {notFound ? (
            <button type="button" onClick={createQuick}>
              Crear rapido
            </button>
          ) : (
            <button type="button" onClick={search}>
              Buscar
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
