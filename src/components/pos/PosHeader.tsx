import { useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, UserRole } from '../../types/pos';
import { PosStatusBar } from './PosStatusBar';

type PosHeaderProps = {
  shiftOpen: boolean;
  shiftStatusLabel: string;
  storeName: string;
  terminalName: string;
  connectionStatus: ConnectionStatus;
  role: UserRole;
  pendingCount: number;
  onCreateSale: () => void;
  onStartShiftClose: () => void;
  onToggleConnection: () => void;
  onToggleRole: () => void;
  onSync: () => void;
};

export function PosHeader({
  shiftOpen,
  shiftStatusLabel,
  storeName,
  terminalName,
  connectionStatus,
  role,
  pendingCount,
  onCreateSale,
  onStartShiftClose,
  onToggleConnection,
  onToggleRole,
  onSync,
}: PosHeaderProps) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (!optionsRef.current?.contains(event.target as Node)) {
        setOptionsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOptionsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [optionsOpen]);

  return (
    <header className="pos-topbar">
      <div className="topbar-brand">
        <strong>POS Mimbral</strong>
      </div>

      <div className="topbar-actions">
        <button className="nav-menu-button" type="button" onClick={onCreateSale}>
          <span aria-hidden="true">+</span>
          <small>F2</small>
          <strong>Nueva venta</strong>
        </button>
        {shiftOpen && (
          <div className="topbar-options" ref={optionsRef}>
            <button className="topbar-close-shift" type="button" onClick={onStartShiftClose}>
              Cerrar turno
            </button>
            <button
              className="topbar-options-trigger"
              type="button"
              aria-expanded={optionsOpen}
              onClick={() => setOptionsOpen((current) => !current)}
            >
              Opciones
            </button>
            {optionsOpen && (
              <div className="topbar-options-menu">
                <button
                  type="button"
                  onClick={() => {
                    setOptionsOpen(false);
                    onStartShiftClose();
                  }}
                >
                  Cerrar turno
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="topbar-context">
        <strong>{shiftStatusLabel}</strong>
        <span>{storeName}</span>
        <span>{terminalName}</span>
      </div>

      <PosStatusBar
        connectionStatus={connectionStatus}
        role={role}
        pendingCount={pendingCount}
        onToggleConnection={onToggleConnection}
        onToggleRole={onToggleRole}
        onSync={onSync}
      />
    </header>
  );
}
