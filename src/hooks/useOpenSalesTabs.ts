import { useEffect, useMemo, useState } from 'react';
import { finalCustomer } from '../mocks/customers';
import { mockProducts } from '../mocks/products';
import type { Customer, PaymentState, Preventa, Product, SaleItem, SaleTab } from '../types/pos';

const STORAGE_KEY = 'pos.openSalesTabs';
const ACTIVE_TAB_KEY = 'pos.activeSaleTabId';
const MAX_TABS = 5;

const emptyPayment = (): PaymentState => ({
  method: null,
  cashReceived: 0,
  transferCode: '',
  transferBank: '',
  terminalStatus: 'IDLE',
});

function createSaleNumber(index: number) {
  return `Venta ${String(index).padStart(3, '0')}`;
}

function calculateTotals(items: SaleTab['items']) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  return {
    subtotal,
    discounts: 0,
    total: subtotal,
  };
}

function calculateLineTotal(quantity: number, unitPrice: number, discountPercent: number) {
  return Math.round(quantity * unitPrice * (1 - discountPercent / 100));
}

function normalizeTab(tab: SaleTab): SaleTab {
  const totals = calculateTotals(tab.items);
  return {
    ...tab,
    ...totals,
    updatedAt: new Date().toISOString(),
  };
}

function loadTabs(): SaleTab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SaleTab[];
    return parsed
      .filter((tab) => tab.status !== 'PAID' && tab.status !== 'CANCELLED')
      .map((tab) =>
        normalizeTab({
          ...tab,
          pendingSync: Boolean(tab.pendingSync),
          items: tab.items.map((item) => ({
            ...item,
            source: item.source ?? 'AUTO',
            iva: item.iva ?? 19,
            discountPercent: item.discountPercent ?? 0,
            total: calculateLineTotal(item.quantity, item.unitPrice, item.discountPercent ?? 0),
          })),
        })
      );
  } catch {
    return [];
  }
}

