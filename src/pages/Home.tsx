import { useEffect, useMemo, useState } from 'react';
import { ActiveSaleWorkspace } from '../components/pos/ActiveSaleWorkspace';
import { ConfirmDialog } from '../components/pos/ConfirmDialog';
import { OpenSalesTabs } from '../components/pos/OpenSalesTabs';
import { PosStatusBar } from '../components/pos/PosStatusBar';
import { SaleCompletedScreen } from '../components/pos/SaleCompletedScreen';
import { formatCurrency } from '../lib/format';
import { mockPosState } from '../mocks/posState';
import { mockFindPreventa, mockProcessPayment } from '../services/posMockApi';
import type { ConnectionStatus, PosState, Product, SaleItem, SaleTab, UserRole } from '../types/pos';
import { useOpenSalesTabs } from '../hooks/useOpenSalesTabs';

type PendingCancel =
  | { type: 'sale'; sale: SaleTab }
  | { type: 'item'; item: SaleItem }
  | { type: 'close-register' }
  | null;

const POS_STATE_KEY = 'pos.terminalState';
const ROLE_KEY = 'pos.userRole';
const CONNECTION_KEY = 'pos.connectionStatus';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function focusProductInput() {
  window.setTimeout(() => {
    document.querySelector<HTMLInputElement>('[data-product-search="true"]')?.focus();
  }, 0);
}

function isEditingFormField() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.dataset.productSearch === 'true') return false;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
}

