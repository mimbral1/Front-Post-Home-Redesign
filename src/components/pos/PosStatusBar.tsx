import type { ConnectionStatus, UserRole } from '../../types/pos';

type PosStatusBarProps = {
  connectionStatus: ConnectionStatus;
  role: UserRole;
  pendingCount: number;
  onToggleConnection: () => void;
  onToggleRole: () => void;
  onSync: () => void;
};

function connectionLabel(status: ConnectionStatus) {
  if (status === 'CONNECTED') return 'Conectado';
  if (status === 'SYNCING') return 'Sincronizando';
  return 'Sin conexion';
}

export function PosStatusBar({
  connectionStatus,
  role,
  pendingCount,
  onToggleConnection,
  onToggleRole,
  onSync,
}: PosStatusBarProps) {
  return (
    <section className="pos-status-bar">
      <button
        className={`connection-pill connection-${connectionStatus.toLowerCase()}`}
        type="button"
        onClick={onToggleConnection}
      >
        <span aria-hidden="true" />
        {connectionLabel(connectionStatus)}
      </button>

      <button className="role-pill" type="button" onClick={onToggleRole}>
        Rol: {role === 'SUPERVISOR' ? 'Supervisor' : 'Cajero'}
      </button>

      <button className="sync-pill" type="button" disabled={connectionStatus === 'OFFLINE'} onClick={onSync}>
        Pendientes: {pendingCount}
      </button>
    </section>
  );
}