export function useOpenSalesTabs(isOffline = false) {
  const [tabs, setTabs] = useState<SaleTab[]>(loadTabs);
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    const restored = loadTabs();
    const savedActive = localStorage.getItem(ACTIVE_TAB_KEY);
    return savedActive ?? restored.find((tab) => tab.status === 'ACTIVE')?.id ?? restored[0]?.id ?? null;
  });
  const [saleCounter, setSaleCounter] = useState(() => loadTabs().length + 1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    if (activeTabId) {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
      return;
    }
    localStorage.removeItem(ACTIVE_TAB_KEY);
  }, [activeTabId]);

  const activeSale = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? null,
    [activeTabId, tabs]
  );

  const updateSale = (tabId: string, updater: (sale: SaleTab) => SaleTab) => {
    setTabs((current) =>
      current.map((tab) =>
        tab.id === tabId ? normalizeTab({ ...updater(tab), pendingSync: tab.pendingSync || isOffline }) : tab
      )
    );
  };

  const createSale = () => {
    if (tabs.length >= MAX_TABS) {
      return { ok: false, message: 'Ya tienes 5 ventas abiertas. Cierra o cobra una venta antes de abrir otra.' };
    }

    const now = new Date().toISOString();
    const sale: SaleTab = {
      id: `sale-${Date.now()}`,
      displayNumber: createSaleNumber(saleCounter),
      customer: finalCustomer,
      items: [],
      subtotal: 0,
      discounts: 0,
      total: 0,
      status: 'ACTIVE',
      payment: emptyPayment(),
      createdAt: now,
      updatedAt: now,
      pendingSync: isOffline,
    };

    setTabs((current) =>
      current
        .map((tab) =>
          tab.status === 'ACTIVE'
            ? { ...tab, status: 'ON_HOLD' as const, pendingSync: tab.pendingSync || isOffline }
            : tab
        )
        .concat(sale)
    );
    setActiveTabId(sale.id);
    setSaleCounter((value) => value + 1);
    return { ok: true, message: `${sale.displayNumber} creada.` };
  };

  const selectSale = (tabId: string) => {
    setTabs((current) =>
      current.map((tab) => {
        if (tab.id === tabId) return { ...tab, status: 'ACTIVE' };
        if (tab.status === 'ACTIVE') {
          return { ...tab, status: tab.items.length > 0 ? 'READY_TO_PAY' as const : 'ON_HOLD' as const };
        }
        return tab;
      })
    );
    setActiveTabId(tabId);
  };

  const putSaleOnHold = (tabId: string) => {
    updateSale(tabId, (sale) => ({ ...sale, status: 'ON_HOLD' }));
    setActiveTabId(null);
  };

  const updateSaleCustomer = (tabId: string, customer: Customer) => {
    updateSale(tabId, (sale) => ({ ...sale, customer }));
  };

  const addItemToSale = (tabId: string, product: Product) => {
    const sale = tabs.find((tab) => tab.id === tabId);
    const existing = sale?.items.find((item) => item.productId === product.id);
    if (existing && existing.quantity >= product.stock) {
      return { ok: false, message: `No hay stock suficiente. Stock disponible: ${product.stock} unidades.` };
    }

    const itemId = existing?.id ?? `${product.id}-${Date.now()}`;

    updateSale(tabId, (current) => {
      const found = current.items.find((item) => item.productId === product.id);
      const items = found
        ? current.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
              : item
          )
        : current.items.concat({
            id: itemId,
            productId: product.id,
            sku: product.sku,
            name: product.name,
            quantity: 1,
            unitPrice: product.price,
            stock: product.stock,
            source: 'AUTO',
            iva: 19,
            discountPercent: 0,
            total: product.price,
          });

      return { ...current, items, status: 'ACTIVE' };
    });

    return { ok: true, message: `${product.name} agregado.`, itemId };
  };

  const removeItemFromSale = (tabId: string, itemId: string) => {
    updateSale(tabId, (sale) => ({ ...sale, items: sale.items.filter((item) => item.id !== itemId) }));
  };

  const updateItemQuantity = (tabId: string, itemId: string, quantity: number) => {
    const sale = tabs.find((tab) => tab.id === tabId);
    const item = sale?.items.find((entry) => entry.id === itemId);
    if (!item) return { ok: false, message: 'No se pudo actualizar el producto.' };
    if (quantity > item.stock) {
      return { ok: false, message: `No hay stock suficiente. Stock disponible: ${item.stock} unidades.` };
    }
    if (quantity <= 0) {
      removeItemFromSale(tabId, itemId);
      return { ok: true, message: 'Producto eliminado.' };
    }

    updateSale(tabId, (current) => ({
      ...current,
      items: current.items.map((entry) =>
        entry.id === itemId
          ? { ...entry, quantity, total: calculateLineTotal(quantity, entry.unitPrice, entry.discountPercent) }
          : entry
      ),
    }));
    return { ok: true, message: 'Cantidad actualizada.' };
  };

  const updateItemPrice = (tabId: string, itemId: string, unitPrice: number) => {
    if (unitPrice < 0 || Number.isNaN(unitPrice)) {
      return { ok: false, message: 'Precio invalido.' };
    }

    updateSale(tabId, (current) => ({
      ...current,
      items: current.items.map((entry) =>
        entry.id === itemId
          ? { ...entry, unitPrice, total: calculateLineTotal(entry.quantity, unitPrice, entry.discountPercent) }
          : entry
      ),
    }));
    return { ok: true, message: 'Precio actualizado.' };
  };

  const addPreventaToSale = (tabId: string, preventa: Preventa) => {
    const sale = tabs.find((tab) => tab.id === tabId);
    if (!sale) return { ok: false, message: 'No hay venta activa.' };

    const alreadyLoaded = sale.items.some((item) => item.preventaId === preventa.id);
    if (alreadyLoaded) return { ok: false, message: 'Esta preventa ya fue cargada.' };

    const preventaItems: SaleItem[] = preventa.items.map((item) => {
      const product = mockProducts.find((entry) => entry.sku === item.id || entry.id === item.id);
      return {
        id: `${preventa.id}-${item.id}`,
        productId: product?.id ?? item.id,
        sku: product?.sku ?? item.id,
        name: product?.name ?? item.nombre,
        quantity: item.cantidad,
        unitPrice: item.precio,
        stock: product?.stock ?? item.cantidad,
        source: 'PREVENTA',
        iva: item.iva,
        discountPercent: item.descuento,
        sellerName: preventa.vendedor,
        preventaId: preventa.id,
        total: calculateLineTotal(item.cantidad, item.precio, item.descuento),
      };
    });

    updateSale(tabId, (current) => ({
      ...current,
      items: current.items.concat(preventaItems),
      status: 'ACTIVE',
    }));

    return { ok: true, message: `Preventa ${preventa.id} cargada.`, itemId: preventaItems[0]?.id };
  };

  const updatePayment = (tabId: string, payment: Partial<PaymentState>) => {
    updateSale(tabId, (sale) => ({ ...sale, payment: { ...sale.payment, ...payment } }));
  };

  const cancelSale = (tabId: string) => {
    setTabs((current) => current.filter((tab) => tab.id !== tabId));
    if (activeTabId === tabId) {
      const next = tabs.find((tab) => tab.id !== tabId) ?? null;
      setActiveTabId(next?.id ?? null);
    }
  };

  const markSaleAsPaid = (tabId: string) => {
    updateSale(tabId, (sale) => ({
      ...sale,
      status: 'PAID',
      pendingSync: sale.pendingSync || isOffline,
      completedSaleNumber: `BOLETA-${Date.now().toString().slice(-6)}`,
    }));

    window.setTimeout(() => {
      setTabs((current) => {
        const remaining = current.filter((tab) => tab.id !== tabId);
        const next = remaining[0] ?? null;
        setActiveTabId((currentActive) => (currentActive === tabId ? next?.id ?? null : currentActive));
        return remaining.map((tab, index) => (index === 0 && !activeTabId ? { ...tab, status: 'ACTIVE' } : tab));
      });
    }, 2000);
  };

  const markAllSynced = () => {
    setTabs((current) => current.map((tab) => ({ ...tab, pendingSync: false })));
  };

  return {
    tabs,
    activeTabId,
    activeSale,
    maxTabs: MAX_TABS,
    createSale,
    selectSale,
    putSaleOnHold,
    updateSaleCustomer,
    addItemToSale,
    addPreventaToSale,
    removeItemFromSale,
    updateItemQuantity,
    updateItemPrice,
    updatePayment,
    cancelSale,
    markSaleAsPaid,
    markAllSynced,
  };
}
