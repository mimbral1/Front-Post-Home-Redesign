import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency } from '../../lib/format';
import type { PosState, ShiftCloseSummary } from '../../types/pos';

type ShiftControlMode = 'closed' | 'open' | 'count' | 'supervisor' | 'summary';
type CloseStep = 'summary' | 'cash' | 'validate';

type ShiftControlPanelProps = {
  mode: ShiftControlMode;
  posState: PosState;
  expectedCash: number;
  summary: ShiftCloseSummary | null;
  initialDeclaredCash?: number;
  initialObservation?: string;
  onOpenShift: (openingFloat: number) => void;
  onCancelClose: () => void;
  onRequestSupervisor: (declaredCash: number, observation: string) => void;
  onCloseShift: (declaredCash: number, observation?: string, supervisorUser?: string) => void;
  onFinishSummary: () => void;
};

export function ShiftControlPanel({
  mode,
  posState,
  expectedCash,
  summary,
  initialDeclaredCash,
  initialObservation,
  onOpenShift,
  onCancelClose,
  onRequestSupervisor,
  onCloseShift,
  onFinishSummary,
}: ShiftControlPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showOpenForm, setShowOpenForm] = useState(mode === 'open');
  const [closeStep, setCloseStep] = useState<CloseStep>('summary');
  const [openingFloat, setOpeningFloat] = useState(posState.openingFloat ?? 0);
  const [declaredCash, setDeclaredCash] = useState(initialDeclaredCash ?? expectedCash);
  const [observation, setObservation] = useState(initialObservation ?? '');
  const [supervisorUser, setSupervisorUser] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const difference = useMemo(() => declaredCash - expectedCash, [declaredCash, expectedCash]);
  const hasDifference = difference !== 0;

  useEffect(() => {
    setError(null);
    if (mode === 'count') setCloseStep('summary');
    if (mode === 'closed') setShowOpenForm(false);
    if (mode === 'open') setShowOpenForm(true);
    if (mode === 'supervisor') {
      setDeclaredCash(initialDeclaredCash ?? expectedCash);
      setObservation(initialObservation ?? '');
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [expectedCash, initialDeclaredCash, initialObservation, mode]);

  const confirmOpen = () => {
    if (openingFloat < 0 || Number.isNaN(openingFloat)) {
      setError('Ingresa un fondo inicial valido.');
      return;
    }
    onOpenShift(openingFloat);
  };

  if (mode === 'summary' && summary) {
    return (
      <section className="shift-screen shift-screen-centered">
        <div className="success-check" aria-hidden="true">
          ✓
        </div>
        <h2>Turno cerrado correctamente</h2>
        <dl className="shift-summary">
          <div>
            <dt>Ventas</dt>
            <dd>{formatCurrency(summary.salesTotal)}</dd>
          </div>
          <div>
            <dt>Efectivo</dt>
            <dd>{formatCurrency(summary.declaredCash)}</dd>
          </div>
          <div>
            <dt>Diferencia</dt>
            <dd className={summary.difference === 0 ? 'diff-ok' : 'diff-alert'}>
              {formatCurrency(summary.difference)}
            </dd>
          </div>
        </dl>
        <div className="shift-actions">
          <button className="primary-button" type="button" onClick={onFinishSummary}>
            Nueva venta
          </button>
          <button className="ghost-button" type="button">
            Imprimir cierre
          </button>
        </div>
      </section>
    );
  }

  if ((mode === 'closed' && !showOpenForm) || mode === 'open') {
    if (mode === 'closed' && !showOpenForm) {
      return (
        <section className="shift-screen shift-screen-centered">
          <p className="eyebrow">Caja cerrada</p>
          <h2>Caja cerrada</h2>
          <p>Para comenzar debes abrir turno</p>
          <button className="primary-button shift-primary" type="button" onClick={() => setShowOpenForm(true)}>
            ABRIR TURNO
          </button>
        </section>
      );
    }
  }

  if (mode === 'closed' || mode === 'open') {
    return (
      <section className="shift-screen">
        <p className="eyebrow">Apertura</p>
        <h2>Abrir turno</h2>
        <div className="shift-meta">
          <span>Caja: {posState.terminalName}</span>
          <span>Cajera: {posState.cashierName}</span>
        </div>
        <label className="field shift-money-field">
          <span>Fondo inicial</span>
          <input
            ref={inputRef}
            type="number"
            min={0}
            value={openingFloat || ''}
            onChange={(event) => setOpeningFloat(Number(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirmOpen();
              }
            }}
          />
        </label>
        {error && <div className="compact-message">{error}</div>}
        <button className="primary-button shift-primary" type="button" onClick={confirmOpen}>
          Confirmar apertura
        </button>
      </section>
    );
  }

  if (mode === 'supervisor') {
    return (
      <section className="shift-screen">
        <p className="eyebrow">Autorizacion supervisor</p>
        <h2>Autorizacion supervisor</h2>
        <label className="field">
          <span>Usuario</span>
          <input ref={inputRef} value={supervisorUser} onChange={(event) => setSupervisorUser(event.target.value)} />
        </label>
        <label className="field">
          <span>Clave</span>
          <input
            type="password"
            value={supervisorPassword}
            onChange={(event) => setSupervisorPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onCancelClose();
              if (event.key === 'Enter' && supervisorUser.trim() && supervisorPassword.trim()) {
                onCloseShift(declaredCash, observation, supervisorUser.trim());
              }
            }}
          />
        </label>
        {error && <div className="compact-message">{error}</div>}
        <button
          className="primary-button shift-primary"
          type="button"
          onClick={() => {
            if (!supervisorUser.trim() || !supervisorPassword.trim()) {
              setError('Ingresa usuario y clave.');
              return;
            }
            onCloseShift(declaredCash, observation, supervisorUser.trim());
          }}
        >
          Autorizar
        </button>
      </section>
    );
  }

  if (closeStep === 'summary') {
    return (
      <section className="shift-screen">
        <p className="eyebrow">Paso 1 de 3</p>
        <h2>Cerrar turno</h2>
        <div className="shift-total-box">
          <span>Total ventas</span>
          <strong>{formatCurrency(posState.shiftSalesTotal ?? 0)}</strong>
        </div>
        <div className="shift-total-box shift-total-soft">
          <span>Efectivo esperado</span>
          <strong>{formatCurrency(expectedCash)}</strong>
        </div>
        <button className="primary-button shift-primary" type="button" onClick={() => setCloseStep('cash')}>
          Continuar
        </button>
      </section>
    );
  }

  if (closeStep === 'cash') {
    return (
      <section className="shift-screen">
        <p className="eyebrow">Paso 2 de 3</p>
        <h2>Efectivo en caja</h2>
        <label className="field shift-money-field">
          <span>Efectivo declarado</span>
          <input
            ref={inputRef}
            type="number"
            min={0}
            value={declaredCash || ''}
            onChange={(event) => setDeclaredCash(Number(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onCancelClose();
              if (event.key === 'Enter') {
                event.preventDefault();
                setCloseStep('validate');
              }
            }}
          />
        </label>
        <div className={`shift-difference ${difference === 0 ? 'diff-ok' : 'diff-alert'}`}>
          Diferencia: {formatCurrency(difference)}
        </div>
        <button className="primary-button shift-primary" type="button" onClick={() => setCloseStep('validate')}>
          Continuar
        </button>
      </section>
    );
  }

  return (
    <section className="shift-screen">
      <p className="eyebrow">Paso 3 de 3</p>
      <h2>{hasDifference ? 'Diferencia detectada' : 'Todo cuadra correctamente'}</h2>
      <div className={`shift-difference ${difference === 0 ? 'diff-ok' : 'diff-alert'}`}>
        {formatCurrency(difference)}
      </div>
      {hasDifference && (
        <label className="field">
          <span>Observacion</span>
          <input
            ref={inputRef}
            value={observation}
            placeholder="Comentario breve"
            onChange={(event) => setObservation(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onCancelClose();
              if (event.key === 'Enter' && observation.trim()) {
                onRequestSupervisor(declaredCash, observation);
              }
            }}
          />
        </label>
      )}
      {error && <div className="compact-message">{error}</div>}
      <button
        className="primary-button shift-primary"
        type="button"
        onClick={() => {
          if (hasDifference) {
            if (!observation.trim()) {
              setError('Agrega una observacion breve.');
              return;
            }
            onRequestSupervisor(declaredCash, observation);
            return;
          }
          onCloseShift(declaredCash);
        }}
      >
        {hasDifference ? 'Solicitar aprobacion' : 'Cerrar turno'}
      </button>
    </section>
  );
}