export function Home() {
  const [posState, setPosState] = useState<PosState>(() => loadJson(POS_STATE_KEY, mockPosState));
  const [role, setRole] = useState<UserRole>(() => loadJson(ROLE_KEY, 'CASHIER' as UserRole));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() =>
    loadJson(CONNECTION_KEY, 'CONNECTED' as ConnectionStatus)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<PendingCancel>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);

  const isOffline = connectionStatus === 'OFFLINE';

  const {
    tabs,
    activeTabId,
    activeSale,
    maxTabs,
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
  } = useOpenSalesTabs(isOffline);

  const permissions = {
    canEditPrice: role === 'SUPERVISOR',
    canRemoveItem: role === 'SUPERVISOR',
    canCancelSale: role === 'SUPERVISOR',
  };

  const canPay = Boolean(
    activeSale &&
      activeSale.items.length > 0 &&
      posState.cashRegisterOpen &&
      posState.shiftOpen &&
      activeSale.total > 0
  );

  const statusTitle = useMemo(() => {
    if (!posState.cashRegisterOpen) return 'Caja cerrada';
    if (!posState.shiftOpen) return 'Turno no iniciado';
    if (!activeSale) return 'Listo para vender';
    return 'Venta en curso';
  }, [activeSale, posState.cashRegisterOpen, posState.shiftOpen]);

  useEffect(() => {
    localStorage.setItem(POS_STATE_KEY, JSON.stringify(posState));
  }, [posState]);

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, JSON.stringify(role));
  }, [role]);

  useEffect(() => {
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(connectionStatus));
  }, [connectionStatus]);

  useEffect(() => {
    focusProductInput();
  }, [activeTabId, activeSale?.items.length]);

  const handleCreateSale = () => {
    if (!posState.cashRegisterOpen) {
      setMessage('Para vender primero debes abrir caja.');
      return;
    }
    if (!posState.shiftOpen) {
      setMessage('Para vender primero debes iniciar turno.');
      return;
    }
    const result = createSale();
    setMessage(result.message);
    focusProductInput();
  };

  const handleProduct = (product: Product) => {
    if (!activeTabId) return;
    const result = addItemToSale(activeTabId, product);
    if (result.itemId) setSelectedItemId(result.itemId);
    setMessage(result.message);
    focusProductInput();
  };

  const handleMissingProduct = () => {
    setMessage('Producto no encontrado. Revisa el codigo o busca por nombre.');
  };

  const handleLoadPreventa = async (preventaId: string) => {
    if (!activeTabId) {
      setMessage('Abre una venta antes de cargar preventa.');
      focusProductInput();
      return;
    }

    const preventa = await mockFindPreventa(preventaId);
    if (!preventa) {
      setMessage('Preventa no encontrada');
      focusProductInput();
      return;
    }

    const result = addPreventaToSale(activeTabId, preventa);
    setMessage(result.message);
    focusProductInput();
  };

  const handleQuantity = (itemId: string, quantity: number) => {
    if (!activeTabId || Number.isNaN(quantity)) return;
    const item = activeSale?.items.find((entry) => entry.id === itemId);
    if (item && quantity <= 0) {
      setPendingCancel({ type: 'item', item });
      return;
    }
    const result = updateItemQuantity(activeTabId, itemId, quantity);
    setMessage(result.message);
    focusProductInput();
  };

  const handleDecrease = (itemId: string) => {
    const item = activeSale?.items.find((entry) => entry.id === itemId);
    if (!activeTabId || !item) return;
    if (item.quantity <= 1) {
      setPendingCancel({ type: 'item', item });
      return;
    }
    handleQuantity(itemId, item.quantity - 1);
  };

  const handleCancelSale = (sale: SaleTab) => {
    if (!permissions.canCancelSale) {
      setMessage('Cancelar venta requiere supervisor.');
      return;
    }
    if (sale.items.length === 0) {
      cancelSale(sale.id);
      setMessage(`${sale.displayNumber} cerrada.`);
      return;
    }
    setPendingCancel({ type: 'sale', sale });
  };

  const handleHoldSale = () => {
    if (!activeTabId) return;
    putSaleOnHold(activeTabId);
    const result = createSale();
    setMessage(result.ok ? 'Venta en espera. Nueva venta abierta.' : 'Venta en espera.');
    focusProductInput();
  };

  const validatePayment = () => {
    if (!activeSale) return 'No hay venta activa.';
    if (!activeSale.payment.method) return 'Selecciona un medio de pago.';
    if (activeSale.payment.method === 'CASH' && activeSale.payment.cashReceived < activeSale.total) {
      return 'El monto recibido es menor al total.';
    }
    if (
      (activeSale.payment.method === 'DEBIT_CARD' || activeSale.payment.method === 'CREDIT_CARD') &&
      activeSale.payment.terminalStatus !== 'APPROVED'
    ) {
      return 'El pago con tarjeta aun no esta aprobado.';
    }
    if (activeSale.payment.method === 'BANK_TRANSFER' && !activeSale.payment.transferCode.trim()) {
      return 'Ingresa el codigo de operacion.';
    }
    if (activeSale.payment.method === 'INTERNAL_CREDIT') {
      if (!activeSale.customer.id) return 'Para vender con credito interno debes seleccionar un cliente.';
      if (!activeSale.customer.creditEnabled) return 'Este cliente no tiene credito interno habilitado.';
      if ((activeSale.customer.availableCredit ?? 0) < activeSale.total) {
        return `Credito disponible insuficiente: ${formatCurrency(activeSale.customer.availableCredit ?? 0)}.`;
      }
    }
    return null;
  };

  const handleConfirmPayment = async () => {
    if (!activeTabId || !activeSale || paymentBusy) return;
    const error = validatePayment();
    if (error) {
      setMessage(error);
      return;
    }
    const method = activeSale.payment.method;
    if (!method) return;
    setPaymentBusy(true);
    updatePayment(activeTabId, {
      terminalStatus:
        method === 'DEBIT_CARD' || method === 'CREDIT_CARD'
          ? 'CONNECTING'
          : activeSale.payment.terminalStatus,
    });
    const result = await mockProcessPayment(method, isOffline);
    if (!result.ok) {
      updatePayment(activeTabId, { terminalStatus: 'CONNECTION_ERROR' });
      setMessage(result.message);
      setPaymentBusy(false);
      focusProductInput();
      return;
    }
    markSaleAsPaid(activeTabId);
    setMessage(result.message);
    setPaymentBusy(false);
    window.setTimeout(() => {
      const next = createSale();
      if (!next.ok) focusProductInput();
    }, 2100);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'F2' || (event.key.toLowerCase() === 'n' && event.ctrlKey)) {
        event.preventDefault();
        handleCreateSale();
      }
      if (event.key === 'F4' && activeTabId) {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('[data-customer-search="true"]')?.focus();
      }
      if (event.key === 'F8' && canPay) {
        event.preventDefault();
        updatePayment(activeTabId!, { method: activeSale?.payment.method ?? 'CASH' });
      }
      const editingFormField = isEditingFormField();
      if (event.key === 'Tab' && event.ctrlKey && tabs.length > 0) {
        event.preventDefault();
        const index = Math.max(0, tabs.findIndex((tab) => tab.id === activeTabId));
        selectSale(tabs[(index + 1) % tabs.length].id);
      }
      if (!editingFormField && event.key === 'ArrowDown' && activeSale?.items.length) {
        event.preventDefault();
        const index = Math.max(0, activeSale.items.findIndex((item) => item.id === selectedItemId));
        setSelectedItemId(activeSale.items[Math.min(index + 1, activeSale.items.length - 1)].id);
      }
      if (!editingFormField && event.key === 'ArrowUp' && activeSale?.items.length) {
        event.preventDefault();
        const index = Math.max(0, activeSale.items.findIndex((item) => item.id === selectedItemId));
        setSelectedItemId(activeSale.items[Math.max(index - 1, 0)].id);
      }
      if (!editingFormField && event.key === 'Delete' && activeSale && selectedItemId) {
        if (!permissions.canRemoveItem) {
          setMessage('Requiere supervisor.');
          return;
        }
        const item = activeSale.items.find((entry) => entry.id === selectedItemId);
        if (item) setPendingCancel({ type: 'item', item });
      }
      if (!editingFormField && (event.key === '+' || event.key === '-') && activeSale && selectedItemId) {
        const item = activeSale.items.find((entry) => entry.id === selectedItemId);
        if (!item) return;
        event.preventDefault();
        if (event.key === '+') handleQuantity(item.id, item.quantity + 1);
        if (event.key === '-') handleDecrease(item.id);
      }
      if (event.key === 'Enter' && !posState.cashRegisterOpen) {
        setPosState({ ...posState, cashRegisterOpen: true });
        setMessage('Caja abierta correctamente.');
      } else if (event.key === 'Enter' && posState.cashRegisterOpen && !posState.shiftOpen) {
        setPosState({ ...posState, shiftOpen: true, shiftId: 'SHIFT-2026-001' });
        setMessage('Turno iniciado correctamente.');
      } else if (event.key === 'Enter' && posState.cashRegisterOpen && posState.shiftOpen && !activeSale) {
        handleCreateSale();
      }
      if (event.key === 'Escape') {
        setPendingCancel(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabId, activeSale, canPay, selectedItemId, tabs, posState, role, paymentBusy]);

  const confirmPendingCancel = () => {
    if (!pendingCancel) return;
    if (pendingCancel.type === 'item' && activeTabId) {
      removeItemFromSale(activeTabId, pendingCancel.item.id);
      setMessage('Producto eliminado.');
      focusProductInput();
    }
    if (pendingCancel.type === 'sale') {
      cancelSale(pendingCancel.sale.id);
      setMessage('Venta cancelada.');
      focusProductInput();
    }
    if (pendingCancel.type === 'close-register') {
      setPosState({ ...posState, cashRegisterOpen: false, shiftOpen: false, shiftId: null });
      setMessage('Caja cerrada correctamente.');
    }
    setPendingCancel(null);
  };

  return (
    <main className="pos-shell">
      <header className="pos-topbar">
        <div className="topbar-identity">
          <div className="topbar-titleline">
            <strong>POS Mimbral</strong>
            <span>{statusTitle}</span>
          </div>
          <div className="terminal-meta">
            <span>{posState.storeName}</span>
            <span>{posState.terminalName}</span>
            <span>{posState.cashierName}</span>
          </div>
        </div>
        <PosStatusBar
          connectionStatus={connectionStatus}
          role={role}
          pendingCount={tabs.filter((tab) => tab.pendingSync).length}
          onToggleConnection={() => {
            if (connectionStatus === 'OFFLINE') {
              setConnectionStatus('SYNCING');
              setMessage('Sincronizando ventas pendientes...');
              window.setTimeout(() => {
                markAllSynced();
                setConnectionStatus('CONNECTED');
                setMessage('Conectado. Ventas sincronizadas.');
                focusProductInput();
              }, 900);
              return;
            }
            setConnectionStatus('OFFLINE');
            setMessage('Sin conexion. Puedes seguir vendiendo.');
          }}
          onToggleRole={() => {
            setRole((current) => (current === 'CASHIER' ? 'SUPERVISOR' : 'CASHIER'));
            setMessage(role === 'CASHIER' ? 'Modo supervisor activo.' : 'Modo cajero activo.');
          }}
          onSync={() => {
            setConnectionStatus('SYNCING');
            window.setTimeout(() => {
              markAllSynced();
              setConnectionStatus('CONNECTED');
              setMessage('Ventas sincronizadas.');
            }, 700);
          }}
        />
      </header>

      {!posState.cashRegisterOpen && (
        <section className="gate-screen">
          <h2>Caja cerrada</h2>
          <p>Para comenzar debes abrir caja.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setPosState({ ...posState, cashRegisterOpen: true });
              setMessage('Caja abierta correctamente.');
            }}
          >
            Abrir caja
          </button>
        </section>
      )}

      {posState.cashRegisterOpen && !posState.shiftOpen && (
        <section className="gate-screen">
          <h2>Turno no iniciado</h2>
          <p>Para vender debes iniciar turno.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setPosState({ ...posState, shiftOpen: true, shiftId: 'SHIFT-2026-001' });
              setMessage('Turno iniciado correctamente.');
            }}
          >
            Iniciar turno
          </button>
        </section>
      )}

      {posState.cashRegisterOpen && posState.shiftOpen && (
        <>
          <OpenSalesTabs
            tabs={tabs}
            activeTabId={activeTabId}
            maxTabs={maxTabs}
            onCreateSale={handleCreateSale}
            onSelectSale={(tabId) => {
              selectSale(tabId);
            }}
            onCancelSale={(tabId) => {
              const sale = tabs.find((tab) => tab.id === tabId);
              if (sale) handleCancelSale(sale);
            }}
          />

          {!activeSale && (
            <section className="ready-screen">
              <p className="eyebrow">Listo para vender</p>
              <h2>Caja y turno activos.</h2>
              <button className="primary-button" type="button" onClick={handleCreateSale}>
                Nueva venta
              </button>
              <button className="ghost-button" type="button" onClick={() => setMessage('Historial abierto.')}>
                Historial
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  if (tabs.length > 0) {
                    setMessage('Cierra o cobra las ventas abiertas antes de cerrar caja.');
                    return;
                  }
                  setPendingCancel({ type: 'close-register' });
                }}
              >
                Cerrar caja
              </button>
            </section>
          )}

          {activeSale?.status === 'PAID' && (
            <SaleCompletedScreen sale={activeSale} onNewSale={handleCreateSale} />
          )}

          {activeSale && activeSale.status !== 'PAID' && (
            <ActiveSaleWorkspace
              sale={activeSale}
              canPay={canPay}
              message={message}
              selectedItemId={selectedItemId}
              canEditPrice={permissions.canEditPrice}
              canRemoveItem={permissions.canRemoveItem}
              canCancelSale={permissions.canCancelSale}
              paymentBusy={paymentBusy}
              onSelectItem={setSelectedItemId}
              onAddProduct={handleProduct}
              onLoadPreventa={handleLoadPreventa}
              onMissingProduct={handleMissingProduct}
              onCustomerChange={(customer) => {
                updateSaleCustomer(activeSale.id, customer);
                setMessage(`Cliente: ${customer.name}.`);
              }}
              onHoldSale={handleHoldSale}
              onCancelSale={() => handleCancelSale(activeSale)}
              onIncrease={(itemId) => {
                const item = activeSale.items.find((entry) => entry.id === itemId);
                if (item) handleQuantity(itemId, item.quantity + 1);
              }}
              onDecrease={handleDecrease}
              onQuantityChange={handleQuantity}
              onPriceChange={(itemId, price) => {
                if (!activeTabId) return;
                const item = activeSale.items.find((entry) => entry.id === itemId);
                if (item?.source === 'PREVENTA') {
                  setMessage('Precio de preventa bloqueado.');
                  return;
                }
                if (!permissions.canEditPrice) {
                  setMessage('Cambiar precio requiere supervisor.');
                  return;
                }
                const result = updateItemPrice(activeTabId, itemId, price);
                setMessage(result.message);
              }}
              onRemove={(item) => {
                if (!permissions.canRemoveItem) {
                  setMessage('Eliminar producto requiere supervisor.');
                  return;
                }
                setPendingCancel({ type: 'item', item });
              }}
              onPaymentChange={(payment) => updatePayment(activeSale.id, payment)}
              onConfirmPayment={handleConfirmPayment}
            />
          )}
        </>
      )}

      {message && !activeSale && <div className="feedback-banner">{message}</div>}

      {pendingCancel && (
        <ConfirmDialog
          title={
            pendingCancel.type === 'item'
              ? 'Eliminar producto'
              : pendingCancel.type === 'close-register'
                ? 'Cerrar caja'
                : 'Cancelar venta'
          }
          description={
            pendingCancel.type === 'item'
              ? 'Eliminar este producto de la venta?'
              : pendingCancel.type === 'close-register'
                ? 'Se cerrara la caja y el turno actual.'
                : 'Esta venta tiene productos agregados. Quieres cancelarla?'
          }
          confirmLabel={
            pendingCancel.type === 'item'
              ? 'Eliminar'
              : pendingCancel.type === 'close-register'
                ? 'Cerrar caja'
                : 'Si, cancelar venta'
          }
          onCancel={() => setPendingCancel(null)}
          onConfirm={confirmPendingCancel}
        />
      )}
    </main>
  );
}
