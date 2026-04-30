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
  return (
    <section className="sales-tabs-shell">
      <div className="sales-tabs-heading">
        <strong>Ventas abiertas</strong>
        <span>{tabs.length}/{maxTabs}</span>
      </div>
      <div className="sales-tabs" role="tablist" aria-label="Ventas abiertas">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`sale-tab ${tab.id === activeTabId ? 'sale-tab-active' : ''} sale-tab-${tab.status.toLowerCase()}`}
          >
            <button type="button" role="tab" onClick={() => onSelectSale(tab.id)}>
              <span>{tab.displayNumber}</span>
              <small>{tab.customer.name || 'Cliente generico'}</small>
              <strong>{formatCurrency(tab.total)}</strong>
              {tab.pendingSync && <em>Pendiente sync</em>}
              {statusLabel(tab.status) && <em>{statusLabel(tab.status)}</em>}
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
