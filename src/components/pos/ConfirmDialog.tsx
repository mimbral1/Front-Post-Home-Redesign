type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <p className="eyebrow">Confirmar</p>
        <h3>{title}</h3>
        <p className="muted">{description}</p>
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onCancel}>
            No, volver
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
