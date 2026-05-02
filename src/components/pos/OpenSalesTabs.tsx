import { formatCurrency } from '../../lib/format';
import type { SaleTab } from '../../types/pos';

type OpenSalesTabsProps = {
  tabs: SaleTab[];
  activeTabId: string | null;
  maxTabs: number;
  onCreateSale: () => void;
  onSelectSale: (tabId: string) => void;
  onCancelSale: (tabId: string) => void;
};

function statusLabel(status: SaleTab['status']) {
  if (status === 'ACTIVE') return 'Activa';
  if (status === 'ON_HOLD') return 'En espera';
  if (status === 'READY_TO_PAY') return 'Lista';
  if (status === 'PAID') return 'Pagada';
  return '';
}

export function OpenSalesTabs({
  tabs,
  activeTabId,
  maxTabs,
  onCreateSale,
  onSelectSale,
  onCancelSale,
}: OpenSalesTabsProps) {
  const openTabs = tabs.filter((tab) => tab.status !== 'PAID' && tab.status !== 'CANCELLED');

  return (
    <section className="sales-tabs-shell">
      <div className="sales-tabs-heading">
        <strong>Ventas abiertas</strong>
        <span>{openTabs.length}/{maxTabs}</span>
      </div>
      <div className="sales-tabs" role="tablist" aria-label="Ventas abiertas">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`sale-tab ${tab.id === activeTabId ? 'sale-tab-active' : ''} sale-tab-${tab.status.toLowerCase()}`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab.id === activeTabId}
              title={`${tab.displayNumber} - ${tab.customer.name || 'Cliente generico'} - ${formatCurrency(tab.total)}`}
              onClick={() => onSelectSale(tab.id)}
            >
              <span className="sale-tab-number">{tab.displayNumber.replace('Venta ', 'V')}</span>
              <strong>{formatCurrency(tab.total)}</strong>
              <em>{tab.id === activeTabId ? statusLabel(tab.status) : 'Retomar'}</em>
              {tab.pendingSync && <span className="sync-dot" title="Pendiente de sincronizacion" />}
            </button>
            <button
              className="sale-tab-close"
              type="button"
              aria-label={`Cerrar ${tab.displayNumber}`}
              onClick={() => onCancelSale(tab.id)}
            >
              x
            </button>
          </div>
        ))}
        <button className="new-sale-tab" type="button" onClick={onCreateSale}>
          + Nueva venta
        </button>
      </div>
    </section>
  );
}
